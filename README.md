# Tic-Tac-Toe + Conversational AI Voice Buddy (v2)

This version adds *full voice integration with compliments/encouragement*:

- Browser **speech recognition** to understand commands.
- Browser **speech synthesis** to speak back.
- **Praise/encouragement** based on your move:
  - Compliments center/corner openings.
  - Praises **critical blocks** (detects if you blocked an AI winning move).
  - Praises **threat creation** (when you set up a two-in-a-row).
  - Friendly nudges and reactions after every turn.
- Flask backend:
  - `/move` — unbeatable Minimax AI.
  - `/suggest` — move recommendation with reason.
  - `/stt` — optional server-side speech capture (if your server has a mic).

## Files
```
tictactoe-voice-ai-v2/
  index.html
  style.css
  script.js
  app.py
  requirements.txt
  README.md
```

## Run
### Backend
```bash
cd tictactoe-voice-ai-v2
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```
Backend runs at `http://127.0.0.1:5000`.

### Frontend
Open `index.html` in a browser (Chrome/Edge recommended). If the mic permission is blocked on file URLs, serve with:
```bash
python -m http.server 8000
# visit http://127.0.0.1:8000/index.html
```

## Voice Commands
- **start game** — reset/start
- **place at 5** — mark cell (1..9 left-to-right, top-to-bottom)
- **suggest** — get a hint (also spoken back)
- **reset**/**restart** — reset board

## Notes
- If installing PyAudio is difficult, comment it in requirements. Browser-based voice still works.
- Set a different API host/port by editing `API_BASE` near the top of `script.js`.
- Use the “Enable compliments & chatter” toggle to disable or enable reactions on the fly.
