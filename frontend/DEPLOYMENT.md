# Deployment Instructions

## Frontend Deployment (Vercel/Netlify)

### 1. Set Environment Variable

In your deployment platform (Vercel/Netlify), add this environment variable:

**Variable Name:** `REACT_APP_API_URL`  
**Value:** Your backend URL (e.g., `https://subsidy-doc-auto.onrender.com`)

### 2. For Vercel:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.onrender.com` (or your backend URL)
   - **Environment:** Production, Preview, Development (select all)

### 3. For Netlify:

1. Go to Site settings → Environment variables
2. Add:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.onrender.com`

### 4. Rebuild and Deploy

After adding the environment variable, trigger a new deployment.

## Local Development

For local development, you don't need to set `REACT_APP_API_URL`. The app will use the proxy configured in `package.json` which routes `/api/*` requests to `http://localhost:5000`.

## How It Works

- **Local:** Uses proxy → `/api/...` → `http://localhost:5000/api/...`
- **Production:** Uses `REACT_APP_API_URL` → `https://your-backend.com/api/...`

