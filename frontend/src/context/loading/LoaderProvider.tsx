import { useCallback, useMemo, useRef, useState } from "react";
import { LoaderContext } from "./loaderContext";

export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  const counterRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    counterRef.current += 1;
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current === 0) setIsLoading(false);
  }, []);

  const inProgress = useCallback(
    async <T,>(task: (() => Promise<T>) | Promise<T>) => {
      startLoading();
      try {
        const promise =
          typeof task === "function" ? (task as () => Promise<T>)() : task;
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const value = useMemo(
    () => ({ isLoading, startLoading, stopLoading, inProgress }),
    [isLoading, startLoading, stopLoading, inProgress]
  );

  return (
    <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>
  );
};
