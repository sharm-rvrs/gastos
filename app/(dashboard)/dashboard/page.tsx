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
} from "@mantine/core";
import { PieChart } from "@mantine/charts";
import { IconAlertTriangle, IconRepeat } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

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

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Spent
          </Text>
          <Text size="xl" fw={700} c="red" mt={4}>
            ₱
            {data.totalSpent.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            this month
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Budget
          </Text>
          <Text size="xl" fw={700} mt={4}>
            ₱
            {data.totalBudget.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            monthly limit
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Remaining
          </Text>
          <Text
            size="xl"
            fw={700}
            c={data.remaining < 0 ? "red" : "green"}
            mt={4}
          >
            ₱
            {data.remaining.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {data.remaining < 0 ? "over budget!" : "left to spend"}
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Wallet Balance
          </Text>
          <Text size="xl" fw={700} c="blue" mt={4}>
            ₱
            {data.totalWalletBalance.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            across all wallets
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Budget Usage + Pie Chart */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Budget Ring */}
        <Paper p="md" radius="md" withBorder>
          <Text fw={500} mb="md">
            Budget Usage
          </Text>
          {data.totalBudget === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              No budgets set yet. Go to Budgets to set monthly limits!
            </Text>
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

        {/* Pie Chart */}
        <Paper p="md" radius="md" withBorder>
          <Text fw={500} mb="md">
            Spending by Category
          </Text>
          {pieData.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              No expenses yet this month.
            </Text>
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
        <Title order={4} mb="md">
          Recent Expenses
        </Title>
        {data.recentExpenses.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No expenses yet this month. Start logging! 💸
          </Text>
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
      {data.wallets.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="md">
            My Wallets 💳
          </Title>
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
