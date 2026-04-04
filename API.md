# BudgetBuddy API Reference 🚀

BudgetBuddy is built with a developer-first approach, offering a comprehensive suite of APIs for financial tracking, workspace collaboration, and AI-driven analysis. All endpoints are secured via **Clerk** and enforce **Role-Based Access Control (RBAC)**.

---

## 🔐 Security & User Management

### Authentication
- All requests must include a valid **Clerk Session Token**.
- Scoped to the `active_workspace_id`.
- Handled primarily by Next.js Middleware.

### Vault & Privacy
- **POST `/api/vault/pin`**: Set or verify your secure access PIN.
- **GET `/api/vault`**: List encrypted sensitive records (Insurance, Crypto, etc.).
- **POST `/api/vault/dms`**: Configure the "Dead Man's Switch" for emergency access.
- **GET `/api/vault/beneficiaries`**: Manage trusted contacts for emergency data inheritance.

---

## 📊 Dashboard & Performance

### 1. Stats & Summaries
- **GET `/api/stats`**: Monthly overview with balance, income, expense, and investment totals.
- **GET `/api/stats/balance`**: Real-time net balance across all accounts and assets.
- **GET `/api/stats/trends`**: Time-series data comparing current vs. previous period performance.
- **GET `/api/stats/top-categories`**: Identification of highest-spending categories.
- **GET `/api/overview/summary`**: Weighted summary cards for the dashboard header.

### 2. Historical Data
- **GET `/api/history-data`**: Aggregated history for charting (Daily/Monthly/Yearly granularity).
- **GET `/api/History-period`**: Available years/months that contain transaction data.

---

## 💸 Transaction Engine

### 1. Searching & Retrieval
- **GET `/api/transactions/search`**: Advanced multi-layer filtering with **pagination**.
  - **Query Params**: `query`, `type`, `category`, `tags`, `minAmount`, `maxAmount`, `from`, `to`, `page`, `pageSize`
  - **Response**: Returns a `transactions` array and a `pagination` metadata object.
- **GET `/api/transactions/recent`**: Quick access to the last 10 workspace activities.
- **GET `/api/transactions/deleted`**: Retrieval of soft-deleted records for audit or restoration.

### 2. Import & Management
- **POST `/api/transactions/import`**: Bulk ingestion of financial data (CSV/Receipt Extract).
- **GET `/api/transaction-history`**: Audit trail of every modification made to a specific record.
- **POST `/api/attachments`**: Secure file upload for receipts and documentation.

---

## 💰 Assets & Net Worth
- **GET / POST `/api/assets`**: Manage cash, stocks, and liabilities.
- **GET `/api/net-worth`**: Calculation of total equity based on current asset valuations and liabilities.

---

## 🎯 Goals & Budgets
- **GET / POST `/api/savings-goals`**: Track progress towards financial milestones with automated percentage calculations.
- **GET / POST `/api/budgets`**: Set and monitor category-specific spending limits.
- **GET `/api/gamification`**: Achievement and streak tracking endpoints for user engagement.

---

### 👨‍👩‍👧‍👦 Workspace & Social
- **GET `/api/activities`**: Live workspace event feed enriched with user data. Supports **pagination**.
  - **Query Params**: `page`, `pageSize`
- **GET / POST `/api/manage`**: Invitation management, role updates (`ADMIN`, `EDITOR`, `VIEWER`), and member removal.

---

## 🧠 AI Financial Intel (Advanced)
- **POST `/api/forecasting`**: Smart prediction engine for end-of-month financial state.
- **GET `/api/persona`**: AI personality configuration (Squirrel, Owl, Fox, Peacock).
- **POST `/api/analytics`**: Deep-dive spend analysis and anomaly detection.

---

## 🛡️ Implementation Standards

### Soft Deletion
Most financial records implement a **Soft Delete** pattern.
- Database records include a `deletedAt` field.
- Logic is implemented at the **Service Layer** to ensure no data is permanently lost unless explicitly cleared.

### Role Enforcement
- **VIEWER**: Read-only access to all dashboards and records.
- **EDITOR**: Can manage transactions, assets, and goals.
- **ADMIN**: Full control over workspace settings, billing, and member roles.

### Error Codes
- `400`: Zod Validation Error.
- `403`: RBAC Permission Denied.
- `404`: Workspace or Record not found.
- `429`: Rate Limit Exceeded.
