# Vehicle Service Management System (VSMS)

A full-stack, university academic web application developed for small to medium-sized vehicle service centers to manage customers, vehicles, appointments, service jobs, parts/labour costs, payments, and complete service histories.

---

## 📌 Project Overview

- **Project Title:** Vehicle Service Management System
- **Intended Audience:** Vehicle Service Center Managers & Staff (Academic Submission)
- **Design Principle:** Simple, clean, practical, and easy to understand (no unnecessary enterprise complexity).

### Core Workflow:
$$\text{Customer} \longrightarrow \text{Vehicle} \longrightarrow \text{Appointment} \longrightarrow \text{Service Job} \longrightarrow \text{Cost Calculation} \longrightarrow \text{Payment Settlement} \longrightarrow \text{Service History}$$

---

## 🛠️ Technology Stack

### Frontend:
- **React (v18+)** with **TypeScript**
- **Vite** (Fast dev server and bundler)
- **Tailwind CSS** (Clean, responsive layout & custom theme)
- **React Router Dom (v7)** (Client-side routing with protected routes)
- **Axios** (HTTP client with JWT request interceptors)
- **Recharts** (Visual revenue and service throughput analytics)
- **Lucide React** (Modern, consistent iconography)

### Backend:
- **Node.js** with **Express.js** (REST API)
- **TypeScript** (Strict type safety)
- **Prisma ORM** (Database modeling, schema migrations, and seeding)
- **JSON Web Tokens (JWT)** (Secure token-based authentication)
- **bcrypt** (Password hashing with 10 salt rounds)
- **CORS & Dotenv** (Cross-origin handling & environment configuration)

### Database:
- **MariaDB / MySQL** (Port `3306`)
- Supported with **Laragon** and **HeidiSQL**

---

## 🗄️ Database Architecture & Tables

Database Name: `vehicle_service_management`

1. **`users`**: System staff and administrators (`id`, `name`, `email`, `password`, `role`).
2. **`customers`**: Vehicle owners (`id`, `name`, `phone`, `email`, `address`).
3. **`vehicles`**: Vehicles registered to customers (`id`, `registrationNumber`, `brand`, `model`, `vehicleType`, `year`, `engineNumber`, `customerId`).
4. **`appointments`**: Bookings (`id`, `customerId`, `vehicleId`, `date`, `time`, `serviceType`, `notes`, `status`).
5. **`services`**: Service job-cards (`id`, `appointmentId`, `vehicleId`, `serviceType`, `customerComplaint`, `workPerformed`, `labourCost`, `partsCost`, `totalCost`, `serviceDate`, `status`).
   - *Automatic calculation:* $\text{Total Cost} = \text{Labour Cost} + \text{Parts Cost}$.
6. **`service_items`**: Itemized breakdown of parts and labor lines.
7. **`payments`**: Invoices and settlements (`id`, `serviceId`, `amount`, `paymentDate`, `paymentMethod`, `paymentStatus`, `notes`).

---

## 🚀 How to Set Up & Run the Project Locally

### Prerequisites:
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- **Laragon** (with MariaDB/MySQL enabled)

---

### Step 1: Start Laragon & MySQL

1. Launch **Laragon**.
2. Click **Start All** (or ensure the MySQL/MariaDB service is started on port `3306`).
3. (Optional) Open **HeidiSQL** from Laragon to inspect the database. Default Laragon credentials:
   - Host: `localhost` (or `127.0.0.1`)
   - Port: `3306`
   - User: `root`
   - Password: *(Leave blank)*

---

### Step 2: Configure & Start the Backend

1. Open a terminal in the `backend/` folder:
   ```bash
   cd backend
   ```

2. Verify or create `.env`:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/vehicle_service_management"
   JWT_SECRET="academic_vehicle_service_jwt_secret_key_2026"
   PORT=5000
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Push the Prisma schema to create the MariaDB database and tables:
   ```bash
   npx prisma db push
   ```

5. Seed sample academic data:
   ```bash
   npm run seed
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will run at `http://localhost:5000`.*

---

### Step 3: Configure & Start the Frontend

