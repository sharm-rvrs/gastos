import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db.server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const goal = await db.savingsGoal.findUnique({ where: { id } });

    if (!goal || goal.userId !== dbUser.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, targetAmount, savedAmount, deadline } = body;

    const updated = await db.savingsGoal.update({
      where: { id },
      data: {
        name: name ?? goal.name,
        targetAmount: targetAmount
          ? parseFloat(targetAmount)
          : goal.targetAmount,
        savedAmount: savedAmount ? parseFloat(savedAmount) : goal.savedAmount,
        deadline: deadline ? new Date(deadline) : goal.deadline,
      },
    });

    return NextResponse.json({
      ...updated,
      targetAmount: parseFloat(updated.targetAmount.toString()),
      savedAmount: parseFloat(updated.savedAmount.toString()),
    });
  } catch (error) {
    console.error("PUT /api/goals/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const goal = await db.savingsGoal.findUnique({ where: { id } });

    if (!goal || goal.userId !== dbUser.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.savingsGoal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
