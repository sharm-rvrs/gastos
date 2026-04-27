"use client";

import { useEffect, useState } from "react";
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  ActionIcon,
  Loader,
  Center,
  Badge,
  ThemeIcon,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconTrash,
  IconRestore,
  IconAlertTriangle,
  IconTrashOff,
} from "@tabler/icons-react";
import {
  CategoryIcon,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/components/ui/CategoryIcon";

interface DeletedExpense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  deletedAt: string;
  daysUntilPurge: number;
}

export default function TrashPage() {
  const [expenses, setExpenses] = useState<DeletedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchTrash = async () => {
    try {
      const res = await fetch("/api/expenses/trash");
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load trash",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleAction = async (
    action: "restore" | "purge" | "purge-all",
    id?: string,
  ) => {
    setActing(action === "purge-all" ? "purge-all" : (id ?? null));
    try {
      const res = await fetch("/api/expenses/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });

      if (!res.ok) throw new Error("Action failed");

      if (action === "restore") {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        notifications.show({
          title: "Restored!",
          message: "Expense has been restored successfully",
          color: "green",
        });
      } else if (action === "purge") {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        notifications.show({
          title: "Permanently deleted",
          message: "Expense has been permanently removed",
          color: "red",
        });
      } else if (action === "purge-all") {
        setExpenses([]);
        notifications.show({
          title: "Trash emptied",
          message: "All deleted expenses have been permanently removed",
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Action failed. Please try again.",
        color: "red",
      });
    } finally {
      setActing(null);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Trash</Title>
          <Text c="dimmed" size="sm">
            Deleted expenses are kept for 30 days before being permanently
            removed
          </Text>
        </div>
        {expenses.length > 0 && (
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={16} />}
            loading={acting === "purge-all"}
            onClick={() => handleAction("purge-all")}
          >
            Empty Trash
          </Button>
        )}
      </Group>

      {/* Info Alert */}
      <Alert
        icon={<IconAlertTriangle size={18} />}
        color="yellow"
        variant="light"
        title="About deleted expenses"
      >
        Deleted expenses are soft-deleted and kept here for 30 days. You can
        restore them anytime. After 30 days they are permanently removed.
      </Alert>

      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : expenses.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <ThemeIcon size={48} radius="xl" variant="light" color="gray">
              <IconTrashOff size={24} />
            </ThemeIcon>
            <Text fw={500}>Trash is empty</Text>
            <Text c="dimmed" size="sm" ta="center">
              Deleted expenses will appear here. You can restore them within 30
              days.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="xs">
          {expenses.map((expense) => (
            <Paper
              key={expense.id}
              p="sm"
              radius="md"
              withBorder
              style={{
                opacity: 0.85,
                borderColor:
                  expense.daysUntilPurge <= 3
                    ? "var(--mantine-color-red-4)"
                    : undefined,
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <CategoryIcon category={expense.category} size={14} />
                  <Stack gap={2}>
                    <Group gap="xs">
                      <Text fw={500} size="sm">
                        {expense.description}
                      </Text>
                      <Badge
                        size="xs"
                        color={expense.daysUntilPurge <= 3 ? "red" : "gray"}
                        variant="light"
                      >
                        {expense.daysUntilPurge === 0
                          ? "Deletes today"
                          : `${expense.daysUntilPurge}d left`}
                      </Badge>
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
                      <Text size="xs" c="dimmed">
                        Deleted{" "}
                        {new Date(expense.deletedAt).toLocaleDateString(
                          "en-PH",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </Text>
                    </Group>
                  </Stack>
                </Group>

                <Group gap="sm" wrap="nowrap">
                  <Text fw={700} size="sm" c="dimmed">
                    ₱
                    {expense.amount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                  <ActionIcon
                    color="green"
                    variant="light"
                    size="sm"
                    loading={acting === expense.id}
                    onClick={() => handleAction("restore", expense.id)}
                    title="Restore"
                  >
                    <IconRestore size={14} />
                  </ActionIcon>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    loading={acting === expense.id}
                    onClick={() => handleAction("purge", expense.id)}
                    title="Delete permanently"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
