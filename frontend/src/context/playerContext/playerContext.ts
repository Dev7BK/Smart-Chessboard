import { createContext } from "react";
import { Observable } from "rxjs";

export type PlayerContextType = {
  blackPlayer: string;
  whitePlayer: string;
  setBlackPlayer: (gamertag: string) => void;
  setWhitePlayer: (gamertag: string) => void;
  fetchPlayers: () => Observable<
    { id: number; gamertag: string; elo: number }[]
  >;

  fetchCreatePlayer: (player: {
    id: number;
    gamertag: string;
    elo: number;
  }) => Observable<{ success: boolean; message: string }>;

  fetchDeletePlayer: (
    playerId: number
  ) => Observable<{ success: boolean; message: string }>;

  fetchUpdatePlayer: (
    playerId: number,
    playerObject: { id: number; gamertag: string; elo: number }
  ) => Observable<{ success: boolean; message: string }>;
};

export const PlayerContext = createContext<PlayerContextType | undefined>(
  undefined
);
