"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  Title,
  Text,
  Group,
  Paper,
  ActionIcon,
  Loader,
  Center,
  SimpleGrid,
  Select,
  TextInput,
  Badge,
  Button,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconTrash,
  IconRepeat,
  IconSearch,
  IconFilter,
  IconX,
  IconUsers,
} from "@tabler/icons-react";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import {
  CategoryIcon,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_SELECT_DATA,
} from "@/components/ui/CategoryIcon";
import { WalletIcon } from "@/components/ui/WalletIcon";

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  isRecurring: boolean;
  isSplit: boolean;
  splitWith: string | null;
  goal: { id: string; name: string } | null;
  wallet: { id: string; name: string; type: string } | null;
}

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Highest amount" },
  { value: "amount-asc", label: "Lowest amount" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2024, i, 1).toLocaleString("en-PH", { month: "long" }),
}));

const YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => ({
  value: String(new Date().getFullYear() - i),
  label: String(new Date().getFullYear() - i),
}));

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("date-desc");

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (month) params.set("month", month);
      if (year) params.set("year", year);
      const [sortBy, sortOrder] = sort.split("-");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load expenses",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [search, category, month, year, sort]);

  useEffect(() => {
    const timeout = setTimeout(fetchExpenses, 300);
    return () => clearTimeout(timeout);
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      notifications.show({
        title: "Deleted",
        message: "Expense removed successfully",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete expense",
        color: "red",
      });
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setMonth("");
    setYear("");
    setSort("date-desc");
  };

  const hasActiveFilters =
    search || category || month || year || sort !== "date-desc";
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Expenses</Title>
          <Text c="dimmed" size="sm">
            Log and manage your daily expenses
          </Text>
        </div>
        <Button
          variant={showFilters ? "light" : "subtle"}
          leftSection={<IconFilter size={16} />}
          onClick={() => setShowFilters((v) => !v)}
          color={hasActiveFilters ? "blue" : "gray"}
        >
          Filters
          {hasActiveFilters && (
            <Badge size="xs" color="blue" ml="xs" circle>
              !
            </Badge>
          )}
        </Button>
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Shown
          </Text>
          <Text size="xl" fw={700} c="red" mt={4}>
            ₱{totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Average
          </Text>
          <Text size="xl" fw={700} mt={4}>
            ₱
            {expenses.length > 0
              ? (totalSpent / expenses.length).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })
              : "0.00"}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            per expense
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Highest
          </Text>
          <Text size="xl" fw={700} c="orange" mt={4}>
            ₱
            {expenses.length > 0
              ? Math.max(...expenses.map((e) => e.amount)).toLocaleString(
                  "en-PH",
                  { minimumFractionDigits: 2 },
                )
              : "0.00"}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            single expense
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Search Bar — always visible */}
      <TextInput
        placeholder="Search expenses..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        rightSection={
          search ? (
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setSearch("")}
            >
              <IconX size={14} />
            </ActionIcon>
          ) : null
        }
      />

      {/* Collapsible Filters */}
      {showFilters && (
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text size="sm" fw={500}>
              Filter & Sort
            </Text>
            {hasActiveFilters && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<IconX size={12} />}
                onClick={handleClearFilters}
              >
                Clear all
              </Button>
            )}
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
            <Select
              label="Category"
              placeholder="All categories"
              clearable
              data={CATEGORY_SELECT_DATA}
              value={category}
              onChange={(val) => setCategory(val ?? "")}
            />
            <Select
              label="Month"
              placeholder="All months"
              clearable
              data={MONTH_OPTIONS}
              value={month}
              onChange={(val) => setMonth(val ?? "")}
            />
            <Select
              label="Year"
              placeholder="All years"
              clearable
              data={YEAR_OPTIONS}
              value={year}
              onChange={(val) => setYear(val ?? "")}
            />
            <Select
              label="Sort by"
              data={SORT_OPTIONS}
              value={sort}
              onChange={(val) => setSort(val ?? "date-desc")}
            />
          </SimpleGrid>
        </Paper>
      )}

      {/* Expense Form */}
      <ExpenseForm onSuccess={fetchExpenses} />

      {/* Expense List */}
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500}>
            {hasActiveFilters ? "Filtered Results" : "All Expenses"}
          </Text>
          {hasActiveFilters && (
            <Badge variant="light" color="blue">
              {expenses.length} result{expenses.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : expenses.length === 0 ? (
          <Stack align="center" gap="sm" py="xl">
            <Text c="dimmed" size="sm" ta="center">
              {hasActiveFilters
                ? "No expenses match your filters."
                : "No expenses yet. Add your first one above!"}
            </Text>
            {hasActiveFilters && (
              <Button size="xs" variant="subtle" onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </Stack>
        ) : (
          <Stack gap="xs">
            {expenses.map((expense) => (
              <Paper
                key={expense.id}
                p="sm"
                radius="md"
                withBorder
                style={{
                  backgroundColor: "var(--mantine-color-default)",
                  border: "1px solid var(--mantine-color-default-border)",
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
                        {expense.isRecurring && (
                          <IconRepeat
                            size={12}
                            color="var(--mantine-color-blue-5)"
                          />
                        )}
                        {expense.isSplit && (
                          <IconUsers
                            size={12}
                            color="var(--mantine-color-grape-5)"
                          />
                        )}
                      </Group>
                      <Group gap="xs" wrap="wrap">
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
                        {expense.wallet && (
                          <Group gap={4}>
                            <WalletIcon type={expense.wallet.type} size={10} />
                            <Text size="xs" c="dimmed">
                              {expense.wallet.name}
                            </Text>
                          </Group>
                        )}
                        {expense.goal && (
                          <Badge size="xs" color="teal" variant="dot">
                            {expense.goal.name}
                          </Badge>
                        )}
                        {expense.isSplit && expense.splitWith && (
                          <Text size="xs" c="dimmed">
                            Split with {expense.splitWith}
                          </Text>
                        )}
                      </Group>
                    </Stack>
                  </Group>

                  <Group gap="sm" wrap="nowrap">
                    <Stack gap={0} align="flex-end">
                      <Text fw={700} size="sm" c="red">
                        ₱
                        {expense.amount.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                      {expense.isSplit && (
                        <Text size="xs" c="dimmed">
                          your share
                        </Text>
                      )}
                    </Stack>
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
