import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db.server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        payday: true,
        payday2: true,
        monthlyIncome: true,
        createdAt: true,
        _count: {
          select: {
            expenses: true,
            budgets: true,
            goals: true,
            wallets: true,
            incomes: true,
          },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...dbUser,
      monthlyIncome: dbUser.monthlyIncome
        ? parseFloat(dbUser.monthlyIncome.toString())
        : null,
    })
  } catch (error) {
    console.error("GET /api/user/profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { name, payday, payday2, monthlyIncome } = body

    const updated = await db.user.update({
      where: { id: dbUser.id },
      data: {
        name: name ?? dbUser.name,
        payday: payday ? parseInt(payday) : null,
        payday2: payday2 ? parseInt(payday2) : null,
        monthlyIncome: monthlyIncome
          ? parseFloat(monthlyIncome)
          : null,
      },
    })

    return NextResponse.json({
      ...updated,
      monthlyIncome: updated.monthlyIncome
        ? parseFloat(updated.monthlyIncome.toString())
        : null,
    })
  } catch (error) {
    console.error("PUT /api/user/profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}