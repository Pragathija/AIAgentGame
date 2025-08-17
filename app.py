from flask import Flask, request, jsonify
from flask_cors import CORS
from voice_agent import process_voice

# in app.py
from voice_agent import start_voice_agent


def start_voice_agent():
    import speech_recognition as sr
    import pyttsx3
    
    r = sr.Recognizer()
    engine = pyttsx3.init()
    with sr.Microphone() as source:
        print("Say something...")
        audio = r.listen(source)
        text = r.recognize_google(audio)
        print("You said:", text)
        engine.say("You said " + text)
        engine.runAndWait()


try:
    import speech_recognition as sr
    HAVE_SR = True
except Exception:
    HAVE_SR = False

app = Flask(__name__)
CORS(app)

AI = "O"
HUMAN = "X"
WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
]

def check_winner(board, p):
    return any(all(board[i] == p for i in combo) for combo in WIN_COMBOS)

def empty_indices(board):
    return [i for i, v in enumerate(board) if v == "" or v is None]

def is_full(board):
    return all(v != "" and v is not None for v in board)

def minimax(board, player):
    if check_winner(board, HUMAN):
        return {"score": -10}
    if check_winner(board, AI):
        return {"score": 10}
    if is_full(board):
        return {"score": 0}

    moves = []
    for i in empty_indices(board):
        move = {"index": i}
        board[i] = player
        result = minimax(board, AI if player == HUMAN else HUMAN)
        move["score"] = result["score"]
        board[i] = ""
        moves.append(move)

    if player == AI:
        best = max(moves, key=lambda m: m["score"])
    else:
        best = min(moves, key=lambda m: m["score"])
    return best

def suggest_move(board):
    # 1) Win now
    for i in empty_indices(board):
        board[i] = HUMAN
        if check_winner(board, HUMAN):
            board[i] = ""
            return i, "Winning move."
        board[i] = ""
    # 2) Block opponent win
    for i in empty_indices(board):
        board[i] = AI
        if check_winner(board, AI):
            board[i] = ""
            return i, "Blocks AI's winning line."
        board[i] = ""
    # 3) Center, corners, sides heuristic
    priority = [4,0,2,6,8,1,3,5,7]
    for i in priority:
        if i in empty_indices(board):
            return i, "Good positional move."
    empties = empty_indices(board)
    return (empties[0] if empties else -1), ""

@app.route("/voice", methods=["POST"])
def handle_voice():
    data = request.get_json()
    user_text = data.get("message", "")
    
    # process the text with your AI voice agent
    response_text = process_voice(user_text)
    
    return jsonify({"response": response_text})

@app.route("/voice", methods=["POST"])
def handle_voice():
    data = request.get_json()
    user_text = data.get("message", "")
    response_text = process_voice(user_text)
    return jsonify({"response": response_text})

@app.route("/suggest", methods=["POST"])
def suggest():
    data = request.get_json(force=True)
    board = data.get("board", [""]*9)
    move, reason = suggest_move(board[:])
    return jsonify({"move": move, "reason": reason})

@app.route("/move", methods=["POST"])
def move():
    data = request.get_json(force=True)
    board = data.get("board", [""]*9)
    best = minimax(board[:], AI)
    return jsonify({"move": best.get("index", -1)})

@app.route("/stt", methods=["POST"])
def stt():
    if not HAVE_SR:
        return jsonify({"error": "SpeechRecognition not installed/available on server"}), 400
    r = sr.Recognizer()
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        audio = r.listen(source, timeout=5, phrase_time_limit=4)
    try:
        text = r.recognize_google(audio)
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/")
def health():
    return jsonify({"ok": True, "message": "TicTacToe AI Voice Agent API running."})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
    app.run(debug=True)
