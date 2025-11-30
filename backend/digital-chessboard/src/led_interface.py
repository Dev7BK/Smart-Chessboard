import board
from rpi_ws281x import *
import neopixel
from multipledispatch import dispatch
import time
import colorsys

class LED:
    """A controller class for managing an LED matrix using NeoPixel strips.
    
    This class provides methods to control a matrix of LEDs connected via a NeoPixel strip,
    including setting individual colors, creating effects, and managing the display.
    
    Attributes:
        WIDTH (int): Width of the LED matrix (number of LEDs horizontally).
        HEIGHT (int): Height of the LED matrix (number of LEDs vertically).
        LED_COUNT (int): Total number of LEDs in the matrix.
        pixels (neopixel.NeoPixel): NeoPixel object for controlling the LED strip.
        active_leds (list): List of currently active LED positions as (x, y) tuples.
    """

    def __init__(self, WIDTH, HEIGHT):
        """Initialize the LED matrix controller.
        
        Args:
            width (int): Width of the LED matrix (number of LEDs horizontally).
            height (int): Height of the LED matrix (number of LEDs vertically).
        """
        self.WIDTH = WIDTH
        self.HEIGHT = HEIGHT

        self.LED_COUNT = WIDTH * HEIGHT       
        self.pixels = neopixel.NeoPixel(board.D18, self.LED_COUNT, brightness=1.0, auto_write=False)

        self.active_leds = []
        
    def __map_leds(self, x_position, y_position, snake=True):
        """Map 2D coordinates to 1D LED strip index.
        
        This method converts 2D matrix coordinates to the corresponding index in a 1D LED strip.
        Supports snake pattern for proper matrix mapping.
        
        Args:
            x_position (int): X coordinate (horizontal position) in the matrix.
            y_position (int): Y coordinate (vertical position) in the matrix.
            snake (bool, optional): If True, applies snake pattern for even rows. Defaults to True.
            
        Returns:
            int: The corresponding index in the 1D LED strip.
        """
        if snake and x_position % 2 == 1:
            y_position = self.WIDTH - 1 - y_position
        return x_position * self.WIDTH + y_position


    def set_color(self, x_position, y_position, color) -> bool:
        """Set the color of a specific LED and all previously set LEDs.
        
        This method sets the color of an LED at the specified position and adds it to the
        active LEDs list. It then updates all active LEDs and displays the changes.
        
        Args:
            x_position (int): X coordinate of the LED in the matrix.
            y_position (int): Y coordinate of the LED in the matrix.
            color (tuple): RGB color tuple (r, g, b) with values 0-255.
            
        Returns:
            bool: True if the operation was successful, False if an error occurred.
        """
        try:
            self.active_leds.clear()  # Clear previous active LEDs
            self.active_leds.append((x_position, y_position))
            for led in self.active_leds:

                index = self.__map_leds(led[0], led[1])
                self.pixels[index] = color
                self.pixels.show()
            return True
        except:
            return False

    def set_all_color(self, color):
        """Set all LEDs in the matrix to the same color.
        
        Args:
            color (tuple): RGB color tuple (r, g, b) with values 0-255.
        """
        for i in range (self.LED_COUNT):
            self.pixels[i] = color
            self.pixels.show()
    
    def rgb_rainbow_breathing_effect(self, wait_ms):
        """Create a breathing rainbow effect by cycling through hues across all pixels.
        
        This method creates a smooth rainbow animation that cycles through all hue values,
        creating a breathing effect by changing all LEDs to the same color at each step.
        
        Args:
            wait_ms (float): Delay in milliseconds between each color change step.
        """
        steps = 360  # Number of hue steps for a smooth rainbow
        for step in range(steps):
            hue = step / steps  # Normalized hue [0,1)
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            color = (int(r * 255), int(g * 255), int(b * 255))
            for i in range(self.LED_COUNT):
                self.pixels[i] = color
            self.pixels.show()
            time.sleep(wait_ms / 1000.0)

    def clear(self):
        """Clear all LEDs by setting them to black (off).
        
        This method turns off all LEDs in the matrix by setting their color to black (0,0,0).
        """
        for i in range (self.LED_COUNT):
            self.pixels[i] = (0,0,0)
            self.pixels.show()
            
    
    def init_chess_matrix(self):
        """Initialize a chessboard pattern on the LED matrix.
        
        This method sets up a chessboard pattern using two specified colors.
        
        Args:
            color1 (tuple): RGB color tuple for the first color (e.g., white).
            color2 (tuple): RGB color tuple for the second color (e.g., black).
        """
        color1 = (255, 255, 255)
        color2 = (0, 0, 255)

        for y in range(self.HEIGHT):
            for x in range(self.WIDTH):
                if (x + y) % 2 == 0:
                    color = color1
                else:
                    color = color2
                index = self.__map_leds(x, y)
                self.pixels[index] = color
        self.pixels.show()