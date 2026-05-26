# Visual Algo-Trading Builder (VAT Builder)

Дипломна робота — **"Розробка програмного забезпечення для візуального конструктора алгоритмічних торгових стратегій"**.

Веб-застосунок для візуального створення, тестування та аналізу алгоритмічних торгових стратегій без написання коду.

---

## Стек технологій

| Шар | Технологія |
|---|---|
| Frontend | React 18, Vite, React Router v6, @xyflow/react, recharts, axios |
| Backend | Node.js 20, Express.js |
| Database | PostgreSQL 15 + Sequelize ORM |
| Auth | JWT (access 15 хв + refresh 7 днів, HttpOnly cookie) |
| WebSocket | ws (прогрес бектесту в реальному часі) |

---

## Встановлення та запуск

### 1. Клонування репозиторію

```bash
git clone <repo-url>
cd diploma
```

### 2. Встановлення залежностей

```bash
# Кореневі (concurrently)
npm install

# Сервер та клієнт
npm run install:all
```

### 3. Налаштування середовища

```bash
cp .env.example server/.env
```

Відредагуйте `server/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vat_builder
DB_USER=postgres
DB_PASS=your_password
JWT_SECRET=change_me_to_random_string
JWT_REFRESH_SECRET=change_me_to_another_random_string
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Створення бази даних

```bash
createdb vat_builder
```

> Sequelize автоматично синхронізує схему при першому запуску (`alter: true`).

### 5. Запуск у режимі розробки

```bash
npm run dev
```

Відкрийте [http://localhost:5173](http://localhost:5173)

---

## Структура проекту

```
diploma/
├── server/                  # Node.js / Express backend
│   ├── config/db.js         # Sequelize підключення
│   ├── controllers/         # AuthController, StrategyController, BacktestController
│   ├── models/              # User, Strategy, BacktestResult, RefreshToken
│   ├── routes/              # auth, strategies, backtests
│   ├── services/
│   │   ├── BacktestEngine.js    # Симуляція стратегій
│   │   ├── IndicatorEngine.js   # SMA, EMA, RSI, MACD, Bollinger
│   │   ├── GraphInterpreter.js  # Топологічне сортування графу
│   │   ├── MarketDataProvider.js # Тестові дані AAPL (330 свічок)
│   │   └── MetricsCalculator.js # Метрики: дохідність, Шарп, просадка
│   ├── websocket/
│   │   ├── backtestSocket.js    # WS-сервер для прогресу бектесту
│   │   └── backtestRegistry.js  # In-memory реєстр очікуючих задач
│   └── server.js
├── client/                  # React 18 frontend
│   ├── src/
│   │   ├── api/axios.js     # axios інстанція з interceptors
│   │   ├── store/authStore.js
│   │   ├── pages/           # LoginPage, RegisterPage, Dashboard,
│   │   │                    # StrategyEditor, BacktestPage, ResultsPage
│   │   └── components/
│   │       ├── editor/      # React Flow canvas + 9 типів вузлів
│   │       ├── dashboard/   # StrategyCard, DeleteConfirmModal
│   │       ├── backtest/    # BacktestForm, ProgressBar
│   │       ├── results/     # MetricsPanel, EquityCurveChart
│   │       └── shared/      # PrivateRoute, LoadingSpinner, ErrorMessage
│   └── vite.config.js
└── .env.example
```

---

## API

| Метод | Шлях | Опис |
|---|---|---|
| POST | `/api/auth/register` | Реєстрація |
| POST | `/api/auth/login` | Вхід |
| POST | `/api/auth/refresh` | Оновлення access token |
| POST | `/api/auth/logout` | Вихід |
| GET | `/api/strategies` | Список стратегій |
| POST | `/api/strategies` | Створити стратегію |
| GET | `/api/strategies/:id` | Отримати стратегію |
| PUT | `/api/strategies/:id` | Оновити стратегію |
| DELETE | `/api/strategies/:id` | Видалити стратегію |
| POST | `/api/strategies/:id/backtest` | Запустити бектест → `{backtestId}` |
| GET | `/api/strategies/:id/backtest/results` | Список результатів |
| GET | `/api/strategies/:id/backtest/results/:backtestId` | Результат бектесту |

### WebSocket

Підключення: `ws://localhost:5173/ws?token=<accessToken>&backtestId=<backtestId>`

Повідомлення від сервера:
- `{ type: "progress", progress: 0-100 }`
- `{ type: "complete", backtestId }`
- `{ type: "error", message }`
