# PortfolioPulse — Financial Portfolio Analytics Platform

A production-quality full-stack application for tracking stock investments, analysing portfolio performance, and visualising financial metrics — built with **Spring Boot + MySQL** on the backend and **React + TypeScript + Vite** on the frontend.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Backend     | Java 17, Spring Boot 3.2, Spring Data JPA, Hibernate |
| Database    | MySQL 8                                          |
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS v3      |
| Charts      | Recharts                                         |
| HTTP Client | Axios                                            |
| Market Data | Yahoo Finance API (live prices, sector data)     |

---

## Project Structure

```
portfoliopulse/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/portfoliopulse/
│       │   ├── PortfolioPulseApplication.java
│       │   ├── config/          # CORS, Jackson
│       │   ├── controller/      # REST controllers
│       │   ├── dto/             # Request / response DTOs
│       │   ├── entity/          # JPA entities
│       │   ├── exception/       # Custom exceptions + global handler
│       │   ├── repository/      # Spring Data JPA repos
│       │   └── service/         # Business logic
│       └── resources/
│           ├── application.properties
│           └── schema.sql
└── frontend/
    ├── src/
    │   ├── api/           # Axios API client
    │   ├── components/
    │   │   ├── charts/    # GrowthChart, AllocationChart, PerformanceChart
    │   │   ├── layout/    # Sidebar, Header, AppLayout
    │   │   └── ui/        # StatCard, TradeModal, EmptyState, Skeleton
    │   ├── pages/         # Dashboard, Holdings, Transactions, Analytics
    │   ├── types/         # TypeScript interfaces
    │   └── utils/         # Formatting helpers
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## REST API

| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/api/dashboard`        | KPIs, top holdings, charts data      |
| GET    | `/api/holdings`         | All current positions (with live P&L)|
| GET    | `/api/holdings?search=` | Search holdings by symbol/name       |
| POST   | `/api/holdings/buy`     | Record a buy transaction             |
| POST   | `/api/holdings/sell`    | Record a sell transaction            |
| GET    | `/api/transactions`     | Full transaction history             |
| GET    | `/api/analytics`        | Deep analytics, top/worst performers |
| GET    | `/api/stocks/{symbol}`  | Live stock quote from Yahoo Finance  |

---

## Database Schema

### `holdings`
| Column           | Type           | Notes                  |
|------------------|----------------|------------------------|
| id               | BIGINT PK AI   |                        |
| symbol           | VARCHAR(20)    | UNIQUE                 |
| company_name     | VARCHAR(255)   |                        |
| sector           | VARCHAR(100)   |                        |
| quantity         | DECIMAL(15,4)  |                        |
| average_buy_price| DECIMAL(15,4)  | Weighted avg cost      |
| created_at       | TIMESTAMP      |                        |
| updated_at       | TIMESTAMP      | Auto-updated           |

### `transactions`
| Column           | Type           | Notes                  |
|------------------|----------------|------------------------|
| id               | BIGINT PK AI   |                        |
| symbol           | VARCHAR(20)    |                        |
| company_name     | VARCHAR(255)   |                        |
| transaction_type | ENUM(BUY,SELL) |                        |
| quantity         | DECIMAL(15,4)  |                        |
| price            | DECIMAL(15,4)  |                        |
| transaction_date | DATE           |                        |
| notes            | TEXT           | Optional               |
| created_at       | TIMESTAMP      |                        |

### `portfolio_snapshots`
| Column           | Type           | Notes                  |
|------------------|----------------|------------------------|
| id               | BIGINT PK AI   |                        |
| portfolio_value  | DECIMAL(20,4)  |                        |
| total_investment | DECIMAL(20,4)  |                        |
| profit_loss      | DECIMAL(20,4)  |                        |
| profit_percentage| DECIMAL(10,4)  |                        |
| snapshot_date    | DATE           | UNIQUE — one per day   |
| created_at       | TIMESTAMP      |                        |

---

## Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Node.js 18+
- npm 9+

---

## Setup & Run

### 1 — MySQL Database

```sql
CREATE DATABASE portfoliopulse;
CREATE USER 'ppuser'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON portfoliopulse.* TO 'ppuser'@'localhost';
FLUSH PRIVILEGES;
```

Or simply run `schema.sql`:

```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

### 2 — Backend Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/portfoliopulse?useSSL=false&serverTimezone=UTC
spring.datasource.username=root        # ← change
spring.datasource.password=password    # ← change
```

### 3 — Start the Backend

```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```

Backend starts on **http://localhost:8080**

### 4 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:5173**

---

## Features

### Dashboard
- Total Investment / Current Value / Total P&L / Stocks held KPI cards
- Portfolio Growth area chart (with cost-basis reference line)
- Asset Allocation donut chart
- Sector Allocation donut chart
- Top Holdings table with live prices

### Holdings
- Full position table: qty, avg buy, CMP, invested, current value, P&L, return, day change
- Sector badge per holding
- Search by symbol or company name
- Inline Buy / Sell buttons per row

### Transactions
- Complete trade history sorted by date
- Filter by BUY / SELL
- Search by symbol or company
- Summary strip: total bought vs sold

### Analytics
- Best & worst performer cards
- Return-by-stock bar chart
- Portfolio growth line chart
- Asset & sector allocation donut charts
- Full holdings breakdown table with weight progress bars

### Trade Modal
- Live symbol lookup (Yahoo Finance)
- Shows current price & day change
- Auto-populates price field
- Calculates total cost / proceeds

---

## Yahoo Finance Integration

The `YahooFinanceService` queries two Yahoo Finance endpoints:

- `query1.finance.yahoo.com/v8/finance/chart/{symbol}` — current price, day change
- `query1.finance.yahoo.com/v7/finance/quote?symbols={symbol}` — sector, industry

Responses are **cached in-memory for 5 minutes** to reduce API calls. The cache is automatically invalidated per symbol.

---

## Analytics Calculations

| Metric             | Formula                                              |
|--------------------|------------------------------------------------------|
| Invested Value     | `quantity × averageBuyPrice`                         |
| Current Value      | `quantity × currentPrice`                            |
| P&L                | `currentValue − investedValue`                       |
| Return %           | `(P&L / investedValue) × 100`                        |
| Avg Buy Price      | Weighted: `(oldQty×oldAvg + newQty×newPrice) / total`|
| Portfolio Snapshot | Saved daily at market close (weekdays, 9 PM UTC)     |

---

## Deployment Notes

### Docker (optional)

```dockerfile
# Backend
FROM eclipse-temurin:17-jre
COPY target/portfoliopulse-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]
```

```bash
# Frontend (build static files, serve with nginx)
npm run build
# Serve dist/ directory
```

### Environment Variables (production)

```bash
SPRING_DATASOURCE_URL=jdbc:mysql://db-host:3306/portfoliopulse
SPRING_DATASOURCE_USERNAME=ppuser
SPRING_DATASOURCE_PASSWORD=secret
```

---

## License

MIT — built as a portfolio project demonstrating full-stack Java + React engineering.
