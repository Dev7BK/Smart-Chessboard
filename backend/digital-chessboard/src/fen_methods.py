import chess
""" Python Library for Chess Logic """

class FenAnalysis():
    """ Klasse zur Analyse des FEN-String basierend auf einem Input vom Schachbrett. """

    def __init__(self, fen: str) -> None:
        self.fen_string = fen
        self.board = chess.Board(self.fen_string)

    def analyze_fen(self) -> dict:
        """ Analysiert den gegebenen FEN-String """

        is_board_valid = self.board.is_valid()
        is_check = self.board.is_check()
        is_checkmate = self.board.is_checkmate()
        is_stalemate = self.board.is_stalemate()
        legal_moves = list(self.board.legal_moves)

        return {
            "is_board_valid": is_board_valid, 
            "is_check": is_check,
            "is_checkmate": is_checkmate,
            "is_stalemate": is_stalemate,
            "legal_moves": [
                self.board.uci(move)
                for move in legal_moves
            ],
        }
    
    def get_legal_moves_from_square(self, square: int) -> list[str]:
        return [
            move.uci()
            for move in self.board.legal_moves
            if move.from_square == square
        ]


#------------------------- TEST ------------------------- #
if __name__ == "__main__":
    fen_analysis = FenAnalysis("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")

    while not fen_analysis.board.is_checkmate() and not fen_analysis.board.is_stalemate(): # Line too long (102/100)PylintC0301:line-too-long - Alles gut diggi, willst du auch ein bisschen?
        result = fen_analysis.analyze_fen()
        print(f"{fen_analysis.board}\n")

        while True:
            white = chess.Move.from_uci(input("Weis am Zug: "))
            if white in fen_analysis.board.legal_moves:
                fen_analysis.board.push(white)
                break
            print(f"Der Zug {white} ist Illegal!\n")

        print(f"{fen_analysis.board}\n")

        while True:
            black = chess.Move.from_uci(input("Schwarz am Zug: "))
            if black in fen_analysis.board.legal_moves:
                fen_analysis.board.push(black)
                break
            print(f"Der Zug {black} ist Illegal!\n")