1. Open a new terminal in the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`.*

4. Open your web browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🧪 Testing the Modules (Step-by-Step)

1. **Login & RBAC Testing:**
   - On the login page, click **Fill Admin** and sign in.
   - You will see all navigation links including **User Management**.
   - Sign out and click **Fill Staff** and sign in.
   - Notice that **User Management** is automatically hidden and protected from non-admin staff.

2. **Dashboard:**
   - Check the 6 real-time KPI stat cards.
   - Review the **Monthly Revenue Trend** bar chart and **Service Breakdown** pie chart.
   - Inspect today's scheduled appointments and recent workshop jobs.

3. **Customer Management:**
   - Click **Customers**.
   - Click **+ Add Customer** to register a new vehicle owner.
   - Use the search bar to search by name or phone.
   - Click the Eye icon to view the customer's profile and registered vehicles.

4. **Vehicle Management:**
   - Click **Vehicles**.
   - Click **+ Add Vehicle** to assign a vehicle (e.g. registration, brand, model, type, year) to any customer.
   - Click the Eye icon on any vehicle to view its technical specs and complete maintenance history.

5. **Appointments & Workflow Conversion:**
   - Click **Appointments**.
   - View scheduled bookings with status badges (`PENDING`, `CONFIRMED`, `IN PROGRESS`, `COMPLETED`).
   - Click **Start Service** on any appointment to convert it into an active workshop service job.

6. **Service Management & Cost Calculation:**
   - Click **Services**.
   - Click **New Service Job** to open the job-card creator.
   - Add parts or labour lines. Observe how **Total Cost = Labour Cost + Parts Cost** is calculated live.
   - Click the **Print / Job Card** icon on any service to view the formatted printable job card.

7. **Payment Management & Invoices:**
   - Click **Payments**.
   - Filter by status (`Paid` vs `Pending`) or payment method (`Cash`, `Card`, `Bank Transfer`).
   - Click **Settle** on a pending payment to record payment settlement.
   - Click the **Printer** icon to view and print an official customer payment receipt.

8. **Vehicle Service History Search:**
   - Click **Service History**.
   - Enter `BAP-1234` in the **Vehicle Reg Number** field and click **Search History**.
   - Expand the timeline cards to view historical work performed, parts used, item costs, and payment records.

9. **Reports:**
   - Click **Reports**.
   - Filter by date range or click preset filters (**Today**, **This Month**, **All Time**).
   - Review revenue metrics and click **Print Report** for an academic report export.

10. **Profile & Security:**
    - Click **Profile & Settings** to review account information and role privileges.
    - Test changing your account password.

---

## 📁 Project Directory Structure

```
vehicle-service-management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # MariaDB schema definition
│   │   └── seed.ts             # Demo academic seed script
│   ├── src/
│   │   ├── controllers/        # REST API controllers
│   │   │   ├── authController.ts
│   │   │   ├── customerController.ts
│   │   │   ├── vehicleController.ts
│   │   │   ├── appointmentController.ts
│   │   │   ├── serviceController.ts
│   │   │   ├── paymentController.ts
│   │   │   ├── historyController.ts
│   │   │   ├── reportController.ts
│   │   │   └── userController.ts
│   │   ├── middleware/         # JWT auth and Role guard
│   │   ├── routes/             # Express route modules
│   │   ├── utils/              # Prisma singleton & JWT helper
│   │   └── index.ts            # Server entrypoint (Port 5000)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Modal, StatCard, StatusBadge, Sidebar, Header)
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── layouts/            # DashboardLayout
│   │   ├── pages/              # Login, Dashboard, Customers, Vehicles, Appointments,
│   │   │                       # Services, Payments, ServiceHistory, Reports, Profile, Users
│   │   ├── services/           # Axios API service
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Date and Currency formatters
│   │   ├── App.tsx             # React Router routing
│   │   ├── main.tsx
│   │   └── index.css           # Tailwind styles
│   ├── index.html
│   ├── vite.config.ts          # Vite configuration with API proxy
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md                   # Full documentation & setup guide
```

---

## 🎓 Academic Submission Notes

- **Simplicity:** All code is written in clean, idiomatic TypeScript with clear naming conventions and comments.
- **Relational Integrity:** Foreign keys with cascade rules ensure no orphan records between Customers, Vehicles, Services, and Payments.
- **Security:** Passwords are never stored in plain text; bcrypt is used for hashing, and JWT tokens verify every protected request.
