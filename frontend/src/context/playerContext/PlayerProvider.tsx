import { useState, useMemo } from "react";
import { PlayerContext } from "./playerContext";
import { from } from "rxjs";
import {
  getPlayers,
  createPlayer,
  deletePlayer,
  updatePlayer,
} from "../../api/fetchPlayerInfos";

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [blackPlayer, setBlackPlayer] = useState<string>("Nicht ausgewählt");
  const [whitePlayer, setWhitePlayer] = useState<string>("Nicht ausgewählt");

  const value = useMemo(
    () => ({
      blackPlayer,
      whitePlayer,
      setBlackPlayer,
      setWhitePlayer,
      fetchPlayers: () => {
        return from(getPlayers());
      },

      fetchCreatePlayer: (player: {
        id: number;
        gamertag: string;
        elo: number;
      }) => {
        return from(createPlayer(player));
      },

      fetchDeletePlayer: (playerId: number) => {
        return from(deletePlayer(playerId));
      },

      fetchUpdatePlayer: (
        playerId: number,
        playerObject: { id: number; gamertag: string; elo: number }
      ) => {
        return from(updatePlayer(playerId, playerObject));
      },
    }),
    [blackPlayer, whitePlayer]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};
