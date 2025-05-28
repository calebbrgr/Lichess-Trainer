# ♟️ Lichess Trainer

A personal project to explore chess engine integration, Docker orchestration, WebSocket communication, and UI augmentation via userscripts.

---

## 🔧 Tech Stack

### Backend
- **Flask** – API & WebSocket server
- **Celery** – Task queue for move analysis
- **Redis** – Celery task broker
- **Stockfish** – World-class open-source chess engine, compiled and run from `./engine`
- **Docker Compose** – Container orchestration

### Frontend
- **Greasemonkey Userscript** – Injected UI overlay and utilities into Lichess

---

## 🧠 Architecture

### Backend
- The backend receives a FEN string and submits it to **Celery**.
- Celery passes it to the **Stockfish engine**, then returns the move evaluations.
- The results are broadcast back to the frontend via **WebSockets**.

### Frontend
- **Stockfish Connection**
- **SVG Overlay Tools**  
  Visual elements (arrows, dots) drawn over the Lichess board.
  
- **Rating Spy**  
  Asynchronously fetches opponent's rating history across game variants from the past 6 months.
  
- **Eval Bar**  
  Displays centipawn evaluation in a fixed horizontal bar at the bottom of the screen.

---

## ⚠️ Disclaimer

> I am **not responsible** for how you use this tool. I advise you not to use this tool in rated or professional games.
> **Using chess engines during competitive play on Lichess is a bannable offense.**  

---

## 📦 Prerequisites

Ensure you have the following installed:

- Docker & Docker Compose
- Python 3.8+ (if running backend locally)
- Redis (optional if not using Docker)
- A modern browser (e.g., Firefox or Chrome)
- Greasemonkey (Firefox)

---

## 🧱 Step-by-Step Setup

### 1. 🔽 Download Stockfish Engine

Download the latest Stockfish binary (`stockfish-ubuntu-x86-64`) from the [official GitHub repository](https://github.com/official-stockfish/Stockfish/releases).

Place the extracted binaries in: ./engine/


### 2. ⚙️ Update Backend Configuration

Edit the config.py file in flaskapp
```
ENGINE_PATH = "/app/engine/stockfish/stockfish-ubuntu-x86-64"
PLAYER = "your_lichess_username"
```

### 3. 🐳 Build and Run Backend with Docker
```
docker compose up --build
```


### 4. 🖊️ Configure the Frontend Userscript
```
let playerName = "lichessusername"
let svgType = "dot" // "dot" or "arrow"
let playerSpyEnabled = true
let evalBarEnabled = false
```
 
