import "../scss/gameInfo.scss";
import { usePlayer } from "../../context/playerContext/usePlayer";
import { useGameTime } from "../../context/gameTime/useGameTime";
import { useGameInfo } from "../../context/gameInfo/useGameInfo";
import { useRef, useEffect, useState } from "react";

import playIconWhite from "icons/eh-play-white.svg";
import pauseIconWhite from "icons/eh-pause-white.svg";
import surrenderWhite from "icons/eh-flag-white.svg";
import handshakeNr1 from "icons/handshakeNr1.svg";
import checkIcon from "icons/eh-confirmation-white.svg";
import closeIcon from "icons/eh-cancel-white.svg";

import blackPawn from "chessPieces/black-pawn.svg";
import whitePawn from "chessPieces/white-pawn.svg";
import blackRook from "chessPieces/black-rook.svg";
import whiteRook from "chessPieces/white-rook.svg";
import blackKnight from "chessPieces/black-knight.svg";
import whiteKnight from "chessPieces/white-knight.svg";
import blackBishop from "chessPieces/black-bishop.svg";
import whiteBishop from "chessPieces/white-bishop.svg";
import blackQueen from "chessPieces/black-queen.svg";
import whiteQueen from "chessPieces/white-queen.svg";
import blackKing from "chessPieces/black-king.svg";
import whiteKing from "chessPieces/white-king.svg";

