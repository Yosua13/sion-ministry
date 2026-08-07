FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.25-alpine AS backend-build
WORKDIR /src/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/sion-academy-api ./main.go
RUN mkdir /out/uploads

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app/backend
COPY --chown=nonroot:nonroot --from=backend-build /out/sion-academy-api ./sion-academy-api
COPY --chown=nonroot:nonroot --from=backend-build /out/uploads ./uploads
COPY --chown=nonroot:nonroot --from=frontend-build /src/frontend/dist /app/frontend/dist
EXPOSE 3000
USER nonroot:nonroot
ENTRYPOINT ["/app/backend/sion-academy-api"]
