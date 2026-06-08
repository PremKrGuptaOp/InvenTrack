# InvenTrack — Inventory & Order Management System

A full-stack web application for managing products, customers, and orders with real-time inventory tracking.

## Tech Stack

| Layer         | Technology                  |
|---------------|----------------------------|
| Frontend      | React (Vite)               |
| Backend       | Python / Flask              |
| Database      | PostgreSQL                  |
| Containerization | Docker + Docker Compose  |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py        # Flask app factory
│   │   ├── config.py          # Configuration
│   │   ├── models.py          # Database models
│   │   ├── utils.py           # Helpers
│   │   └── routes/
│   │       ├── products.py    # Product CRUD
│   │       ├── customers.py   # Customer CRUD
│   │       └── orders.py      # Order management
│   ├── run.py                 # Entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd assessment
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set a secure POSTGRES_PASSWORD
   ```

3. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

### Running Without Docker (Development)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Set DATABASE_URL env variable pointing to your PostgreSQL instance
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

### Products

| Method | Endpoint           | Description            |
|--------|--------------------|------------------------|
| POST   | `/products`        | Create a new product   |
| GET    | `/products`        | List all products      |
| GET    | `/products/:id`    | Get product by ID      |
| PUT    | `/products/:id`    | Update a product       |
| DELETE | `/products/:id`    | Delete a product       |

**Product fields:** `name`, `sku` (unique), `price`, `quantity`

### Customers

| Method | Endpoint            | Description             |
|--------|---------------------|-------------------------|
| POST   | `/customers`        | Create a new customer   |
| GET    | `/customers`        | List all customers      |
| GET    | `/customers/:id`    | Get customer by ID      |
| DELETE | `/customers/:id`    | Delete a customer       |

**Customer fields:** `name`, `email` (unique), `phone`

### Orders

| Method | Endpoint         | Description          |
|--------|------------------|----------------------|
| POST   | `/orders`        | Create a new order   |
| GET    | `/orders`        | List all orders      |
| GET    | `/orders/:id`    | Get order details    |
| DELETE | `/orders/:id`    | Cancel an order      |

**Create order payload:**
```json
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

## Business Rules

- Product SKU must be unique
- Customer email must be unique
- Product quantity cannot go negative
- Orders are rejected if stock is insufficient
- Creating an order automatically reduces stock
- Cancelling an order restores stock
- Total amount is calculated by the backend

## Deployment

### Backend — Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Set **Root Directory** to `backend`
4. Set **Build Command:** `pip install -r requirements.txt`
5. Set **Start Command:** `gunicorn run:app --bind 0.0.0.0:$PORT`
6. Add a **PostgreSQL** database on Render (free tier)
7. Add environment variable `DATABASE_URL` with the Internal Database URL from Render

### Frontend — Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set **Build Command:** `npm run build`
4. Set **Output Directory:** `dist`
5. Add environment variable: `VITE_API_URL` = your Render backend URL (e.g. `https://your-app.onrender.com`)

### Environment Variables

| Variable         | Service  | Description                     |
|------------------|----------|---------------------------------|
| `DATABASE_URL`   | Backend  | PostgreSQL connection string    |
| `SECRET_KEY`     | Backend  | Flask secret key                |
| `VITE_API_URL`   | Frontend | Backend API URL                 |

## Docker Details

- **Backend image:** `python:3.12-slim` with gunicorn
- **Frontend image:** Multi-stage — `node:20-alpine` (build) → `nginx:alpine` (serve)
- **Database:** `postgres:16-alpine` with named volume for persistence
- No hardcoded credentials — all config via environment variables
