import { useContext } from "react";
import { LoaderContext } from "./loaderContext";

export const useLoader = () => {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useLoader must be used within LoaderProvider");
  return ctx;
};
