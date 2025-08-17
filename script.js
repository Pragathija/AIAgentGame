const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const API_BASE = "http://127.0.0.1:5000"; // change if backend runs elsewhere

let board = Array(9).fill("");
let gameActive = true;
let agentEnabled = true;
let chatterEnabled = true;

const winCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// --------- Voice Helpers ---------
function speak(text) {
  if (!agentEnabled) return;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.04;
    utter.pitch = 1.0;
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {}
}

function speakRandom(lines) {
  if (!chatterEnabled) return;
  const t = lines[Math.floor(Math.random() * lines.length)];
  speak(t);
}

function toggleAgent(){
  agentEnabled = !agentEnabled;
  setStatus(`Agent ${agentEnabled ? "enabled" : "disabled"}.`);
  if (agentEnabled) speak("I'm back. Let's play!");
}
function toggleChatter(v){ chatterEnabled = v; if (v) speak("Compliments are on. Show me your best moves!"); }

// --------- UI ---------
function drawBoard() {
  boardElement.innerHTML = "";
  board.forEach((cell, index) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.textContent = cell;
    div.addEventListener("click", () => makeMove(index, "click"));
    boardElement.appendChild(div);
  });
}

// --------- Game Logic ---------
function makeMove(index, source="manual") {
  if (!gameActive) { speakRandom(["The game's over. let's reset to play again."]); return; }
  if (board[index]) { speakRandom(["That spot is taken.", "Already occupied. Try a free cell.", "Nope—blocked. Pick another."]); return; }

  // Snapshot before the move to judge a 'block'
  const preBoard = board.slice();
  const aiWinningCellsBefore = getImmediateWins(preBoard, "O");

  board[index] = "X";
  drawBoard();

  // Praise logic after user move
  praiseMove(preBoard, index, aiWinningCellsBefore);

  if (checkWinner("X")) {
    setStatus("You win! 🎉");
    speakRandom(["Brilliant! You played well!", "What a finish—well deserved!", "GG! That was sharp."]);
    gameActive = false;
    return;
  }
  if (isFull()) {
    setStatus("It's a draw.");
    speakRandom(["Nice defense! We both held strong.", "Well played—stalemate!", "Draw! That was tight."]);
    gameActive = false;
    return;
  }

  setStatus("AI thinking…");
  setTimeout(aiMove, 280);
}

