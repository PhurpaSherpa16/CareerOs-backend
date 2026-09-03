# Express + Prisma + Supabase Backend Boilerplate 🚀

[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

A robust and scalable backend for portfolio applications, built with **Express.js**, **Prisma ORM**, and **Supabase (PostgreSQL)**. This boilerplate provides a clean architecture and essential setup to jumpstart your development.

---

## ✨ Features

- ⚡ **Express.js** - Fast, unopinionated, minimalist web framework.
- 💎 **Prisma** - Next-generation ORM for Node.js and TypeScript.
- ☁️ **Supabase** - Managed PostgreSQL database with real-time capabilities.
- 🏗️ **Controller-Service Architecture** - Clean separation of concerns.
- 🛠️ **Error Handling** - Centralized middleware for consistent API responses.
- 🔐 **Environment Config** - Secure configuration using `dotenv`.

---


## 🛠️ Getting Started - Follow the steps below to run the project

### 1. Installation

```bash
git clone <your-repository-url>
cd portfolio_backend
```

It will automatically install the required packages

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory and add your credentials:

```env
DATABASE_URL="your_postgresql_database_url"
DIRECT_URL="your_direct_database_url"
SUPABASE_URL="your_supabase_project_url"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
```

### 3. Run the server

```bash
npm run dev
```

Expected output:

```bash
📊 API running at http://localhost:9000
```

---

### Database Initialization
To initialize the database, run the following commands:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (if any)
npx prisma migrate dev

# Sync database schema
npx prisma db push
```

---

## ⚙️ Install Dependencies

If error / changes required, install all required packages:

```bash
npm install
npm install express cors dotenv @prisma/client @supabase/supabase-js 
npm install -D nodemon prisma
```

---

## 📂 Project Structure

```text
Projects/
├── controller/         # Request handlers
├── lib/               # Shared libraries (Prisma client, etc.)
├── middleware/         # Custom Express middlewares
├── prisma/             # Prisma schema and migrations
├── routes/             # API route definitions
├── service/            # Business logic layer
├── utils/              # Helper functions and constants
├── index.js           # Application entry point
├── package.json        # Dependencies and scripts
└── .gitignore         # Git ignore rules
```

---

## 🚀 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the server in development mode with `nodemon`. |
| `npm start` | Starts the server in production mode. |
| `npm run build` | Generates the Prisma client. |

---

## 📝 Summary

5 easy steps to run the project:
1. Clone the project/repository
2. Run the bash ( npm install ) it will automatically install all the required packages
3. Create a .env file in the root directory and add your credentials
4. Run the bash ( npm run dev ) it will start the server
5. Open http://localhost:9000 in your browser

--- 

## 🛡️ License

This project is [ISC](https://opensource.org/licenses/ISC) licensed.