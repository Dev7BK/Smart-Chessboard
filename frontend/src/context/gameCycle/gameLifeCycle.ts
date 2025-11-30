import { Subject } from "rxjs";

export type GameLifecycleEvent =
  | { type: "start" }
  | { type: "pause" }
  | { type: "stop" }
  | { type: "reset"; minutes?: number };

export const gameLifecycle = new Subject<GameLifecycleEvent>();

export const dispatchStart = () => gameLifecycle.next({ type: "start" });
export const dispatchPause = () => gameLifecycle.next({ type: "pause" });
export const dispatchStop = () => gameLifecycle.next({ type: "stop" });
export const dispatchReset = (minutes?: number) =>
  gameLifecycle.next({ type: "reset", minutes });
