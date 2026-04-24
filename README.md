# Gastos — Personal Budget & Finance Tracker

> _Gastos_ is Filipino for _expenses_

A full-stack personal finance web application built for solo living in Manila, Philippines. Track daily expenses, set monthly budgets, monitor savings goals, manage wallet balances, and get AI-powered financial insights from **Peso Buddy** — a Manila-aware finance assistant.

---

## ✨ Features

- **Expense Tracking** — Log daily expenses with categories, descriptions, dates, and recurring flags
- **Quick-Add Buttons** — One-tap preset buttons for common Manila expenses (Jeepney ₱13, Siomai Rice ₱50, Grab ₱80)
- **Split Billing** — Track shared bills and log only your share
- **Monthly Budgets** — Set spending limits per category with color-coded progress bars
- **Budget Hints** — See remaining budget when logging an expense
- **Wallet Tracking** — Manage GCash, Maya, Cash, Credit Card, and Bank balances with auto-deduction
- **Savings Goals** — Set targets with deadlines, track progress, and link savings expenses directly to goals
- **Peso Buddy AI** — Chat with a Manila-aware AI assistant powered by Groq (LLaMA 3.3 70B)
- **Petsa de Peligro Mode** — Automatic alert when your budget is critically low
- **Onboarding Wizard** — 3-step setup with AI-powered budget suggestions based on your income
- **Dark Mode** — Full dark/light mode support with localStorage persistence
- **Semi-Monthly Payday** — Supports dual payday dates (e.g. 5th and 20th of the month)

---

## 🛠️ Tech Stack

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Frontend   | Next.js 16 + TypeScript              |
| UI Library | Mantine UI v9                        |
| Icons      | Tabler Icons React                   |
| Database   | PostgreSQL 18                        |
| ORM        | Prisma 7 + @prisma/adapter-pg        |
| Auth       | NextAuth.js v4 (Google OAuth)        |
| AI         | Groq API — LLaMA 3.3 70B (free tier) |
| Charts     | Mantine Charts (Recharts)            |

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 18
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/gastos.git
cd gastos

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Push schema to database
npx prisma db push
npx prisma generate

# 5. Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/gastos"
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GROQ_API_KEY="your-groq-api-key"
```

---

## Project Structure

```
gastos/
├── app/
│   ├── (auth)/login/          Login page
│   ├── (dashboard)/           Protected dashboard routes
│   │   ├── dashboard/         Main dashboard + charts
│   │   ├── expenses/          Expense logger + list
│   │   ├── budgets/           Monthly budget settings
│   │   ├── wallets/           Wallet balance tracker
│   │   ├── goals/             Savings goals
│   │   └── ai/                Peso Buddy AI chat
│   ├── api/                   REST API routes
│   └── onboarding/            3-step setup wizard
├── components/
│   ├── ui/                    Shared UI components
│   │   ├── CategoryIcon.tsx   Category icons + colors
│   │   ├── WalletIcon.tsx     Wallet icons + types
│   │   └── MantineAppProvider.tsx
│   ├── expenses/              ExpenseForm component
│   └── ai/                    AIChat component
├── lib/
│   ├── db.server.ts           Prisma client singleton
│   └── auth.ts                NextAuth configuration
└── prisma/
    └── schema.prisma          Database schema
```

---

## Database Schema

Five models: **User**, **Expense**, **Budget**, **SavingsGoal**, **Wallet**

Key design decisions:

- `Decimal` (not Float) for all monetary fields — prevents rounding errors
- `deletedAt` soft delete on Expense — users can recover deleted entries
- `goalId` FK on Expense — links savings expenses directly to goals
- `walletId` FK on Expense — auto-deducts wallet balance on expense log

---

## Peso Buddy AI

Peso Buddy is powered by Groq's free LLaMA 3.3 70B model. It reads your last 30 expenses, current budgets, savings goals, and wallet balances before responding. The system prompt is designed specifically for Metro Manila:

- Knows local stores by price: Palengke < Puregold < SM < Robinsons < S&R
- Knows food options: Carinderia < Jollibee < casual restaurants < BGC restaurants
- Knows transport costs: Jeepney (₱13-25) < MRT < Grab
- Activates strict "tipid" mode during Petsa de Peligro
- Responds warmly with occasional Filipino words (tipid, sulit, kaya natin)

---

## Planned Features (Week 3+)

- [ ] Income tracking — log variable semi-monthly income
- [ ] Savings Pool — income minus expenses = savings pool with goal allocation
- [ ] Payday countdown on dashboard
- [ ] Expense filters and search
- [ ] Soft delete Trash page
- [ ] Monthly comparison charts
- [ ] Recurring expense automation
- [ ] Export to CSV
- [ ] Receipt parsing via Groq vision API
- [ ] Deploy to Vercel

---
