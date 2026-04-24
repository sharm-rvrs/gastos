import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

    const { monthlyIncome, payday, payday2, budgets, wallets } =
      await req.json();

    // Update user
    await db.user.update({
      where: { id: dbUser.id },
      data: {
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        payday: payday ?? null,
        payday2: payday2 ?? null,
        onboardingDone: true,
      },
    });

    // Create budgets
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    for (const budget of budgets) {
      await db.budget.upsert({
        where: {
          userId_category_month_year: {
            userId: dbUser.id,
            category: budget.category,
            month,
            year,
          },
        },
        update: { limit: parseFloat(budget.limit) },
        create: {
          category: budget.category,
          limit: parseFloat(budget.limit),
          month,
          year,
          userId: dbUser.id,
        },
      });
    }

    // Create wallets
    const WALLET_ICONS: Record<string, string> = {
      CASH: "💵",
      GCASH: "💙",
      MAYA: "💚",
      CREDIT_CARD: "💳",
      DEBIT_CARD: "🏧",
      BANK: "🏦",
      OTHER: "📦",
    };

    const WALLET_COLORS: Record<string, string> = {
      CASH: "green",
      GCASH: "blue",
      MAYA: "teal",
      CREDIT_CARD: "grape",
      DEBIT_CARD: "orange",
      BANK: "cyan",
      OTHER: "gray",
    };

    for (const wallet of wallets) {
      await db.wallet.create({
        data: {
          name: wallet.name || wallet.type,
          type: wallet.type,
          balance: parseFloat(wallet.balance) || 0,
          icon: WALLET_ICONS[wallet.type] ?? "📦",
          color: WALLET_COLORS[wallet.type] ?? "gray",
          userId: dbUser.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/user/onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
