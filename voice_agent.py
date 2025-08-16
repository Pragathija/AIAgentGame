import speech_recognition as sr
import pyttsx3
import random
import time

# Initialize recognizer and TTS engine
recognizer = sr.Recognizer()
engine = pyttsx3.init()
engine.setProperty("rate", 160)   # speaking speed
engine.setProperty("volume", 1.0)

# Some dynamic agent phrases
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

def speak(text):
    """Speak out text using pyttsx3"""
    print("🤖:", text)
    engine.say(text)
    engine.runAndWait()

def listen():
    """Capture voice input and convert to text"""
    with sr.Microphone() as source:
        print("🎤 Listening...")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source, timeout=5, phrase_time_limit=4)
    try:
        text = recognizer.recognize_google(audio)
        print("👤:", text)
        return text.lower()
    except sr.UnknownValueError:
        speak("Sorry, I didn't catch that.")
    except sr.RequestError:
        speak("Speech service unavailable.")
    return ""

def game_loop():
    """Simple loop to demonstrate speech-to-speech interaction"""
    speak(random.choice(greetings))

    while True:
        command = listen()

        if not command:
            continue

        if "start" in command:
            speak("Great! You go first. Say 'place at five' for example.")
        elif "place at" in command:
            speak(random.choice(praise))
            # Here you could call your Tic Tac Toe backend /makeMove
            speak(random.choice(ai_responses))
        elif "suggest" in command:
            speak("I suggest you try the center.")
        elif "reset" in command or "quit" in command or "exit" in command:
            speak("Okay, ending the game. Thanks for playing!")
            break
        else:
            speak("Try saying: start game, place at five, or suggest.")

if __name__ == "__main__":
    game_loop()
