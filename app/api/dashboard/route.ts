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

    // Total spent this month
    const totalSpent = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0,
    );

    // Total budget this month
    const totalBudget = budgets.reduce(
      (sum, b) => sum + parseFloat(b.limit.toString()),
      0,
    );

    // Spending by category
    const byCategory = expenses.reduce(
      (acc, e) => {
        const cat = e.category;
        acc[cat] = (acc[cat] || 0) + parseFloat(e.amount.toString());
        return acc;
      },
      {} as Record<string, number>,
    );

    // Daily spending for chart (last 30 days)
    const dailySpending = expenses.reduce(
      (acc, e) => {
        const day = new Date(e.date).getDate().toString();
        acc[day] = (acc[day] || 0) + parseFloat(e.amount.toString());
        return acc;
      },
      {} as Record<string, number>,
    );

    // Total wallet balance
    const totalWalletBalance = wallets.reduce(
      (sum, w) => sum + parseFloat(w.balance.toString()),
      0,
    );

    // Recent expenses (last 5)
    const recentExpenses = expenses.slice(0, 5);

    return NextResponse.json({
      totalSpent,
      totalBudget,
      remaining: totalBudget - totalSpent,
      savingsRate:
        totalBudget > 0
          ? Math.round(((totalBudget - totalSpent) / totalBudget) * 100)
          : 0,
      byCategory,
      dailySpending,
      recentExpenses,
      totalWalletBalance,
      wallets,
      month,
      year,
      isPetsaDePeligro:
        totalBudget > 0 && (totalBudget - totalSpent) / totalBudget < 0.2,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
