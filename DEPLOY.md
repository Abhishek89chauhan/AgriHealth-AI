# Deploy AgriHelp on Render (recommended)

Your repo already has `render.yaml`. Follow these steps.

## 1) Push the latest code to GitHub

From the project root (`agrihelp`):

```powershell
git add backend render.yaml README.md
git status
git commit -m "Replace FastAPI backend with Express for deployment"
git push origin main
```

Only commit when you are ready. Do **not** skip pushing — Render deploys from GitHub.

## 2) Create services on Render

### Option A — Blueprint (easiest)

1. Open [https://dashboard.render.com](https://dashboard.render.com)
2. **New** → **Blueprint**
3. Connect repo `Abhishek89chauhan/agrihelp`
4. Apply `render.yaml`
5. Create the two services:
   - `plant-disease-backend` (Web Service)
   - `plant-disease-frontend` (Static Site)

### Option B — Manual setup

#### Backend (Web Service)
| Setting | Value |
|--------|--------|
| Root Directory | *(leave empty — repo root)* |
| Runtime | Node |
| Build Command | `cd backend && npm install` |
| Start Command | `cd backend && npm start` |
| Instance | Free |

#### Frontend (Static Site)
| Setting | Value |
|--------|--------|
| Root Directory | *(leave empty)* |
| Build Command | `cd frontend && npm install && npm run build` |
| Publish Directory | `frontend/build` |

**Frontend env var (required):**

| Key | Value |
|-----|--------|
| `REACT_APP_API_URL` | your backend URL, e.g. `https://plant-disease-backend.onrender.com` |

Set this **after** the backend is live, then **Manual Deploy** the frontend so React rebuilds with the correct API URL.

## 3) Verify

1. Backend: open `https://YOUR-BACKEND.onrender.com/ping` → should show `Hello, I am alive`
2. Frontend: open the static site URL and upload a leaf image

## Notes

- **Cold starts**: free Render sleeps after ~15 min idle; first request can take 30–60s
- **Models**: SavedModel folders (`models/1`, `models1/2`, …) must be in the GitHub repo (they already are)
- **Local Windows**: `tfjs-node` may fail to install; Render Linux uses it successfully for SavedModels
- Old frontend fallback URL in code points at a previous API; production should use `REACT_APP_API_URL`
