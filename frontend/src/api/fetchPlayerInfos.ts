const api_path = "http://10.42.0.1:8000/api";

export const getPlayers = async (): Promise<
  { id: number; gamertag: string; elo: number }[]
> => {
  try {
    const response = await fetch(`${api_path}/get_players`);
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der Spieler: ${response.statusText}`);
    }
    const players = await response.json();
    return players;
  } catch (error) {
    throw new Error(
      `Fehler beim Laden der Spieler: ${error}! Bitte versuchen Sie es erneut.`
    );
  }
};

export const updatePlayer = async (
  playerId: number,
  playerObject: {
    id: number;
    gamertag: string;
    elo: number;
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${api_path}/update_player/${playerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(playerObject),
    });
    if (!response.ok) {
      throw new Error(
        `Fehler beim Aktualisieren des Spielers: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Fehler beim Aktualisieren des Spielers: ${error}`);
  }
};

export const createPlayer = async (player: {
  id: number;
  gamertag: string;
  elo: number;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${api_path}/create_player`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(player),
    });
    if (!response.ok) {
      throw new Error(
        `Fehler beim Erstellen des Spielers: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Fehler beim Erstellen des Spielers: ${error}`);
  }
};

export const deletePlayer = async (
  playerId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${api_path}/delete_player/${playerId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Fehler beim Löschen des Spielers: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Fehler beim Löschen des Spielers: ${error}`);
  }
};
