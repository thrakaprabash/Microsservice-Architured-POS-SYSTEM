# POS System Deployment Guide

This guide provides instructions on how to deploy the Microservice-Architectured POS System using **Docker Compose** or **Kubernetes**.

---

## 🐳 Option 1: Docker Compose

Docker Compose is the easiest way to spin up the entire system locally for development or testing. It automatically configures a private bridge network so all microservices can securely communicate.

### Prerequisites
- Docker Desktop installed and running.

### 1. Configure Environment Variables
Ensure your root `.env` file is properly configured.
```bash
# Example .env configuration
FRONTEND_URL=http://localhost:8080
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Start the System
In the root directory of the project, run:
```bash
docker-compose up --build -d
```
*(The `-d` flag runs the containers in the background).*

### 3. Access the Application
- **Frontend**: http://localhost:8080
- **API Gateway**: http://localhost:3000

### 4. Stop the System
When you are done, shut down the system cleanly with:
```bash
docker-compose down
```

---

## ☸️ Option 2: Kubernetes (k8s)

Kubernetes provides robust orchestration for production deployments. The `k8s/` folder contains all the necessary deployment, service, and configuration manifests for the microservices.

### Prerequisites
- A running Kubernetes cluster (e.g., Docker Desktop k8s, Minikube, or a managed cloud cluster like EKS/GKE).
- `kubectl` CLI installed and configured.
- *Optional*: NGINX Ingress Controller installed in your cluster.

### 1. Create the Namespace & Secrets
First, create the dedicated namespace and load your secrets into Kubernetes:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
```

### 2. Deploy the Microservices
Apply the manifests for the database and all microservices:
```bash
kubectl apply -f k8s/mongodb/
kubectl apply -f k8s/auth-service/
kubectl apply -f k8s/product-service/
kubectl apply -f k8s/order-service/
kubectl apply -f k8s/payment-service/
kubectl apply -f k8s/report-service/
kubectl apply -f k8s/api-gateway/
kubectl apply -f k8s/frontend/
```

### 3. Verify the Deployment
Ensure all pods are running successfully:
```bash
kubectl get pods -n pos-system
```

### 4. Accessing the Application on Port 8081
To fulfill your requirement of running the Kubernetes frontend on **port 8081**, the easiest and most reliable method for local development is using `kubectl port-forward`. 

Run this command in a terminal:
```bash
kubectl port-forward svc/frontend 8081:80 -n pos-system
```
*Note: Leave this terminal open. As long as it is running, traffic to `localhost:8081` will be tunneled directly into the frontend pod in your cluster.*

- **Access the Frontend**: http://localhost:8081

### 5. (Optional) Using Ingress
If you prefer to use Ingress instead of port-forwarding:
1. Ensure the NGINX Ingress Controller is installed.
2. Apply the ingress manifest: `kubectl apply -f k8s/ingress.yaml`
3. Add `127.0.0.1 pos.local` to your `C:\Windows\System32\drivers\etc\hosts` file.
4. Access the app at `http://pos.local`.

---

## 🧹 Cleaning Up

To completely remove the Kubernetes deployment:
```bash
kubectl delete namespace pos-system
```
