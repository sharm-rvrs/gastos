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

    const goals = await db.savingsGoal.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    const goalsWithProgress = goals.map((g) => ({
      ...g,
      targetAmount: parseFloat(g.targetAmount.toString()),
      savedAmount: parseFloat(g.savedAmount.toString()),
      percentSaved: Math.min(
        Math.round(
          (parseFloat(g.savedAmount.toString()) /
            parseFloat(g.targetAmount.toString())) *
            100,
        ),
        100,
      ),
    }));

    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    console.error("GET /api/goals error:", error);
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
    const { name, targetAmount, savedAmount, deadline } = body;

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: "Name and target amount are required" },
        { status: 400 },
      );
    }

    const goal = await db.savingsGoal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        savedAmount: parseFloat(savedAmount) || 0,
        deadline: deadline ? new Date(deadline) : null,
        userId: dbUser.id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
