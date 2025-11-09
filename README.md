# Anatomy_View

Boilerplate monorepo that pairs a Vite-powered React frontend with a minimal Flask backend.

## Project Structure

```
.
├── backend
│   ├── requirements.txt
│   └── server.py
├── frontend
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── src
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
└── README.md
```

- The **frontend** directory contains the Vite React application configured with routing and Three.js dependencies.
- The **backend** directory hosts the Flask API server.

## Running the Applications

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python server.py
   ```

With both servers running, API requests from the frontend to `/api/*` will be proxied to the Flask backend.

## Gemini + Dedalus Labs Integration

The backend exposes a `/api/chat` endpoint that streams conversation history to Google Gemini so the model can issue
tool calls. The React frontend executes those tools via the Dedalus Labs controller to rotate, highlight and annotate the
Three.js heart scene.

1. Create a Google AI Studio API key and make it available to the backend:

   ```bash
   export GEMINI_API_KEY="your_api_key"
   # Optional: choose a different model variant
   export GEMINI_MODEL="models/gemini-1.5-pro-latest"
   ```

2. When developing locally, point the Vite dev server to the Flask backend:

   ```bash
   # from the frontend directory
   export VITE_API_BASE_URL="http://localhost:5000"
   npm run dev
   ```

3. Start the Flask server with the same environment variables so the `/api/chat` route can contact Gemini:

   ```bash
   cd backend
   flask --app server run
   ```

If the API key is missing, the assistant will return a friendly error message instead of contacting Gemini. Successful
responses include tool call metadata that the frontend uses to animate the model.
