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

    // Pass the actual date so the AI knows current inflation/prices in 2026
    const today = new Date().toLocaleDateString("en-PH", { year: 'numeric', month: 'long' });

    const prompt = `You are a Filipino personal finance expert. 
Context: Manila, Philippines (${today}). 
User: A 25-year-old professional earning ₱${monthlyIncome.toLocaleString()} per month.

Suggest a realistic budget allocation in Philippine Peso for:
- RENT: Living in Metro Manila (Studio, Bedspace, or Shared Condo).
- GROCERIES: Essential household items and home-cooked meals.
- TRANSPORT: Daily commute (LRT/MRT/Jeep) + occasional Grab.
- FOOD: Outside meals, office lunch, and carinderia.
- UTILITIES: Meralco, Water, Fiber Internet, and Load.
- LEISURE: Subscriptions (Netflix/Spotify) and hobbies.
- HEALTH: Gym, vitamins, and emergency medical fund.
- SAVINGS: Direct deposit to a high-yield digital bank.

Rules:
1. Total must equal exactly ₱${monthlyIncome}.
2. Use 2026 Manila price benchmarks (e.g., higher electricity and transport costs).
3. Be gender-neutral: Use "Bes" or "User" in reasoning; NEVER use "Ate" or "Kuya".
4. Priority: If income < ₱20k, prioritize Bedspace/Rent and Groceries. If > ₱60k, push for 30%+ Savings.

Respond ONLY with a valid JSON object:
{
  "RENT": number,
  "GROCERIES": number,
  "TRANSPORT": number,
  "FOOD": number,
  "UTILITIES": number,
  "LEISURE": number,
  "HEALTH": number,
  "SAVINGS": number,
  "reasoning": "Brief one-line explanation using gender-neutral terms."
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.2, 
    });

    const content = response.choices[0].message.content ?? "";

    // Parse JSON safely,. regex ensures we ignore any accidental conversational text
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