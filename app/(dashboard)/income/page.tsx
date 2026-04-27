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
  TextInput,
  NumberInput,
  Select,
  Loader,
  Center,
  Badge,
  ThemeIcon,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconTrash,
  IconCash,
  IconBriefcase,
  IconTrendingUp,
  IconBuildingStore,
  IconGift,
  IconPackage,
} from "@tabler/icons-react";

const INCOME_SOURCES = [
  { value: "SALARY", label: "Salary" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "COMMISSION", label: "Commission" },
  { value: "BUSINESS", label: "Business" },
  { value: "ALLOWANCE", label: "Allowance" },
  { value: "OTHER", label: "Other" },
];

const SOURCE_COLORS: Record<string, string> = {
  SALARY: "blue",
  FREELANCE: "teal",
  COMMISSION: "green",
  BUSINESS: "grape",
  ALLOWANCE: "orange",
  OTHER: "gray",
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  SALARY: <IconCash size={16} />,
  FREELANCE: <IconBriefcase size={16} />,
  COMMISSION: <IconTrendingUp size={16} />,
  BUSINESS: <IconBuildingStore size={16} />,
  ALLOWANCE: <IconGift size={16} />,
  OTHER: <IconPackage size={16} />,
};

interface Income {
  id: string;
  amount: number;
  description: string;
  source: string;
  date: string;
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

const emptyForm = {
  amount: 0 as number,
  description: "",
  source: "",
  date: new Date(),
};

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchIncomes = async () => {
    try {
      const res = await fetch("/api/income");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to load");

      setIncomes(data.incomes ?? []);
      setTotalThisMonth(data.totalThisMonth ?? 0);
      setMonth(data.month ?? new Date().getMonth() + 1);
      setYear(data.year ?? new Date().getFullYear());
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load income",
        color: "red",
      });
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleSave = async () => {
    if (!form.amount || !form.description || !form.source) {
      notifications.show({
        title: "Missing fields",
        message: "Please fill in all required fields",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          description: form.description,
          source: form.source,
          date: form.date.toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save income");

      notifications.show({
        title: "Income logged!",
        message: `₱${form.amount.toLocaleString("en-PH")} from ${form.description} saved`,
        color: "green",
      });

      close();
      setForm(emptyForm);
      fetchIncomes();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save income",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setIncomes((prev) => prev.filter((i) => i.id !== id));
      notifications.show({
        title: "Deleted",
        message: "Income entry removed",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete income",
        color: "red",
      });
    }
  };

  // Group incomes by month + year
  const grouped = incomes.reduce(
    (acc, income) => {
      const key = `${income.year}-${income.month}`;
      if (!acc[key]) {
        acc[key] = {
          month: income.month,
          year: income.year,
          incomes: [],
          total: 0,
        };
      }
      acc[key].incomes.push(income);
      acc[key].total += income.amount;
      return acc;
    },
    {} as Record<
      string,
      { month: number; year: number; incomes: Income[]; total: number }
    >,
  );

  const groupedList = Object.values(grouped).sort(
    (a, b) => b.year - a.year || b.month - a.month,
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Income</Title>
          <Text c="dimmed" size="sm">
            Track your salary, freelance, and other income sources
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Log Income
        </Button>
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            This Month
          </Text>
          <Text size="xl" fw={700} c="green" mt={4}>
            ₱
            {totalThisMonth.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {MONTH_NAMES[month - 1]} {year}
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Entries
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {incomes.filter((i) => i.month === month && i.year === year).length}{" "}
            payments
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            this month
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            All Time Total
          </Text>
          <Text size="xl" fw={700} c="blue" mt={4}>
            ₱
            {incomes
              .reduce((sum, i) => sum + i.amount, 0)
              .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            across all months
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Income List grouped by month */}
      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : incomes.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <ThemeIcon size={48} radius="xl" variant="light" color="green">
              <IconCash size={24} />
            </ThemeIcon>
            <Text fw={500}>No income logged yet</Text>
            <Text c="dimmed" size="sm" ta="center">
              Log your salary, freelance payments, or allowance to track your
              earnings
            </Text>
            <Button leftSection={<IconPlus size={16} />} onClick={open}>
              Log your first income
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="md">
          {groupedList.map((group) => (
            <Paper
              key={`${group.year}-${group.month}`}
              p="md"
              radius="md"
              withBorder
            >
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <Text fw={600}>
                    {MONTH_NAMES[group.month - 1]} {group.year}
                  </Text>
                  {group.month === month && group.year === year && (
                    <Badge size="xs" color="green" variant="light">
                      Current
                    </Badge>
                  )}
                </Group>
                <Text fw={700} c="green">
                  ₱
                  {group.total.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </Group>

              <Stack gap="xs">
                {group.incomes.map((income) => (
                  <Paper
                    key={income.id}
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      backgroundColor: "var(--mantine-color-gray-0)",
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon
                          size={32}
                          radius="xl"
                          color={SOURCE_COLORS[income.source] ?? "gray"}
                          variant="light"
                        >
                          {SOURCE_ICONS[income.source]}
                        </ThemeIcon>
                        <Stack gap={2}>
                          <Text size="sm" fw={500}>
                            {income.description}
                          </Text>
                          <Group gap="xs">
                            <Badge
                              size="xs"
                              color={SOURCE_COLORS[income.source] ?? "gray"}
                              variant="light"
                            >
                              {INCOME_SOURCES.find(
                                (s) => s.value === income.source,
                              )?.label ?? income.source}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {new Date(income.date).toLocaleDateString(
                                "en-PH",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </Text>
                          </Group>
                        </Stack>
                      </Group>

                      <Group gap="sm" wrap="nowrap">
                        <Text fw={700} size="sm" c="green">
                          +₱
                          {income.amount.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => handleDelete(income.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Log Income Modal */}
      <Modal opened={opened} onClose={close} title="Log Income" centered>
        <Stack gap="sm">
          <NumberInput
            label="Amount (₱)"
            placeholder="e.g. 15000"
            min={0}
            decimalScale={2}
            value={form.amount}
            onChange={(val) => setForm((f) => ({ ...f, amount: Number(val) }))}
            required
          />
          <TextInput
            label="Description"
            placeholder="e.g. April salary, Freelance - ABC Corp"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            required
          />
          <Select
            label="Source"
            placeholder="Select income source"
            data={INCOME_SOURCES}
            value={form.source}
            onChange={(val) => setForm((f) => ({ ...f, source: val ?? "" }))}
            required
          />
          <DateInput
            label="Date Received"
            value={form.date}
            onChange={(val) =>
              setForm((f) => ({
                ...f,
                date: val ? new Date(val) : new Date(),
              }))
            }
            required
          />
          <Button onClick={handleSave} loading={saving} fullWidth color="green">
            Log Income
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
