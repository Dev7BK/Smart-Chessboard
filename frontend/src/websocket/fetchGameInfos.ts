const API_PATH = "http://10.42.0.1:8000/api";
const WS_PATH = "ws://10.42.0.1:8000/ws";

export const setGameStatus = async (
  status: string
): Promise<{ status: string }> => {
  try {
    const response = await fetch(`${API_PATH}/${status}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Fehler beim Setzen des Spielstatus: ${error}`);
  }
};

export async function waitForBackendReady(
  timeoutMs = 15000,
  url = API_PATH
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { cache: "no-store", method: "GET" });
      if (res.ok || res.status === 404) return;
    } catch {
      // Backend not available yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Backend not ready within ${timeoutMs}ms`);
}

export type BoardInfoMessage = {
  fen: string;
  is_check: boolean;
  is_checkmate: boolean;
  is_stalemate: boolean;
  last_move: string | null;
  player_turn: string;
};

export type HighlightMessage = {
  highlight: string[];
  from_square: string | null;
  opponent_squares: string[];
};

export type UnknownMessage = { type: "unknown"; raw: string };
export type GameSocketMessage =
  | BoardInfoMessage
  | HighlightMessage
  | UnknownMessage;

export type GameWebSocket = {
  onMessage: (
    handler: (msg: GameSocketMessage, raw: string) => void
  ) => () => void;
  onOpen: (handler: () => void) => () => void;
  onError: (handler: (err: Event) => void) => () => void;
  onClose: (handler: () => void) => () => void;
  close: () => void;
};

export const connectGameWebSocket = (): GameWebSocket => {
  const wsUrl = import.meta.env.VITE_WS_PATH || WS_PATH;

  let ws: WebSocket | null = null;
  let manualClose = false;
  let retries = 0;
  const MAX_RETRIES = 12;

  const messageHandlers: Array<(msg: GameSocketMessage, raw: string) => void> =
    [];
  const openHandlers: Array<() => void> = [];
  const errorHandlers: Array<(err: Event) => void> = [];
  const closeHandlers: Array<() => void> = [];

  const attach = () => {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      retries = 0;
      for (const h of openHandlers) h();
    };

    ws.onmessage = (event) => {
      let parsed: GameSocketMessage;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        parsed = { type: "unknown", raw: event.data };
      }
      for (const h of messageHandlers) h(parsed, event.data);
    };

    ws.onerror = (err) => {
      for (const h of errorHandlers) h(err);
    };

    ws.onclose = async () => {
      for (const h of closeHandlers) h();
      if (manualClose) return;
      if (retries >= MAX_RETRIES) return;
      const delay = Math.min(8000, 500 * Math.pow(2, retries));
      retries += 1;
      await new Promise((r) => setTimeout(r, delay));
      attach();
    };
  };

  attach();

  return {
    onMessage: (handler) => {
      messageHandlers.push(handler);
      return () => {
        const idx = messageHandlers.indexOf(handler);
        if (idx !== -1) messageHandlers.splice(idx, 1);
      };
    },
    onOpen: (handler) => {
      openHandlers.push(handler);
      return () => {
        const idx = openHandlers.indexOf(handler);
        if (idx !== -1) openHandlers.splice(idx, 1);
      };
    },
    onError: (handler) => {
      errorHandlers.push(handler);
      return () => {
        const idx = errorHandlers.indexOf(handler);
        if (idx !== -1) errorHandlers.splice(idx, 1);
      };
    },
    onClose: (handler) => {
      closeHandlers.push(handler);
      return () => {
        const idx = closeHandlers.indexOf(handler);
        if (idx !== -1) closeHandlers.splice(idx, 1);
      };
    },
    close: () => {
      manualClose = true;
      ws?.close();
    },
  };
};

export const collectAllMessages = (
  timeoutMs = 3000
): Promise<GameSocketMessage[]> => {
  return new Promise((resolve) => {
    const messages: GameSocketMessage[] = [];
    const ws = connectGameWebSocket();
    ws.onMessage((m) => messages.push(m));
    const timer = setTimeout(() => {
      ws.close();
      resolve(messages);
    }, timeoutMs);
    ws.onClose(() => {
      clearTimeout(timer);
      resolve(messages);
    });
  });
};
