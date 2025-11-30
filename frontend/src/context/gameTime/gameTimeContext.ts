import { createContext } from "react";

export type GameWinner = string | null;
export type GameEndReason = "timeout" | "resignation" | "draw" | "checkmate" | null;

export type GameResult = {
  winner: GameWinner;
  reason: GameEndReason;
};

export type TimeoutListener = (loser: "playerOne" | "playerTwo") => void;

export type GameTimeContextType = {
  playerOneTime: number;
  playerTwoTime: number;
  activePlayer: "one" | "two" | null;
  isRunning: boolean;
  gameResult: GameResult;
  gameTimeMinutes: number;
  setGameTime: (minutes: number) => void;

  setPlayerOneTime: React.Dispatch<React.SetStateAction<number>>;
  setPlayerTwoTime: React.Dispatch<React.SetStateAction<number>>;
  setActivePlayer: React.Dispatch<React.SetStateAction<"one" | "two" | null>>;

  startTimer: () => void;
  pauseTimer: () => void;
  resetTimers: (timeInMinutes: number) => void;
  switchPlayer: () => void;
  setIndividualTimes: (p1Minutes: number, p2Minutes: number) => void;
  stopTimer: (
    winner: string | null,
    reason: "timeout" | "resignation" | "draw" | "checkmate"
  ) => void;
  resetGame: () => void;
  prepareNewGame: () => void;
  subscribeToTimeout: (cb: TimeoutListener) => () => void;
};

export const GameTimeContext = createContext<GameTimeContextType | undefined>(
  undefined
);
