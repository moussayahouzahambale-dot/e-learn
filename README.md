# E-Learn Platform

Plateforme e-learning en Node.js, Express, MongoDB et frontend vanilla.

## Lancer en local

1. Copier `.env.example` vers `.env`
1. Configurer les variables dans `.env`
1. Installer les dependances:

```bash
npm install
```

1. Lancer le serveur:

```bash
npm start
```

Application disponible sur `http://localhost:5000`.

## Variables d environnement

- `PORT`: Port HTTP de l application
- `MONGO_URI`: URL MongoDB (Atlas en production)
- `JWT_SECRET`: Secret JWT fort et prive
- `ADMIN_SECRET`: Secret pour creation compte admin
- `FRONTEND_URL`: Origine frontend autorisee par CORS
- `NODE_ENV`: `production` en ligne

## Deploiement Render

1. Push du repository sur GitHub
2. Creer un service Web sur Render
3. Render detecte `render.yaml`
4. Renseigner les variables sensibles:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `ADMIN_SECRET`
5. Deployer

Endpoint de verification:

`/api/health`

## Deploiement Railway

1. Connecter le repository sur Railway
2. Railway utilise `railway.json`
3. Configurer les variables d environnement:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `ADMIN_SECRET`
   - `FRONTEND_URL`
   - `NODE_ENV=production`
4. Deployer et verifier `/api/health`

## Securite

- Limitation de debit sur routes auth
- Headers de securite via helmet
- Validation d entree serveur
- CORS controle via `FRONTEND_URL`
