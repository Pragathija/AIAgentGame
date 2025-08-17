import pyttsx3
import random

engine = pyttsx3.init()
engine.setProperty("rate", 160)
engine.setProperty("volume", 1.0)

# Dynamic phrases
greetings = [
    "Hello! Want to play Tic Tac Toe?",
    "Hi there! Ready for a quick game?",
    "Hey! Let’s have some fun with Tic Tac Toe."
]

praise = [
    "Nice move!",
    "Smart choice!",
    "Great block, I didn’t see that coming.",
    "Brilliant strategy!"
]

ai_responses = [
    "I’ll place my move here.",
    "Hmm, let me think... okay, done.",
    "Interesting! Your turn now."
]

def process_voice(user_text: str) -> str:
    """Decide a reply based on user input"""
    user_text = user_text.lower()

    if "hello" in user_text or "hi" in user_text:
        reply = random.choice(greetings)
    elif "start" in user_text or "play" in user_text:
        reply = "Okay, let's start the game. You go first!"
    elif "good" in user_text or "nice" in user_text:
        reply = random.choice(praise)
    elif "move" in user_text or "where" in user_text:
        reply = random.choice(ai_responses)
    elif "reset" in user_text:
        reply = "The game has been reset. Let's begin again!"
    else:
        reply = "Sorry, I didn't understand. Can you repeat?"

    # Speak reply (optional for backend)
    engine.say(reply)
    engine.runAndWait()

    return reply
