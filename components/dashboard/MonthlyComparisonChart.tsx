"use client";

import {
  Paper,
  Text,
  Group,
  Badge,
  SimpleGrid,
  Stack,
  ThemeIcon,
} from "@mantine/core";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react";

interface TrendMonth {
  month: number;
  year: number;
  label: string;
  spent: number;
  income: number;
}

interface Props {
  sixMonthTrend: TrendMonth[];
  totalSpent: number;
  totalLastMonthSpent: number;
  totalIncome: number;
  totalLastMonthIncome: number;
}

export default function MonthlyComparisonChart({
  sixMonthTrend,
  totalSpent,
  totalLastMonthSpent,
  totalIncome,
  totalLastMonthIncome,
}: Props) {
  const spentDiff = totalSpent - totalLastMonthSpent;
  const spentPercent =
    totalLastMonthSpent > 0
      ? Math.round((spentDiff / totalLastMonthSpent) * 100)
      : 0;

  const incomeDiff = totalIncome - totalLastMonthIncome;
  const incomePercent =
    totalLastMonthIncome > 0
      ? Math.round((incomeDiff / totalLastMonthIncome) * 100)
      : 0;

  const getIcon = (diff: number) => {
    if (diff === 0) return <IconMinus size={14} />;
    return diff > 0 ? (
      <IconTrendingUp size={14} />
    ) : (
      <IconTrendingDown size={14} />
    );
  };

  const getColor = (diff: number, isSpending: boolean) => {
    if (diff === 0) return "gray";
    if (isSpending) return diff > 0 ? "red" : "green";
    return diff > 0 ? "green" : "red";
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Text fw={600} mb="md">
        6-Month Trend
      </Text>

      {/* This month vs last month comparison */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
        <Paper p="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="xs">
            Spending vs Last Month
          </Text>
          <Group gap="sm">
            <ThemeIcon
              size={36}
              radius="xl"
              color={getColor(spentDiff, true)}
              variant="light"
            >
              {getIcon(spentDiff)}
            </ThemeIcon>
            <div>
              <Text fw={700} c={getColor(spentDiff, true)}>
                {spentDiff === 0
                  ? "Same as last month"
                  : `${spentDiff > 0 ? "+" : ""}₱${Math.abs(spentDiff).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              </Text>
              <Text size="xs" c="dimmed">
                {totalLastMonthSpent > 0
                  ? `${spentPercent > 0 ? "+" : ""}${spentPercent}% vs last month`
                  : "No data last month"}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper p="sm" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500} mb="xs">
            Income vs Last Month
          </Text>
          <Group gap="sm">
            <ThemeIcon
              size={36}
              radius="xl"
              color={getColor(incomeDiff, false)}
              variant="light"
            >
              {getIcon(incomeDiff)}
            </ThemeIcon>
            <div>
              <Text fw={700} c={getColor(incomeDiff, false)}>
                {incomeDiff === 0
                  ? "Same as last month"
                  : `${incomeDiff > 0 ? "+" : ""}₱${Math.abs(incomeDiff).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              </Text>
              <Text size="xs" c="dimmed">
                {totalLastMonthIncome > 0
                  ? `${incomePercent > 0 ? "+" : ""}${incomePercent}% vs last month`
                  : "No data last month"}
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Bar Chart */}
      {sixMonthTrend.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={sixMonthTrend}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--mantine-color-gray-3)"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "var(--mantine-color-dimmed)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--mantine-color-dimmed)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`
              }
            />
            <Tooltip
              formatter={(value, name) => [
                `₱${Number(value ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                name === "spent" ? "Expenses" : "Income",
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--mantine-color-gray-3)",
                background: "var(--mantine-color-body)",
                color: "var(--mantine-color-text)",
              }}
            />
            <Legend
              formatter={(value) => (value === "spent" ? "Expenses" : "Income")}
            />
            <Bar
              dataKey="income"
              fill="var(--mantine-color-teal-5)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="spent"
              fill="var(--mantine-color-red-5)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Text c="dimmed" size="sm" ta="center" py="xl">
          Not enough data yet. Keep logging expenses to see your trend!
        </Text>
      )}
    </Paper>
  );
}
