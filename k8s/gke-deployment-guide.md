# Google Kubernetes Engine (GKE) Deployment Guide

This guide walks through deploying the entire LinkedIn Microservices Platform to **Google Kubernetes Engine (GKE)** with **Google Artifact Registry** and **GKE Ingress**.

---

## 1. Prerequisites & GCP Setup

### A. Install Google Cloud SDK & Kubectl
```bash
# Login to Google Cloud
gcloud auth login

# Set active GCP Project
gcloud config set project <YOUR_GCP_PROJECT_ID>

# Set default region/zone
gcloud config set compute/region asia-south1
gcloud config set compute/zone asia-south1-a
```

### B. Enable Required GCP APIs
```bash
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Create Google Artifact Registry (Docker Repo)

```bash
# Create standard Docker registry in Artifact Registry
gcloud artifacts repositories create linkedin-repo \
  --repository-format=docker \
  --location=asia-south1 \
  --description="LinkedIn microservices docker images"

# Authenticate Docker with GCP Artifact Registry
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

---

## 3. Build & Push Docker Images to Artifact Registry

Set your GCP Project ID environment variable:
```bash
export PROJECT_ID=$(gcloud config get-value project)
export REGISTRY="asia-south1-docker.pkg.dev/${PROJECT_ID}/linkedin-repo"
```

Build and push each service:
```bash
# 1. Discovery Server
docker build -t ${REGISTRY}/discovery-server:latest ./discovery-server
docker push ${REGISTRY}/discovery-server:latest

# 2. Config Server
docker build -t ${REGISTRY}/config-server:latest ./config-server
docker push ${REGISTRY}/config-server:latest

# 3. API Gateway
docker build -t ${REGISTRY}/api-gateway:latest ./api-gateway
docker push ${REGISTRY}/api-gateway:latest

# 4. User Service
docker build -t ${REGISTRY}/user-service:latest ./user-service
docker push ${REGISTRY}/user-service:latest

# 5. Posts Service
docker build -t ${REGISTRY}/posts-service:latest ./posts-service
docker push ${REGISTRY}/posts-service:latest

# 6. Connection Service
docker build -t ${REGISTRY}/connection-service:latest ./connection-service
docker push ${REGISTRY}/connection-service:latest

# 7. Notification Service
docker build -t ${REGISTRY}/notification-service:latest ./notification-service
docker push ${REGISTRY}/notification-service:latest
```

---

## 4. Provision GKE Cluster

Create an Autopilot or Standard Kubernetes Cluster:

```bash
# Option A: GKE Autopilot (Recommended for automated scaling and security)
gcloud container clusters create-auto linkedin-cluster \
  --region=asia-south1

# Option B: GKE Standard (3-node e2-standard-4 cluster)
# gcloud container clusters create linkedin-cluster \
#   --num-nodes=3 \
#   --machine-type=e2-standard-4 \
#   --zone=asia-south1-a

# Get cluster credentials for kubectl
gcloud container clusters get-credentials linkedin-cluster --region=asia-south1
```

---

## 5. Deploy with Kustomize

### A. Update Image Names in Kustomize
```bash
cd k8s
kustomize edit set image \
  discovery-server:latest=${REGISTRY}/discovery-server:latest \
  config-server:latest=${REGISTRY}/config-server:latest \
  api-gateway:latest=${REGISTRY}/api-gateway:latest \
  user-service:latest=${REGISTRY}/user-service:latest \
  posts-service:latest=${REGISTRY}/posts-service:latest \
  connection-service:latest=${REGISTRY}/connection-service:latest \
  notification-service:latest=${REGISTRY}/notification-service:latest
```

### B. Deploy all manifests
```bash
kubectl apply -k .
```

---

## 6. Monitor & Verify the Cluster

```bash
# Check all pods status
kubectl get pods -n linkedin-microservices -o wide

# Check services & ClusterIPs
kubectl get svc -n linkedin-microservices

# Check Ingress external IP allocation (takes ~2-3 mins on GKE)
kubectl get ingress -n linkedin-microservices -w

# Check Horizontal Pod Autoscalers
kubectl get hpa -n linkedin-microservices

# View live pod logs
kubectl logs -f -l app=api-gateway -n linkedin-microservices
```

---

## 7. Accessing the Live Ingress Endpoint

Once the Ingress allocates an `EXTERNAL-IP`:
```bash
export INGRESS_IP=$(kubectl get ingress linkedin-api-ingress -n linkedin-microservices -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Public Gateway URL: http://${INGRESS_IP}"

# Test API Gateway via Ingress
curl http://${INGRESS_IP}/actuator/health
```
