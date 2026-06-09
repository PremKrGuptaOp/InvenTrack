# InvenTrack — Inventory & Order Management System

**🔗 Deployed Live Demo:** [inven-track-nu.vercel.app](https://inven-track-nu.vercel.app)

A full-stack, enterprise-grade inventory and order management system. Built with a modern, glassmorphic dark user interface, real-time metrics visual charting, and transaction logic.

---

## 🎨 Visual Showcase

### 📊 Real-time Dashboard
![Dashboard Screenshot](screenshots/dashboard.png)

### 📦 Products Inventory Management
![Products Screenshot](screenshots/products.png)

### 👥 Customers Directory
![Customers Screenshot](screenshots/customers.png)

### 🛒 Point of Sale & Orders
![Orders Screenshot](screenshots/orders.png)

---

## 🚀 Key Features

* **Real-time Analytics Dashboard**: Features custom interactive SVG trend charts with hover tooltips and a chronological system activity timeline.
* **Automatic Database Seeding**: Pre-populates the system with realistic business items (Dell monitors, iPhones, keyboards) and completed sales orders on startup.
* **Point of Sale (POS) Checkout**: A split-screen checkout flow displaying a live-updating paper invoice receipt with taxes, subtotals, and stock validations.
* **Full CRUD Management**: Search, filter, add, and delete controls for products, customers, and transactions.
* **Responsive Sidebar Navigation**: Glassmorphic layout with custom SVG icons.

---

## 🏛️ System Architecture

InvenTrack uses a decoupled client-server architecture:

```mermaid
graph TD
    subgraph Client Layer [Frontend Client - React & Vite]
        A[Browser UI] -->|Axios REST Requests| B[API Client Services]
    end

    subgraph Service Layer [Backend API - Flask]
        C[REST Controllers] -->|SQLAlchemy ORM| D[Database Context]
    end

    subgraph Storage Layer [Database System]
        D -->|Production/Docker| E[PostgreSQL Database]
        D -->|Local Development| F[SQLite Database]
    end

    B -->|HTTP Requests| C
    C -->|JSON Responses| B
```

---

## 📊 Database Relational Schema

The database model is structured with standard foreign key relations and cascade-deletes for clean data consistency:

```mermaid
erDiagram
    customers ||--o{ orders : "places"
    orders ||--|{ order_items : "contains"
    products ||--o{ order_items : "referenced in"

    customers {
        int id PK
        string name
        string email UK
        string phone
    }

    products {
        int id PK
        string name
        string sku UK
        float price
        int quantity
    }

    orders {
        int id PK
        int customer_id FK
        float total_amount
        datetime created_at
    }

    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        float unit_price
    }
```

---

## 🔄 Core Business Workflows

### 1. POS Order Placement Flow
This flowchart details how the system validates customer accounts, checks stock thresholds, and commits atomic inventory deductions:

```mermaid
flowchart TD
    A[Start Order Request] --> B[Receive Payload: customer_id & items]
    B --> C{Does Customer Exist?}
    C -- No --> D[Return 404: Customer Not Found]
    C -- Yes --> E[Initialize Transaction Loop]
    E --> F{For each item: Does Product Exist?}
    F -- No --> G[Abort & Return 404: Product Not Found]
    F -- Yes --> H{Is Stock Available?}
    H -- No --> I[Abort & Return 400: Insufficient Stock]
    H -- Yes --> J[Proceed to Next Item]
    J --> K{All Items Checked?}
    K -- No --> F
    K -- Yes --> L[Subtract Quantities from Stock]
    L --> M[Insert Order & OrderItems Rows]
    M --> N[Commit Transaction]
    N --> O[Return 201: Order Confirmed]
```

### 2. Order Cancellation Flow
Cancelling an order automatically restores inventory levels in a database transaction:

```mermaid
flowchart TD
    A[Cancel Request: order_id] --> B{Does Order Exist?}
    B -- No --> C[Return 404: Order Not Found]
    B -- Yes --> D[Loop through Order Items]
    D --> E[Add item quantity back to Product stock]
    E --> F[Next Item]
    F --> G{All Items Restored?}
    G -- No --> D
    G -- Yes --> H[Delete Order Row - Cascades OrderItems]
    H --> I[Commit Transaction]
    I --> J[Return 200: Stock Restored Successfully]
```

---

## 💻 Local Development Setup (Quick Start)

The application features a local SQLite fallback, allowing you to run it without setting up a database server.

### 1. Run the Backend API
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   python run.py
   ```
   *The backend will boot on `http://localhost:5000` and automatically create the SQLite database populated with seed data.*

### 2. Run the Frontend UI
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will open at `http://localhost:5173/`.*

---

## 🐳 Docker Compose Launch

You can run the full environment (PostgreSQL database, Flask backend, and Nginx-served React frontend) in containers:

1. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
2. Build and launch the services:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   * **Frontend UI**: `http://localhost:3000`
   * **Backend API**: `http://localhost:5000`

---

## ☁️ Beginner-Friendly Cloud Deployment Guide

Follow these steps to deploy InvenTrack to the cloud for free using Render and Vercel.

### Step 1: Deploy the Database on Render
1. Go to [Render](https://render.com) and sign up/log in (you can use your GitHub account).
2. Click the blue **New +** button and select **PostgreSQL**.
3. Configure the database:
   * **Name**: `inventrack-db`
   * **Instance Type**: Select **Free**.
4. Scroll down and click **Create Database**.
5. Once the database status changes to **Active**, scroll to the **Connection** section and copy the **Internal Database URL** (e.g., `postgres://...`). *Save this URL.*

### Step 2: Deploy the Backend API on Render
1. Click **New +** on Render and select **Web Service**.
2. Connect your GitHub repository containing the InvenTrack code.
3. Configure the service:
   * **Name**: `inventrack-api`
   * **Root Directory**: `backend`
   * **Language**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT`
   * **Instance Type**: Select **Free**.
4. Scroll down, click **Advanced**, and add the following **Environment Variables**:
   * **DATABASE_URL**: *Paste the Internal Database URL copied in Step 1*
   * **SECRET_KEY**: *Type any secure random password*
5. Click **Create Web Service**. Once the deploy finishes and says **Live**, copy your API URL at the top left (e.g., `https://inventrack-api.onrender.com`).

### Step 3: Deploy the Frontend UI on Vercel
1. Go to [Vercel](https://vercel.com) and log in with your GitHub account.
2. Click **Add New** and select **Project**.
3. Import your `InvenTrack` repository.
4. Configure the project:
   * **Root Directory**: Select the `frontend` folder.
   * **Framework Preset**: Vercel will automatically detect `Vite`.
5. Expand the **Environment Variables** section and add:
   * **Key**: `VITE_API_URL`
   * **Value**: *Paste the live Render API URL from Step 2 (make sure there is no trailing slash)*
6. Click **Deploy**. Vercel will build your static files and host them live.

---

## 🔌 API Endpoints Reference

### Products CRUD
| Method | Endpoint | Description | Payload Format |
|---|---|---|---|
| `GET` | `/products` | Retrieve all products | None |
| `GET` | `/products/:id` | Get details for single product | None |
| `POST` | `/products` | Create a new product | `{"name": "...", "sku": "...", "price": 10.0, "quantity": 5}` |
| `PUT` | `/products/:id` | Update an existing product | `{"name": "...", "price": 12.0}` |
| `DELETE` | `/products/:id` | Remove product (fails if in order) | None |

### Customers CRUD
| Method | Endpoint | Description | Payload Format |
|---|---|---|---|
| `GET` | `/customers` | Retrieve customer database | None |
| `GET` | `/customers/:id` | Get details for single customer | None |
| `POST` | `/customers` | Register a new customer | `{"name": "...", "email": "...", "phone": "..."}` |
| `DELETE` | `/customers/:id` | Delete customer (fails if has orders) | None |

### Orders & Transactions
| Method | Endpoint | Description | Payload Format |
|---|---|---|---|
| `GET` | `/orders` | Retrieve order list with customer names | None |
| `GET` | `/orders/:id` | Get details and item list for single order | None |
| `POST` | `/orders` | Place a new order (modifies stock) | `{"customer_id": 1, "items": [{"product_id": 1, "quantity": 2}]}` |
| `DELETE` | `/orders/:id` | Cancel order and restore stock | None |
