import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const month = searchParams.get("month") ?? "";
    const year = searchParams.get("year") ?? "";
    const sortBy = searchParams.get("sortBy") ?? "date";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const now = new Date();

    const expenses = await db.expense.findMany({
      where: {
        userId: dbUser.id,
        deletedAt: null,
        ...(category ? { category: category as any } : {}),
        ...(search
          ? {
              description: { contains: search, mode: "insensitive" as any },
            }
          : {}),
        ...(month && year
          ? {
              date: {
                gte: new Date(parseInt(year), parseInt(month) - 1, 1),
                lte: new Date(parseInt(year), parseInt(month), 0, 23, 59, 59),
              },
            }
          : {}),
      },
      orderBy:
        sortBy === "amount"
          ? { amount: sortOrder as any }
          : { date: sortOrder as any },
      include: {
        goal: { select: { id: true, name: true } },
        wallet: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json(
      expenses.map((e) => ({
        ...e,
        amount: parseFloat(e.amount.toString()),
        totalAmount: e.totalAmount
          ? parseFloat(e.totalAmount.toString())
          : null,
        yourShare: e.yourShare ? parseFloat(e.yourShare.toString()) : null,
      })),
    );
  } catch (error) {
    console.error("GET /api/expenses error:", error);
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
    const {
      amount,
      description,
      category,
      date,
      isRecurring,
      isSplit,
      totalAmount,
      splitWith,
      walletId,
      goalId,
    } = body;

    if (!amount || !description || !category) {
      return NextResponse.json(
        { error: "Amount, description and category are required" },
        { status: 400 },
      );
    }

    const parsedAmount = parseFloat(amount);

    // Create the expense
    const expense = await db.expense.create({
      data: {
        amount: parsedAmount,
        description,
        category,
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring ?? false,
        isSplit: isSplit ?? false,
        totalAmount: totalAmount ? parseFloat(totalAmount) : null,
        splitWith: splitWith ?? null,
        userId: dbUser.id,
        walletId: walletId ?? null,
        goalId: goalId ?? null,
      },
    });

    // If category is SAVINGS and a goal is selected, update goal savedAmount
    if (category === "SAVINGS" && goalId) {
      const goal = await db.savingsGoal.findUnique({
        where: { id: goalId },
      });

      if (goal && goal.userId === dbUser.id) {
        await db.savingsGoal.update({
          where: { id: goalId },
          data: {
            savedAmount: {
              increment: parsedAmount,
            },
          },
        });
      }
    }

    // If walletId provided, deduct from wallet balance
    if (walletId) {
      const wallet = await db.wallet.findUnique({
        where: { id: walletId },
      });

      if (wallet && wallet.userId === dbUser.id) {
        await db.wallet.update({
          where: { id: walletId },
          data: {
            balance: {
              decrement: parsedAmount,
            },
          },
        });
      }
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
