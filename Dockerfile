FROM golang:1.24.2-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/main.go

FROM alpine:3.19

WORKDIR /app

# Копируем бинарный файл из стадии сборки
COPY --from=builder /app/main .
COPY --from=builder /app/configs ./configs
COPY --from=builder /app/migrations ./migrations

# Добавляем зеркала репозиториев и устанавливаем утилиту migrate
RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.19/main" > /etc/apk/repositories && \
    echo "https://dl-cdn.alpinelinux.org/alpine/v3.19/community" >> /etc/apk/repositories && \
    echo "https://mirror.yandex.ru/mirrors/alpine/v3.19/main" >> /etc/apk/repositories && \
    echo "https://mirror.yandex.ru/mirrors/alpine/v3.19/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache wget && \
    wget https://github.com/golang-migrate/migrate/releases/download/v4.16.2/migrate.linux-amd64.tar.gz && \
    tar xvz -f migrate.linux-amd64.tar.gz && \
    mv migrate /usr/local/bin/migrate && \
    rm -f migrate.linux-amd64.tar.gz && \
    chmod +x /usr/local/bin/migrate

EXPOSE 8080

# Исправляем команду запуска
ENTRYPOINT ["./main"]
CMD ["--with-testdata"] 