async function aiMove() {
  // Try backend first
  let move = -1;
  try {
    const res = await fetch(`${API_BASE}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board })
    });
    const data = await res.json();
    if (typeof data.move === "number" && board[data.move] === "") {
      move = data.move;
    }
  } catch {}

  // Local fallback
  if (move === -1) move = findBestMove();

  board[move] = "O";
  drawBoard();

  if (checkWinner("O")) {
    setStatus("AI wins! 🤖");
    speakRandom(["Haha, I win! Rematch?", "Gotcha! One more round?", "That was fun—care for another?"]);
    gameActive = false;
    return;
  }
  if (isFull()) {
    setStatus("Tie!");
    speakRandom(["We’re evenly matched!", "Tie game—good battle!", "That was close."]);
    gameActive = false;
    return;
  }
  setStatus("Your turn!");
  if (chatterEnabled) {
    const nudges = [
      "Your move. Think a step ahead!",
      "Your turn—can you create a fork?",
      "Over to you. I’m watching closely.",
      "Your turn! Corners can be strong too."
    ];
    speakRandom(nudges);
  }
}

function findBestMove() {
  // try winning
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      board[i] = "O";
      if (checkWinner("O")) { board[i] = ""; return i; }
      board[i] = "";
    }
  }
  // try blocking
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      board[i] = "X";
      if (checkWinner("X")) { board[i] = ""; return i; }
      board[i] = "";
    }
  }
  // otherwise random
  const empty = board.map((v, i) => v === "" ? i : null).filter(i => i !== null);
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : -1;
}

function checkWinner(p) {
  return winCombos.some(c => c.every(i => board[i] === p));
}
function isFull(){ return board.every(c => c); }

function resetGame() {
  board = Array(9).fill("");
  gameActive = true;
  drawBoard();
  setStatus("Your turn! Say “suggest” for help.");
  speakRandom([
    "New game. Your move first—good luck!",
    "Fresh board! Let's start.",
    "Let’s go again—place your first mark."
  ]);
}

// --------- Praise & Analysis ---------
function getImmediateWins(arr, player) {
  // returns indices that would yield an immediate win for 'player'
  const wins = [];
  for (const combo of winCombos) {
    const marks = combo.map(i => arr[i]);
    const empties = combo.filter(i => arr[i] === "");
    if (empties.length === 1) {
      const otherTwo = combo.filter(i => i !== empties[0]);
      if (otherTwo.every(i => arr[i] === player)) {
        wins.push(empties[0]);
      }
    }
  }
  return wins;
}

function countTwoInARow(arr, player) {
  // counts lines where player has exactly two with one empty (threats)
  let c = 0;
  for (const combo of winCombos) {
    const marks = combo.map(i => arr[i]);
    const playerCount = marks.filter(x => x === player).length;
    const emptyCount = marks.filter(x => x === "").length;
    if (playerCount === 2 && emptyCount === 1) c++;
  }
  return c;
}

function praiseMove(prevBoard, idx, aiWinsBefore) {
  if (!chatterEnabled) return;

  const isCenter = idx === 4;
  const isCorner = [0,2,6,8].includes(idx);

  // Strong heuristics
  if (isCenter && prevBoard.every(c => c === "")) {
    speakRandom(["Center start—pro move!", "Nice! Taking center gives you control.", "Great opening—own the middle."]);
    return;
  }
  if (isCorner && prevBoard.every(c => c === "")) {
    speakRandom(["Corner start—classic strategy!", "Bold corner opener, I like it."]);
    return;
  }

  // Blocking praise
  if (aiWinsBefore.includes(idx)) {
    speakRandom(["Clutch block! I almost had that.", "Smart defense—you saw it coming.", "Nice block—denied!"]);
    return;
  }

  // Threat creation praise
  const threatsBefore = countTwoInARow(prevBoard, "X");
  const threatsAfter = countTwoInARow(board, "X");
  if (threatsAfter > threatsBefore) {
    speakRandom(["Strong setup—you’re creating pressure.", "Nice—you're setting a trap!", "I see you building a threat."]);
    return;
  }

  // Positional praise
  if (isCenter) {
    speakRandom(["Center control—excellent choice.", "Middle square—keeps options open."]);
    return;
  }
  if (isCorner) {
    speakRandom(["Corners are powerful—good pick.", "Nice corner—angles are your friend."]);
    return;
  }

  // Neutral encouragement
  speakRandom(["Nice move!", "Good one.", "Alright, I felt that.", "Solid choice."]);
}

// --------- AI Suggestion ---------
async function getAISuggestion() {
  try {
    const response = await fetch(`${API_BASE}/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board })
    });
    const data = await response.json();
    if (typeof data.move === "number") {
      speak(`I suggest placing at ${data.move + 1}. ${data.reason || ""}`);
    } else {
      alert("No suggestion available.");
    }
  } catch (e) {
    const move = findBestMove();
    speak(` Place your move at ${move + 1}. may help you to win`);
  }
}

// --------- Voice Agent (Browser STT + TTS) ---------
function startVoiceControl() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert("SpeechRecognition not supported in this browser."); return; }
  const recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log("Voice Command:", command);

    if (command.includes("Let's start the game") || command.includes("Let's begin the game")) {
      resetGame();
      speakRandom(["Game started. Make Your move!", "Let’s begin—place anywhere."]);
    } else if (command.includes("suggest my next move") || command.includes("help me with this move")) {
      getAISuggestion();
    } else if (command.includes("reset the game") || command.includes("restart the game")) {
      resetGame();
    } else if (command.includes("Where to place my next move")) {
       speak("Place your first move at center");
    } else {
      speak("Sure, Make your First move");
    }
  };
  recognition.onerror = (e) => console.warn("Speech error:", e.error);
  recognition.onend = () => console.log("Voice session ended.");
  recognition.start();
}

// --------- Helpers ---------
function setStatus(msg){ statusElement.textContent = msg; }

// Init
drawBoard();
setStatus("Your turn! Click a cell or say “start game”.");
speakRandom([
  "Hi! Want to play Tic Tac Toe? Say start game to begin.",
  "I’m your voice buddy. Say start game and I’ll cheer you on!"
]);
