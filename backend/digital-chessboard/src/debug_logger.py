""" Static Class to provide default log messages. """

class DebugLogger:
    def __init__(self, enable_debug: bool = True):
        self.enabled = enable_debug

    def log_debounced_result(self, squares: list):
        if self.enabled:
            print(f"[DEBOUNCED]        → Stable: {squares}")

    def log_event(self, message: str):
        if self.enabled:
            print(f"[EVENT] {message}")

    def log_error(self, message: str):
        print(f"[ERROR] {message}")
