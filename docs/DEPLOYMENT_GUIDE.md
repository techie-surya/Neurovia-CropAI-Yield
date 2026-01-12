# Deployment Guide

## Production Deployment

### Backend (Heroku/Render)

1. Create `Procfile`:
```
web: python backend/app.py
```

2. Set environment variables:
```
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET_KEY=your-secret-key
FLASK_ENV=production
```

3. Deploy:
```bash
git push heroku main
```

### Frontend (Vercel)

1. Build settings:
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

2. Environment variables:
```
VITE_API_URL=your-backend-url
```

3. Deploy:
```bash
vercel --prod
```

### MongoDB Atlas

1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Update backend `.env`

## Docker Deployment

```bash
# Build
docker-compose build

# Run
docker-compose up -d
```

## Health Checks

- Backend: `http://your-backend-url/health`
- Frontend: `http://your-frontend-url/`
- Database: Check MongoDB Atlas dashboard
