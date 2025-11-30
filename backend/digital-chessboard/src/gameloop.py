"Reed-Switch polling + GameManager update state"
from time import sleep
from multiplexing import Multiplexer
from board_processor import BoardProcessor
import threading
import time

class GameLoop:
    def __init__(self, multiplexer):
        self.multiplexer = multiplexer
        self.running = False
        self.previous_state = set()

    def start(self):
        self.running = True
        threading.Thread(target=self.poll_loop, daemon=True).start()
    
    def stop(self):
        self.running = False