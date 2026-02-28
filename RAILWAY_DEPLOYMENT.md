# Railway Deployment Guide

Follow these steps to deploy your production-ready Node.js Express backend to Railway.

## 1. Prepare for Deployment
- Ensure your code is pushed to a **GitHub Repository**.
- The project root should be the `backend` folder (or Railway should be pointed there).

## 2. Connect PostgreSQL on Railway
1. Log in to [Railway](https://railway.app/).
2. Click **+ New Project** -> **Provision PostgreSQL**.
3. Once the database is created, click on the **Postgres** service.
4. Go to the **Variables** tab. Railway automatically provides variables like `DATABASE_URL`.
5. For your `pg` Pool configuration, you can use these individual variables provided by Railway:
   - `PGHOST` (Map to your `DB_HOST`)
   - `PGPORT` (Map to your `DB_PORT`)
   - `PGUSER` (Map to your `DB_USER`)
   - `PGPASSWORD` (Map to your `DB_PASSWORD`)
   - `PGDATABASE` (Map to your `DB_NAME`)

## 3. Deploy the Service
1. Click **+ New Service** -> **GitHub Repo**.
2. Select your repository.
3. Railway will detect the `package.json` and run `npm install` automatically.

## 4. Add Environment Variables in Railway
1. Go to your backend service in Railway.
2. Click on the **Variables** tab.
3. Click **New Variable** and add:
   - `PORT`: `5000` (or any port, Railway handles this automatically if you use `process.env.PORT`).
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (Your secret key)
   - `FRONTEND_URL`: (Your actual frontend domain, e.g., `https://your-frontend.up.railway.app`)
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Map these to the Postgres variables.

## 5. Execution
- Railway will run `npm start` by default.
- Your server is configured to listen on `0.0.0.0`, which is required for Railway to correctly route traffic.
- Check the **Deployments** tab for logs and to verify the startup message.
