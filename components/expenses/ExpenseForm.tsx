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
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconBolt,
  IconPigMoney,
  IconWallet,
  IconAlertTriangle,
  IconRobot,
} from "@tabler/icons-react";
import { WalletIcon, WALLET_SELECT_DATA } from "@/components/ui/WalletIcon";
import {
  CategoryIcon,
  CATEGORY_SELECT_DATA,
} from "@/components/ui/CategoryIcon";

const QUICK_ADD = [
  {
    label: "Jeepney",
    amount: 13,
    category: "TRANSPORT",
    description: "Jeepney fare",
  },
  {
    label: "Jeepney+",
    amount: 25,
    category: "TRANSPORT",
    description: "Jeepney fare",
  },
  {
    label: "Grab",
    amount: 80,
    category: "TRANSPORT",
    description: "Grab ride",
  },
  {
    label: "Siomai Rice",
    amount: 50,
    category: "FOOD",
    description: "Siomai rice",
  },
  {
    label: "Carinderia",
    amount: 60,
    category: "FOOD",
    description: "Carinderia meal",
  },
  { label: "7-Eleven", amount: 50, category: "FOOD", description: "7-Eleven" },
  {
    label: "3-in-1",
    amount: 15,
    category: "FOOD",
    description: "3-in-1 coffee",
  },
  {
    label: "Puregold",
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

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: string;
  icon: string | null;
}

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
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
    walletId: null as string | null,
  });

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then(setGoals)
      .catch(() => {});

    fetch("/api/budgets")
      .then((r) => r.json())
      .then((data) => setBudgets(data.budgets ?? []))
      .catch(() => {});

    fetch("/api/wallets")
      .then((r) => r.json())
      .then(setWallets)
      .catch(() => {});
  }, []);

  const handleQuickAdd = (item: (typeof QUICK_ADD)[0]) => {
    setForm((f) => ({
      ...f,
      amount: item.amount,
      description: item.description,
      category: item.category,
      goalId: null,
    }));
  };

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

  const handleSubmit = async () => {
    if (!form.amount || !form.description || !form.category) {
      notifications.show({
        title: "Missing fields",
        message: "Please fill in all required fields",
        color: "red",
      });
      return;
    }

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
          walletId: form.walletId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      notifications.show({
        title: "Saved!",
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
        walletId: null,
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
              setForm((f) => ({
                ...f,
                date: val ? new Date(val) : new Date(),
              }))
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
          data={CATEGORY_SELECT_DATA}
          value={form.category}
          onChange={(val) =>
            setForm((f) => ({ ...f, category: val ?? "", goalId: null }))
          }
          renderOption={({ option }) => (
            <Group gap="sm">
              <CategoryIcon category={option.value} size={14} />
              <Text size="sm">{option.label}</Text>
            </Group>
          )}
          required
        />

        {/* Wallet Selector */}
        {wallets.length > 0 ? (
          <Select
            label="Paid with"
            placeholder="Select wallet (optional)"
            clearable
            data={wallets.map((w) => ({
              value: w.id,
              label: `${w.name} — ₱${parseFloat(w.balance).toLocaleString(
                "en-PH",
                { minimumFractionDigits: 2 },
              )}`,
            }))}
            value={form.walletId}
            onChange={(val) =>
              setForm((f) => ({ ...f, walletId: val ?? null }))
            }
            renderOption={({ option }) => {
              const wallet = wallets.find((w) => w.id === option.value);
              if (!wallet) return <Text size="sm">{option.label}</Text>;
              return (
                <Group gap="sm">
                  <WalletIcon type={wallet.type} size={14} />
                  <Text size="sm">{option.label}</Text>
                </Group>
              );
            }}
          />
        ) : (
          <Alert
            color="gray"
            variant="light"
            p="xs"
            icon={<IconWallet size={14} />}
          >
            <Group justify="space-between" wrap="nowrap">
              <Text size="xs" c="dimmed">
                No wallets set up yet
              </Text>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                component="a"
                href="/wallets"
              >
                Add wallet
              </Button>
            </Group>
          </Alert>
        )}

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
                      ? `⚠️ Over budget! ₱${Math.abs(
                          hint.remaining,
                        ).toLocaleString("en-PH")} exceeded`
                      : `₱${hint.remaining.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })} remaining of ₱${hint.limit.toLocaleString(
                          "en-PH",
                        )} budget`}
                  </Text>
                  <Text size="xs" fw={600}>
                    {hint.percentUsed}% used
                  </Text>
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
                  data={activeGoals.map((g) => ({
                    value: g.id,
                    label: `${g.name} — ₱${g.savedAmount.toLocaleString(
                      "en-PH",
                    )} / ₱${g.targetAmount.toLocaleString("en-PH")}`,
                  }))}
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
