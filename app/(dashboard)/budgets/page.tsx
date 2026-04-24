"use client";

import { useEffect, useState } from "react";
import {
  Stack,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Group,
  Button,
  ActionIcon,
  Modal,
  Select,
  NumberInput,
  Loader,
  Center,
  Progress,
  Badge,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash, IconWallet } from "@tabler/icons-react";
import {
  CategoryIcon,
  CATEGORY_LABELS,
  CATEGORY_SELECT_DATA,
} from "@/components/ui/CategoryIcon";

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
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

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [opened, { open, close }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "",
    limit: 0 as number,
  });

  const fetchBudgets = async () => {
    try {
      const res = await fetch("/api/budgets");
      const data = await res.json();
      setBudgets(data.budgets);
      setMonth(data.month);
      setYear(data.year);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load budgets",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSave = async () => {
    if (!form.category || !form.limit) {
      notifications.show({
        title: "Missing fields",
        message: "Please select a category and enter a limit",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          limit: form.limit,
        }),
      });

      if (!res.ok) throw new Error("Failed to save budget");

      notifications.show({
        title: "Budget saved!",
        message: `₱${form.limit.toLocaleString("en-PH")} budget set for ${
          CATEGORY_LABELS[form.category] ?? form.category
        }`,
        color: "green",
      });

      close();
      setForm({ category: "", limit: 0 });
      fetchBudgets();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save budget",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      notifications.show({
        title: "Deleted",
        message: "Budget removed successfully",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete budget",
        color: "red",
      });
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "red";
    if (percent >= 80) return "orange";
    if (percent >= 60) return "yellow";
    return "green";
  };

  const getStatusBadge = (percent: number) => {
    if (percent >= 100) return { label: "Over budget!", color: "red" };
    if (percent >= 80) return { label: "Almost full", color: "orange" };
    if (percent >= 60) return { label: "Halfway", color: "yellow" };
    return { label: "On track", color: "green" };
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Group gap="sm" align="center">
            <ThemeIcon size={34} radius="xl" variant="light">
              <IconWallet size={18} />
            </ThemeIcon>
            <Title order={2}>Budgets</Title>
          </Group>
          <Text c="dimmed" size="sm">
            {MONTH_NAMES[month - 1]} {year} — Set your monthly spending limits
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Set Budget
        </Button>
      </Group>

      {/* Summary */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Budget
          </Text>
          <Text size="xl" fw={700} mt={4}>
            ₱{totalBudget.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Spent
          </Text>
          <Text size="xl" fw={700} c="red" mt={4}>
            ₱{totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Remaining
          </Text>
          <Text
            size="xl"
            fw={700}
            c={totalBudget - totalSpent < 0 ? "red" : "green"}
            mt={4}
          >
            ₱
            {(totalBudget - totalSpent).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Budget List */}
      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : budgets.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <IconWallet size={24} />
            <Text fw={500}>No budgets set yet</Text>
            <Text c="dimmed" size="sm" ta="center">
              Set monthly limits for each spending category to track your budget
            </Text>
            <Button leftSection={<IconPlus size={16} />} onClick={open}>
              Set your first budget
            </Button>
          </Stack>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {budgets.map((budget) => {
            const status = getStatusBadge(budget.percentUsed);
            return (
              <Paper key={budget.id} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Group gap="sm">
                    <Group gap="xs" wrap="nowrap">
                      <CategoryIcon category={budget.category} size={14} />
                      <Text fw={600}>
                        {CATEGORY_LABELS[budget.category] ?? budget.category}
                      </Text>
                    </Group>
                    <Badge size="xs" color={status.color} variant="light">
                      {status.label}
                    </Badge>
                  </Group>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>

                <Progress
                  value={Math.min(budget.percentUsed, 100)}
                  color={getProgressColor(budget.percentUsed)}
                  size="md"
                  radius="xl"
                  mb="xs"
                />

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    ₱
                    {budget.spent.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    spent
                  </Text>
                  <Text size="xs" fw={500}>
                    ₱
                    {budget.limit.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    limit
                  </Text>
                </Group>

                <Text
                  size="xs"
                  c={budget.remaining < 0 ? "red" : "dimmed"}
                  mt={4}
                >
                  {budget.remaining < 0
                    ? `₱${Math.abs(budget.remaining).toLocaleString("en-PH", { minimumFractionDigits: 2 })} over budget!`
                    : `₱${budget.remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })} remaining`}
                </Text>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}

      {/* Add Budget Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Set Monthly Budget"
        centered
      >
        <Stack gap="sm">
          <Select
            label="Category"
            placeholder="Select a category"
            data={CATEGORY_SELECT_DATA.filter(
              (c) => !budgets.find((b) => b.category === c.value),
            )}
            value={form.category}
            onChange={(val) => setForm((f) => ({ ...f, category: val ?? "" }))}
            renderOption={({ option }) => (
              <Group gap="sm">
                <CategoryIcon category={option.value} size={14} />
                <Text size="sm">{option.label}</Text>
              </Group>
            )}
            required
          />
          <NumberInput
            label="Monthly Limit (₱)"
            placeholder="e.g. 5000"
            min={0}
            decimalScale={2}
            value={form.limit}
            onChange={(val) => setForm((f) => ({ ...f, limit: Number(val) }))}
            required
          />
          <Text size="xs" c="dimmed">
            Already set a budget for a category? Setting it again will update
            the existing limit.
          </Text>
          <Button onClick={handleSave} loading={saving} fullWidth>
            Save Budget
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
