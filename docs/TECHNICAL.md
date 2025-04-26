# Техническая документация

## Архитектура системы

### Backend
- Язык: Go
- Фреймворк: Стандартная библиотека net/http
- База данных: SQLite
- Структура:
  - `main.go` - инициализация и запуск сервера
  - `handlers/` - обработчики HTTP-запросов
  - `models/` - модели данных и работа с БД

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Отсутствие фреймворков (чистый JS)
- Адаптивный дизайн

## Модели данных

### Order
```go
type Order struct {
    ID            int64     `json:"id"`
    VehicleNumber string    `json:"vehicle_number"`
    PaymentMethod string    `json:"payment_method"`
    ClientType    string    `json:"client_type"`
    CreatedAt     time.Time `json:"created_at"`
    Services      []OrderService
}
```

### OrderService
```go
type OrderService struct {
    ID           int64  `json:"id"`
    OrderID      int64  `json:"order_id"`
    ServiceID    int64  `json:"service_id"`
    ServiceName  string `json:"service_name"`
    WheelPosition string `json:"wheel_position"`
}
```

## API

### GET /api/services
Возвращает список доступных услуг с ценами.

### GET /api/orders
Возвращает список всех заказов.

### POST /api/orders
Создает новый заказ.

Параметры запроса:
```json
{
    "vehicle_number": "А777МР77/АВ123477",
    "payment_method": "нал|агрегатор|контрагент",
    "client_type": "individual|company",
    "services": [
        {
            "service_type": "название услуги",
            "wheel_position": "позиция колеса"
        }
    ]
}
```

## База данных

### Таблицы
- `orders` - заказы
- `services` - услуги
- `order_services` - связь заказов с услугами

### Миграции
```sql
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_number TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    client_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price_individual INTEGER NOT NULL,
    price_company INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    wheel_position TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);
```

## Безопасность
- Валидация входных данных
- Защита от SQL-инъекций через параметризованные запросы
- Проверка форматов номеров ТС
- Валидация типов клиентов и методов оплаты

## Тестирование
- Ручное тестирование функционала
- Проверка валидации номеров ТС
- Тестирование создания заказов
- Проверка отображения списка заказов 