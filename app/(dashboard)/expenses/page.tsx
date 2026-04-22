"use client";

import { useEffect, useState } from "react";
import {
  Stack,
  Title,
  Text,
  Group,
  Badge,
  Paper,
  ActionIcon,
  Loader,
  Center,
  SimpleGrid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconTrash, IconRepeat } from "@tabler/icons-react";
import ExpenseForm from "@/components/expenses/ExpenseForm";

const CATEGORY_COLORS: Record<string, string> = {
  RENT: "blue",
  GROCERIES: "green",
  TRANSPORT: "yellow",
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

interface Expense {
  id: string;
  amount: string;
  description: string;
  category: string;
  date: string;
  isRecurring: boolean;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load expenses",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      setExpenses((prev) => prev.filter((e) => e.id !== id));
      notifications.show({
        title: "Deleted",
        message: "Expense removed successfully",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete expense",
        color: "red",
      });
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Expenses 💸</Title>
        <Text c="dimmed" size="sm">
          Log and manage your daily expenses
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Logged
          </Text>
          <Text size="xl" fw={700} mt={4}>
            ₱{totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Entries
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {expenses.length} expenses
          </Text>
        </Paper>
      </SimpleGrid>

      <ExpenseForm onSuccess={fetchExpenses} />

      <Paper p="md" radius="md" withBorder>
        <Title order={4} mb="md">
          Recent Expenses
        </Title>

        {loading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : expenses.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No expenses yet. Add your first one above! 💸
          </Text>
        ) : (
          <Stack gap="xs">
            {expenses.map((expense) => (
              <Paper
                key={expense.id}
                p="sm"
                radius="md"
                withBorder
                style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <Stack gap={2}>
                      <Group gap="xs">
                        <Text fw={500} size="sm">
                          {expense.description}
                        </Text>
                        {expense.isRecurring && (
                          <IconRepeat
                            size={14}
                            color="var(--mantine-color-blue-5)"
                          />
                        )}
                      </Group>
                      <Group gap="xs">
                        <Badge
                          size="xs"
                          color={CATEGORY_COLORS[expense.category]}
                          variant="light"
                        >
                          {CATEGORY_LABELS[expense.category]}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {new Date(expense.date).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </Group>
                    </Stack>
                  </Group>

                  <Group gap="sm" wrap="nowrap">
                    <Text fw={700} size="sm" c="red">
                      ₱
                      {parseFloat(expense.amount).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
