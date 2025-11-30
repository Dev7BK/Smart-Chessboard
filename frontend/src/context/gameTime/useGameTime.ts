import { useContext } from "react";
import { GameTimeContext } from "./gameTimeContext";

export const useGameTime = () => {
  const context = useContext(GameTimeContext);
  if (!context) {
    throw new Error("useGameTime must be used within a GameTimeProvider");
  }
  return context;
};
