"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Title,
  Text,
  Paper,
  Button,
  Group,
  Stepper,
  NumberInput,
  Select,
  SimpleGrid,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconWallet,
  IconCash,
  IconTarget,
  IconCheck,
  IconChartPie,
  IconRobot,
} from "@tabler/icons-react";
import {
  WalletIcon,
  WALLET_TYPES,
  WALLET_SELECT_DATA,
} from "@/components/ui/WalletIcon";

const MANILA_BUDGET_DEFAULTS = [
  {
    category: "RENT",
    label: "Rent",
    amount: 8000,
    description: "Typical Manila room/condo rent",
  },
  {
    category: "GROCERIES",
    label: "Groceries",
    amount: 3000,
    description: "Monthly grocery budget",
  },
  {
    category: "TRANSPORT",
    label: "Transport",
    amount: 2000,
    description: "Jeepney, MRT, Grab combined",
  },
  {
    category: "FOOD",
    label: "Food",
    amount: 4000,
    description: "Meals, carinderia, delivery",
  },
  {
    category: "UTILITIES",
    label: "Utilities",
    amount: 2000,
    description: "Electric, water, internet",
  },
  {
    category: "LEISURE",
    label: "Leisure",
    amount: 1500,
    description: "Entertainment, subscriptions",
  },
  {
    category: "HEALTH",
    label: "Health",
    amount: 1000,
    description: "Medicines, checkups",
  },
  {
    category: "SAVINGS",
    label: "Savings",
    amount: 3000,
    description: "Emergency fund, goals",
  },
];

interface WalletEntry {
  name: string;
  type: string;
  balance: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [payday2, setPayday2] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  // Step 1 — Income + Payday
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [payday, setPayday] = useState<string | null>(null);

  // Step 2 — Budgets
  const [budgets, setBudgets] = useState(
    MANILA_BUDGET_DEFAULTS.map((b) => ({ ...b, enabled: true })),
  );

  // Step 3 — Wallets
  const [wallets, setWallets] = useState<WalletEntry[]>([
    { name: "GCash", type: "GCASH", balance: 0 },
  ]);

  const totalBudget = budgets
    .filter((b) => b.enabled)
    .reduce((sum, b) => sum + b.amount, 0);

  const addWallet = () => {
    setWallets((prev) => [...prev, { name: "", type: "CASH", balance: 0 }]);
  };

