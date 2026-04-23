import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db.server";
import { NextRequest, NextResponse } from "next/server";

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

    // Get budgets for current month
    const budgets = await db.budget.findMany({
      where: { userId: dbUser.id, month, year },
      orderBy: { category: "asc" },
    });

    // Get expenses this month per category
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const expenses = await db.expense.findMany({
      where: {
        userId: dbUser.id,
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Calculate spent per category
    const spentByCategory = expenses.reduce(
      (acc, e) => {
        const cat = e.category;
        acc[cat] = (acc[cat] || 0) + parseFloat(e.amount.toString());
        return acc;
      },
      {} as Record<string, number>,
    );

    // Merge budgets with spent amounts
    const budgetsWithSpent = budgets.map((b) => ({
      ...b,
      limit: parseFloat(b.limit.toString()),
      spent: spentByCategory[b.category] || 0,
      remaining:
        parseFloat(b.limit.toString()) - (spentByCategory[b.category] || 0),
      percentUsed: Math.round(
        ((spentByCategory[b.category] || 0) / parseFloat(b.limit.toString())) *
          100,
      ),
    }));

    return NextResponse.json({ budgets: budgetsWithSpent, month, year });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    const body = await req.json();
    const { category, limit } = body;

    if (!category || !limit) {
      return NextResponse.json(
        { error: "Category and limit are required" },
        { status: 400 },
      );
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Upsert — update if exists, create if not
    const budget = await db.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: dbUser.id,
          category,
          month,
          year,
        },
      },
      update: { limit: parseFloat(limit) },
      create: {
        category,
        limit: parseFloat(limit),
        month,
        year,
        userId: dbUser.id,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
