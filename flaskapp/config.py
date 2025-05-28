# config.py

class Config(object):
    PLAYER = "lichessusername"
    DEBUG = False
    TESTING = False
    CSRF_ENABLED = True
    SECRET_KEY = 'this-really-needs-to-be-changed'
    CELERY_BROKER_URL = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND = "redis://redis:6379/0"
    #SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']


# --- Stockfish Configuration ---
ENGINE_PATH = "./engine/stockfish/stockfish-ubuntu-x86-64"
ENGINE_DEPTH = 12
ENGINE_PARAMS = {
    "Threads": 6,
    "Hash": 1024,
    "Ponder": "false",
    "Skill Level": 15,
}

# --- Redis Configuration ---
REDIS_HOST = "localhost"
REDIS_PORT = 6379
ENGINE_CHANNEL = "engine_channel"
RESULT_CHANNEL = "engine_result"

# --- Webhook ---
WEBHOOK_URL = "http://127.0.0.1:5000/socket"