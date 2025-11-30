import "../../scss/player/addPlayerPopUp.scss";
import { Dispatch, SetStateAction, useState } from "react";
import { from } from "rxjs";
import { finalize } from "rxjs/operators";
import { useLoader } from "../../../context/loading/useLoader";
import addPlayerWhiteIcon from "icons/add-player-white.svg";
import closeWhiteIcon from "icons/eh-cancel-white.svg";
import { useNotification } from "../../../context/notification/useNotification";
import { usePlayer } from "../../../context/playerContext/usePlayer";

type AddPlayerProps = {
  setAddPlayerPopUp: Dispatch<SetStateAction<boolean>>;
  nextFreePlayerId: number;
  refreshPlayers: () => void;
};

const AddPlayerPopUp = ({
  setAddPlayerPopUp,
  nextFreePlayerId,
  refreshPlayers,
}: AddPlayerProps) => {
  const [gamertag, setGamertag] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showError, showSuccess } = useNotification();
  const { fetchCreatePlayer } = usePlayer();
  const { startLoading, stopLoading } = useLoader();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!gamertag.trim()) {
      console.warn(
        "AddPlayerPopUp: Client validation failed - empty gamertag",
        {
          inputValue: gamertag,
          timestamp: new Date().toISOString(),
        }
      );
      setErrorMessage("Gamertag darf nicht leer sein!");
      return;
    }

    const newPlayer = {
      id: nextFreePlayerId,
      gamertag: gamertag.trim(),
      elo: 0,
    };

    console.info("AddPlayerPopUp: Attempting to create player", {
      newPlayer: { id: newPlayer.id, gamertag: newPlayer.gamertag },
      timestamp: new Date().toISOString(),
    });

    startLoading();
    from(fetchCreatePlayer(newPlayer))
      .pipe(finalize(() => stopLoading()))
      .subscribe({
        next: (result) => {
          console.log("AddPlayerPopUp: Server response received", {
            success: result.success,
            message: result.message,
            playerData: { id: newPlayer.id, gamertag: newPlayer.gamertag },
            timestamp: new Date().toISOString(),
          });

          if (result.success) {
            console.log("AddPlayerPopUp: Player created successfully", {
              newPlayer: { id: newPlayer.id, gamertag: newPlayer.gamertag },
              timestamp: new Date().toISOString(),
            });

            setAddPlayerPopUp(false);
            refreshPlayers();
            showSuccess(result.message || "Spieler erfolgreich erstellt!");
          } else {
            console.warn("AddPlayerPopUp: Server validation failed", {
              serverMessage: result.message,
              playerData: { id: newPlayer.id, gamertag: newPlayer.gamertag },
              timestamp: new Date().toISOString(),
            });

            setErrorMessage(
              result.message || "Spieler konnte nicht erstellt werden."
            );
          }
        },
        error: (error) => {
          console.error("AddPlayerPopUp: Network/Connection error", {
            error: error.message || "Unknown error",
            stack: error.stack,
            playerData: { id: newPlayer.id, gamertag: newPlayer.gamertag },
            timestamp: new Date().toISOString(),
            context: "fetchCreatePlayer",
          });

          if (error instanceof TypeError && error.message.includes("fetch")) {
            showError(
              "Keine Verbindung zum Server. Bitte überprüfen Sie Ihre Netzwerkverbindung."
            );
          } else {
            showError("Serverfehler. Bitte versuchen Sie es später erneut.");
          }
        },
      });
  };

  return (
    <div className="add-player-primary-div">
      <div className="add-player-secondary-div">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            id="userName"
            placeholder="Geben Sie Ihren Benutzernamen ein"
            className="input-username"
            value={gamertag}
            onChange={(e) => setGamertag(e.target.value)}
          />
          <p className={`error-message ${errorMessage ? "visible" : ""}`}>
            {errorMessage}
          </p>
          <div className="add-player-button-container">
            <button type="submit" className="add-player-submit-button">
              <img
                src={addPlayerWhiteIcon}
                alt="Add Player Icon"
                className="add-player-icon"
              />
              {"Speichern"}
            </button>
            <button
              type="button"
              className="add-player-cancel-button"
              onClick={() => setAddPlayerPopUp(false)}
            >
              <img
                src={closeWhiteIcon}
                alt="Cancel Icon"
                className="add-player-close-icon"
              />
              {"Abbrechen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlayerPopUp;