  const updateWallet = (
    index: number,
    field: keyof WalletEntry,
    value: string | number,
  ) => {
    setWallets((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    );
  };

  const removeWallet = (index: number) => {
    setWallets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save income + payday
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome,
          payday: payday ? parseInt(payday) : null,
          payday2: payday2 ? parseInt(payday2) : null,
          budgets: budgets
            .filter((b) => b.enabled)
            .map((b) => ({ category: b.category, limit: b.amount })),
          wallets: wallets.filter((w) => w.name && w.type),
        }),
      });

      notifications.show({
        title: "Setup complete!",
        message: "Welcome to Gastos! Let's start tracking your expenses.",
        color: "green",
      });

      router.push("/dashboard");
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save setup. Please try again.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAISuggestion = async () => {
    if (!monthlyIncome || monthlyIncome <= 0) {
      notifications.show({
        title: "Missing income",
        message: "Please enter your monthly income first",
        color: "yellow",
      });
      return;
    }

    setAiLoading(true);
    setAiReasoning(null);
    try {
      const res = await fetch("/api/ai/budget-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyIncome }),
      });

      if (!res.ok) throw new Error("Failed to get suggestion");

      const data = await res.json();

      // Update budgets with AI suggestions
      setBudgets((prev) =>
        prev.map((b) => ({
          ...b,
          amount: data[b.category] ?? b.amount,
          enabled: true,
        })),
      );

      if (data.reasoning) {
        setAiReasoning(data.reasoning);
      }

      notifications.show({
        title: "AI Budget Ready!",
        message: "Peso Buddy has suggested budgets based on your income!",
        color: "teal",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to get AI suggestion. Using Manila defaults instead.",
        color: "red",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Stack
      align="center"
      justify="center"
      style={{ minHeight: "100vh", padding: "2rem" }}
      bg="gray.0"
    >
      <Paper p="lg" radius="md" withBorder w="100%" maw={640}>
        <Stack gap="lg">
          {/* Header */}
          <Stack align="center" gap="xs">
            <ThemeIcon size={48} radius="xl" variant="light" color="teal">
              <IconCash size={24} />
            </ThemeIcon>
            <Title order={2} ta="center">
              Welcome to Gastos!
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Let's set up your budget in 3 easy steps. Takes less than 2
              minutes!
            </Text>
          </Stack>

          <Stepper active={active} onStepClick={setActive} size="sm">
            {/* Step 1 — Income */}
            <Stepper.Step
              label="Income"
              description="Your monthly earnings"
              icon={<IconCash size={18} />}
            >
              <Stack gap="md" mt="md">
                <Title order={4}>Your Monthly Income</Title>
                <Text c="dimmed" size="sm">
                  This helps Gastos give you better budget recommendations and
                  savings advice.
                </Text>

                <NumberInput
                  label="Monthly Income (₱)"
                  placeholder="e.g. 25000"
                  min={0}
                  decimalScale={2}
                  value={monthlyIncome}
                  onChange={(val) => setMonthlyIncome(Number(val))}
                  size="md"
                />

                <SimpleGrid cols={2} spacing="sm">
                  <Select
                    label="First Payday"
                    description="e.g. 5th of the month"
                    placeholder="Select day"
                    data={Array.from({ length: 31 }, (_, i) => ({
                      value: String(i + 1),
                      label: `${i + 1}${
                        i + 1 === 1
                          ? "st"
                          : i + 1 === 2
                            ? "nd"
                            : i + 1 === 3
                              ? "rd"
                              : "th"
                      } of the month`,
                    }))}
                    value={payday}
                    onChange={setPayday}
                    size="md"
                    searchable
                  />
                  <Select
                    label="Second Payday"
                    description="Leave blank if monthly"
                    placeholder="Select day (optional)"
                    data={Array.from({ length: 31 }, (_, i) => ({
                      value: String(i + 1),
                      label: `${i + 1}${
                        i + 1 === 1
                          ? "st"
                          : i + 1 === 2
                            ? "nd"
                            : i + 1 === 3
                              ? "rd"
                              : "th"
                      } of the month`,
                    }))}
                    value={payday2}
                    onChange={setPayday2}
                    size="md"
                    searchable
                    clearable
                  />
                </SimpleGrid>

                {monthlyIncome > 0 && (
                  <Paper p="sm" radius="md" bg="teal.0" withBorder>
                    <Stack gap="xs">
                      <Text size="sm" c="teal.8">
                        💡 Your total budget is ₱
                        {totalBudget.toLocaleString("en-PH")} (
                        {Math.round((totalBudget / monthlyIncome) * 100)}% of
                        your income).
                        {totalBudget > monthlyIncome
                          ? " ⚠️ Your budget exceeds your income! Consider reducing some categories."
                          : totalBudget / monthlyIncome > 0.8
                            ? " You're budgeting most of your income — try to save at least 20%!"
                            : " Great! You have room to save more."}
                      </Text>
                      <Button
                        variant="light"
                        color="teal"
                        size="sm"
                        loading={aiLoading}
                        leftSection={<IconRobot size={16} />}
                        onClick={handleAISuggestion}
                      >
                        {aiLoading
                          ? "Peso Buddy is thinking..."
                          : "Get AI Budget Suggestion"}
                      </Button>
                    </Stack>
                  </Paper>
                )}

                <Button fullWidth size="md" onClick={() => setActive(1)}>
                  Next →
                </Button>
              </Stack>
            </Stepper.Step>

            {/* Step 2 — Budgets */}
            <Stepper.Step
              label="Budgets"
              description="Monthly spending limits"
              icon={<IconChartPie size={18} />}
            >
              <Stack gap="md" mt="md">
                <Group justify="space-between">
                  <Group gap="sm" align="center">
                    <IconWallet size={16} />
                    <Title order={4}>Monthly Budgets</Title>
                  </Group>
                  <Badge color="teal" variant="light">
                    Manila defaults
                  </Badge>
                </Group>
                <Text c="dimmed" size="sm">
                  We've pre-filled typical Manila amounts. Adjust to fit your
                  lifestyle!
                </Text>

                {aiReasoning && (
                  <Paper p="sm" radius="md" bg="teal.0" withBorder>
                    <Group gap="xs">
                      <IconRobot
                        size={16}
                        color="var(--mantine-color-teal-6)"
                      />
                      <Text size="sm" c="teal.8">
                        <Text span fw={600}>
                          Peso Buddy says:{" "}
                        </Text>
                        {aiReasoning}
                      </Text>
                    </Group>
                  </Paper>
                )}

                <Stack gap="xs">
                  {budgets.map((budget, index) => (
                    <Paper
                      key={budget.category}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{
                        opacity: budget.enabled ? 1 : 0.5,
                        cursor: "pointer",
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                          <Text
                            size="lg"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setBudgets((prev) =>
                                prev.map((b, i) =>
                                  i === index
                                    ? { ...b, enabled: !b.enabled }
                                    : b,
                                ),
                              )
                            }
                          >
                            {budget.enabled ? "✅" : "⬜"}
                          </Text>
                          <Stack gap={0} style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                              {budget.label}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {budget.description}
                            </Text>
                          </Stack>
                        </Group>
                        <NumberInput
                          value={budget.amount}
                          onChange={(val) =>
                            setBudgets((prev) =>
                              prev.map((b, i) =>
                                i === index ? { ...b, amount: Number(val) } : b,
                              ),
                            )
                          }
                          min={0}
                          prefix="₱"
                          w={120}
                          size="xs"
                          disabled={!budget.enabled}
                        />
                      </Group>
                    </Paper>
                  ))}
                </Stack>

                <Paper p="sm" radius="md" bg="blue.0" withBorder>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      Total monthly budget:
                    </Text>
                    <Text size="sm" fw={700} c="blue">
                      ₱{totalBudget.toLocaleString("en-PH")}
                    </Text>
                  </Group>
                  {monthlyIncome > 0 && (
                    <Text size="xs" c="dimmed" mt={4}>
                      {Math.round((totalBudget / monthlyIncome) * 100)}% of your
                      ₱{monthlyIncome.toLocaleString("en-PH")} income
                    </Text>
                  )}
                </Paper>

                <Group grow>
                  <Button variant="default" onClick={() => setActive(0)}>
                    ← Back
                  </Button>
                  <Button onClick={() => setActive(2)}>Next →</Button>
                </Group>
              </Stack>
            </Stepper.Step>

            {/* Step 3 — Wallets */}
            <Stepper.Step
              label="Wallets"
              description="Your money accounts"
              icon={<IconWallet size={18} />}
            >
              <Stack gap="md" mt="md">
                <Title order={4}>Your Wallets</Title>
                <Text c="dimmed" size="sm">
                  Add your GCash, Maya, Cash, or bank accounts. We'll track your
                  balance automatically as you log expenses.
                </Text>

                <Stack gap="sm">
                  {wallets.map((wallet, index) => (
                    <Paper key={index} p="sm" radius="md" withBorder>
                      <Group gap="sm" mb="xs">
                        {wallet.type && (
                          <WalletIcon type={wallet.type} size={16} />
                        )}
                        <Text size="sm" fw={500}>
                          {wallet.type
                            ? WALLET_TYPES.find((w) => w.value === wallet.type)
                                ?.label
                            : "Select wallet type"}
                        </Text>
                      </Group>
                      <SimpleGrid cols={3} spacing="xs">
                        <Select
                          placeholder="Type"
                          data={WALLET_SELECT_DATA}
                          value={wallet.type}
                          onChange={(val) =>
                            updateWallet(index, "type", val ?? "CASH")
                          }
                          size="xs"
                        />
                        <NumberInput
                          placeholder="Balance ₱"
                          value={wallet.balance}
                          onChange={(val) =>
                            updateWallet(index, "balance", Number(val))
                          }
                          min={0}
                          size="xs"
                        />
                        <Button
                          variant="subtle"
                          color="red"
                          size="xs"
                          onClick={() => removeWallet(index)}
                          disabled={wallets.length === 1}
                        >
                          Remove
                        </Button>
                      </SimpleGrid>
                    </Paper>
                  ))}
                </Stack>

                <Button variant="light" onClick={addWallet} size="sm">
                  + Add another wallet
                </Button>

                <Group grow>
                  <Button variant="default" onClick={() => setActive(1)}>
                    ← Back
                  </Button>
                  <Button
                    color="teal"
                    loading={saving}
                    onClick={handleFinish}
                    leftSection={<IconCheck size={16} />}
                  >
                    Finish Setup!
                  </Button>
                </Group>
              </Stack>
            </Stepper.Step>
          </Stepper>
        </Stack>
      </Paper>
    </Stack>
  );
}
