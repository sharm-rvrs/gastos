import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db.server";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

    const { message, history } = await req.json();

    // Fetch last 30 expenses
    const expenses = await db.expense.findMany({
      where: { userId: dbUser.id, deletedAt: null },
      orderBy: { date: "desc" },
      take: 30,
    });

    // Fetch budgets this month
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const budgets = await db.budget.findMany({
      where: { userId: dbUser.id, month, year },
    });

    // Fetch goals
    const goals = await db.savingsGoal.findMany({
      where: { userId: dbUser.id },
    });

    // Fetch wallets
    const wallets = await db.wallet.findMany({
      where: { userId: dbUser.id },
    });

    // Build context
    const totalSpent = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0,
    );
    const totalBudget = budgets.reduce(
      (sum, b) => sum + parseFloat(b.limit.toString()),
      0,
    );
    const remaining = totalBudget - totalSpent;
    const isPetsaDePeligro = totalBudget > 0 && remaining / totalBudget < 0.2;

    const expenseContext = expenses
      .map(
        (e) =>
          `- ${e.category}: ₱${parseFloat(e.amount.toString()).toLocaleString("en-PH")} — ${e.description} (${new Date(e.date).toLocaleDateString("en-PH")})`,
      )
      .join("\n");

    const budgetContext = budgets
      .map(
        (b) =>
          `- ${b.category}: ₱${parseFloat(b.limit.toString()).toLocaleString("en-PH")} limit`,
      )
      .join("\n");

    const goalsContext = goals
      .map(
        (g) =>
          `- ${g.name}: ₱${parseFloat(g.savedAmount.toString()).toLocaleString("en-PH")} saved of ₱${parseFloat(g.targetAmount.toString()).toLocaleString("en-PH")} target`,
      )
      .join("\n");

    const walletsContext = wallets
      .map(
        (w) =>
          `- ${w.name} (${w.type}): ₱${parseFloat(w.balance.toString()).toLocaleString("en-PH")}`,
      )
      .join("\n");

    const systemPrompt = `You are Peso Buddy, a friendly and witty Filipino personal finance assistant. 
The user is a 25-year-old living alone in Manila, Philippines.

CURRENT FINANCIAL SNAPSHOT:
- Total spent this month: ₱${totalSpent.toLocaleString("en-PH")}
- Total budget this month: ₱${totalBudget.toLocaleString("en-PH")}
- Remaining budget: ₱${remaining.toLocaleString("en-PH")}
- Petsa de Peligro mode: ${isPetsaDePeligro ? "YES — BE EXTRA STRICT!" : "No"}

RECENT EXPENSES (last 30):
${expenseContext || "No expenses yet"}

MONTHLY BUDGETS:
${budgetContext || "No budgets set"}

SAVINGS GOALS:
${goalsContext || "No goals set"}

WALLET BALANCES:
${walletsContext || "No wallets set"}

YOUR PERSONALITY & RULES:
1. Always suggest the tipid (budget-friendly) option first
2. Know local stores by price: Palengke < Puregold < SM Supermarket < Robinsons < S&R
3. Know food options by price: Carinderia/Turo-turo < Jollibee < casual restaurants < BGC restaurants
3. 3-in-1 coffee (₱8-15) vs Starbucks (₱180-250) — always mention the gap when relevant
4. Know Manila transport costs: Jeepney (₱13-25) < MRT/LRT < Grab/Taxi
5. Suggest Shopee/Lazada for non-urgent purchases instead of malls
6. When Petsa de Peligro is active, be extra strict and focus only on essentials
7. Be warm, funny, and conversational — like a kuya/ate who happens to know finance
8. Use ₱ for all amounts, never PHP
9. Occasionally use Filipino words naturally: tipid, sulit, jusko, naman, kaya natin
10. Keep responses concise — max 3-4 short paragraphs
11. Always end with a practical actionable tip
12. Never judge the user's spending — just guide them gently`;

    // Build messages with history
    const messages = [
      ...(history || []),
      { role: "user" as const, content: message },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("POST /api/ai error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
