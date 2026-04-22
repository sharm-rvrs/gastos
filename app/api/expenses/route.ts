import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db.server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/expenses - fetch all expenses for current user
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

    const expenses = await db.expense.findMany({
      where: { userId: dbUser.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/expenses - create a new expense
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
    const { amount, description, category, date, isRecurring } = body;

    if (!amount || !description || !category) {
      return NextResponse.json(
        { error: "Amount, description and category are required" },
        { status: 400 },
      );
    }

    const expense = await db.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring ?? false,
        userId: dbUser.id,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
