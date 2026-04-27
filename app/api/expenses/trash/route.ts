import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db.server";
import { NextRequest, NextResponse } from "next/server";

// GET — fetch all soft deleted expenses
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

    const deleted = await db.expense.findMany({
      where: {
        userId: dbUser.id,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
    });

    return NextResponse.json(
      deleted.map((e) => ({
        ...e,
        amount: parseFloat(e.amount.toString()),
        daysUntilPurge: Math.max(
          0,
          30 -
            Math.floor(
              (Date.now() - new Date(e.deletedAt!).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
        ),
      })),
    );
  } catch (error) {
    console.error("GET /api/expenses/trash error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST — restore or purge
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

    const { action, id } = await req.json();

    if (action === "restore") {
      const expense = await db.expense.findUnique({ where: { id } });
      if (!expense || expense.userId !== dbUser.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await db.expense.update({
        where: { id },
        data: { deletedAt: null },
      });

      return NextResponse.json({ success: true, action: "restored" });
    }

    if (action === "purge") {
      // Permanently delete one expense
      const expense = await db.expense.findUnique({ where: { id } });
      if (!expense || expense.userId !== dbUser.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await db.expense.delete({ where: { id } });
      return NextResponse.json({ success: true, action: "purged" });
    }

    if (action === "purge-all") {
      // Permanently delete all soft deleted expenses
      await db.expense.deleteMany({
        where: {
          userId: dbUser.id,
          deletedAt: { not: null },
        },
      });
      return NextResponse.json({ success: true, action: "purged-all" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/expenses/trash error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
