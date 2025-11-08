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
