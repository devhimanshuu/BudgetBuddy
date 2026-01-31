# BudgetBuddy 💰

BudgetBuddy is a modern, AI-powered personal finance tracker designed to help you master your financial life. Built with **Next.js 15** and **Google Gemini**, it combines powerful analytics with a seamless, stunning user experience to make money management effortless.

## 🌟 What's New

### 🤖 AI Financial Analyst

Unlock personalized financial insights with our **Gemini-powered AI Assistant**.

- **Context-Aware**: Understands your transactions, budgets, and savings goals.
- **Interactive Chat**: Ask questions like "How much did I spend on food this month?" or "Can I afford a vacation?".
- **Draggable Interface**: A floating, draggable chat window that stays with you but never gets in the way.

### ⚡ Smart User Interface

- **Draggable Quick Actions**: A floating "Quick Add" widget that you can move anywhere on the screen for easy access on mobile or desktop.
- **Command Palette (`Cmd+K`)**: Navigate the entire app or trigger actions (like "New Expense" or "Open AI Chat") instantly with your keyboard.
- **Visual Finance Calendar**: View your spending habits day-by-day in an intuitive calendar view.

---

## 🚀 Key Features

### 📊 Comprehensive Money Management

- **Transaction Tracking**: Log income and expenses with smart categorization.
- **Budgeting**: Create monthly budgets for specific categories and get alerted when you're close to limits.
- **Savings Goals**: specific financial milestones (e.g., "New Car") and track contribution progress.
- **Asset Tracking**: Monitor your net worth by tracking assets alongside your cash flow.

### 📈 Deep Analytics & Insights

- **Real-time Dashboard**: Interactive charts showing cash flow, spending trends, and category breakdowns.
- **Comparative History**: Analyze period-over-period performance (Weekly, Monthly, Yearly).
- **Multi-Currency**: Full support for global currencies with user-selectable display formats.
- **Data Export**: Download your complete financial history in **CSV** or **PDF** formats.

### 🎨 Premium Design

- **Glassmorphism UI**: A sleek, modern interface built with **Shadcn UI** and translucency effects.
- **Theme Customization**: Switch between light/dark modes and customize primary colors.
- **Fully Responsive**: Optimized experience for phones, tablets, and large desktop screens.
- **Offline Mode**: Visual indicators and safe-guards for when you lose connectivity.

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Motion**: [Framer Motion](https://www.framer.com/motion/) (Animations & Drag-and-Drop)
- **State/Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **Visualization**: [Recharts](https://recharts.org/)

### Backend & AI

- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Prisma ORM](https://www.prisma.io/))
- **Auth**: [Clerk](https://clerk.com/) (Secure User Management)
- **AI Model**: [Google Gemini 1.5 Flash](https://deepmind.google/technologies/gemini/) (via `@google/genai`)
- **Validation**: [Zod](https://zod.dev/)

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** Database URL (Local or Cloud e.g., Neon, Supabase)
- **Clerk** Account (Public/Secret Keys)
- **Google AI Studio** API Key (for Chat features)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/devhimanshuu/BudgetBuddy.git
   cd BudgetBuddy
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://user:pass@localhost:5432/budgetbuddy"

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   # AI (Google Gemini)
   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
   ```

4. **Initialize Database:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/NewThing`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

---

## 📬 Contact

Created by [Himanshu Gupta](https://www.linkedin.com/in/himanshu-guptaa/).

- **Twitter**: [@devhimanshuu](https://twitter.com/devhimanshuu)
- **Email**: devhimanshuu@gmail.com
