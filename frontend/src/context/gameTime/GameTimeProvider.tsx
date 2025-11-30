import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { GameTimeContext } from "./gameTimeContext";
import type { GameResult, TimeoutListener } from "./gameTimeContext";

export const GameTimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [gameTimeMinutes, setGameTimeMinutes] = useState(10);
  const [playerOneTime, setPlayerOneTime] = useState<number>(600);
  const [playerTwoTime, setPlayerTwoTime] = useState<number>(600);
  const [activePlayer, setActivePlayer] = useState<"one" | "two" | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult>({
    winner: null,
    reason: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Merkt sich die initiale Zeit in Sekunden (für Reset am Spielende)
  const initialTimeSecondsRef = useRef<number>(gameTimeMinutes * 60);

  useEffect(() => {
    initialTimeSecondsRef.current = gameTimeMinutes * 60;
  }, [gameTimeMinutes]);

  const timeoutListenersRef = useRef<TimeoutListener[]>([]);
  const subscribeToTimeout = useCallback((cb: TimeoutListener) => {
    timeoutListenersRef.current.push(cb);
    return () => {
      timeoutListenersRef.current = timeoutListenersRef.current.filter(
        (fn) => fn !== cb
      );
    };
  }, []);
  const notifyTimeout = useCallback((loser: "playerOne" | "playerTwo") => {
    for (const fn of timeoutListenersRef.current) {
      try {
        fn(loser);
      } catch {
        // ignore listener errors
      }
    }
  }, []);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimerInterval();

    if (!isRunning || !activePlayer) return;

    intervalRef.current = setInterval(() => {
      if (activePlayer === "one") {
        setPlayerOneTime((t) => {
          if (t <= 1) {
            clearTimerInterval();
            setIsRunning(false);
            setActivePlayer(null);
            notifyTimeout("playerOne");
            return 0;
          }
          return t - 1;
        });
      } else {
        setPlayerTwoTime((t) => {
          if (t <= 1) {
            clearTimerInterval();
            setIsRunning(false);
            setActivePlayer(null);
            notifyTimeout("playerTwo");
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return clearTimerInterval;
  }, [isRunning, activePlayer, clearTimerInterval, notifyTimeout]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimers = useCallback(
    (timeInMinutes: number) => {
      clearTimerInterval();
      const seconds = Math.max(0, Math.floor(timeInMinutes * 60));
      initialTimeSecondsRef.current = seconds;
      setIsRunning(false);
      setActivePlayer(null);
      setPlayerOneTime(seconds);
      setPlayerTwoTime(seconds);
    },
    [clearTimerInterval]
  );

  const switchPlayer = useCallback(() => {
    setActivePlayer((prev) => (prev === "one" ? "two" : "one"));
  }, []);

  const setIndividualTimes = useCallback(
    (playerOneMinutes: number, playerTwoMinutes: number) => {
      const p1 = Math.max(0, Math.floor(playerOneMinutes * 60));
      const p2 = Math.max(0, Math.floor(playerTwoMinutes * 60));
      setPlayerOneTime(p1);
      setPlayerTwoTime(p2);
    },
    []
  );

  const stopTimer = useCallback(
    (
      winner: string | null,
      reason: "timeout" | "resignation" | "draw" | "checkmate"
    ) => {
      clearTimerInterval();
      setIsRunning(false);
      setActivePlayer(null);
      setGameResult({ winner, reason });
    },
    [clearTimerInterval]
  );

  const resetGame = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    setActivePlayer(null);
    setPlayerOneTime(initialTimeSecondsRef.current);
    setPlayerTwoTime(initialTimeSecondsRef.current);
  }, [clearTimerInterval]);

  const prepareNewGame = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    setActivePlayer(null);
    setGameResult({ winner: null, reason: null });
  }, [clearTimerInterval]);

  const setGameTime = useCallback((minutes: number) => {
    setGameTimeMinutes(minutes);
    const seconds = minutes * 60;
    initialTimeSecondsRef.current = seconds;
    setPlayerOneTime(seconds);
    setPlayerTwoTime(seconds);
  }, []);

  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  const value = useMemo(
    () => ({
      playerOneTime,
      playerTwoTime,
      activePlayer,
      isRunning,
      gameResult,
      gameTimeMinutes,
      setGameTime,
      setPlayerOneTime,
      setPlayerTwoTime,
      setActivePlayer,
      startTimer,
      pauseTimer,
      resetTimers,
      switchPlayer,
      setIndividualTimes,
      stopTimer,
      resetGame,
      prepareNewGame,
      subscribeToTimeout,
    }),
    [
      playerOneTime,
      playerTwoTime,
      activePlayer,
      isRunning,
      gameResult,
      gameTimeMinutes,
      setGameTime,
      startTimer,
      pauseTimer,
      resetTimers,
      switchPlayer,
      setIndividualTimes,
      stopTimer,
      resetGame,
      prepareNewGame,
      subscribeToTimeout,
    ]
  );

  return (
    <GameTimeContext.Provider value={value}>
      {children}
    </GameTimeContext.Provider>
  );
};
