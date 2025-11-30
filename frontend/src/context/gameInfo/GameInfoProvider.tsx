import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { UseGameContext, CapturedPieces } from "./gameInfoContext";
import {
  connectGameWebSocket,
  setGameStatus,
  GameWebSocket,
  GameSocketMessage,
  waitForBackendReady,
} from "../../websocket/fetchGameInfos";
import { useNotification } from "../notification/useNotification";
import { useGameTime } from "../gameTime/useGameTime";
import { useLoader } from "../loading/useLoader";
import { usePlayer } from "../playerContext/usePlayer";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const GameInfoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [fenString, setFenString] = useState(INITIAL_FEN);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({
    white: [],
    black: [],
  });
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckMate, setIsCheckMate] = useState(false);
  const [isStaleMate, setIsStaleMate] = useState(false);
  const [playerTurn, setPlayerTurn] = useState<string>("white");

  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [activeSquare, setActiveSquare] = useState<string | null>(null);
  const [opponentSquares, setOpponentSquares] = useState<string[]>([]);

  const wsRef = useRef<GameWebSocket | null>(null);
  const { showSuccess, showError } = useNotification();
  const { inProgress, startLoading, stopLoading, isLoading } = useLoader();
  const {
    startTimer,
    stopTimer,
    subscribeToTimeout,
    resetGame,
    prepareNewGame,
    setActivePlayer,
  } = useGameTime();

  const { whitePlayer, blackPlayer } = usePlayer();

  const timerStartedRef = useRef(false);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsLoadingRef = useRef(false);

  const toErrorInfo = (e: unknown) => {
    if (e instanceof Error) {
      return { name: e.name, message: e.message, stack: e.stack };
    }
    try {
      return { message: JSON.stringify(e) };
    } catch {
      return { message: String(e) };
    }
  };

  const logError = useCallback((ctx: string, e: unknown) => {
    console.error(ctx, toErrorInfo(e));
  }, []);

  const resetToStart = useCallback(
    (opts?: { reason?: "ws_timeout" | "ws_error" }) => {
      setGameStarted(false);
      timerStartedRef.current = false;

      resetGame();

      setFenString(INITIAL_FEN);
      prevFenRef.current = INITIAL_FEN;
      setCapturedPieces({ white: [], black: [] });
      setIsCheck(false);
      setIsCheckMate(false);
      setIsStaleMate(false);
      setPlayerTurn("white");
      setValidMoves([]);
      setActiveSquare(null);
      setOpponentSquares([]);

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          logError("[GameInfoProvider] resetToStart", e);
        }
        wsRef.current = null;
      }
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }

      if (wsLoadingRef.current) {
        stopLoading();
        wsLoadingRef.current = false;
      }

      if (opts?.reason === "ws_timeout") {
        showError?.("Keine Verbindung. Rückkehr zum Start.");
      } else if (opts?.reason === "ws_error") {
        showError?.("WebSocket-Fehler. Rückkehr zum Start.");
      }
    },
    [resetGame, stopLoading, showError, logError]
  );

  const parseFenBoard = useCallback((fen: string): string[] => {
    const boardPart = fen.split(" ")[0];
    const rows = boardPart.split("/");
    const squares: string[] = [];
    for (const row of rows) {
      for (const ch of row) {
        const n = Number(ch);
        if (Number.isNaN(n)) {
          squares.push(ch);
        } else {
          for (let i = 0; i < n; i++) squares.push("");
        }
      }
    }
    return squares;
  }, []);

  const countPieces = useCallback((board: string[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const p of board) {
      if (!p) continue;
      counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, []);

  const isWhitePiece = useCallback((piece: string): boolean => {
    return piece === piece.toUpperCase() && piece !== piece.toLowerCase();
  }, []);

  const detectCapturedPieces = useCallback(
    (oldFen: string, newFen: string): CapturedPieces => {
      const oldCounts = countPieces(parseFenBoard(oldFen));
      const newCounts = countPieces(parseFenBoard(newFen));
      const captured: CapturedPieces = { white: [], black: [] };

      for (const piece of Object.keys(oldCounts)) {
        const before = oldCounts[piece];
        const after = newCounts[piece] || 0;
        if (after < before) {
          const diff = before - after;
          for (let i = 0; i < diff; i++) {
            if (isWhitePiece(piece)) {
              captured.white.push(piece);
            } else {
              captured.black.push(piece);
            }
          }
        }
      }
      return captured;
    },
    [parseFenBoard, countPieces, isWhitePiece]
  );

  const prevFenRef = useRef<string>(INITIAL_FEN);

  const updateFen = useCallback(
    (newFen: string) => {
      const diff = detectCapturedPieces(prevFenRef.current, newFen);
      if (diff.white.length > 0 || diff.black.length > 0) {
        setCapturedPieces((prev) => ({
          white: [...prev.white, ...diff.white],
          black: [...prev.black, ...diff.black],
        }));
      }
      prevFenRef.current = newFen;
      setFenString(newFen);
    },
    [detectCapturedPieces]
  );

  useEffect(() => {
    if (!gameStarted) return;

    startLoading();
    wsLoadingRef.current = true;

    const ws = connectGameWebSocket();
    wsRef.current = ws;

    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = setTimeout(() => {
      console.warn("[GameInfoProvider] WebSocket connect timeout");
      resetToStart({ reason: "ws_timeout" });
    }, 5000);

    const clearWatchdog = () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
    };

    const offMsg = ws.onMessage((msg: GameSocketMessage) => {
      if ("fen" in msg) {
        updateFen(msg.fen);
        setIsCheck(!!msg.is_check);
        setIsCheckMate(!!msg.is_checkmate);
        setIsStaleMate(!!msg.is_stalemate);
        setPlayerTurn(msg.player_turn ?? "white");
        if (msg.player_turn === "white") setActivePlayer("two");
        else if (msg.player_turn === "black") setActivePlayer("one");
        clearWatchdog();
        if (wsLoadingRef.current) {
          stopLoading();
          wsLoadingRef.current = false;
        }
      }

      if ("highlight" in msg) {
        setValidMoves(Array.isArray(msg.highlight) ? msg.highlight : []);
        setActiveSquare(msg.from_square ?? null);
        const combinedOpp = msg.opponent_squares;
        if (Array.isArray(combinedOpp)) {
          setOpponentSquares(combinedOpp);
        }
      }

      if ("opponent_squares" in msg && !("highlight" in msg)) {
        const arr = (msg as { opponent_squares: unknown }).opponent_squares;
        setOpponentSquares(Array.isArray(arr) ? arr : []);
      }
    });

    const offOpen = ws.onOpen(() => {
      console.info("[GameInfoProvider] WebSocket connected");
    });

    const offError = ws.onError((err) => {
      logError("[GameInfoProvider] WebSocket error", err);
      clearWatchdog();
    });

    const offClose = ws.onClose(() => {
      console.warn("[GameInfoProvider] WebSocket closed");
    });

    return () => {
      offMsg();
      offOpen();
      offError();
      offClose();
      try {
        ws.close();
      } catch (e) {
        logError("[GameInfoProvider] WebSocket close error", e);
      }
      wsRef.current = null;
      clearWatchdog();
      if (wsLoadingRef.current) {
        stopLoading();
        wsLoadingRef.current = false;
      }
    };
  }, [
    updateFen,
    gameStarted,
    startLoading,
    stopLoading,
    resetToStart,
    logError,
    setActivePlayer,
  ]);

  useEffect(() => {
    if (!gameStarted) {
      timerStartedRef.current = false;
      return;
    }
    if (!isLoading && !wsLoadingRef.current && !timerStartedRef.current) {
      const timeout = setTimeout(() => {
        startTimer();
        timerStartedRef.current = true;
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [gameStarted, isLoading, startTimer]);

  const startGame = useCallback(async () => {
    try {
      prepareNewGame();

      setFenString(INITIAL_FEN);
      prevFenRef.current = INITIAL_FEN;
      setCapturedPieces({ white: [], black: [] });
      setIsCheck(false);
      setIsCheckMate(false);
      setIsStaleMate(false);
      setPlayerTurn("white");
      setValidMoves([]);
      setActiveSquare(null);
      setOpponentSquares([]);

      await waitForBackendReady(15000);

      await inProgress(() => setGameStatus("start_game"));
      wsLoadingRef.current = true;
      setGameStarted(true);
      showSuccess?.("Spiel gestartet!");

      setActivePlayer("two");

      if (!timerStartedRef.current) {
        startTimer();
        timerStartedRef.current = true;
      }
    } catch (e) {
      logError("[GameInfoProvider] startGame failed", e);
      showError?.("Fehler beim Starten des Spiels");
    }
  }, [
    inProgress,
    showSuccess,
    showError,
    logError,
    prepareNewGame,
    startTimer,
    setActivePlayer,
  ]);

  const stopGame = useCallback(
    async (reason: "draw" | "surrender White" | "surrender Black") => {
      try {
        await inProgress(() => setGameStatus("stop_game"));

        if (reason === "draw") {
          stopTimer(null, "draw");
        } else if (reason === "surrender White") {
          if (blackPlayer) stopTimer(blackPlayer, "resignation");
        } else if (reason === "surrender Black") {
          if (whitePlayer) stopTimer(whitePlayer, "resignation");
        }

        setGameStarted(false);
        timerStartedRef.current = false;

        setFenString(INITIAL_FEN);
        prevFenRef.current = INITIAL_FEN;
        setCapturedPieces({ white: [], black: [] });
        setIsCheck(false);
        setIsCheckMate(false);
        setIsStaleMate(false);
        setPlayerTurn("white");
        setValidMoves([]);
        setActiveSquare(null);
        setOpponentSquares([]);

        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch (e) {
            logError("[GameInfoProvider] stopGame ws close", e);
          }
          wsRef.current = null;
        }

        resetGame();

        showSuccess?.("Spiel beendet: " + reason + "!");
      } catch (e) {
        logError("[GameInfoProvider] stopGame failed", e);
        showError?.("Fehler beim Beenden des Spiels");
      }
    },
    [
      inProgress,
      showSuccess,
      showError,
      logError,
      resetGame,
      stopTimer,
      whitePlayer,
      blackPlayer,
    ]
  );

  const finishGame = useCallback(
    async (
      args:
        | { reason: "draw"; winner?: null }
        | { reason: "timeout" | "resignation" | "checkmate"; winner: string }
    ) => {
      const winner = args.reason === "draw" ? null : args.winner;

      stopTimer(winner, args.reason);
      setGameStarted(false);
      timerStartedRef.current = false;
      showSuccess?.(
        "Spiel beendet!" + (winner ? ` Gewinner: ${winner}` : " Unentschieden.")
      );

      startLoading();
      try {
        await setGameStatus("stop_game");

        setFenString(INITIAL_FEN);
        prevFenRef.current = INITIAL_FEN;
        setCapturedPieces({ white: [], black: [] });
        setIsCheck(false);
        setIsCheckMate(false);
        setIsStaleMate(false);
        setPlayerTurn("white");
        setValidMoves([]);
        setActiveSquare(null);
        setOpponentSquares([]);

        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch (e) {
            logError("[GameInfoProvider] finishGame ws close", e);
          }
          wsRef.current = null;
        }

        resetGame();
      } catch (e) {
        logError("[GameInfoProvider] finishGame backend stop failed", e);
      } finally {
        stopLoading();
      }
    },
    [stopTimer, showSuccess, startLoading, stopLoading, logError, resetGame]
  );

  useEffect(() => {
    if (!gameStarted) return;

    if (isCheckMate) {
      const winner = playerTurn === "white" ? blackPlayer : whitePlayer;
      finishGame({ winner, reason: "checkmate" });
    } else if (isStaleMate) {
      finishGame({ reason: "draw" });
    }
  }, [
    isCheckMate,
    isStaleMate,
    gameStarted,
    playerTurn,
    whitePlayer,
    blackPlayer,
    finishGame,
  ]);

  useEffect(() => {
    if (!subscribeToTimeout) return;
    const unsub = subscribeToTimeout((loser) => {
      const winnerName = loser === "playerOne" ? whitePlayer : blackPlayer;
      if (!winnerName) return;
      finishGame({ winner: winnerName, reason: "timeout" });
    });
    return unsub;
  }, [subscribeToTimeout, finishGame, whitePlayer, blackPlayer]);

  const value = useMemo(
    () => ({
      fenString,
      updateFen,
      isCheck,
      isCheckMate,
      isStaleMate,
      playerTurn,
      validMoves,
      activeSquare,
      opponentSquares,
      capturedPieces,
      gameStarted,
      setGameStarted,
      startGame,
      stopGame,
      finishGame,
    }),
    [
      fenString,
      updateFen,
      isCheck,
      isCheckMate,
      isStaleMate,
      playerTurn,
      validMoves,
      activeSquare,
      opponentSquares,
      capturedPieces,
      gameStarted,
      setGameStarted,
      startGame,
      stopGame,
      finishGame,
    ]
  );

  useEffect(() => {
    console.info("[GameInfoProvider] state update", {
      fenString,
      playerTurn,
      isCheck,
      isCheckMate,
      isStaleMate,
      validMoves,
      activeSquare,
      opponentSquares,
      capturedPieces,
    });
  }, [
    fenString,
    updateFen,
    isCheck,
    isCheckMate,
    isStaleMate,
    playerTurn,
    validMoves,
    activeSquare,
    opponentSquares,
    capturedPieces,
    gameStarted,
    setGameStarted,
    startGame,
    stopGame,
    finishGame,
  ]);

  return (
    <UseGameContext.Provider value={value}>{children}</UseGameContext.Provider>
  );
};
