# BudgetBuddy 💰

BudgetBuddy is an AI-Native Advanced Personal Finance Tracker AKA Wealth Management Application that helps users manage expenses and savings effectively. Built with modern web technologies, it offers a seamless experience for tracking financial transactions and generating insightful reports.

[![BudgetBuddy Dashboard Preview](https://res.cloudinary.com/djkqo49ip/image/upload/v1775292690/Dark_tkiyfr.png)](https://budget-buddy-lovat.vercel.app/)

## 🌟 What's New

### 🎯 Smarter Budgeting

Take control of your monthly spend limits with completely overhauled planning tools.

- **✨ Auto-Suggest Budgets**: Sick of manual entry? Calculate a rolling 3-month average for your typical categories instantly. It even smartly recommends a 5% reduction on discretionary/luxury categories to quietly enforce saving.
- **📅 Multi-Month Grid View**: Toggle to an Excel-like annual layout to plan ahead for Christmas in July or annual car insurance premiums, side-by-side with your active card view.
- **🧹 End-of-Month Savings Sweep**: Don't let your unspent budget vanish! A smart banner detects unused funds at the end of the month and helps you "sweep" them directly into your savings goals.

### 🏛️ Legacy Vault

Secure your digital heritage and emergency information with bank-grade PIN protection.

- **PIN-Based Access**: Multi-layered security with a dedicated PIN overlay for sensitive data.
- **Digital Heritage**: Store insurance, legal, crypto, and medical records securely.
- **Beneficiary Management**: Designate trusted contacts to access your vault in case of emergencies.
- **Categorized Security**: Organize sensitive information with custom sensitivity levels and categories.

### 👨‍👩‍👧‍👦 Collaborative Workspaces (Family Mode)

Manage finances together in isolated, shared environments with role-based access control.

- **Multiple Workspaces**: Create separate workspaces for Family, Business, or Personal use.
- **Role-Based Access Control**: Invite members via email with specific roles (Admin, Editor, Viewer).
- **Real-Time Activity Feed**: Track exactly who added, edited, or deleted transactions within the workspace.
- **Workspace-Scoped Data**: Transactions, budgets, categories, and analytics are securely isolated per workspace.

### 📱 Omnipresent Chat Bots (Slack, Discord & Telegram)

Manage your finances entirely from your favorite chat apps with 100% feature parity between Slack, Discord, and Telegram.

- **Multi-Modal Receipt Scanning**: Snap a photo of a receipt or invoice and send it to the bot. Groq Vision instantly extracts the vendor, amount, and category.
- **Whisper Voice Logging**: Just hold the microphone button and say "I spent 50 on an Uber". The AI perfectly transcribes and logs it.
- **Interactive UI Flows**: The bots reply with native interactive buttons (Add Notes, Tags, Splits) that trigger seamless modal popups directly inside Slack, Discord, and Telegram.
- **AI Financial Advisor with TTS**: Ask the bot for financial advice (`/chat`) and it will generate a personalized response, complete with an **AI Voice Note (TTS)** reply that plays right in the chat.
- **Smart Bill Reminders**: A background cron job checks your upcoming bills and securely DMs you a reminder 24 hours in advance on your linked Slack, Discord, or Telegram account.

### 🔗 3rd-Party App Integrations (Splitwise & Notion)

Connect your favorite tools and let the background sync engines do the heavy lifting.

- **Splitwise OAuth Flow**: Securely connect Splitwise to BudgetBuddy without copy-pasting API keys.
- **Dynamic Bill Splitting**: Select your actual Splitwise friends from a dropdown when creating a transaction, and watch the background engine push the expense directly to Splitwise.
- **Automated Settlement Sync**: A background cron job silently polls Splitwise every 4 hours, automatically logging settled debts back into BudgetBuddy as Income!
- **Notion Database Sync**: Set up a seamless one-way sync to your personal Notion databases. Watch your transactions automatically populate your Notion workspaces as soon as you log them.

### 🔌 Universal Webhooks (Zapier & Apple Shortcuts)

Build custom automation pipelines without writing a single line of code.

- **Unique Inbound URLs**: Generate a secure, user-specific webhook endpoint directly from your dashboard.
- **No-Code Extensibility**: Paste your webhook URL into Zapier, Make.com, IFTTT, or Apple Shortcuts to automate expense logging.
- **Multi-Modal Parsing**: The webhook accepts structured JSON, raw text ("I spent $5 on coffee"), or even image URLs (receipts), parsing them intelligently via Groq AI.
- **Enterprise-Grade Hardening**: Protected against SSRF and DoS attacks with strict 5MB payload limits and active protocol validation.
- **Live Activity Logs**: View a real-time dashboard of all incoming webhook requests, their payloads, and success/failure statuses.

### 🤖 LangGraph Agentic Financial Command Center

BudgetBuddy is powered by a network of **Autonomous LangGraph Agents**. It's not just a stateless chatbot; it's a proactive intelligence engine with persistent memory and tool execution capabilities.

#### 🧠 The Agent Ecosystem

- **Smart Receipt & Bill Splitter**: Snap a photo of a restaurant receipt. The agent uses multimodal AI to extract items, detects if it was a group meal, and autonomously asks if you'd like to split it—pushing the exact owed amounts directly to Splitwise or your internal debts.
- **End-of-Year Tax Auditor**: Trigger `/taxaudit` to spin up a specialized agent that loops through your entire year of transactions. It flags borderline items (like a laptop purchase), asks you for business/personal clarification via Telegram, and generates a clean PDF report for your accountant.
- **Savings Goal Planner**: Tell the agent you want to save for a vacation. It uses web search tools to find current flight and hotel costs, calculates a realistic target amount, and sets up a step-by-step milestone plan.
- **Gamified Wealth Challenger**: Type `/challenge` and the Game Master agent will analyze your recent spending weak spots (e.g., dining out) and propose a tailored, time-bound challenge. It monitors your transactions in the background and awards XP if you succeed!
- **"Good Cop / Bad Cop" Monthly Reviews**: Two interacting agents evaluate your monthly spending dynamically, providing engaging and memorable financial feedback.
- **Subscription Negotiator**: The agent analyzes your recurring transactions, spots unused subscriptions, and drafts cancellation emails or guides you through the cancellation flow.

#### 🎮 Gamification & Engagement

- **Dynamic Wealth Challenges**: Autonomous agents propose custom challenges based on your actual spending data.
- **Streak Tracking**: Stay motivated with **Budget Adherence Streaks** and level up your financial discipline 🔥.
- **Achievement System**: Unlock literal achievements for hitting milestones and completing AI challenges, celebrated with **Dynamic Confetti** explosions 🎊.

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
- **Legacy Vault**: A secure sanctuary for your digital heritage, crypto keys, and medical records.

### 🛡️ Advanced Security & Heritage

- **PIN-Protected Access**: Secure sensitive vault data with a dedicated, multi-layered PIN system.
- **Beneficiary Trust**: Designate trusted contacts to access your vital information in case of emergencies.
- **Privacy Mode**: Instantly mask sensitive numbers and balances for safe use in public spaces.
- **Bank-Grade Encryption**: Your financial data is protected with industry-leading security protocols.

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

## 📊 Database Schema

BudgetBuddy utilizes a robust relational schema designed for workspace isolation and detailed financial tracking.

![BudgetBuddy Database Schema](BudgetBuddy_Schema.svg)

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Motion**: [Framer Motion](https://www.framer.com/motion/) (Fluid Animations & Drag-and-Drop layouts)
- **State/Fetching**: [TanStack Query v5](https://tanstack.com/query/latest) (Server state synchronization), [Zustand](https://github.com/pmndrs/zustand) (Client UI state management)
- **Visualization**: [Recharts](https://recharts.org/) (Interactive analytics & simulations)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utilities**: [date-fns](https://date-fns.org/), [React CountUp](https://www.npmjs.com/package/react-countup)
- **UI Components**: [cmdk](https://cmdk.paco.me/) (Command Menu), [Sonner](https://sonner.emilkowal.ski/) (Toast alerts), [Vaul](https://vaul.emilkowal.ski/) (Drawer overlays), [Emoji Mart](https://www.npmjs.com/package/emoji-mart), [React Markdown](https://react-markdown.github.io/) (Rich chatbot replies), [React Day Picker](https://react-day-picker.js.org/) (Date filters), [Input OTP](https://input-otp.pacocoursey.com/) (PIN verification), [Embla Carousel](https://www.embla-carousel.com/) (Sliders)
- **Effects**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Utilities**: [QRCode React](https://www.npmjs.com/package/qrcode.react)

### Backend & Database

- **Database**: [PostgreSQL](https://www.postgresql.org/) (hosted via [Neon Serverless](https://neon.tech/))
- **ORM**: [Prisma ORM](https://www.prisma.io/)
- **Auth**: [Clerk](https://clerk.com/) (Secure Workspace Isolation & Role-based authentication)
- **File Storage**: [UploadThing](https://uploadthing.com/) & [Cloudinary](https://cloudinary.com/) (Receipt image hosting & preview)
- **Data Export/Import**: [jspdf](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) (PDF reports), [export-to-csv](https://www.npmjs.com/package/export-to-csv) & [papaparse](https://www.npmjs.com/package/papaparse) (CSV files)
- **Validation**: [Zod](https://zod.dev/)
- **Mailing**: [SendGrid](https://sendgrid.com/) & [Resend](https://resend.com/) (Notification engine & Invite delivery)

### AI & Agentic Orchestration

- **Agent Framework**: [LangGraph JS](https://js.langchain.com/docs/concepts/langgraph/) (`@langchain/langgraph`) - State-based graph orchestration for autonomous multi-agent workflows (Tax Auditor, Receipt Scanner, Wealth Challenger, etc.) with persistent session states.
- **AI Infrastructure**: [LangChain](https://js.langchain.com/docs/introduction/) (`@langchain/core`, `@langchain/community`) - Prompt builders, tool binding wrappers, and agent integrations.
- **AI Models**: 
  - **Groq SDK** (Llama 3.3 70B Versatile for core agents; Llama 3.2 Vision for receipt image parsing)
  - **OpenRouter** (Gemini 2.0 Flash for strategic visual simulation & advice generation)
- **Web Search Tools**: [Tavily AI Search API](https://tavily.com/) - Integrated agent search tool for real-time cost auditing (flights, hotels, etc.).
- **Voice Transcription**: [Groq Whisper (whisper-large-v3-turbo)](https://groq.com/) - Ultra-fast voice logging processing.
- **Voice Synthesis (TTS)**: [Google TTS](https://translate.google.com) - Empathetic audio replies for chatbot / Drive Mode.

### Third-Party Integrations

- **Splitwise API**: Secure OAuth 2.0 synchronization, dynamic user split assignments, and automatic background settlement matching.
- **Notion SDK**: Automated one-way syncing of transactions straight into the user's Notion databases.
- **Telegram Bot**: Native webhook handling with persistent session states, custom sentiment routing, Drive Mode conversational replies, and inline callback menus.
- **Discord Bot**: Slash command webhook handler (`discord-interactions`) for chatbot query parity.
- **Slack Bot**: Native events subscription and interactive modal feedback endpoints.

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
   # Database (PostgreSQL / Neon)
   DATABASE_URL="postgresql://user:pass@localhost:5432/budgetbuddy"

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   # AI & Agents Configuration
   GROQ_API_KEY=gsk_...
   OPENROUTER_API_KEY=sk-or-...
   TAVILY_API_KEY=tvly-...

   # Email Providers (SendGrid & Resend)
   SENDGRID_API_KEY=SG....
   RESEND_API_KEY=re_...
   EMAIL_FROM=hello@budgetbuddy.app

   # Telegram Bot Integration
   TELEGRAM_BOT_TOKEN=...

   # Discord Bot Integration
   DISCORD_BOT_TOKEN=...
   DISCORD_PUBLIC_KEY=...
   DISCORD_APP_ID=...

   # Slack Bot Integration
   SLACK_CLIENT_ID=...
   SLACK_CLIENT_SECRET=...
   SLACK_SIGNING_SECRET=...

   # Splitwise OAuth Integration
   SPLITWISE_CLIENT_ID=...
   SPLITWISE_CLIENT_SECRET=...

   # UploadThing & Cloudinary Assets (Optional)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   UPLOADTHING_TOKEN=...
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
