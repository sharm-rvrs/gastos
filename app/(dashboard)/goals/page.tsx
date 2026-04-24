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
  Loader,
  Center,
  Progress,
  Badge,
  ThemeIcon,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconPigMoney,
  IconCheck,
} from "@tabler/icons-react";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  percentSaved: number;
  deadline: string | null;
}

const emptyForm = {
  name: "",
  targetAmount: 0 as number,
  savedAmount: 0 as number,
  deadline: null as Date | null,
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addingProgress, setAddingProgress] = useState<Goal | null>(null);
  const [progressOpened, { open: openProgress, close: closeProgress }] =
    useDisclosure(false);
  const [form, setForm] = useState(emptyForm);
  const [addAmount, setAddAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      setGoals(data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load goals",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpen = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setForm({
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        deadline: goal.deadline ? new Date(goal.deadline) : null,
      });
    } else {
      setEditingGoal(null);
      setForm(emptyForm);
    }
    open();
  };

  const handleOpenProgress = (goal: Goal) => {
    setAddingProgress(goal);
    setAddAmount(0);
    openProgress();
  };

  const handleSave = async () => {
    if (!form.name || !form.targetAmount) {
      notifications.show({
        title: "Missing fields",
        message: "Please fill in name and target amount",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : "/api/goals";
      const method = editingGoal ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          targetAmount: form.targetAmount,
          savedAmount: form.savedAmount,
          deadline: form.deadline ? form.deadline.toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save goal");

      notifications.show({
        title: editingGoal ? "Goal updated!" : "Goal created!",
        message: `${form.name} has been ${editingGoal ? "updated" : "created"} successfully`,
        color: "green",
      });

      close();
      fetchGoals();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save goal",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddProgress = async () => {
    if (!addingProgress || !addAmount) return;

    setSaving(true);
    try {
      const newSaved = addingProgress.savedAmount + addAmount;
      const res = await fetch(`/api/goals/${addingProgress.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savedAmount: newSaved,
        }),
      });

      if (!res.ok) throw new Error("Failed to update progress");

      const isCompleted = newSaved >= addingProgress.targetAmount;

      notifications.show({
        title: isCompleted ? "Goal completed!" : "Progress added!",
        message: isCompleted
          ? `You reached your ${addingProgress.name} goal!`
          : `₱${addAmount.toLocaleString("en-PH")} added to ${addingProgress.name}`,
        color: isCompleted ? "teal" : "green",
      });

      closeProgress();
      fetchGoals();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update progress",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setGoals((prev) => prev.filter((g) => g.id !== id));
      notifications.show({
        title: "Deleted",
        message: "Goal removed successfully",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete goal",
        color: "red",
      });
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completedGoals = goals.filter((g) => g.percentSaved >= 100).length;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Group gap="sm" align="center">
            <ThemeIcon size={34} radius="xl" variant="light">
              <IconPigMoney size={18} />
            </ThemeIcon>
            <Title order={2}>Savings Goals</Title>
          </Group>
          <Text c="dimmed" size="sm">
            Track your targets — emergency fund, gadgets, travel, and more
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpen()}
        >
          Add Goal
        </Button>
      </Group>

      {/* Summary */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Saved
          </Text>
          <Text size="xl" fw={700} c="teal" mt={4}>
            ₱{totalSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Total Target
          </Text>
          <Text size="xl" fw={700} mt={4}>
            ₱{totalTarget.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Goals Completed
          </Text>
          <Text size="xl" fw={700} c="green" mt={4}>
            {completedGoals} / {goals.length}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Goals List */}
      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : goals.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <ThemeIcon size={48} radius="xl" variant="light" color="teal">
              <IconPigMoney size={24} />
            </ThemeIcon>
            <Text fw={500}>No savings goals yet</Text>
            <Text c="dimmed" size="sm" ta="center">
              Set a goal for your emergency fund, a new laptop, or a vacation!
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => handleOpen()}
            >
              Add your first goal
            </Button>
          </Stack>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {goals.map((goal) => {
            const isCompleted = goal.percentSaved >= 100;
            const daysLeft = goal.deadline
              ? Math.ceil(
                  (new Date(goal.deadline).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                )
              : null;

            return (
              <Paper key={goal.id} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Group gap="sm">
                    <Text fw={600}>{goal.name}</Text>
                    {isCompleted && (
                      <Badge
                        size="xs"
                        color="teal"
                        variant="light"
                        leftSection={<IconCheck size={10} />}
                      >
                        Completed!
                      </Badge>
                    )}
                  </Group>
                  <Group gap={4}>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      size="sm"
                      onClick={() => handleOpen(goal)}
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Progress
                  value={goal.percentSaved}
                  color={isCompleted ? "teal" : "blue"}
                  size="md"
                  radius="xl"
                  mb="xs"
                  animated={!isCompleted}
                />

                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed">
                    ₱
                    {goal.savedAmount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    saved
                  </Text>
                  <Text size="xs" fw={500}>
                    ₱
                    {goal.targetAmount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    target
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {goal.percentSaved}% complete
                    {daysLeft !== null && (
                      <Text span c={daysLeft < 7 ? "red" : "dimmed"}>
                        {" "}
                        ·{" "}
                        {daysLeft > 0
                          ? `${daysLeft} days left`
                          : "Deadline passed!"}
                      </Text>
                    )}
                  </Text>
                  {!isCompleted && (
                    <Button
                      size="xs"
                      variant="light"
                      color="teal"
                      onClick={() => handleOpenProgress(goal)}
                    >
                      + Add savings
                    </Button>
                  )}
                </Group>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingGoal ? "Edit Goal" : "New Savings Goal"}
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Goal Name"
            placeholder="e.g. Emergency Fund, New Laptop, Boracay Trip"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <NumberInput
            label="Target Amount (₱)"
            placeholder="e.g. 50000"
            min={0}
            decimalScale={2}
            value={form.targetAmount}
            onChange={(val) =>
              setForm((f) => ({ ...f, targetAmount: Number(val) }))
            }
            required
          />
          <NumberInput
            label="Already Saved (₱)"
            placeholder="0.00"
            min={0}
            decimalScale={2}
            value={form.savedAmount}
            onChange={(val) =>
              setForm((f) => ({ ...f, savedAmount: Number(val) }))
            }
          />
          <DateInput
            label="Target Date (optional)"
            placeholder="Pick a deadline"
            value={form.deadline}
            onChange={(val) =>
              setForm((f) => ({ ...f, deadline: val ? new Date(val) : null }))
            }
            clearable
          />
          <Button onClick={handleSave} loading={saving} fullWidth>
            {editingGoal ? "Save Changes" : "Create Goal"}
          </Button>
        </Stack>
      </Modal>

      {/* Add Progress Modal */}
      <Modal
        opened={progressOpened}
        onClose={closeProgress}
        title={`Add savings to "${addingProgress?.name}"`}
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Current: ₱
            {addingProgress?.savedAmount.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}{" "}
            / ₱
            {addingProgress?.targetAmount.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
          <NumberInput
            label="Amount to Add (₱)"
            placeholder="e.g. 1000"
            min={0}
            decimalScale={2}
            value={addAmount}
            onChange={(val) => setAddAmount(Number(val))}
            required
          />
          <Button
            onClick={handleAddProgress}
            loading={saving}
            fullWidth
            color="teal"
          >
            Add to Savings
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
