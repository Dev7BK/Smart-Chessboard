""" This Module manages the connected clients and pushes board updates to all clients"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
from typing import Set

from debug_logger import DebugLogger
from game_manager import GameManager
from multiplexing import Multiplexer
from led_interface import LED

main_event_loop = None
app = FastAPI()
connected_clients: Set[WebSocket] = set()
logger = DebugLogger(enable_debug=True)

# Import Controller Classes and Setup
led_controller = LED(WIDTH=8, HEIGHT=8)
mux = Multiplexer(column_pins=[8, 10, 36, 16, 18, 22, 24, 26], row_pins=[29, 31, 7, 11, 13, 15, 19, 23])

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# LED Pins: 
# - Weiß: 5V
# - Purple: LED input
# - Blue: GND

mux.setup()
led_controller.clear()

game_manager = GameManager(mux, led_controller)

led_controller.set_all_color((0, 0, 0))
def get_board_information():
    board = game_manager.chess_board
    return BoardInformation(
        fen=board.fen(),
        is_check=board.is_check(),
        is_checkmate=board.is_checkmate(),
        is_stalemate=board.is_stalemate(),
        last_move=board.peek().uci() if board.move_stack else None,
        player_turn='white' if board.turn else 'black',
    )

class Move(BaseModel):
    # in UCI
    from_square: str
    to_square: str
    promotion: str | None = None

class BoardInformation(BaseModel):
    fen: str
    is_check: bool
    is_checkmate: bool
    is_stalemate: bool
    last_move: str | None = None
    player_turn: str

class GameplayState(BaseModel):
    paused: bool = True

class HighlightMove(BaseModel):
    # in UCI
    squares: list[str]

class GameResult(BaseModel):
    winner: str 
    outcome: str # Draw / Stalemate / Checkmate

class Player(BaseModel):
    id: int
    gamertag: str
    elo: int

file_path = r"./Player/player.csv"

@app.on_event("startup")
async def startup_event():
    global main_event_loop
    main_event_loop = asyncio.get_running_loop()

@app.get("/api") 
async def api_status():
    """API endpoint to check if the server is running"""
    return "API is running"

"""
    Player related Endpoints.
"""

@app.post("/api/create_player")
async def create_player(input: Player):
    """ API Endpoint to create new Players."""
    id = input.id
    gamertag = input.gamertag
    elo = input.elo

    # Check if player already exists
    with open(file_path, 'r') as file:
        for line in file:
            existing_id, existing_gamertag, _ = line.strip().split(",")
            if existing_gamertag == gamertag:
                return {
                        "success": False, 
                        "message": "Player already exists!"
                    }

            elif existing_id == str(id):
                return {
                        "success": False, 
                        "message": "Player ID already exists!"
                    }

    with open(file_path, 'a') as file:
        file.write(f"{id},{gamertag},{elo}\n")

    return {
        "success": True,
        "message": "Player created!"     
    }

@app.get("/api/get_players", response_model=list[Player])
async def get_players():
    """ API Endpoint to view all existing Players. """
    players = []

    with open(file_path) as file:
        for line in file:
            id, gamertag, elo = line.strip().split(",")
            players.append(Player(id=int(id), gamertag=gamertag, elo=int(elo)))
    return players

@app.delete("/api/delete_player/{player_id}")
async def delete_player(player_id: int):
    """ API Endpoint to delete Player based off Player ID."""
    lines = []
    with open(file_path) as file:
        lines = file.readlines()
    
    with open(file_path, 'w') as file:
        for line in lines:
            if not line.startswith(f"{player_id},"):
                file.write(line)
    return { 
        "Success": True,
        "message": "Player deleted!"
    }

@app.put("/api/update_player/{player_id}")
async def update_player(player_id: int, input: Player):
    """ API Endpoint to update player based off Player ID. """
    lines = []
    with open(file_path) as file:
        lines = file.readlines()
    
    with open(file_path, 'w') as file:
        for line in lines:
            if line.startswith(f"{player_id},"):
                file.write(f"{player_id},{input.gamertag},{input.elo}\n")
            else:
                file.write(line)

    return { 
            "Success": True,
            "message": "Player updated!" 
        }


"""
    Game Related Endpoints
"""

@app.post("/api/start_game")
async def start_game():
    if not game_manager.running:
        game_manager.start()
        return {
            "status": "Game started"
        }
    else:
        return {
            "status": "Game already running"
        }

@app.post("/api/stop_game")
async def stop_game():
    if game_manager.running:
        game_manager.stop()
        return {
            "status": "Game stopped."
        }
    else:
        return {
            "status": "Game already stopped."
        }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    board_info = get_board_information()
    await websocket.send_text(board_info.model_dump_json())
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
    
# board_info an alle Clients senden
async def broadcast_board_update():
    board_info = get_board_information()
    data = board_info.model_dump_json()
    disconnected = set()
    for ws in connected_clients:
        try:
            await ws.send_text(data)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        connected_clients.discard(ws)


def board_update_callback(fen):
    coroutine = broadcast_board_update()
    if main_event_loop:
        asyncio.run_coroutine_threadsafe(coroutine, main_event_loop)

# Highlight-Moves an alle Clients senden
async def broadcast_highlight_moves(moves):
    highlight = HighlightMove(squares=moves)
    data = json.dumps({
        "highlight": highlight.squares,
        "from_square": game_manager.source_square,
        "opponent_squares": game_manager.opponent_squares
    })
    disconnected = set()
    for ws in connected_clients:
        try:
            await ws.send_text(data)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        connected_clients.discard(ws)

def highlight_callback(moves):
    coroutine = broadcast_highlight_moves(moves)
    if main_event_loop:
        asyncio.run_coroutine_threadsafe(coroutine, main_event_loop)

game_manager.set_board_update(board_update_callback)
game_manager.set_highlight_callback(highlight_callback)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
