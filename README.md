# Hinomontaj

Система управления шиномонтажной мастерской

## Возможности

- Управление сотрудниками
- Учет заказов
- Работа с клиентами
- Статистика и отчеты
- Разграничение прав доступа (работники/менеджеры)

## Технологии

- Go 1.21
- PostgreSQL
- Gin Web Framework
- JWT для авторизации
- SQLx для работы с БД

## Установка

1. Клонировать репозиторий:
```bash
git clone https://github.com/your-username/hinomontaj.git
cd hinomontaj
```

2. Установить зависимости:
```bash
go mod download
```

3. Создать базу данных:
```bash
createdb hinomontaj
```

4. Применить миграции:
```bash
make migrate-up
```

5. Настроить конфигурацию в `configs/config.yml`

6. Запустить сервер:
```bash
go run cmd/app/main.go
```

## Структура проекта

```
.
├── cmd/                  # Точки входа приложения
├── configs/             # Конфигурационные файлы
├── docs/               # Документация
├── internal/           # Внутренний код приложения
│   ├── handlers/      # HTTP обработчики
│   ├── middleware/    # Промежуточные обработчики
│   ├── models/        # Модели данных
│   ├── repository/    # Слой работы с БД
│   └── service/       # Бизнес-логика
├── migrations/        # Миграции базы данных
├── pkg/              # Общие пакеты
├── go.mod            # Зависимости
└── README.md         # Документация проекта
```

## API Документация

Подробная документация API доступна в [docs/api.md](docs/api.md)

## Разработка

### Создание новой миграции

```bash
make migrate-create name=migration_name
```

### Применение миграций

```bash
make migrate-up    # Применить все миграции
make migrate-down  # Откатить все миграции
```

## Лицензия

MIT 