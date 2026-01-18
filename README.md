## Project Structure

The project is organized into three main components:

- **`frontend/`**: A React application built with Vite and Shadcn UI. It interfaces with the backend and connects to the LiveKit voice agent.
- **`backend/`**: A Flask API that handles user input refinement, strategic planning with agents (LangGraph/Instructor), and LiveKit token generation.
- **`agent-starter-python-main/`**: The Voice Agent service built using the LiveKit Agents framework. It handles the real-time voice interaction and STT (Speech-to-Text).

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **uv** (An extremely fast Python package installer and resolver, required for the agent)
  - Install via: `curl -LsSf https://astral.sh/uv/install.sh | sh` (macOS/Linux) or `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"` (Windows)
- **LiveKit Cloud Account**: Sign up at [livekit.io](https://livekit.io/) to get your URL and API Keys.
- **Groq API Key**: For the backend LLM processing.

## Installation & Configuration

### 1. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Create a virtual environment (optional but recommended) and install dependencies:

```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory with the following keys:

```ini
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=meta-llama/llama-3.3-70b-versatile
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=your_livekit_url
```

### 2. Voice Agent Setup

Navigate to the `agent-starter-python-main` directory:

```bash
cd agent-starter-python-main
```

Install dependencies using `uv`:

```bash
uv sync
```

Create a `.env.local` file in `agent-starter-python-main` (copy from `.env.example` if available):

```ini
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 3. Frontend Setup

Navigate to the `frontend` directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file (or `.env.local`) in the `frontend` directory regarding the backend API URL if needed (defaults are usually configured in `vite.config.ts` or hardcoded for dev).

## Running the Project

You will need to run three separate terminal sessions.

**Terminal 1: Backend**

```bash
cd backend
python app.py
```

_Runs on `http://localhost:5000`_

**Terminal 2: Voice Agent**

```bash
cd agent-starter-python-main
uv run python src/agent.py dev
```

_Connects to your LiveKit Cloud project and waits for participants._

**Terminal 3: Frontend**

```bash
cd frontend
npm run dev
```

_Runs on `http://localhost:5173` (typically)._

Open `http://localhost:5173` in your browser to interact with Eureka.
