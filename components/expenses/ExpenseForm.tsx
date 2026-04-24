"use client";

import { useEffect, useState } from "react";
import {
  TextInput,
  NumberInput,
  Select,
  Button,
  Stack,
  Group,
  Checkbox,
  Paper,
  Title,
  Text,
  SimpleGrid,
  Alert,
  Badge,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconBolt,
  IconPigMoney,
  IconAlertTriangle,
  IconWallet,
} from "@tabler/icons-react";

const CATEGORIES = [
  { value: "RENT", label: "🏠 Rent" },
  { value: "GROCERIES", label: "🛒 Groceries" },
  { value: "TRANSPORT", label: "🚗 Transport" },
  { value: "FOOD", label: "🍜 Food" },
  { value: "UTILITIES", label: "💡 Utilities" },
  { value: "LEISURE", label: "🎮 Leisure" },
  { value: "HEALTH", label: "💊 Health" },
  { value: "SAVINGS", label: "💰 Savings" },
  { value: "OTHER", label: "📦 Other" },
];

const QUICK_ADD = [
  {
    label: "🚌 Jeepney",
    amount: 13,
    category: "TRANSPORT",
    description: "Jeepney fare",
  },
  {
    label: "🚌 Jeepney+",
    amount: 25,
    category: "TRANSPORT",
    description: "Jeepney fare",
  },
  {
    label: "🚖 Grab",
    amount: 80,
    category: "TRANSPORT",
    description: "Grab ride",
  },
  {
    label: "🍚 Siomai Rice",
    amount: 50,
    category: "FOOD",
    description: "Siomai rice",
  },
  {
    label: "🍜 Carinderia",
    amount: 60,
    category: "FOOD",
    description: "Carinderia meal",
  },
  {
    label: "🏪 7-Eleven",
    amount: 50,
    category: "FOOD",
    description: "7-Eleven",
  },
  {
    label: "☕ 3-in-1",
    amount: 15,
    category: "FOOD",
    description: "3-in-1 coffee",
  },
  {
    label: "🛒 Puregold",
    amount: 300,
    category: "GROCERIES",
    description: "Puregold groceries",
  },
];

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  percentSaved: number;
}

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [form, setForm] = useState({
    amount: 0 as number,
    description: "",
    category: "",
    date: new Date(),
    isRecurring: false,
    isSplit: false,
    totalAmount: 0 as number,
    splitWith: "",
    goalId: null as string | null,
  });

  // Fetch goals for savings linking
  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then(setGoals)
      .catch(() => {});
  }, []);

  // Fetch budgets for hints
  useEffect(() => {
    fetch("/api/budgets")
      .then((r) => r.json())
      .then((data) => setBudgets(data.budgets ?? []))
      .catch(() => {});
  }, []);

  const getBudgetHint = (category: string) => {
    if (!category) return null;
    const budget = budgets.find((b) => b.category === category);
    if (!budget) return { type: "none" as const };
    return {
      type: "found" as const,
      limit: budget.limit,
      spent: budget.spent,
      remaining: budget.remaining,
      percentUsed: budget.percentUsed,
    };
  };

  const handleQuickAdd = (item: (typeof QUICK_ADD)[0]) => {
    setForm((f) => ({
      ...f,
      amount: item.amount,
      description: item.description,
      category: item.category,
      goalId: null,
    }));
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.description || !form.category) {
      notifications.show({
        title: "Missing fields",
        message: "Please fill in all required fields",
        color: "red",
      });
      return;
    }

    // If savings category, warn if no goal selected
    if (form.category === "SAVINGS" && !form.goalId) {
      const confirmed = window.confirm(
        "No goal selected. This will be logged as General Savings. Continue?",
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          description: form.description,
          category: form.category,
          date: form.date.toISOString(),
          isRecurring: form.isRecurring,
          isSplit: form.isSplit,
          totalAmount: form.isSplit ? form.totalAmount : null,
          splitWith: form.isSplit ? form.splitWith : null,
          goalId: form.category === "SAVINGS" ? form.goalId : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      notifications.show({
        title: "Saved! 💸",
        message: `₱${form.amount.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })} for ${form.description} logged`,
        color: "green",
      });

      setForm({
        amount: 0,
        description: "",
        category: "",
        date: new Date(),
        isRecurring: false,
        isSplit: false,
        totalAmount: 0,
        splitWith: "",
        goalId: null,
      });

      onSuccess?.();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save expense. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeGoals = goals.filter((g) => g.percentSaved < 100);

  return (
    <Paper p="md" radius="md" withBorder>
      <Title order={4} mb="xs">
        Add New Expense
      </Title>

      {/* Quick Add */}
      <Text size="xs" c="dimmed" mb="xs" fw={500}>
        <IconBolt size={12} style={{ marginRight: 4 }} />
        QUICK ADD
      </Text>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mb="md">
        {QUICK_ADD.map((item) => (
          <Button
            key={item.label}
            variant="light"
            size="xs"
            onClick={() => handleQuickAdd(item)}
            styles={{ root: { height: "auto", padding: "6px 8px" } }}
          >
            <Stack gap={0} align="center">
              <Text size="xs" fw={600}>
                {item.label}
              </Text>
              <Text size="xs" c="dimmed">
                ₱{item.amount}
              </Text>
            </Stack>
          </Button>
        ))}
      </SimpleGrid>

      <Stack gap="sm">
        <Group grow>
          <NumberInput
            label="Amount (₱)"
            placeholder="0.00"
            min={0}
            decimalScale={2}
            value={form.amount}
            onChange={(val) => setForm((f) => ({ ...f, amount: Number(val) }))}
            required
          />
          <DateInput
            label="Date"
            value={form.date}
            onChange={(val) =>
              setForm((f) => ({ ...f, date: val ? new Date(val) : new Date() }))
            }
            required
          />
        </Group>

        <TextInput
          label="Description"
          placeholder="e.g. Puregold groceries, Grab to work..."
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          required
        />

        <Select
          label="Category"
          placeholder="Select a category"
          data={CATEGORIES}
          value={form.category}
          onChange={(val) =>
            setForm((f) => ({ ...f, category: val ?? "", goalId: null }))
          }
          required
        />
        {/* Budget Hint */}
        {form.category &&
          form.category !== "SAVINGS" &&
          (() => {
            const hint = getBudgetHint(form.category);
            if (!hint) return null;

            if (hint.type === "none") {
              return (
                <Alert
                  color="yellow"
                  variant="light"
                  p="xs"
                  icon={<IconAlertTriangle size={14} />}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs">No budget set for this category yet</Text>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="yellow"
                      component="a"
                      href="/budgets"
                    >
                      Set budget
                    </Button>
                  </Group>
                </Alert>
              );
            }

            return (
              <Alert
                color={
                  hint.percentUsed >= 100
                    ? "red"
                    : hint.percentUsed >= 80
                      ? "orange"
                      : "teal"
                }
                variant="light"
                p="xs"
                icon={<IconWallet size={14} />}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs">
                    {hint.percentUsed >= 100
                      ? `⚠️ Over budget! ₱${Math.abs(hint.remaining).toLocaleString("en-PH")} exceeded`
                      : `₱${hint.remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })} remaining of ₱${hint.limit.toLocaleString("en-PH")} budget`}
                  </Text>
                  <Badge
                    size="xs"
                    color={
                      hint.percentUsed >= 100
                        ? "red"
                        : hint.percentUsed >= 80
                          ? "orange"
                          : "teal"
                    }
                  >
                    {hint.percentUsed}% used
                  </Badge>
                </Group>
              </Alert>
            );
          })()}

        {/* Goal Selector — only shows when SAVINGS is selected */}
        {form.category === "SAVINGS" && (
          <Alert
            icon={<IconPigMoney size={16} />}
            color="teal"
            variant="light"
            p="sm"
          >
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Which goal is this savings for?
              </Text>
              {activeGoals.length === 0 ? (
                <Text size="xs" c="dimmed">
                  No active goals yet. This will be logged as General Savings.
                </Text>
              ) : (
                <Select
                  placeholder="Select a goal (or leave for General Savings)"
                  clearable
                  data={[
                    ...activeGoals.map((g) => ({
                      value: g.id,
                      label: `🎯 ${g.name} — ₱${g.savedAmount.toLocaleString("en-PH")} / ₱${g.targetAmount.toLocaleString("en-PH")}`,
                    })),
                  ]}
                  value={form.goalId}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, goalId: val ?? null }))
                  }
                />
              )}
            </Stack>
          </Alert>
        )}

        <Group>
          <Checkbox
            label="Recurring expense"
            checked={form.isRecurring}
            onChange={(e) =>
              setForm((f) => ({ ...f, isRecurring: e.target.checked }))
            }
          />
          <Checkbox
            label="Split bill"
            checked={form.isSplit}
            onChange={(e) =>
              setForm((f) => ({ ...f, isSplit: e.target.checked }))
            }
          />
        </Group>

        {/* Split Bill Fields */}
        {form.isSplit && (
          <Paper p="sm" radius="md" withBorder bg="blue.0">
            <Text size="xs" fw={600} c="blue" mb="xs">
              Split Bill Details
            </Text>
            <Group grow>
              <NumberInput
                label="Total Bill (₱)"
                placeholder="e.g. 800"
                min={0}
                decimalScale={2}
                value={form.totalAmount}
                onChange={(val) =>
                  setForm((f) => ({ ...f, totalAmount: Number(val) }))
                }
              />
              <TextInput
                label="Split with"
                placeholder="e.g. Nico, Jess"
                value={form.splitWith}
                onChange={(e) =>
                  setForm((f) => ({ ...f, splitWith: e.target.value }))
                }
              />
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              Enter your share in the Amount field above
            </Text>
          </Paper>
        )}

        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleSubmit}
          loading={loading}
          fullWidth
        >
          Add Expense
        </Button>
      </Stack>
    </Paper>
  );
}
