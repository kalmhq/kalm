# ============== Frontend ==============
FROM node:10 as frontend-builder
WORKDIR /workspace

# Frontend and api will run on the same domain
ENV REACT_APP_K8S_API_PERFIX ""
ENV REACT_APP_K8S_API_VERSION v1alpha1
ENV SKIP_PREFLIGHT_CHECK=true

# Copy npm packages manifests
COPY frontend/package.json package.json
COPY frontend/package-lock.json package-lock.json
RUN npm install

# Copy source
COPY frontend/ .

# Build
RUN npm run build

# ============== Api ==============
FROM golang:1.15.2 as api-builder
WORKDIR /workspace/api

# Copy dependencies
COPY controller/ /workspace/controller

# Copy the Go Modules manifests
COPY api/go.mod go.mod
COPY api/go.sum go.sum

RUN go mod download

# Copy the go source
COPY api/ .

ARG KALM_BUILD_ENV_GIT_VERSION
ARG KALM_BUILD_ENV_GIT_COMMIT

# Build
RUN CGO_ENABLED=1 go build -installsuffix 'static' \
    -ldflags "-X github.com/iAladdin/kalm/api/config.GIT_VERSION=$KALM_BUILD_ENV_GIT_VERSION -X github.com/iAladdin/kalm/api/config.GIT_COMMIT=$KALM_BUILD_ENV_GIT_COMMIT -X 'github.com/iAladdin/kalm/api/config.BUILD_TIME=$(date -Iseconds)' -X 'github.com/iAladdin/kalm/api/config.PLATFORM=$(go version | cut -d ' ' -f 4)' -X 'github.com/iAladdin/kalm/api/config.GO_VERSION=$(go version | cut -d ' ' -f 3)' -extldflags '-static'" \
    -o kalm-api-server main.go

RUN go build -ldflags "-s -w" -o auth-proxy ./cmd/auth-proxy
RUN go build -ldflags "-s -w" -o imgconv ./cmd/imgconv

# ============== Finial ==============
FROM alpine
WORKDIR /workspace
# tell kalm api server the location of static files
ENV STATIC_FILE_ROOT build

# Collect binaries and assets
COPY --from=api-builder /workspace/api/kalm-api-server .

RUN mkdir /lib64 && ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2
COPY --from=api-builder /workspace/api/auth-proxy .
COPY --from=api-builder /workspace/api/imgconv .

COPY --from=frontend-builder /workspace/build/ build/
