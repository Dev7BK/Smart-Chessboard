import { createContext } from "react";

export interface CapturedPieces {
  white: string[];
  black: string[];
}

export interface UseGameContextType {
  fenString: string;
  updateFen: (fen: string) => void;
  isCheck: boolean;
  isCheckMate: boolean;
  isStaleMate: boolean;
  playerTurn: string;
  validMoves: string[];
  activeSquare: string | null;
  opponentSquares: string[];
  capturedPieces: CapturedPieces;
  gameStarted: boolean;
  setGameStarted: (v: boolean) => void;

  startGame: () => Promise<void>;
  stopGame: (
    reason: "draw" | "surrender White" | "surrender Black"
  ) => Promise<void>;

  finishGame: (
    args:
      | { reason: "draw"; winner?: null }
      | { reason: "timeout" | "resignation" | "checkmate"; winner: string }
  ) => Promise<void>;
}

export const UseGameContext = createContext<UseGameContextType | undefined>(
  undefined
);
