import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db.server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // All expenses this month
    const expenses = await db.expense.findMany({
      where: {
        userId: dbUser.id,
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { date: "desc" },
    });

    // Budgets this month
    const budgets = await db.budget.findMany({
      where: { userId: dbUser.id, month, year },
    });

    // Wallets
    const wallets = await db.wallet.findMany({
      where: { userId: dbUser.id },
    });

    // Income this month
    const incomes = await db.income.findMany({
      where: { userId: dbUser.id, month, year },
    });

    // Calculations
    const totalSpent = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0,
    );
    const totalBudget = budgets.reduce(
      (sum, b) => sum + parseFloat(b.limit.toString()),
      0,
    );
    const totalIncome = incomes.reduce(
      (sum, i) => sum + parseFloat(i.amount.toString()),
      0,
    );

    // Savings pool = income - expenses
    const savingsPool = totalIncome - totalSpent;

    // Spending by category
    const byCategory = expenses.reduce(
      (acc, e) => {
        const cat = e.category;
        acc[cat] = (acc[cat] || 0) + parseFloat(e.amount.toString());
        return acc;
      },
      {} as Record<string, number>,
    );

    // Daily spending
    const dailySpending = expenses.reduce(
      (acc, e) => {
        const day = new Date(e.date).getDate().toString();
        acc[day] = (acc[day] || 0) + parseFloat(e.amount.toString());
        return acc;
      },
      {} as Record<string, number>,
    );

    // Wallet totals
    const totalWalletBalance = wallets.reduce(
      (sum, w) => sum + parseFloat(w.balance.toString()),
      0,
    );

    // Recent expenses
    const recentExpenses = expenses.slice(0, 5);

    // Payday countdown
    const today = now.getDate();
    let daysUntilPayday: number | null = null;
    if (dbUser.payday || dbUser.payday2) {
      const paydays = [dbUser.payday, dbUser.payday2]
        .filter(Boolean)
        .map(Number)
        .sort((a, b) => a - b);

      const nextPayday = paydays.find((d) => d > today);
      if (nextPayday) {
        daysUntilPayday = nextPayday - today;
      } else {
        // Next payday is next month
        daysUntilPayday =
          paydays[0] + (new Date(year, month, 0).getDate() - today);
      }
    }

    // Petsa de Peligro
    const isPetsaDePeligro =
      totalBudget > 0 && (totalBudget - totalSpent) / totalBudget < 0.2;

    return NextResponse.json({
      totalSpent,
      totalBudget,
      totalIncome,
      savingsPool,
      remaining: totalBudget - totalSpent,
      savingsRate:
        totalIncome > 0 ? Math.round((savingsPool / totalIncome) * 100) : 0,
      byCategory,
      dailySpending,
      recentExpenses,
      totalWalletBalance,
      wallets,
      isPetsaDePeligro,
      daysUntilPayday,
      month,
      year,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
