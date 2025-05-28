import os
from datetime import datetime
import requests

from stockfish import Stockfish


WEBHOOK_URL = "http://flask:5000/socket"
ENGINE_PATH = "/app/engine/stockfish/stockfish-ubuntu-x86-64"
ENGINE_PARAMS = {"Threads": 4, "Hash": 512, "Skill Level": 15}

from flaskapp.celery_worker import celery_app

@celery_app.task
def analyze_board(data):
    game_id = data.get("game_id")
    fen = data.get("fen")

    stockfish = Stockfish(path=ENGINE_PATH, depth=12, parameters=ENGINE_PARAMS)
    if not stockfish.is_fen_valid(fen):
        return {"status": 0, "error": "Invalid FEN"}

    stockfish.set_fen_position(fen)
    top_moves = stockfish.get_top_moves(5)
    eval_ = stockfish.get_evaluation()

    result = {
        "game_id": game_id,
        "top_moves": top_moves,
        "evaluation": eval_,
        "status": 1,
        "timestamp": datetime.utcnow().isoformat()
    }
    print(top_moves)
    try:
        requests.post(WEBHOOK_URL, json=result, timeout=3)
    except Exception as e:
        result["webhook_error"] = str(e)

    return result
