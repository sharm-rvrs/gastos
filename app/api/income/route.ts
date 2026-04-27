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

    const incomes = await db.income.findMany({
      where: { userId: dbUser.id },
      orderBy: { date: "desc" },
    });

    const thisMonthIncomes = incomes.filter(
      (i) => i.month === month && i.year === year,
    );

    const totalThisMonth = thisMonthIncomes.reduce(
      (sum, i) => sum + parseFloat(i.amount.toString()),
      0,
    );

    return NextResponse.json({
      incomes: incomes.map((i) => ({
        ...i,
        amount: parseFloat(i.amount.toString()),
      })),
      totalThisMonth,
      month,
      year,
    });
  } catch (error) {
    console.error("GET /api/income error:", error);
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
    const { amount, description, source, date } = body;

    if (!amount || !description || !source) {
      return NextResponse.json(
        { error: "Amount, description and source are required" },
        { status: 400 },
      );
    }

    const incomeDate = date ? new Date(date) : new Date();
    const month = incomeDate.getMonth() + 1;
    const year = incomeDate.getFullYear();

    const income = await db.income.create({
      data: {
        amount: parseFloat(amount),
        description,
        source,
        date: incomeDate,
        month,
        year,
        userId: dbUser.id,
      },
    });

    return NextResponse.json(
      {
        ...income,
        amount: parseFloat(income.amount.toString()),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/income error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
