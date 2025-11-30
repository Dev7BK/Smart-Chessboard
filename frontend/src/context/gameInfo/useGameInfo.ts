import { useContext } from "react";
import { UseGameContext } from "./gameInfoContext";

export const useGameInfo = () => {
  const context = useContext(UseGameContext);
  if (context === undefined) {
    throw new Error("useGameInfo must be used within a UseGameProvider");
  }
  return context;
};
