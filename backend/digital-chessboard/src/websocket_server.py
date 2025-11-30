""" This Module manages the connected clients and pushes board updates to all clients"""
from fastapi import FastAPI
from fastapi import APIRouter, WebSocket
from pydantic import BaseModel
from typing import Set

app = FastAPI()
router = APIRouter()
connected_clients: Set[WebSocket] = set()

class Move(BaseModel):
    from_square: str
    to_square: str
    promotion: str | None = None

class BoardInformation(BaseModel):
    fen: str
    total_legal_moves: list[str]
    is_check: bool
    is_checkmate: bool
    is_stalemate: bool
    last_move: str | None = None
    player_turn: str
    message: str | None = None

class GameplayState(BaseModel):
    paused: bool = True

class HighlightMove(BaseModel):
    squares: list[str]

class Player(BaseModel):
    id: int
    gamertag: str
    elo: int


@app.get("/api") 
async def api_status():
    """API endpoint to check if the server is running"""
    return "API is running"

@app.post("/api/create_player")
async def create_player(input: Player):
    id = input.id
    gamertag = input.gamertag
    elo = input.elo

    file_path =  r"players.csv"

    with open(file_path) as file:
        file.write(f"{id},{gamertag},{elo}\n")

@app.get("/api/get_players", response_model=list[Player])
async def get_players():
    players = []
    file_path = r"players.csv"
    with open(file_path) as file:
        for line in file:
            id, gamertag, elo = line.strip().split(",")
            players.append(Player(id=int(id), gamertag=gamertag, elo=int(elo)))
    return players

@app.delete("/api/delete_player/{player_id}")
async def delete_player(player_id: int):
    file_path = r"players.csv"
    lines = []
    with open(file_path) as file:
        lines = file.readlines()
    
    with open(file_path, 'w') as file:
        for line in lines:
            if not line.startswith(f"{player_id},"):
                file.write(line)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except:
        connected_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)