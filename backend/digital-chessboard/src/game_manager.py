import chess
import sys
import time
import threading
from multiplexing import Multiplexer, Square
from led_interface import LED

# Encapsulate functions later
class GameManager:
    def __init__(self, multiplexer: Multiplexer, led_controller: LED): 
        self.multiplexer = multiplexer
        self.led_controller = led_controller

        self.previous_state = set()
        #self.current_fen = chess.STARTING_FEN
        # hier noch in starting_fen ändern!
        # self.current_fen = "k7/6R1/8/7R/8/8/8/8 w"
        self.current_fen = "1k3r2/2p1n3/6Q1/b2q4/7B/2N5/1P6/4R1K1"

        self.chess_board = chess.Board(self.current_fen)

        self.running = False
        self.selected_square = None
        self.pending_capture = None
        self.opponent_squares = []
        # Track castling rook relocation in the physical board
        # Structure: { 'from': Square, 'to': Square, 'removed': bool, 'placed': bool }
        self.castling_pending = None

    def set_board_update(self, callback):
        self.board_update = callback

    def set_highlight_callback(self, callback):
        self.highlight_callback = callback

    def start(self):
        """ Start Gameloop im Thread """
        # hier noch in starting_fen ändern!
        # self.current_fen = "k7/6R1/8/7R/8/8/8/8 w"
        self.current_fen = "1k3r2/2p1n3/6Q1/b2q4/7B/2N5/1P6/4R1K1"
        self.chess_board = chess.Board(self.current_fen)
        print(self.chess_board)

        self.running = True
        self.led_controller.init_chess_matrix()
        thread = threading.Thread(target=self.poll_loop, daemon=True)
        thread.start()
    
    def stop(self):
        self.running = False
        self.led_controller.clear()

    def poll_loop(self):
        print("[GameLoop] gestartet.")

        while self.running:
            outcome = self.chess_board.outcome()
            if outcome:
                winner = outcome.winner  # Check if outcome is not None
                print(f"[Winner]: { {True: 'White', False: 'Black', None: 'Draw'}[winner] }")
                self.stop()
                break

            detected_squares = set(self.multiplexer.detect_signal())

            if detected_squares != self.previous_state:
                self.handle_change(self.previous_state, detected_squares)
                self.previous_state = detected_squares

            time.sleep(0.1)  # poll rate 100 ms
    
    def handle_change(self, old_state, new_state):
        removed = list(old_state - new_state)  # get detected square by subtracting new state from old state 
        added = list(new_state - old_state)
        self.opponent_squares = []

        # If a castling move was just made, ignore the rook's physical movement
        if self.castling_pending:
            cf = self.castling_pending['from']
            ct = self.castling_pending['to']
            changed = False

            if cf in removed:
                self.castling_pending['removed'] = True
                changed = True
            if ct in added:
                self.castling_pending['placed'] = True
                changed = True

            # If we detected any part of the rook relocation, do not interpret it as a move
            if changed:
                # When both actions are observed, clear pending and refresh LEDs
                if self.castling_pending['removed'] and self.castling_pending['placed']:
                    self.castling_pending = None
                    self.selected_square = None
                    self.pending_capture = None
                    # Re-sync LEDs to board state
                    self.led_controller.init_chess_matrix()
                    # Clear highlights on frontend
                    if hasattr(self, 'highlight_callback') and self.highlight_callback:
                        self.source_square = ""
                        self.opponent_squares = []
                        self.highlight_callback([])
                return

        if len(removed) == 1 and not self.selected_square:
            # Figur wurde aufgenommen
            self.selected_square = removed[0]
            self.source_square = chess.square_name(self.square_to_index(self.selected_square))

            self.led_controller.set_color(self.selected_square.x_position, self.selected_square.y_position, (255, 255, 0))
            legal_moves = self.get_legal_moves_from_square(self.square_to_index(self.selected_square)) # list of legal moves for 'removed' piece

            for legal_move in legal_moves:
                move = chess.Move.from_uci(legal_move) # convert the UCI move into a chess move object
                to_square = move.to_square
                x_coordinate = chess.square_file(to_square)
                y_coordinate = 7 - chess.square_rank(to_square)

                if self.chess_board.piece_at(to_square): # prüft ob dort eine figur steht
                    self.led_controller.set_color(x_coordinate, y_coordinate, (0, 255, 0))
                    self.opponent_squares.append(chess.square_name(to_square))
                else:
                    self.led_controller.set_color(x_coordinate, y_coordinate, (255, 0, 0))

            # Callback für Highlight-Moves aufrufen
            if hasattr(self, 'highlight_callback') and self.highlight_callback:
                self.highlight_callback(legal_moves)
            return
        
        if self.selected_square in added:
            # 1 Figur wird aufgehoben und auf Ausgangsposition zurückgelegt
            self.led_controller.init_chess_matrix()
            self.selected_square = None

            self.source_square = ""
            self.opponent_squares = []
            self.highlight_callback([])
            return

        if len(removed) == 0 and len(added) == 1 and self.selected_square:
            # Genau 1 Figur wurde aufgenommen und abgesetzt
            target_square = added.pop()
            from_square = self.selected_square

            # Prüfen, ob es sich um eine Rochade handelt
            move = chess.Move(
                self.square_to_index(from_square),
                self.square_to_index(target_square)
            )
            if self.chess_board.is_castling(move):
                self.make_move(from_square, target_square)  # König bewegen
                self.selected_square = None

                self.source_square = ""
                self.opponent_squares = []
                self.highlight_callback([])
                return

            # Normaler Zug
            self.make_move(from_square, target_square)

            self.source_square = ""
            self.opponent_squares = []
            self.highlight_callback([])
            self.selected_square = None


        # Ignoriere Turmbewegung während Rochade
        if len(removed) == 1 and len(added) == 1:
            removed_square = removed[0]
            added_square = added[0]

            if self.chess_board.piece_at(self.square_to_index(removed_square)) and \
               self.chess_board.piece_at(self.square_to_index(added_square)):
                # Turm wurde während Rochade bewegt, ignoriere
                return

        if len(removed) == 1 and self.selected_square and not self.pending_capture:
            # Während eine Figur ausgewhält ist, wird noch eine figur entfernt
            self.pending_capture = removed[0]
            return
        
        if len(added) == 1 and self.selected_square:
            # Nach Schlagen wird die Figur auf neues feld gesetzt
            target_square = added[0]
            from_square = self.selected_square
            self.selected_square = None
            self.make_move(from_square, target_square)
            self.pending_capture = None

            self.source_square = ""
            self.opponent_squares = []
            self.highlight_callback([])
            return
        
        if len(removed) == 0 and len(added) == 0:
            # Keine Figur hinzugefügt oder entfernt
            self.selected_square = None
            self.pending_capture = None

    def _castling_rook_squares(self, move: chess.Move) -> tuple[Square, Square] | None:
        """Return rook from/to as Square objects for a given castling move, else None."""
        if move.from_square == chess.E1 and move.to_square == chess.G1:  # White kingside
            r_from, r_to = chess.H1, chess.F1
        elif move.from_square == chess.E1 and move.to_square == chess.C1:  # White queenside
            r_from, r_to = chess.A1, chess.D1
        elif move.from_square == chess.E8 and move.to_square == chess.G8:  # Black kingside
            r_from, r_to = chess.H8, chess.F8
        elif move.from_square == chess.E8 and move.to_square == chess.C8:  # Black queenside
            r_from, r_to = chess.A8, chess.D8
        else:
            return None

        fx, fy = self.index_to_square(r_from)
        tx, ty = self.index_to_square(r_to)
        return Square(fx, fy), Square(tx, ty)

    def make_move(self, from_square, to_square):
        move = chess.Move(
            self.square_to_index(from_square),
            self.square_to_index(to_square)
        )

        if move in self.chess_board.legal_moves:
            print(f"[Zug] Legal: {move.uci()}")
            # Determine castling before pushing (board expects pre-push context)
            is_castle = self.chess_board.is_castling(move)
            rook_plan = self._castling_rook_squares(move) if is_castle else None

            self.chess_board.push(move)

            # If castling, set pending rook relocation to ignore physical move as a separate turn
            if rook_plan:
                r_from_sq, r_to_sq = rook_plan
                self.castling_pending = { 'from': r_from_sq, 'to': r_to_sq, 'removed': False, 'placed': False }

            self.led_controller.init_chess_matrix()
            self.current_fen = self.chess_board.fen()
            print(self.chess_board.fen())

            # Boardupdate Callback aufrufen
            if self.board_update:
                self.board_update(self.current_fen)
        else:
            print(f"[Zug] Illegal: {move.uci()}")

        time.sleep(0.5)
    
    def square_to_index(self, square: Square) -> int:
        return chess.square(square.x_position, 7 - square.y_position)
    
    def index_to_square(self, index: int) -> tuple[int, int]:
        x = chess.square_file(index)
        y = 7 - chess.square_rank(index)

        return (x, y)  # Return as a tuple
    
    def get_current_fen(self) -> str:
        return self.current_fen

    def reset_game(self):
        self.chess_board.reset()

    # encapsulate this later
    def get_legal_moves_from_square(self, square: int):
        return [
            move.uci()
            for move in self.chess_board.legal_moves
            if move.from_square == square
        ]
