
# BudgetBuddy 💰

BudgetBuddy is a modern, feature-rich personal finance tracker designed to help you take control of your financial life. Built with the latest web technologies, it offers a seamless and aesthetically pleasing experience for managing your expenses, savings, and budgets.

## 🚀 Key Features

### 📊 Financial Management
- **Expense & Income Tracking**: Log, categorize, and monitor your daily financial transactions with ease.
- **Budgeting**: Create and manage monthly budgets to keep your spending in check.
- **Savings Goals**: Set specific financial milestones (e.g., "Vacation Fund") and track your progress in real-time.
- **Multi-Currency Support**: Seamlessly handle transactions in various currencies with real-time conversion rates.

### 📈 Analytics & Insights
- **Interactive Dashboard**: Get a high-level overview of your finances with dynamic charts and graphs.
- **Detailed Reports**: Analyze your spending habits over time with filtering by category, period, or type.
- **Period History**: Compare your financial performance across different timeframes (Weekly, Monthly, Yearly).
- **Export Data**: Download your financial data in **CSV** or **PDF** formats for offline analysis.

### ⚡ User Experience & Aesthetics
- **Modern UI/UX**: Built with **Shadcn UI** and **Glassmorphism** elements for a premium look and feel.
- **Dark/Light Mode**: Fully supported theme switching to suit your preference.
- **Responsive Design**: Optimized for all devices, ensuring a smooth experience on desktop, tablet, and mobile.
- **Quick Add Widget**: Fast and accessible widget to log transactions on the go.
- **Command Palette**: Quickly navigate the app or perform actions using a keyboard-centric command menu.

### 🔒 Security & Performance
- **Secure Authentication**: Powered by **Clerk** to ensure your data is private and secure.
- **Real-Time Updates**: Leverages **React Query** for instant data synchronization and optimistic UI updates.
- **Efficient Backend**: Built on **Prisma** and **PostgreSQL** for reliable data storage and retrieval.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [React CountUp](https://www.npmjs.com/package/react-countup)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Charts**: [Recharts](https://recharts.org/)

### Backend
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **API**: Next.js Server Actions & API Routes

### Authentication & Tools
- **Auth**: [Clerk](https://clerk.com/)
- **File Uploads**: [UploadThing](https://uploadthing.com/)
- **PDF Generation**: [jspdf](https://github.com/parallax/jsPDF)
- **CSV Export**: [export-to-csv](https://www.npmjs.com/package/export-to-csv)
- **Date Handling**: [date-fns](https://date-fns.org/)

---

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v18.x or later)
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** (Local instance or cloud provider like Neon/Supabase)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devhimanshuu/BudgetBuddy.git
   cd BudgetBuddy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   # Database connection string
   DATABASE_URL="postgresql://username:password@localhost:5432/budgetbuddy?schema=public"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Clerk URLs
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/wizard
   ```

4. **Initialize the Database:**
   Push the Prisma schema to your database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve BudgetBuddy, please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 📬 Contact

Created by [Himanshu Gupta](https://www.linkedin.com/in/himanshu-guptaa/) - feel free to reach out!

- **Twitter**: [@devhimanshuu](https://twitter.com/devhimanshuu)
- **Email**: devhimanshuu@gmail.com
- **Blog**: [TechSphere](https://techsphere.hashnode.dev/)
