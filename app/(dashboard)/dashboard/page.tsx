"use client";

import { useEffect, useState } from "react";
import {
  Stack,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Group,
  Badge,
  Loader,
  Center,
  RingProgress,
  Alert,
  Button,
  ThemeIcon,
} from "@mantine/core";
import { PieChart } from "@mantine/charts";
import {
  IconAlertTriangle,
  IconRepeat,
  IconWallet,
  IconChartPie,
  IconPlus,
  IconArrowRight,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

const CATEGORY_COLORS: Record<string, string> = {
  RENT: "blue",
  GROCERIES: "green",
  TRANSPORT: "yellow.6",
  FOOD: "orange",
  UTILITIES: "cyan",
  LEISURE: "grape",
  HEALTH: "red",
  SAVINGS: "teal",
  OTHER: "gray",
};

const CATEGORY_LABELS: Record<string, string> = {
  RENT: "🏠 Rent",
  GROCERIES: "🛒 Groceries",
  TRANSPORT: "🚗 Transport",
  FOOD: "🍜 Food",
  UTILITIES: "💡 Utilities",
  LEISURE: "🎮 Leisure",
  HEALTH: "💊 Health",
  SAVINGS: "💰 Savings",
  OTHER: "📦 Other",
};

interface DashboardData {
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  savingsRate: number;
  byCategory: Record<string, number>;
  dailySpending: Record<string, number>;
  recentExpenses: {
    id: string;
    amount: string;
    description: string;
    category: string;
    date: string;
    isRecurring: boolean;
  }[];
  totalWalletBalance: number;
  wallets: {
    id: string;
    name: string;
    balance: string;
    icon: string | null;
    color: string | null;
  }[];
  isPetsaDePeligro: boolean;
  month: number;
  year: number;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() =>
        notifications.show({
          title: "Error",
          message: "Failed to load dashboard",
          color: "red",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="md" />
      </Center>
    );
  }

  if (!data) return null;

  const pieData = Object.entries(data.byCategory).map(([cat, value]) => ({
    name: CATEGORY_LABELS[cat] ?? cat,
    value: Math.round(value * 100) / 100,
    color: CATEGORY_COLORS[cat] ?? "gray",
  }));

  const budgetUsedPercent =
    data.totalBudget > 0
      ? Math.min(Math.round((data.totalSpent / data.totalBudget) * 100), 100)
      : 0;

  const hasExpenses = data.recentExpenses.length > 0;
  const hasBudgets = data.totalBudget > 0;
  const hasWallets = data.wallets.length > 0;

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={2}>Dashboard 📊</Title>
          <Text c="dimmed" size="sm">
            {MONTH_NAMES[data.month - 1]} {data.year} overview
          </Text>
        </div>
      </Group>

      {/* Petsa de Peligro Alert */}
      {data.isPetsaDePeligro && (
        <Alert
          icon={<IconAlertTriangle size={18} />}
          title="Petsa de Peligro! 🚨"
          color="red"
          variant="light"
        >
          Your budget is running low! Stick to essentials only — groceries,
          transport, and utilities. Leisure can wait! 💪
        </Alert>
      )}

      {/* Onboarding hints — show if missing key setup */}
      {(!hasBudgets || !hasWallets) && (
        <Alert
          icon={<IconArrowRight size={18} />}
          title="Complete your setup to get the most out of Gastos!"
          color="blue"
          variant="light"
        >
          <Stack gap="xs" mt="xs">
            {!hasBudgets && (
              <Group gap="sm">
                <Text size="sm">
                  💰 Set your monthly budgets to track spending per category
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  onClick={() => router.push("/budgets")}
                  rightSection={<IconArrowRight size={12} />}
                >
                  Set Budgets
                </Button>
              </Group>
            )}
            {!hasWallets && (
              <Group gap="sm">
                <Text size="sm">
                  💳 Add your GCash, Maya, or Cash wallet to track balances
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  onClick={() => router.push("/wallets")}
                  rightSection={<IconArrowRight size={12} />}
                >
                  Add Wallet
                </Button>
              </Group>
            )}
          </Stack>
        </Alert>
      )}

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Spent
          </Text>
          <Text size="xl" fw={700} c={hasExpenses ? "red" : "dimmed"} mt={4}>
            {hasExpenses
              ? `₱${data.totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
              : "₱0.00"}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {hasExpenses ? "this month" : "no expenses yet"}
          </Text>
          {!hasExpenses && (
            <Button
              size="xs"
              variant="subtle"
              mt="xs"
              leftSection={<IconPlus size={12} />}
              onClick={() => router.push("/expenses")}
            >
              Add expense
            </Button>
          )}
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Budget
          </Text>
          <Text size="xl" fw={700} c={hasBudgets ? "dark" : "dimmed"} mt={4}>
            {hasBudgets
              ? `₱${data.totalBudget.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
              : "Not set"}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {hasBudgets ? "monthly limit" : "no budgets yet"}
          </Text>
          {!hasBudgets && (
            <Button
              size="xs"
              variant="subtle"
              mt="xs"
              leftSection={<IconPlus size={12} />}
              onClick={() => router.push("/budgets")}
            >
              Set budget
            </Button>
          )}
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Remaining
          </Text>
          <Text
            size="xl"
            fw={700}
            c={!hasBudgets ? "dimmed" : data.remaining < 0 ? "red" : "green"}
            mt={4}
          >
            {hasBudgets
              ? `₱${data.remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
              : "—"}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {!hasBudgets
              ? "set a budget first"
              : data.remaining < 0
                ? "over budget!"
                : "left to spend"}
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Wallet Balance
          </Text>
          <Text size="xl" fw={700} c={hasWallets ? "blue" : "dimmed"} mt={4}>
            {hasWallets
              ? `₱${data.totalWalletBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
              : "Not set"}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {hasWallets ? "across all wallets" : "no wallets yet"}
          </Text>
          {!hasWallets && (
            <Button
              size="xs"
              variant="subtle"
              mt="xs"
              leftSection={<IconPlus size={12} />}
              onClick={() => router.push("/wallets")}
            >
              Add wallet
            </Button>
          )}
        </Paper>
      </SimpleGrid>

      {/* Budget Usage + Pie Chart */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Text fw={500} mb="md">
            Budget Usage
          </Text>
          {!hasBudgets ? (
            <Stack align="center" gap="sm" py="xl">
              <ThemeIcon size={48} radius="xl" variant="light" color="blue">
                <IconWallet size={24} />
              </ThemeIcon>
              <Text c="dimmed" size="sm" ta="center">
                No budgets set yet. Set monthly limits to see your usage here.
              </Text>
              <Button
                size="xs"
                variant="light"
                onClick={() => router.push("/budgets")}
                rightSection={<IconArrowRight size={12} />}
              >
                Set Budgets
              </Button>
            </Stack>
          ) : (
            <Group justify="center">
              <RingProgress
                size={180}
                thickness={20}
                roundCaps
                sections={[
                  {
                    value: budgetUsedPercent,
                    color:
                      budgetUsedPercent >= 100
                        ? "red"
                        : budgetUsedPercent >= 80
                          ? "orange"
                          : "teal",
                  },
                ]}
                label={
                  <Center>
                    <Stack gap={0} align="center">
                      <Text fw={700} size="xl">
                        {budgetUsedPercent}%
                      </Text>
                      <Text size="xs" c="dimmed">
                        used
                      </Text>
                    </Stack>
                  </Center>
                }
              />
            </Group>
          )}
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text fw={500} mb="md">
            Spending by Category
          </Text>
          {!hasExpenses ? (
            <Stack align="center" gap="sm" py="xl">
              <ThemeIcon size={48} radius="xl" variant="light" color="orange">
                <IconChartPie size={24} />
              </ThemeIcon>
              <Text c="dimmed" size="sm" ta="center">
                No expenses yet this month. Start logging to see your spending
                breakdown!
              </Text>
              <Button
                size="xs"
                variant="light"
                color="orange"
                onClick={() => router.push("/expenses")}
                rightSection={<IconArrowRight size={12} />}
              >
                Add Expense
              </Button>
            </Stack>
          ) : (
            <PieChart
              data={pieData}
              withTooltip
              tooltipDataSource="segment"
              size={180}
              mx="auto"
              h={200}
            />
          )}
        </Paper>
      </SimpleGrid>

      {/* Recent Expenses */}
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500}>Recent Expenses</Text>
          {hasExpenses && (
            <Button
              size="xs"
              variant="subtle"
              onClick={() => router.push("/expenses")}
              rightSection={<IconArrowRight size={12} />}
            >
              View all
            </Button>
          )}
        </Group>
        {!hasExpenses ? (
          <Stack align="center" gap="sm" py="xl">
            <Text c="dimmed" size="sm" ta="center">
              No expenses logged this month yet.
            </Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={12} />}
              onClick={() => router.push("/expenses")}
            >
              Log your first expense
            </Button>
          </Stack>
        ) : (
          <Stack gap="xs">
            {data.recentExpenses.map((expense) => (
              <Group
                key={expense.id}
                justify="space-between"
                p="xs"
                style={{
                  borderRadius: 8,
                  background: "var(--mantine-color-gray-0)",
                }}
              >
                <Group gap="sm">
                  <Stack gap={2}>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {expense.description}
                      </Text>
                      {expense.isRecurring && (
                        <IconRepeat
                          size={12}
                          color="var(--mantine-color-blue-5)"
                        />
                      )}
                    </Group>
                    <Group gap="xs">
                      <Badge
                        size="xs"
                        color={CATEGORY_COLORS[expense.category]?.split(".")[0]}
                        variant="light"
                      >
                        {CATEGORY_LABELS[expense.category]}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {new Date(expense.date).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </Group>
                  </Stack>
                </Group>
                <Text fw={700} size="sm" c="red">
                  ₱
                  {parseFloat(expense.amount).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </Group>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Wallets */}
      {hasWallets && (
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={500}>My Wallets 💳</Text>
            <Button
              size="xs"
              variant="subtle"
              onClick={() => router.push("/wallets")}
              rightSection={<IconArrowRight size={12} />}
            >
              Manage
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
            {data.wallets.map((wallet) => (
              <Paper key={wallet.id} p="sm" radius="md" withBorder>
                <Text size="xs" c="dimmed">
                  {wallet.icon} {wallet.name}
                </Text>
                <Text fw={700} size="sm" mt={4}>
                  ₱
                  {parseFloat(wallet.balance).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Paper>
      )}
    </Stack>
  );
}
