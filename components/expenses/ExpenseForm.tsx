"use client";

import { useState } from "react";
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
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";

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

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "",
    date: new Date(),
    isRecurring: false,
  });

  const handleSubmit = async () => {
    if (!form.amount || !form.description || !form.category) {
      notifications.show({
        title: "Missing fields",
        message: "Please fill in all required fields",
        color: "red",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          description: form.description,
          category: form.category,
          date: form.date.toISOString(),
          isRecurring: form.isRecurring,
        }),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      notifications.show({
        title: "Expense added! 💸",
        message: `₱${parseFloat(form.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} for ${form.description} saved`,
        color: "green",
      });

      // Reset form
      setForm({
        amount: "",
        description: "",
        category: "",
        date: new Date(),
        isRecurring: false,
      });

      onSuccess?.();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save expense. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Title order={4} mb="md">
        Add New Expense
      </Title>
      <Stack gap="sm">
        <Group grow>
          <NumberInput
            label="Amount (₱)"
            placeholder="0.00"
            min={0}
            decimalScale={2}
            value={form.amount}
            onChange={(val) => setForm((f) => ({ ...f, amount: String(val) }))}
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
          onChange={(val) => setForm((f) => ({ ...f, category: val ?? "" }))}
          required
        />

        <Checkbox
          label="Recurring expense (monthly)"
          checked={form.isRecurring}
          onChange={(e) =>
            setForm((f) => ({ ...f, isRecurring: e.target.checked }))
          }
        />

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
