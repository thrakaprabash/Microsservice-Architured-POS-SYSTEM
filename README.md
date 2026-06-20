# POS System — MERN Microservices

A production-ready **Point of Sale system** built with the MERN stack, microservices architecture, Docker, and Kubernetes.

---

## 🏗️ Architecture

```
Browser / React SPA (port 5173 dev / 80 docker)
              │
              ▼
     [API Gateway :3000]  ← JWT auth, rate-limit, proxy
              │
  ┌───────────┼────────────┬───────────────┬──────────────┐
  ▼           ▼            ▼               ▼              ▼
[Auth]    [Product]    [Order]         [Payment]     [Report]
:4001      :4002        :4003           :4004          :4005
  │           │            │               │
MongoDB   MongoDB       MongoDB         MongoDB
pos-auth  pos-products  pos-orders    pos-payments
```

---

## 📦 Services

| Service | Port | Responsibility |
|---|---|---|
| **API Gateway** | 3000 | Route, JWT verify, rate-limit |
| **Auth Service** | 4001 | Register/Login, JWT, user roles |
| **Product Service** | 4002 | Products, categories, stock |
| **Order Service** | 4003 | Cart → Orders, receipts |
| **Payment Service** | 4004 | Stripe card payments + cash |
| **Report Service** | 4005 | Sales analytics, charts |
| **React Frontend** | 5173/80 | POS UI (cashier + admin) |

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Kubernetes enabled)
- Node.js 20+ (for local development)
- A [Stripe account](https://dashboard.stripe.com/register) for payment keys

### 1. Configure Environment Variables

```powershell
# Copy env template
cp .env.example .env
```

Edit `.env` and fill in your actual values:
- `JWT_SECRET` — generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `STRIPE_SECRET_KEY` — from https://dashboard.stripe.com/apikeys (use test key: `sk_test_...`)
- `VITE_STRIPE_PUBLISHABLE_KEY` — from same page (use: `pk_test_...`)
- `STRIPE_WEBHOOK_SECRET` — from Stripe CLI or dashboard webhooks

### 2. Run with Docker Compose (Recommended for Development)

```powershell
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access:**
- 🌐 **Frontend:** http://localhost (port 80)
- 🔀 **API Gateway:** http://localhost:3000
- 🗄️ **MongoDB:** localhost:27017

### 3. First Login

The system requires manually creating the first admin user. After Docker starts:

```powershell
# Create first admin user
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\": \"Admin\", \"email\": \"admin@pos.com\", \"password\": \"admin123\", \"role\": \"admin\"}'
```

Then log in at http://localhost with `admin@pos.com` / `admin123`.

---

## ☸️ Kubernetes Deployment (Docker Desktop)

### Prerequisites

1. **Enable Kubernetes** in Docker Desktop:
   - Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply

2. **Install NGINX Ingress Controller:**
```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

3. **Wait for Ingress to be ready:**
```powershell
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
```

4. **Add hosts entry** (run PowerShell as Administrator):
```powershell
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1 pos.local"
```

### Build Docker Images

```powershell
# Build all images (run from project root)
docker build -t pos/api-gateway:latest ./services/api-gateway
docker build -t pos/auth-service:latest ./services/auth-service
docker build -t pos/product-service:latest ./services/product-service
docker build -t pos/order-service:latest ./services/order-service
docker build -t pos/payment-service:latest ./services/payment-service
docker build -t pos/report-service:latest ./services/report-service
docker build -t pos/frontend:latest ./frontend
```

### Configure Kubernetes Secrets

Edit `k8s/secrets.yaml` with your base64-encoded values:

```powershell
# Encode your values
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-jwt-secret"))
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("sk_test_yourkey"))
```

### Deploy to Kubernetes

```powershell
# Apply all manifests in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongodb/statefulset.yaml

# Wait for MongoDB to be ready
kubectl wait --namespace pos-system --for=condition=ready pod --selector=app=mongodb --timeout=120s

# Deploy all services
kubectl apply -f k8s/auth-service/deployment.yaml
kubectl apply -f k8s/product-service/deployment.yaml
kubectl apply -f k8s/order-service/deployment.yaml
kubectl apply -f k8s/payment-service/deployment.yaml
kubectl apply -f k8s/report-service/deployment.yaml
kubectl apply -f k8s/api-gateway/deployment.yaml
kubectl apply -f k8s/frontend/deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### Verify Deployment

```powershell
# Check all pods are running
kubectl get pods -n pos-system

# Check services
kubectl get services -n pos-system

# Check ingress
kubectl get ingress -n pos-system

# View logs for a service
kubectl logs -n pos-system -l app=api-gateway -f
```

**Access:**
- 🌐 **Frontend:** http://pos.local
- 🔀 **API:** http://pos.local/api/health

---

## 🛠️ Local Development (without Docker)

Run each service individually for development:

```powershell
# Terminal 1: MongoDB
docker run -d -p 27017:27017 --name pos-mongo mongo:7.0

# Terminal 2: Auth Service
cd services/auth-service
cp .env.example .env  # edit values
npm install
npm run dev

# Terminal 3: Product Service
cd services/product-service
cp .env.example .env
npm install
npm run dev

# (repeat for order, payment, report services)

# Terminal 7: API Gateway
cd services/api-gateway
cp .env.example .env
npm install
npm run dev

# Terminal 8: Frontend
cd frontend
cp .env.example .env  # add VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev
```

---

## 💳 Stripe Setup

1. Create account at https://dashboard.stripe.com
2. Go to **Developers → API Keys**
3. Copy **Publishable key** (`pk_test_...`) → `VITE_STRIPE_PUBLISHABLE_KEY`
4. Copy **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
5. For webhooks (local testing): install [Stripe CLI](https://stripe.com/docs/stripe-cli)
   ```powershell
   stripe listen --forward-to localhost:4004/payments/webhook
   # Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET
   ```

> **Note:** LKR (Sri Lankan Rupee) support depends on your Stripe account's country and settings. If LKR is not available, contact Stripe support or use USD for testing.

---

## 📁 Project Structure

```
POS/
├── services/
│   ├── api-gateway/       # Express proxy + JWT auth
│   ├── auth-service/      # JWT, bcrypt, user roles
│   ├── product-service/   # Products, categories, stock
│   ├── order-service/     # Orders, receipts, stats
│   ├── payment-service/   # Stripe + cash payments
│   └── report-service/    # Analytics aggregation
├── frontend/              # React + Vite POS UI
├── k8s/                   # Kubernetes manifests
├── scripts/               # MongoDB init scripts
├── docker-compose.yml     # Local orchestration
├── .env.example           # Environment template
└── README.md
```

---

## 🔐 Security Notes

- JWT stored in **HTTP-only cookies** (XSS protection)
- CORS restricted to frontend origin
- Rate limiting: 500 req/15min global, 20 req/15min on auth
- Kubernetes Secrets for sensitive values
- Non-root Docker containers
- Input validation on all endpoints (express-validator)

---

## 🧩 API Endpoints (via API Gateway)

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Create user | Public |
| POST | /api/auth/login | Login → JWT cookie | Public |
| POST | /api/auth/logout | Clear cookie | Required |
| GET | /api/auth/me | Current user | Required |
| GET | /api/products | List products | Required |
| POST | /api/products | Create product | Admin |
| PATCH | /api/products/:id/stock | Update stock | Admin/Internal |
| GET | /api/categories | List categories | Required |
| POST | /api/orders | Create order | Required |
| GET | /api/orders | List orders | Required |
| POST | /api/payments/intent | Create Stripe intent | Required |
| POST | /api/payments/cash | Record cash payment | Required |
| GET | /api/reports/summary | Sales summary | Admin |
| GET | /api/reports/weekly | Weekly chart data | Admin |

---

## 📊 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Zustand + Recharts |
| Styling | Vanilla CSS + CSS Custom Properties |
| API Gateway | Node.js + Express + http-proxy-middleware |
| Microservices | Node.js + Express + Mongoose |
| Database | MongoDB 7.0 |
| Auth | JWT + bcryptjs |
| Payments | Stripe |
| Containers | Docker (multi-stage Alpine builds) |
| Orchestration | Kubernetes + NGINX Ingress |

---

*Built with ❤️ using MERN Stack Microservices*
