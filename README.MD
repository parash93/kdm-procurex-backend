# KDM ProcureX - Backend

A robust procurement management API built with Node.js, TypeScript, and Prisma.

## 🚀 Technology Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Web Framework**: Express 5
- **API Framework**: [tsoa](https://tsoa-community.github.io/docs/) (Auto-generated OpenAPI/Swagger routes)
- **Database**: PostgreSQL (Prisma ORM)
- **Dependency Injection**: [InversifyJS](https://inversify.io/)
- **Security**: JWT Authentication, bcryptjs, Helmet
- **Development**: nodemon, ts-node, concurrently

## 🏗️ Architecture

The backend follows a layered service-controller architecture:

1. **Controllers** (`src/controllers`): Handlers for incoming HTTP requests, built using TSOA decorators for easy routing and OpenAPI generation.
2. **Services** (`src/services`): Contain the core business logic, injected into controllers via InversifyJS.
3. **Repository/ORM** (`prisma`): Prisma ORM for type-safe database access and migrations.
4. **Middlewares**: Custom authentication and error-handling middlewares.

## 💼 Business Logic & Modules

### 1. Purchase Order (PO) Management
- **Flow**: POs are created in `DRAFT` status and move through multi-level approvals (`PENDING_L1`, `APPROVED_L1`) before being `ORDER_PLACED`.
- **Versioning**: Each PO maintains a snapshot of product details (name, sku) at the time of creation.

### 2. Multi-level Approval Workflow
- **Roles**: Approvals can be performed by Users with `ADMIN` or `OPERATIONS` roles at specific levels.
- **Decision Tracking**: Every approval decision (Approve/Reject) is logged with remarks and a timestamp.

### 3. Dispatch & Inventory System
- **Dispatches**: Suppliers create dispatches against PO items.
- **Stock Automation**: Inventory is automatically updated (`ADD`) when a dispatch is marked as `DELIVERED`.
- **Reversals**: Marking a dispatch as `RETURNED` or `CANCELLED` automatically reverses the stock (`SUBTRACT`) and releases the `dispatchedQuantity` on the PO item for re-dispatching.

### 4. Audit Logging
- Comprehensive audit trails for all critical actions (CRUD, Status Changes, Stock Updates) are stored in the `AuditLog` table.

## 📂 Project Structure

```bash
├── prisma/               # Database schema and migrations
├── src/
│   ├── controllers/      # TSOA Controllers
│   ├── services/         # Business logic services
│   ├── build/            # Auto-generated TSOA routes
│   └── server.ts         # Entry point
├── tsoa.json             # TSOA configuration
└── tsconfig.json         # TypeScript configuration
```

## 🛠️ Setup & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Configure `.env` with `DATABASE_URL` and `JWT_SECRET`.

3. **Database Sync**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Dev Server**:
   ```bash
   npm run dev
   ```

5. **API Documentation**:
   Access the Swagger UI at `http://localhost:3000/docs`.
