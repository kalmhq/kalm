# ============== Frontend ==============
FROM node:10 as frontend-builder
WORKDIR /workspace

# Frontend and api will run on the same domain
ENV REACT_APP_K8S_API_PERFIX ""
ENV REACT_APP_K8S_API_VERSION v1alpha1

# Copy npm packages manifests
COPY frontend/package.json package.json
COPY frontend/package-lock.json package-lock.json
RUN npm install

# Copy source
COPY frontend/ .

# Build
RUN npm run build

# ============== Api ==============
FROM golang:1.13 as api-builder
WORKDIR /workspace/api

# Copy dependencies
COPY controller/ /workspace/controller

# Copy the Go Modules manifests
COPY api/go.mod go.mod
COPY api/go.sum go.sum

RUN go mod download

# Copy the go source
COPY api/ .

# Build
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -installsuffix 'static' -ldflags '-extldflags "-static"' -o kalm-api-server main.go
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -installsuffix 'static' -ldflags '-extldflags "-static"' -o auth-proxy ./cmd/auth-proxy

# ============== Finial ==============
FROM alpine
WORKDIR /workspace

# tell kalm api server the location of static files
ENV STATIC_FILE_ROOT build

# Collect binaries and assets
COPY --from=api-builder /workspace/api/kalm-api-server .
COPY --from=api-builder /workspace/api/auth-proxy .
COPY --from=frontend-builder /workspace/build/ build/
