#from utils.utils import capture_board
from flaskapp.models import Game
from flaskapp.config import Config
from flask import Flask, jsonify, request, render_template, send_from_directory
import random
import time
from redis import Redis
from rq.job import Job
from rq import Queue
import pickle
import json
from datetime import datetime, timezone, timedelta
from flask_socketio import SocketIO, emit
from bs4 import BeautifulSoup
import requests
# Connect to Redis
redis_conn = Redis(host='localhost', port=6379, db=0)
queue = Queue('game_queue', connection=redis_conn)
from flaskapp.tasks import analyze_board

# ACTIVE GAMES
games_dict = {
}
PLAYER = Config.PLAYER


# Initialize Flask app
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")


@app.after_request
def apply_csp(response):
    response.headers["Content-Security-Policy"] = (
        "default-src * 'unsafe-inline' 'unsafe-eval'; "
        "connect-src * ws://localhost:5000 http://localhost:5000; "
        "script-src * 'unsafe-inline' 'unsafe-eval';"
    )
    return response


# Serve files from the "static" directory
@app.route('/scripts/<path:filename>')
def serve_script(filename):
    return send_from_directory('static', filename)


@app.route("/socket", methods=['POST'])
def socket():
    data = request.json
    status = data['status']
    game_id = data['game_id']
    top_moves = data['top_moves']
    evaluation = data['evaluation']
    session = games_dict[game_id]
    current_turn = "white" if session.board.turn else "black"
    if session.white == PLAYER:
        current_color = "white"
    else:
        current_color = "black"
    data = {
        'status': status,
        'game_id': game_id,
        'top_moves': top_moves,
        'evaluation': evaluation,
        'current_turn': current_turn,
        'current_color': current_color,
    }

    print(f"{datetime.now(timezone.utc)}: Sending data to socket")
    socketio.emit('socket', data)
    return jsonify({"status": "success", "message": "Socket targeted"}), 200

@socketio.on('connect')
def on_connect():
    print("Client connected via WebSocket")

import traceback

@app.route("/game/<string:game_id>/move", methods=['POST'])
def post_move(game_id: str):
    try:
        print(f"Received move for game_id: {game_id}")
        print("games_dict keys:", list(games_dict.keys()))

        if game_id not in games_dict:
            return jsonify({"error": "Game not found"}), 404

        json_data = request.get_json()
        print("Incoming JSON data:", json_data)

        move = json_data['move']
        session = games_dict[game_id]

        session.move(move)  # ← This is likely where the error occurs
        fen = session.get_fen()

        kwargs = {
            'utc': datetime.now(timezone.utc),
            'game_id': game_id,
            'move': move,
            'fen': fen,
        }
        print("job kwargs:", kwargs)
        #job = queue.enqueue(process_move, **kwargs)
        job = analyze_board.delay({'game_id': game_id, 'move': move, 'fen': fen})
        return jsonify({"message": f"Game {game_id} updated"}), 200

    except Exception as e:
        print("Exception occurred:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/new-game/<string:game_id>", methods=['POST'])
def new_game(game_id: str):
    json_data = request.json
    session = Game(game_id=game_id, l4x=json_data['l4x'], tc=json_data['tc'], black=json_data['black'], white=json_data['white'])
    games_dict[str(session.game_id)] = session
    return jsonify({"message": f"Game {game_id} created"}), 201

@app.route("/game/<string:game_id>", methods=['GET'])
def get_game(game_id: str):
    # Fetch the game data from Redis
    game_data = redis_conn.hgetall(game_id)
    
    if game_data:
        # Decode byte responses to strings
        game_data = {key.decode(): value.decode() for key, value in game_data.items()}
        return jsonify(game_data), 200
    else:
        return jsonify({"error": "Game not found"}), 404

@app.route("/exists/<string:game_id>", methods=['POST'])
def game_exists(game_id: str):
    if game_id in games_dict:
        print('exists')
        data = {'moves': None, 'request': 0, 'message': 'Game exists'}
        return jsonify(data)
    else:
        print('na exists')
        data = {'moves': None, 'request': 1, 'message': 'Game does not exist'}
        return jsonify(data)

@app.route("/player/<string:player>", methods=['GET'])
def get_player(player: str):
    
    def extract_and_compute_averages(json_data):
            # Get today's date
            today = datetime.today()

            # Define time cutoffs
            six_months_ago = today - timedelta(days=6*30)  # Approximate 6 months
            one_month_ago = today - timedelta(days=30)
            one_week_ago = today - timedelta(days=7)

            averages = {}

            for game_type in json_data["data"]:
                name = game_type["name"]
                points = game_type["points"]  # List of [year, month, day, rating]

                if not points:
                    continue  # Skip if there are no rating records

                # Convert points to datetime objects with ratings
                ratings = [
                    (datetime(year, month + 1, day), rating)  # Month +1 because JS months are 0-based
                    for year, month, day, rating in points
                ]

                # Compute averages
                def get_avg(cutoff):
                    filtered_ratings = [rating for date, rating in ratings if date >= cutoff]
                    return int(sum(filtered_ratings) / len(filtered_ratings)) if filtered_ratings else None

                averages[name] = {
                    "avg_6_months": get_avg(six_months_ago),
                    "avg_1_month": get_avg(one_month_ago),
                    "avg_1_week": get_avg(one_week_ago),
                }
                def clean_averages(averages):
                    # Loop through the averages dictionary and remove keys where all values are None
                    keys_to_remove = [name for name, values in averages.items() 
                                    if values['avg_6_months'] is None and values['avg_1_month'] is None and values['avg_1_week'] is None]
                    
                    # Remove the keys from averages dictionary
                    for key in keys_to_remove:
                        del averages[key]
                    
                    return averages

            return clean_averages(averages)
    
    r = requests.get(f'https://lichess.org/@/{player}')
    soup = BeautifulSoup(r.content, 'html.parser')
    # Find the script tag with the JSON data
    script_tag = soup.find("script", {"id": "page-init-data"})

    if script_tag:
        # Extract the JSON string
        json_text = script_tag.string.strip()

        # Parse the JSON
        json_data = json.loads(json_text)

        averages = extract_and_compute_averages(json_data)
        print(averages)

    return jsonify({"message": "player data received", "averages": averages}), 200
if __name__ == '__main__':
   socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
