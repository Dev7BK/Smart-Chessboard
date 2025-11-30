""" App-Start, Gameloop start """
from multiplexing import Multiplexer
from game_manager import GameManager
from led_interface import LED
from debug_logger import DebugLogger
import RPi.GPIO as GPIO
import time

logger = DebugLogger(enable_debug=True)

# Instantiate Controller classes and setup 
led_controller = LED(WIDTH=3, HEIGHT=3)
mux = Multiplexer(row_pins=[11, 13, 15], column_pins=[16, 18, 22])
mux.setup()
led_controller.clear()

time.sleep(1)
game = GameManager(mux, led_controller)

try:
    game.start()

    while True:
        time.sleep(1)
    
except KeyboardInterrupt:
    led_controller.clear()
    logger.log_error("Gameloop abgebrochen durch Tasteneingabe. ")
    GPIO.cleanup()