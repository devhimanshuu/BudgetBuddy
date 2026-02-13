# BudgetBuddy 💰

BudgetBuddy is a modern personal finance tracker designed to help you master your financial life. Built with **Next.js 15**, it combines powerful analytics with a seamless, stunning user experience to make money management effortless.

[![BudgetBuddy Dashboard Preview](https://res.cloudinary.com/dbonhpuvh/image/upload/f_auto,q_auto:best,w_2000,c_limit,e_sharpen:100,e_improve/v1770181853/dashboard-dark_ocosok.png)](https://budget-buddy-lovat.vercel.app/)

## 🌟 What's New

### 🤖 AI Financial Command Center

BudgetBuddy features a world-class **AI Financial Analyst** that evolves with your spending habits. It's not just a chatbot; it's a proactive intelligence engine.

#### 🧠 Smart Insights & Intelligence

- **Anomaly Detection**: Automatically scans your history to flag unusual spending spikes with **Smart Alerts** ⚠️.
- **Predictive Forecasting**: Projects your end-of-month spending vs. budget with **Confidence Scores** 🔮.
- **Automated Recaps**: Daily and Weekly summaries that track trends, savings growth, and provide actionable **Budget Buddy Tips** 🗓️.
- **Persona-Driven Advice**: Adapts its personality based on your behavior—meet the **Squirrel** (Saver), **Peacock** (Spender), **Owl** (Strategist), or **Fox** (Balanced).

#### 🎮 Gamification & Engagement

- **Streak Tracking**: Stay motivated with **Budget Adherence Streaks** and level up your financial discipline 🔥.
- **Achievement System**: Unlock literal achievements for hitting milestones, celebrated with **Dynamic Confetti** explosions 🎊.

#### 🎙️ Voice & Accessibility

- **Voice-to-Action**: "Add $50 for coffee" — speak naturally and watch the AI execute actions instantly 🎤.
- **Auto-Execution**: Voice commands trigger real-time transactions and tool calls without pressing "Send".
- **Text-to-Speech**: Professional voice narration for all AI insights and responses.

#### 📊 Interactive Living UI

The AI embeds functional, reactive components directly in your chat:

- **Budget Adjuster**: Modify your monthly limits inline with increment/decrement controls.
- **Transaction Cards**: Instant access to Edit/Delete transactions within the chat flow.
- **Goal Progress**: Visualized milestones for savings goals with celebration badges.
- **Rich Visualizations**: Interactive Bar Charts, Pie Charts, Heatmaps, and Trend Lines.

#### 📄 Professional Documentation

- **Export PDF Report**: Instantly generate and download a professional-grade PDF of your chat history and financial insights with one click.

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
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utilities**: [date-fns](https://date-fns.org/), [React CountUp](https://www.npmjs.com/package/react-countup)
- **UI Components**: [cmdk](https://cmdk.paco.me/), [Sonner](https://sonner.emilkowal.ski/), [Vaul](https://vaul.emilkowal.ski/), [Emoji Mart](https://www.npmjs.com/package/emoji-mart)
- **Effects**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

### Backend

- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Prisma ORM](https://www.prisma.io/))
- **Auth**: [Clerk](https://clerk.com/) (Secure User Management)
- **AI Models**: [Groq (Llama 3.3)](https://groq.com/), [OpenRouter (GPT-4o)](https://openrouter.ai/)
- **File Uploads**: [UploadThing](https://uploadthing.com/)
- **Data Export**: [jspdf](https://github.com/parallax/jsPDF), [export-to-csv](https://www.npmjs.com/package/export-to-csv)
- **Validation**: [Zod](https://zod.dev/)

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** Database URL (Local or Cloud e.g., Neon, Supabase)
- **Clerk** Account (Public/Secret Keys)

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
