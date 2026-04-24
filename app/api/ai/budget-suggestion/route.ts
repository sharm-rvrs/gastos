import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { monthlyIncome } = await req.json();

    if (!monthlyIncome || monthlyIncome <= 0) {
      return NextResponse.json(
        { error: "Monthly income is required" },
        { status: 400 },
      );
    }

    const prompt = `You are a Filipino personal finance expert who knows Manila cost of living very well.

A 25-year-old professional living alone in Manila earns ₱${monthlyIncome.toLocaleString()} per month.

Based on this income, suggest realistic monthly budget amounts in Philippine Peso for these categories:
- RENT (room/condo in Metro Manila)
- GROCERIES (supermarket + palengke)
- TRANSPORT (jeepney, MRT, Grab combined)
- FOOD (meals outside, carinderia, delivery)
- UTILITIES (electric, water, internet, phone)
- LEISURE (entertainment, subscriptions, hobbies)
- HEALTH (medicines, checkups, gym)
- SAVINGS (emergency fund, goals - aim for at least 20% of income)

Rules:
- Total budget should NOT exceed the monthly income
- Savings should be at least 10-20% of income
- Be realistic for Manila 2025 prices
- If income is low (below ₱15,000), prioritize essentials and minimize leisure
- If income is high (above ₱50,000), suggest higher savings rate

Respond ONLY with a valid JSON object, no explanation, no markdown, no backticks:
{
  "RENT": 8000,
  "GROCERIES": 3000,
  "TRANSPORT": 2000,
  "FOOD": 4000,
  "UTILITIES": 2000,
  "LEISURE": 1500,
  "HEALTH": 1000,
  "SAVINGS": 5000,
  "reasoning": "Brief one-line explanation of the allocation"
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content ?? "";

    // Parse JSON safely
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const suggestion = JSON.parse(jsonMatch[0]);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("POST /api/ai/budget-suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 },
    );
  }
}
