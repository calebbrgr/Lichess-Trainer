import chess
from bs4 import BeautifulSoup
from flaskapp.config import Config
class Game():
    def __init__(self, game_id, l4x, tc, white, black, last_move=""):
        self.game_id = game_id
        self.l4x = l4x
        self.tc = tc
        self.white = white
        self.black = black
        self.board = self.init_board()
        self.last_move = last_move
        self.moves = []
    def init_board(self):
        soup = BeautifulSoup(self.l4x, 'html.parser')
        board = chess.Board()
        l4x_moves = []
        for tag in soup.find_all(['kwdb']):
            l4x_moves.append(tag.text)

        for move in l4x_moves:
            move = self.clean_move(move)
            try:
                board.push_san(move)
            except chess.InvalidMoveError:
                return False

        # Return board
        return board

    def move(self, move):
        move = self.clean_move(move)
        self.moves.append(move)
        try:
            self.board.push_san(move)
            return True
        except chess.InvalidMoveError:
            print("INVALID MOVE")
            return False
    
    def get_fen(self):
        fen = self.board.fen()
        return fen
    
    def get_color(self):
        if self.white == Config.PLAYER:
            return 'white'
        elif self.black == Config.PLAYER:
            return 'black'
        else:
            return False

    def update_board(self, l4x):
        soup = BeautifulSoup(l4x, 'html.parser')
        board = chess.Board()
        l4x_moves = []
        for tag in soup.find_all(['kwdb']):
            l4x_moves.append(tag.text)

        for move in l4x_moves:
            move = self.clean_move(move)
            try:
                board.push_san(move)
            except chess.InvalidMoveError:
                return False

        self.board = board
        return board

    def clean_move(self, move):
        if '½' in move:
            cleaned = move.split('½')
            return cleaned[0]
        return move