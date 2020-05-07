# ============== Frontend ==============
FROM node:10 as frontend-builder
WORKDIR /workspace

# Frontend and api will run on the same domain
ENV REACT_APP_K8S_API_PERFIX ""

# Copy npm packages manifests
COPY frontend/package.json package.json
COPY frontend/package-lock.json package-lock.json
RUN npm install

# Copy source
COPY frontend/ .

# Build
RUN npm run build

# ============== Api ==============
FROM golang:1.12 as api-builder
WORKDIR /workspace/api

# Copy dependencies
COPY lib/ /workspace/lib
COPY controller/ /workspace/controller

# Copy the Go Modules manifests
COPY api/go.mod go.mod
COPY api/go.sum go.sum

RUN go mod download

# Copy the go source
COPY api/ .

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags '-s -w' -o kapp-api-server main.go

# ============== Finial ==============
FROM alpine
WORKDIR /workspace

# tell kapp api server the location of static files
ENV STATIC_FILE_ROOT build

# Collect binaries and assets
COPY --from=api-builder /workspace/api/kapp-api-server .
COPY --from=frontend-builder /workspace/build/ build/