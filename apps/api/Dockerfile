FROM golang:1.24-alpine AS build

WORKDIR /src
COPY go.mod ./
COPY go.sum* ./
RUN go mod download
COPY . .
ENV GOAMD64=v1
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 10001 app
COPY --from=build /out/api /app/api
USER app
EXPOSE 8080
ENTRYPOINT ["/app/api"]
CMD ["serve"]
