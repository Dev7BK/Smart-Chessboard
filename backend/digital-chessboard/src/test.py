from led_interface import LED
import time


led_controller = LED(WIDTH=8, HEIGHT=8)

led_controller.clear()
led_controller.set_color(0, 6, (255, 0, 0))  # Set square (1,0) to red