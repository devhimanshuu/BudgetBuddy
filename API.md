# BudgetBuddy API Documentation

Welcome to the BudgetBuddy API documentation. This document provides a comprehensive guide to consuming our backend services.

## Base URL
The API is served under the `/api` prefix of the application.

## Authentication
Most endpoints require authentication via Clerk. Ensure you are logged in or provide a valid Clerk session token in your requests.

---

## Transactions API

### 1. Search Transactions
`GET /api/transactions/search`

Search and filter transactions with pagination.

**Query Parameters:**
| Parameter | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `query` | string | Full-text search on description and notes | - |
| `tags` | string | Comma-separated list of Tag IDs | - |
| `category` | string | Filter by category name | - |
| `type` | string | `income`, `expense`, or `investment` | - |
| `minAmount`| number | Minimum amount | - |
| `maxAmount`| number | Maximum amount | - |
| `from` | date | Start date (ISO format) | - |
| `to` | date | End date (ISO format) | - |
| `page` | number | Page number | `1` |
| `pageSize` | number | Records per page | `100` |

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "description": "Coffee",
      "amount": 5.50,
      "formattedAmount": "$5.50",
      "type": "expense",
      "category": "Food",
      "date": "2024-03-20T10:00:00Z",
      "tags": [...],
      "attachments": [...],
      "splits": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 100,
    "totalCount": 125,
    "totalPages": 2
  }
}
```

### 2. Get Transaction History
`GET /api/transaction-history`

Retrieve historical transaction data within a date range.

### 3. Deleted Transactions (Trash Bin)
`GET /api/transactions/deleted`

Retrieve soft-deleted transactions available for recovery.

---

## Stats & Analytics API

### 1. Dashboard Summary
`GET /api/dashboard/summary`

Returns top-level stats (total income, expense, balance) for a specific date range.

### 2. Category Details
`GET /api/analytics/category-details`

Returns deep-dive analytics for specific categories.

---

## Workspace API

### 1. Get Active Workspace
`GET /api/workspaces/active`

Returns the current user's active workspace.

---

## AI & Gamification

### 1. AI Nudge
`GET /api/ai/nudge`

Get personalized financial advice based on recent spending patterns.

### 2. Achievements
`GET /api/achievements`

List earned and pending achievements for the current user.

---

## Error Handling
The API uses standard HTTP status codes:
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource does not exist
- `500 Internal Server Error`: Server-side failure
