import "../../scss/player/choosePlayerPopUp.scss";
import { useEffect, useState, useCallback, useRef } from "react";
import AddPlayerPopUp from "./AddPlayerPopUp";
import { usePlayer } from "../../../context/playerContext/usePlayer";
import { useNotification } from "../../../context/notification/useNotification";
import { from } from "rxjs";
import { finalize } from "rxjs/operators";
import { useLoader } from "../../../context/loading/useLoader";
import playerBlackIcon from "chessPieces/black-pawn.svg";
import playerWhiteIcon from "chessPieces/white-pawn.svg";
import addPlayerWhiteIcon from "icons/add-player-white.svg";
import closeWhiteIcon from "icons/eh-cancel-white.svg";
import deletePlayerWhiteIcon from "icons/eh-delete-white.svg";
import editPlayerWhiteIcon from "icons/eh-edit-white.svg";
import submitWhiteIcon from "icons/eh-confirmation-white.svg";

type ChoosePlayerPopUpProps = {
  setChangePlayerPopUp: (value: boolean) => void;
  isPlayerOne: boolean | null;
  setIsPlayerOne: (value: boolean | null) => void;
};

type Player = {
  id: number;
  gamertag: string;
  elo: number;
};

const ChoosePlayerPopUp = ({
  setChangePlayerPopUp,
  isPlayerOne,
  setIsPlayerOne,
}: ChoosePlayerPopUpProps) => {
  const {
    setBlackPlayer,
    setWhitePlayer,
    blackPlayer,
    whitePlayer,
    fetchPlayers,
    fetchDeletePlayer,
    fetchUpdatePlayer,
  } = usePlayer();

  const { showSuccess, showError } = useNotification();
  const { startLoading, stopLoading } = useLoader();

  const lastIsPlayerOneRef = useRef<boolean | null>(isPlayerOne);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [openAddPlayerPopUp, setOpenAddPlayerPopUp] = useState<boolean>(false);
  const [editPlayer, setEditPlayer] = useState<boolean>(false);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const editableRef = useRef<HTMLInputElement | null>(null);
  const cancelEditRef = useRef<boolean>(false);

  const refreshPlayers = useCallback(() => {
    console.info("ChoosePlayerPopUp: Refreshing players list", {
      timestamp: new Date().toISOString(),
      action: "manual_refresh",
    });

    startLoading();
    fetchPlayers()
      .pipe(finalize(() => stopLoading()))
      .subscribe({
        next: (players: Player[]) => {
          console.log("ChoosePlayerPopUp: Players loaded successfully", {
            playerCount: players.length,
            players: players.map((p) => ({ id: p.id, name: p.gamertag })),
            timestamp: new Date().toISOString(),
          });
          setAllPlayers(players);
        },
        error: (error: { success: boolean; message: string }) => {
          console.error("ChoosePlayerPopUp: Failed to load players", {
            error: error.message || "Unknown error",
            timestamp: new Date().toISOString(),
            context: "refreshPlayers",
          });
          showError(error.message || "Spieler konnten nicht geladen werden.");
          setAllPlayers([]);
        },
      });
  }, [fetchPlayers, showError, startLoading, stopLoading]);

  useEffect(() => {
    refreshPlayers();
  }, [refreshPlayers]);

  const filteredPlayers = allPlayers.filter(
    (player) =>
      player.gamertag !== blackPlayer && player.gamertag !== whitePlayer
  );

  const handlePlayerOneChange = (selectedPlayer: string) => {
    if (!editPlayer && whitePlayer !== selectedPlayer) {
      setWhitePlayer(selectedPlayer);
    }
  };

  const handlePlayerTwoChange = (selectedPlayer: string) => {
    if (!editPlayer && blackPlayer !== selectedPlayer) {
      setBlackPlayer(selectedPlayer);
    }
  };

  const handleDeletePlayer = useCallback(
    (playerId: number) => {
      console.info("ChoosePlayerPopUp: Attempting to delete player", {
        playerId,
        timestamp: new Date().toISOString(),
      });

      startLoading();
      const response = from(fetchDeletePlayer(playerId)).pipe(
        finalize(() => stopLoading())
      );
      response.subscribe({
        next: (result) => {
          console.log("ChoosePlayerPopUp: Player deleted successfully", {
            playerId,
            serverResponse: result.message,
            timestamp: new Date().toISOString(),
          });
          showSuccess("Spieler erfolgreich gelöscht!");
          refreshPlayers();
        },
        error: (error) => {
          console.error("ChoosePlayerPopUp: Failed to delete player", {
            playerId,
            error: error.message || "Unknown error",
            stack: error.stack,
            timestamp: new Date().toISOString(),
            context: "handleDeletePlayer",
          });
          showError(error.message || "Spieler konnte nicht gelöscht werden.");
        },
      });
    },
    [
      showError,
      showSuccess,
      fetchDeletePlayer,
      refreshPlayers,
      startLoading,
      stopLoading,
    ]
  );

  const handleSubmitEdit = (player: Player, newGamerTag: string) => {
    console.info("ChoosePlayerPopUp: Attempting to update player", {
      playerId: player.id,
      updatedData: { id: player.id, gamertag: newGamerTag },
      timestamp: new Date().toISOString(),
    });

    startLoading();
    fetchUpdatePlayer(player.id, {
      id: player.id,
      gamertag: newGamerTag,
      elo: player.elo,
    })
      .pipe(finalize(() => stopLoading()))
      .subscribe({
        next: () => {
          console.log("ChoosePlayerPopUp: Player updated successfully", {
            playerId: player.id,
            updatedPlayer: { id: player.id, gamertag: newGamerTag },
            timestamp: new Date().toISOString(),
          });

          showSuccess("Spieler erfolgreich aktualisiert!");
          setEditPlayer(false);
          setEditingPlayerId(null);
          refreshPlayers();
        },
        error: (error: Error) => {
          console.error("ChoosePlayerPopUp: Failed to update player", {
            playerId: player.id,
            updatedPlayer: { id: player.id, gamertag: newGamerTag },
            error: error.message || "Unknown error",
            stack: error.stack,
            timestamp: new Date().toISOString(),
            context: "handleEditPlayer",
          });

          showError(
            error.message || "Spieler konnte nicht aktualisiert werden."
          );
          setEditPlayer(false);
          setEditingPlayerId(null);
        },
      });
  };

  const getNextFreePlayerId = () => {
    let id = 1;

    while (allPlayers.some((player: Player) => player.id === id)) {
      id++;
    }

    return id;
  };

  const handleAddPlayerPopUp = () => {
    setOpenAddPlayerPopUp(true);
  };

  useEffect(() => {
    if (editPlayer) {
      setIsPlayerOne(null);
    } else {
      setIsPlayerOne(lastIsPlayerOneRef.current);
    }
  }, [editPlayer, setIsPlayerOne]);

  useEffect(() => {
    if (editPlayer && editableRef.current) {
      const input = editableRef.current;
      input.focus();
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }
  }, [editPlayer]);

  return (
    <div className="choose-player-primary-div">
      {!openAddPlayerPopUp && (
        <div className="choose-player-secondary-div">
          <div className="tertiary-div">
            <div className="player-choice">
              <button
                className={`player-icon-container ${
                  isPlayerOne ? "active" : "inactive"
                }`}
                onClick={() => {
                  setIsPlayerOne(true);
                  setEditPlayer(false);
                }}
                disabled={editPlayer}
              >
                <img
                  src={playerWhiteIcon}
                  alt="Player 1 Icon"
                  className="player-icon"
                />
              </button>
              <span className="chosen-player white-text">{whitePlayer}</span>
            </div>
            <span className="chosen-player vs-text">vs</span>
            <div className="player-choice">
              <span className="chosen-player black-text">{blackPlayer}</span>
              <button
                className={`player-icon-container ${
                  !isPlayerOne && isPlayerOne !== null ? "active" : "inactive"
                }`}
                onClick={() => {
                  setIsPlayerOne(false);
                  setEditPlayer(false);
                }}
                disabled={editPlayer}
              >
                <img
                  src={playerBlackIcon}
                  alt="Player 2 Icon"
                  className="player-icon"
                />
              </button>
            </div>
          </div>

          <div className="player-selection-buttons">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="player-row">
                {editPlayer && editingPlayerId === player.id ? (
                  <input
                    ref={editableRef}
                    className="choose-player-base-button choose-player choose-player-edit-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      if (cancelEditRef.current) {
                        cancelEditRef.current = false;
                        return;
                      }
                      const newValue = editValue;
                      if (newValue.trim() && newValue !== player.gamertag) {
                        handleSubmitEdit(player, newValue);
                      }
                      setEditPlayer(false);
                      setEditingPlayerId(null);
                      setEditValue("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const newValue = editValue;
                        if (newValue.trim() && newValue !== player.gamertag) {
                          handleSubmitEdit(player, newValue);
                        }
                        setEditPlayer(false);
                        setEditingPlayerId(null);
                        setEditValue("");
                        setIsPlayerOne(lastIsPlayerOneRef.current);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setEditPlayer(false);
                        setEditingPlayerId(null);
                        setEditValue("");
                        refreshPlayers();
                        setIsPlayerOne(lastIsPlayerOneRef.current);
                      }
                    }}
                  />
                ) : (
                  <button
                    className="choose-player-base-button choose-player"
                    onClick={() =>
                      isPlayerOne
                        ? handlePlayerOneChange(player.gamertag)
                        : handlePlayerTwoChange(player.gamertag)
                    }
                    disabled={editPlayer && editingPlayerId !== player.id}
                  >
                    {player.gamertag}
                  </button>
                )}
                {!editPlayer || editingPlayerId !== player.id ? (
                  <>
                    <button
                      className="choose-player-base-button edit-player"
                      onClick={() => {
                        lastIsPlayerOneRef.current = isPlayerOne;
                        setEditPlayer(true);
                        setEditingPlayerId(player.id);
                        setEditValue(player.gamertag);
                        setIsPlayerOne(null);
                      }}
                      disabled={editPlayer && editingPlayerId !== player.id}
                    >
                      <img
                        src={editPlayerWhiteIcon}
                        alt="Edit Player Icon"
                        className="edit-player-icon"
                      />
                    </button>
                    <button
                      className="choose-player-base-button delete-player"
                      onClick={() => handleDeletePlayer(player.id)}
                      disabled={editPlayer && editingPlayerId !== player.id}
                    >
                      <img
                        src={deletePlayerWhiteIcon}
                        alt="Delete Player Icon"
                        className="delete-player-icon"
                      />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="choose-player-base-button submit-edit"
                      onMouseDown={() => (cancelEditRef.current = true)}
                      onTouchStart={() => (cancelEditRef.current = true)}
                      onClick={() => {
                        const newValue = editableRef.current
                          ? editableRef.current.value
                          : player.gamertag;
                        if (newValue.trim() && newValue !== player.gamertag) {
                          handleSubmitEdit(player, newValue);
                        }
                        setEditValue("");
                        setEditPlayer(false);
                        setEditingPlayerId(null);
                        setIsPlayerOne(lastIsPlayerOneRef.current);
                      }}
                    >
                      <img
                        src={submitWhiteIcon}
                        alt="Submit Edit Icon"
                        className="submit-edit-icon"
                      />
                    </button>
                    <button
                      className="choose-player-base-button cancel-edit"
                      onMouseDown={() => (cancelEditRef.current = true)}
                      onTouchStart={() => (cancelEditRef.current = true)}
                      onClick={() => {
                        setEditPlayer(false);
                        setEditingPlayerId(null);
                        setIsPlayerOne(lastIsPlayerOneRef.current);
                        refreshPlayers();
                      }}
                    >
                      <img
                        src={closeWhiteIcon}
                        alt="Cancel Edit Icon"
                        className="cancel-edit-icon"
                      />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="choose-player-button-container">
            <button
              className="choose-player-base-button add-player"
              onClick={() => {
                handleAddPlayerPopUp();
                setEditPlayer(false);
              }}
              disabled={editPlayer}
            >
              <img
                src={addPlayerWhiteIcon}
                alt="Add Player Icon"
                className="add-player-icon"
              />
              {"Spieler hinzufügen"}
            </button>
            <button
              className="choose-player-base-button close"
              onClick={() => {
                setChangePlayerPopUp(false);
                setEditPlayer(false);
              }}
              disabled={editPlayer}
            >
              <img
                src={closeWhiteIcon}
                alt="Close Icon"
                className="close-icon"
              />
              {"Schließen"}
            </button>
          </div>
        </div>
      )}

      {openAddPlayerPopUp && (
        <AddPlayerPopUp
          setAddPlayerPopUp={setOpenAddPlayerPopUp}
          nextFreePlayerId={getNextFreePlayerId()}
          refreshPlayers={refreshPlayers}
        />
      )}
    </div>
  );
};

export default ChoosePlayerPopUp;
