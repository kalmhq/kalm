# ============== Frontend ==============
FROM node:10 as frontend-builder
WORKDIR /workspace
ENV REACT_APP_K8S_API_PERFIX ""
COPY frontend/package.json package.json
COPY frontend/package-lock.json package-lock.json
RUN npm install
COPY frontend/ .
RUN npm run build

# ============== Api ==============
FROM golang:1.12 as api-builder
WORKDIR /workspace
COPY api/go.mod go.mod
COPY api/go.sum go.sum
RUN go mod download
COPY api/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags '-s -w' -o kapp-api-server main.go


# ============== Finial ==============
FROM alpine
WORKDIR /workspace
ENV STATIC_FILE_ROOT build
COPY --from=api-builder /workspace/kapp-api-server .
COPY --from=frontend-builder /workspace/build/ build/
CMD ["/workspace/kapp-api-server"]
