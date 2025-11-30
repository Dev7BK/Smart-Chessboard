""" Detect Moves and parse to Chess UCI """
from multiplexing import Square
from fen_methods import FenAnalysis

class BoardProcessor():
    def __init__(self, board: list[Square]):
        self.starting_map_dict = {
            "a8": "r", "b8": "n", "c8": "b", "d8": "q", "e8": "k", "f8": "b", "g8": "n", "h8": "r",
            "a7": "p", "b7": "p", "c7": "p", "d7": "p", "e7": "p", "f7": "p", "g7": "p", "h7": "p",
            "a2": "P", "b2": "P", "c2": "P", "d2": "P", "e2": "P", "f2": "P", "g2": "P", "h2": "P",
            "a1": "R", "b1": "N", "c1": "B", "d1": "Q", "e1": "K", "f1": "B", "g1": "N", "h1": "R"
        }
        self.current_board_dict = self.starting_map_dict.copy()

    def index_to_square(self, row: int, column: int) -> str:
        """0,0 -> 'a8'; 7,7 -> 'h1'"""
        return chr(ord('a') + column) + str(8 - row)

    """ Generates a valid FEN String from the input and converted sensor data """
    def generate_fen_from_sensor_data(self, squares: list[Square]) -> str:
        board = [['1' for _ in range(8)] for _ in range(8)]

        for square in squares:
            notation = self.index_to_square(square.y_position, square.x_position) # Get chess notation of index position (0, 0) -> a8
            piece = self.current_board_dict.get(notation) # Get the Piece that is at 'a8' -> 'r'
            board[square.y_position][square.x_position] = piece # Set Piece on the correct position on the board

        fen_rows = []
        for row in board:
            fen_row = ''
            empty = 0
            for square in row:
                if square == '1':
                    empty += 1
                else:
                    if empty:
                        fen_row += str(empty)
                        empty = 0
                    fen_row += square
            if empty:
                fen_row += str(empty)
            fen_rows.append(fen_row)
        
        board_fen = '/'.join(fen_rows)

        return board_fen

