
# BudgetBuddy

BudgetBuddy is a personal finance tracker that helps users manage expenses and savings effectively. Built with modern web technologies, it offers a seamless experience for tracking financial transactions and generating insightful reports.

## Features

- **Expense Tracking**: Log daily expenses and categorize them for easy management.
- **Savings Goals**: Set and track savings goals with real-time updates.
- **Data Visualization**: Interactive charts and graphs to visualize your financial data.
- **Secure Authentication**: User accounts secured with Clerk authentication.

## Tech Stack

- **Frontend**: Next.js, Shadcn/ui, React, TypeScript
- **State Management**: React Query
- **Backend**: Prisma, PostgreSQL
- **Authentication**: Clerk
- **Visualization**: Recharts

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v14.x or later)
- npm or yarn
- PostgreSQL (v12.x or later)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/BudgetBuddy.git
   cd BudgetBuddy
   ```

2. **Install dependencies:**

   Using npm:
   ```bash
   npm install
   ```

   Using yarn:
   ```bash
   yarn install
   ```

3. **Setup the environment variables:**

   Create a `.env` file in the root directory and add the following:

   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/budgetbuddy
   NEXT_PUBLIC_CLERK_FRONTEND_API=<your_clerk_frontend_api>
   CLERK_API_KEY=<your_clerk_api_key>
   ```

   Replace the placeholders with your PostgreSQL and Clerk credentials.

4. **Migrate the database:**

   ```bash
   npx prisma migrate dev
   ```

5. **Run the development server:**

   ```bash
   npm run dev
   ```

   or

   ```bash
   yarn dev
   ```

   Your app should now be running on [http://localhost:3000](http://localhost:3000).

## Usage

- **Add Transactions**: Navigate to the "Transactions" page to log new expenses or income.
- **View Reports**: Use the "Reports" page to visualize your spending and savings trends.
- **Manage Account**: Access the "Account" page to update your profile and manage your budget.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-branch-name`
5. Submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


