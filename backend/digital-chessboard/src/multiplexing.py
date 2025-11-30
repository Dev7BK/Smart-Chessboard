""" Read Reed-Switch matrix """
import RPi.GPIO as GPIO
import time
from debug_logger import DebugLogger

class Square():
    def __init__(self, x_position: int, y_position: int):
        self.x_position = x_position
        self.y_position = y_position

    def __eq__(self, other):
        if isinstance(other, Square):
            return self.x_position == other.x_position and self.y_position == other.y_position
        return False

    def __hash__(self):
        return hash((self.x_position, self.y_position))

    def __repr__(self):
        return f"Square({self.x_position}, {self.y_position})"

class Multiplexer():

    def __init__(self, row_pins: list[int], column_pins: list[int]):
        GPIO.cleanup()
        GPIO.setmode(GPIO.BOARD) # Phyical Board Pins
        self.row_pins = row_pins
        self.column_pins = column_pins
        self.logger = DebugLogger(enable_debug=True)

    def setup(self) -> None:
        """Configure GPIO for hi-Z column scanning.

        - Columns: INPUT (hi-Z) by default; we will temporarily drive the active
          column as OUTPUT HIGH only while sampling rows.
        - Rows: INPUT with pull-down to define a stable LOW when open.
        """
        # Columns default to INPUT (hi-Z)
        for pin in self.column_pins:
            GPIO.setup(pin, GPIO.IN)

        # Rows as inputs with pull-downs
        for pin in self.row_pins:
            GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    def detect_signal(self) -> list[Square]: 
        """Scan with hi-Z columns: drive one column HIGH, read rows, then release.

        Non-active columns stay INPUT (hi-Z), preventing them from clamping the
        row lines when multiple reed contacts are closed in the same row.
        Includes lightweight majority voting per cell to reduce noise.
        """
        active_squares = []

        # Tuning parameters
        settle_delay = 0.0005   # 500 µs to allow signals to settle
        samples = 3             # majority vote over 3 samples
        inter_sample_delay = 0.0002 # 200 µs between samples

        try:
            # Ensure all columns are INPUT before starting
            for col_pin in self.column_pins:
                GPIO.setup(col_pin, GPIO.IN)

            for col_index, col_pin in enumerate(self.column_pins):
                # Drive only the active column HIGH
                GPIO.setup(col_pin, GPIO.OUT)
                GPIO.output(col_pin, GPIO.HIGH)
                time.sleep(settle_delay)

                for row_index, row_pin in enumerate(self.row_pins):
                    high_count = 0
                    for _ in range(samples):
                        if GPIO.input(row_pin):
                            high_count += 1
                        if samples > 1:
                            time.sleep(inter_sample_delay)
                    if high_count >= (samples // 2 + 1):
                        active_squares.append(Square(col_index, row_index))

                # Release the column back to hi-Z
                GPIO.setup(col_pin, GPIO.IN)

            if active_squares:
                self.logger.log_debounced_result(active_squares)

            return active_squares

        except KeyboardInterrupt:
            self.logger.log_error("Scan abgebrochen durch Tastatur input")
            GPIO.cleanup()
            return []