const pieces: Record<string, string> = {
  r: blackRook,
  n: blackKnight,
  b: blackBishop,
  q: blackQueen,
  k: blackKing,
  p: blackPawn,
  R: whiteRook,
  N: whiteKnight,
  B: whiteBishop,
  Q: whiteQueen,
  K: whiteKing,
  P: whitePawn,
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const GameInfo = () => {
  const { capturedPieces, isCheck, isCheckMate, isStaleMate, finishGame } =
    useGameInfo();
  const {
    playerOneTime,
    playerTwoTime,
    activePlayer,
    isRunning,
    gameResult,
    startTimer,
    pauseTimer,
  } = useGameTime();

  const { whitePlayer, blackPlayer } = usePlayer();

  const [showDrawPopup, setShowDrawPopup] = useState(false);
  const [acceptedWhitePlayer, setAcceptedWhitePlayer] = useState(false);
  const [acceptedBlackPlayer, setAcceptedBlackPlayer] = useState(false);
  const wasRunningBeforeDrawRef = useRef(false);

  const handleSurrenderPlayerOne = () =>
    finishGame({ winner: whitePlayer, reason: "resignation" });

  const handleSurrenderPlayerTwo = () =>
    finishGame({ winner: blackPlayer, reason: "resignation" });

  const handleDrawClick = () => {
    wasRunningBeforeDrawRef.current = isRunning;
    setShowDrawPopup(true);
    if (isRunning) pauseTimer();
  };

  const handleBlackAccept = () => {
    setAcceptedBlackPlayer(true);
  };

  const handleWhiteAccept = () => {
    setAcceptedWhitePlayer(true);
  };

  const handleCancelDraw = () => {
    setShowDrawPopup(false);
    setAcceptedWhitePlayer(false);
    setAcceptedBlackPlayer(false);
    if (wasRunningBeforeDrawRef.current) startTimer();
    wasRunningBeforeDrawRef.current = false;
  };

  useEffect(() => {
    if (acceptedWhitePlayer && acceptedBlackPlayer) {
      finishGame({ reason: "draw" });
      setShowDrawPopup(false);
      setAcceptedWhitePlayer(false);
      setAcceptedBlackPlayer(false);
    }
  }, [acceptedWhitePlayer, acceptedBlackPlayer, finishGame]);

  useEffect(() => {
    if (gameResult.reason !== null && showDrawPopup) {
      setShowDrawPopup(false);
      setAcceptedWhitePlayer(false);
      setAcceptedBlackPlayer(false);
    }
  }, [gameResult, showDrawPopup]);

  const winnerAnnouncement = (() => {
    if (gameResult.reason === "draw") return "Remis";
    if (gameResult.winner) {
      const reasonMap: Record<string, string> = {
        resignation: "durch Aufgabe",
        timeout: "durch Zeitüberschreitung",
        checkmate: "durch Schachmatt",
      };
      return `${gameResult.winner} gewinnt (${
        gameResult.reason
          ? reasonMap[gameResult.reason] ?? gameResult.reason
          : "unbekannter Grund"
      })`;
    }
    return null;
  })();

  return (
    <>
      <div className="game-info-container">
        <div className="player-section">
          <button
            className="surrender-button"
            onClick={handleSurrenderPlayerOne}
            disabled={!isRunning}
            title="Aufgeben"
          >
            <img src={surrenderWhite} alt="Aufgeben" />
          </button>

          <div className="timer-section">
            <div
              className={`timer-button-display ${
                activePlayer === "one" && isRunning ? "active" : ""
              }`}
            >
              <div className="player-name">{blackPlayer}</div>
              <div className="timer-value">{formatTime(playerOneTime)}</div>
            </div>
          </div>
        </div>

        {capturedPieces.white.length > 0 && (
          <div className="captured-pieces-section">
            <div className="captured-pieces-grid">
              {capturedPieces.white.map((p, i) => (
                <img
                  key={`w-${p}-${i}`}
                  src={pieces[p]}
                  alt={p}
                  className="chess-pieces"
                  style={{ width: "2rem", height: "2rem" }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="game-status">
          {winnerAnnouncement && (
            <div className="winner-announcement">{winnerAnnouncement}</div>
          )}
          {isCheckMate && gameResult.winner === null && (
            <div className="winner-announcement">Schachmatt!</div>
          )}
          {isStaleMate && gameResult.winner === null && (
            <div className="winner-announcement">Patt!</div>
          )}
          {isCheck && !isCheckMate && gameResult.winner === null && (
            <div className="winner-announcement">Schach!</div>
          )}
        </div>

        <div className="game-controls-center">
          {isRunning ? (
            <button className="game-button" onClick={pauseTimer} title="Pause">
              <img src={pauseIconWhite} alt="Pause" />
            </button>
          ) : (
            <button className="game-button" onClick={startTimer} title="Start">
              <img src={playIconWhite} alt="Start" />
            </button>
          )}
          <button
            className="game-button"
            onClick={handleDrawClick}
            title="Remis anbieten"
          >
            <img src={handshakeNr1} alt="Remis" />
          </button>
        </div>

        {capturedPieces.black.length > 0 && (
          <div className="captured-pieces-section">
            <div className="captured-pieces-grid">
              {capturedPieces.black.map((p, i) => (
                <img
                  key={`b-${p}-${i}`}
                  src={pieces[p]}
                  alt={p}
                  className="chess-pieces"
                  style={{ width: "2rem", height: "2rem" }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="player-section">
          <button
            className="surrender-button"
            onClick={handleSurrenderPlayerTwo}
            disabled={!isRunning}
            title="Aufgeben"
          >
            <img src={surrenderWhite} alt="Aufgeben" />
          </button>

          <div className="timer-section">
            <div
              className={`timer-button-display ${
                activePlayer === "two" && isRunning ? "active" : ""
              }`}
            >
              <div className="player-name">{whitePlayer}</div>
              <div className="timer-value">{formatTime(playerTwoTime)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Draw Popup */}
      {showDrawPopup && (
        <div className="draw-popup-overlay">
          <div className="draw-popup-container">
            <h2 className="draw-popup-title">Remis Angebot</h2>

            <div className="draw-popup-content">
              <div className="draw-player-section">
                <p className="draw-player-label">
                  Schwarzer Spieler: {blackPlayer}
                </p>
                <div className="draw-button-group">
                  <button
                    className={`draw-accept-button ${
                      acceptedBlackPlayer ? "accepted" : ""
                    }`}
                    onClick={handleBlackAccept}
                    disabled={acceptedBlackPlayer}
                  >
                    <img src={checkIcon} alt="Akzeptieren" />
                    {acceptedBlackPlayer ? "Akzeptiert" : "Akzeptieren"}
                  </button>
                  <button
                    className="draw-cancel-button"
                    onClick={handleCancelDraw}
                  >
                    <img src={closeIcon} alt="Abbrechen" />
                    {"Ablehnen"}
                  </button>
                </div>
              </div>

              <div className="draw-divider" />

              <div className="draw-player-section">
                <p className="draw-player-label">
                  Weißer Spieler: {whitePlayer}
                </p>
                <div className="draw-button-group">
                  <button
                    className={`draw-accept-button ${
                      acceptedWhitePlayer ? "accepted" : ""
                    }`}
                    onClick={handleWhiteAccept}
                    disabled={acceptedWhitePlayer}
                  >
                    <img src={checkIcon} alt="Akzeptieren" />
                    {acceptedWhitePlayer ? "Akzeptiert" : "Akzeptieren"}
                  </button>
                  <button
                    className="draw-cancel-button"
                    onClick={handleCancelDraw}
                  >
                    <img src={closeIcon} alt="Abbrechen" />
                    {"Ablehnen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameInfo;
