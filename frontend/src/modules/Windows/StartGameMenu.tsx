import ChoosePlayer from "../components/player/ChoosePlayer";
import ChooseGameTime from "../components/timer/ChooseGameTime";
import Button from "../../public/components/Button";
import playIconBlack from "icons/eh-play-black.svg";
import playIconWhite from "icons/eh-play-white.svg";
import "../scss/startGameMenu.scss";
import { useGameTime } from "../../context/gameTime/useGameTime";
import { useNotification } from "../../context/notification/useNotification";
import { usePlayer } from "../../context/playerContext/usePlayer";
import { dispatchStart } from "../../context/gameCycle/gameLifeCycle";
import { useGameInfo } from "../../context/gameInfo/useGameInfo";
import { useEffect } from "react";

const StartGameMenu = () => {
  const { gameResult, playerOneTime } = useGameTime();
  const { showSuccess, showError } = useNotification();
  const { blackPlayer: playerOne, whitePlayer: playerTwo } = usePlayer();
  const { startGame } = useGameInfo();

  const handleStartGame = async () => {
    try {
      console.info("StartGameMenu: Attempting to start game", {
        players: { playerOne, playerTwo },
        gameTime: playerOneTime,
        timestamp: new Date().toISOString(),
      });

      if (playerOne === playerTwo) {
        console.warn(
          "StartGameMenu: Validation failed - Same player selected",
          {
            playerOne,
            playerTwo,
            timestamp: new Date().toISOString(),
          }
        );
        showError("Die Spielernamen dürfen nicht identisch sein.");
        return;
      }

      console.log("StartGameMenu: Validation passed, starting game", {
        players: { playerOne, playerTwo },
        gameTime: playerOneTime,
        timestamp: new Date().toISOString(),
      });

      startGame();
      dispatchStart();

      console.log("StartGameMenu: Game started successfully", {
        players: { playerOne, playerTwo },
        gameTime: playerOneTime,
        timestamp: new Date().toISOString(),
      });

      showSuccess(
        `Spiel gestartet! ${playerOne ?? "Spieler Eins"} vs ${
          playerTwo ?? "Spieler Zwei"
        }`
      );
    } catch (error) {
      console.error("StartGameMenu: Error starting game", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        players: { playerOne, playerTwo },
        gameTime: playerOneTime,
        timestamp: new Date().toISOString(),
      });

      showError(
        "Spiel konnte nicht gestartet werden. Bitte versuchen Sie es erneut."
      );
    }
  };

  const reasonText = (r: string | null) => {
    switch (r) {
      case "draw":
        return "Remis";
      case "timeout":
        return "Zeitüberschreitung";
      case "resignation":
        return "Aufgabe";
      case "checkmate":
        return "Schachmatt";
      default:
        return r ?? "";
    }
  };

  useEffect(() => {
    console.log(gameResult.winner, gameResult.reason);
  }, [gameResult]);

  return (
    <div className="div-container">
      <ChoosePlayer />
      <ChooseGameTime />

      {gameResult.reason !== null && (
        <div className="game-result">
          <h2 className="result-title">Spiel beendet</h2>
          <p className="result-message">
            {gameResult.reason === "draw"
              ? "Remis!"
              : `${gameResult.winner} gewinnt! Grund: ${reasonText(
                  gameResult.reason
                )}`}
          </p>
          <Button
            content="Neues Spiel"
            onClick={handleStartGame}
            svgImg={playIconBlack}
            hoverSvgImg={playIconWhite}
          />
        </div>
      )}

      {gameResult.reason === null && (
        <Button
          content="Spiel starten"
          onClick={handleStartGame}
          svgImg={playIconBlack}
          hoverSvgImg={playIconWhite}
        />
      )}
    </div>
  );
};

export default StartGameMenu;
