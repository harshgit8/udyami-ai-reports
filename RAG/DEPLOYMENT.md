# Udyami AI - Deployment Guide

## 🚀 Quick Deployment (Hackathon)

### Option 1: Local Development (Recommended for Demo)

#### Step 1: Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend runs at: `http://localhost:8000`

#### Step 2: Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm start
```
Frontend runs at: `http://localhost:3000`

#### Step 3: Test
```bash
# In another terminal
cd backend
python test_rag.py
```

---

## 🐳 Docker Deployment

### Backend Dockerfile
Create `backend/Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

### Frontend Dockerfile
Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
CMD ["serve", "-s", "build", "-l", "3000"]
```

### Docker Compose
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/knowledgebase:/app/knowledgebase
    environment:
      - PYTHONUNBUFFERED=1

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/data

volumes:
  chroma_data:
```

### Run with Docker Compose
```bash
docker-compose up
```

---

## ☁️ Cloud Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance: t3.medium (2GB RAM minimum)
   - Security Group: Allow ports 80, 443, 8000, 3000

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install -y python3-pip nodejs npm git
   ```

4. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd udyami-ai
   ```

5. **Setup Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

6. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

7. **Run with PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   
   # Start backend
   cd backend
   pm2 start "python main.py" --name "udyami-backend"
   
   # Start frontend
   cd ../frontend
   pm2 start "npm start" --name "udyami-frontend"
   
   # Save PM2 config
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx Reverse Proxy**
   ```bash
   sudo apt install -y nginx
   ```
   
   Create `/etc/nginx/sites-available/udyami`:
   ```nginx
   upstream backend {
       server localhost:8000;
   }
   
   upstream frontend {
       server localhost:3000;
   }
   
   server {
       listen 80;
       server_name your-domain.com;
   
       location /api/ {
           proxy_pass http://backend/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   
       location / {
           proxy_pass http://frontend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   
   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/udyami /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

4. **Deploy Backend**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

5. **Deploy Frontend**
   ```bash
   cd ../frontend
   npm run build
   # Deploy to Vercel or Netlify
   ```

---

## 🔒 Production Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set environment variables
- [ ] Configure database backups
- [ ] Setup monitoring & logging
- [ ] Enable rate limiting
- [ ] Setup authentication
- [ ] Configure CORS properly
- [ ] Enable caching
- [ ] Setup CI/CD pipeline
- [ ] Monitor resource usage

---

## 📊 Performance Optimization

### Backend Optimization
```python
# Use async queries
from fastapi import BackgroundTasks

@app.post("/query/async")
async def query_async(request: QueryRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(rag_engine.query_auto_route, request.query)
    return {"status": "processing"}
```

### Frontend Optimization
```javascript
// Lazy load components
const RAGChat = React.lazy(() => import('./components/RAGChat'));

// Add suspense
<Suspense fallback={<div>Loading...</div>}>
  <RAGChat />
</Suspense>
```

### Database Optimization
```python
# Add indexing
collection = chroma_client.get_or_create_collection(
    name="production_kb",
    metadata={"hnsw:space": "cosine", "hnsw:batch_size": 100}
)
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :8000` and kill process |
| CORS errors | Check backend CORS config |
| Out of memory | Reduce chunk_size or use smaller model |
| Slow responses | Enable caching, reduce top_k |
| Database connection | Check ChromaDB is running |

---

## 📈 Scaling Strategy

1. **Horizontal Scaling**
   - Deploy multiple backend instances
   - Use load balancer (Nginx, HAProxy)
   - Separate vector DB server

2. **Vertical Scaling**
   - Increase instance size
   - Add more RAM
   - Use GPU for embeddings

3. **Caching**
   - Add Redis for query caching
   - Cache embeddings
   - Cache frequent queries

4. **Database**
   - Use managed ChromaDB
   - Implement sharding
   - Regular backups

---

## 📝 Monitoring

### Logs
```bash
# Backend logs
tail -f backend.log

# Frontend logs
npm run build 2>&1 | tee frontend.log
```

### Metrics
- Query response time
- Document indexing time
- API error rate
- Memory usage
- CPU usage

### Alerts
- High error rate (>5%)
- Response time >2s
- Memory usage >80%
- Disk space <10%

---

## 🚀 CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to AWS
        run: |
          # Your deployment script
          ./deploy.sh
```

---

## 📞 Support

For deployment issues:
1. Check logs: `docker logs container-name`
2. Verify ports: `netstat -tuln`
3. Test connectivity: `curl http://localhost:8000/health`
4. Check resources: `top`, `df -h`

---

**Ready to deploy? Start with Option 1 for hackathon demo!** 🚀
