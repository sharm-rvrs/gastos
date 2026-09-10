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

    // Context preparation
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [expenses, budgets, goals, wallets] = await Promise.all([
      db.expense.findMany({
        where: { userId: dbUser.id, deletedAt: null },
        orderBy: { date: "desc" },
        take: 30,
      }),
      db.budget.findMany({
        where: { userId: dbUser.id, month, year },
      }),
      db.savingsGoal.findMany({
        where: { userId: dbUser.id },
      }),
      db.wallet.findMany({
        where: { userId: dbUser.id },
      }),
    ]);

    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.limit.toString()), 0);
    const remaining = totalBudget - totalSpent;
    const isPetsaDePeligro = totalBudget > 0 && remaining / totalBudget < 0.2;

    const expenseContext = expenses
      .map(e => `- ${e.category}: ₱${parseFloat(e.amount.toString()).toLocaleString("en-PH")} — ${e.description} (${new Date(e.date).toLocaleDateString("en-PH")})`)
      .join("\n");

    const budgetContext = budgets
      .map(b => `- ${b.category}: ₱${parseFloat(b.limit.toString()).toLocaleString("en-PH")} limit`)
      .join("\n");

    const goalsContext = goals
      .map(g => `- ${g.name}: ₱${parseFloat(g.savedAmount.toString()).toLocaleString("en-PH")} saved of ₱${parseFloat(g.targetAmount.toString()).toLocaleString("en-PH")} target`)
      .join("\n");

    const walletsContext = wallets
      .map(w => `- ${w.name} (${w.type}): ₱${parseFloat(w.balance.toString()).toLocaleString("en-PH")}`)
      .join("\n");

    const systemPrompt = `You are Peso Buddy, a friendly and witty Filipino personal finance assistant. 
The user is a 25-year-old living alone in Manila, Philippines.
Today's Date: ${now.toLocaleDateString("en-PH", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

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
1. Always suggest the tipid (budget-friendly) option first.
2. Local price hierarchy: Palengke < Puregold < SM < Robinsons < S&R.
3. Food hierarchy: Carinderia < Jollibee < Casual < BGC/Makati fine dining.
4. Always highlight the gap between 3-in-1 coffee (₱8-15) and Starbucks (₱180-250) when relevant.
5. Transport costs: Jeepney (₱13+) < MRT/LRT < Grab/Taxi.
6. When Petsa de Peligro is active, be a strict but loving "Kuya/Ate" — focus only on survival and essentials.
7. Use ₱ for all amounts. Use Filipino words naturally (tipid, sulit, jusko, sayang).
   CRITICAL: Do not assume the user's gender. Do not use "Ate" or "Kuya" to refer to the user 
   unless they explicitly mention it. Instead, use gender-neutral terms like "Bes", 
   "Friend", or just address them directly.
8. Keep responses concise (max 3-4 short paragraphs) and end with a practical actionable tip.

STRICT GUARDRAILS:
9. SCOPE LOCK: You are ONLY a financial assistant. 
10. NO CODING: If the user asks for code, programming help, or tech support, politely refuse in character. 
    Example: "Huy, focus muna tayo sa pera! Hindi ako marunong mag-code, marunong lang ako mag-budget para hindi tayo mag-asin sa dulo ng buwan."
11. NO GENERAL TASKS: Do not write essays, poems, or provide general trivia unless it's about Philippine money/taxes.
12. Never judge the user's spending — guide them gently back to their goals.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...(history || []), { role: "user", content: message }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    return NextResponse.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("POST /api/ai error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}