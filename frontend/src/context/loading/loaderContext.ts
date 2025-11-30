import { createContext } from "react";

export type LoaderContextType = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  inProgress: <T>(task: (() => Promise<T>) | Promise<T>) => Promise<T>;
};

export const LoaderContext = createContext<LoaderContextType | undefined>(
  undefined
);
