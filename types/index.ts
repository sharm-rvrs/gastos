import { Category } from "@prisma/client";

export type { Category };

export interface ExpenseWithCategory {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: Date;
  isRecurring: boolean;
  createdAt: Date;
  userId: string;
}

export interface BudgetWithUsage {
  id: string;
  category: Category;
  limit: number;
  month: number;
  year: number;
  spent: number;
}

export interface SavingsGoalType {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: Date | null;
  createdAt: Date;
}
