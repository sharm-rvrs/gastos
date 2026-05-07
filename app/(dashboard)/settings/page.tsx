"use client"

import { useEffect, useState } from "react"
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  TextInput,
  NumberInput,
  Select,
  Avatar,
  Divider,
  SimpleGrid,
  ThemeIcon,
  Badge,
  Loader,
  Center,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
  IconUser,
  IconCalendar,
  IconCash,
  IconDeviceFloppy,
  IconReceipt,
  IconWallet,
  IconPigMoney,
  IconChartBar,
} from "@tabler/icons-react"

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  payday: number | null
  payday2: number | null
  monthlyIncome: number | null
  createdAt: string
  _count: {
    expenses: number
    budgets: number
    goals: number
    wallets: number
    incomes: number
  }
}

const PAYDAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}${
    i + 1 === 1 ? "st" : i + 1 === 2 ? "nd" : i + 1 === 3 ? "rd" : "th"
  } of the month`,
}))

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    payday: null as string | null,
    payday2: null as string | null,
    monthlyIncome: 0 as number,
  })

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile")
      const data = await res.json()
      setProfile(data)
      setForm({
        name: data.name ?? "",
        payday: data.payday ? String(data.payday) : null,
        payday2: data.payday2 ? String(data.payday2) : null,
        monthlyIncome: data.monthlyIncome ?? 0,
      })
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load profile",
        color: "red",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          payday: form.payday,
          payday2: form.payday2,
          monthlyIncome: form.monthlyIncome,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      notifications.show({
        title: "Settings saved!",
        message: "Your profile has been updated successfully",
        color: "green",
      })

      fetchProfile()
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save settings",
        color: "red",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="md" />
      </Center>
    )
  }

  if (!profile) return null

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Settings</Title>
        <Text c="dimmed" size="sm">
          Manage your profile and preferences
        </Text>
      </div>

      {/* Profile Overview */}
      <Paper p="md" radius="md" withBorder>
        <Group gap="md">
          <Avatar
            src={profile.image}
            alt={profile.name ?? "User"}
            size={64}
            radius="xl"
          />
          <div>
            <Text fw={600} size="lg">
              {profile.name ?? "No name set"}
            </Text>
            <Text c="dimmed" size="sm">
              {profile.email}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Member since{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-PH", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          </div>
        </Group>
      </Paper>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        {[
          {
            label: "Expenses",
            value: profile._count.expenses,
            icon: IconReceipt,
            color: "red",
          },
          {
            label: "Budgets",
            icon: IconChartBar,
            value: profile._count.budgets,
            color: "blue",
          },
          {
            label: "Goals",
            value: profile._count.goals,
            icon: IconPigMoney,
            color: "teal",
          },
          {
            label: "Wallets",
            value: profile._count.wallets,
            icon: IconWallet,
            color: "grape",
          },
        ].map((stat) => (
          <Paper key={stat.label} p="md" radius="md" withBorder>
            <Group gap="sm">
              <ThemeIcon
                size={36}
                radius="xl"
                color={stat.color}
                variant="light"
              >
                <stat.icon size={18} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  {stat.label}
                </Text>
                <Text fw={700}>{stat.value}</Text>
              </div>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Edit Profile */}
      <Paper p="md" radius="md" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon size={32} radius="xl" variant="light" color="blue">
            <IconUser size={16} />
          </ThemeIcon>
          <Text fw={600}>Personal Info</Text>
        </Group>

        <Stack gap="sm">
          <TextInput
            label="Display Name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
          />
          <TextInput
            label="Email"
            value={profile.email}
            disabled
            description="Email is managed by Google and cannot be changed here"
          />
        </Stack>
      </Paper>

      {/* Payday Settings */}
      <Paper p="md" radius="md" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon size={32} radius="xl" variant="light" color="orange">
            <IconCalendar size={16} />
          </ThemeIcon>
          <div>
            <Text fw={600}>Payday Settings</Text>
            <Text size="xs" c="dimmed">
              Used for payday countdown on dashboard
            </Text>
          </div>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Select
            label="First Payday"
            description="e.g. 5th of the month"
            placeholder="Select day"
            data={PAYDAY_OPTIONS}
            value={form.payday}
            onChange={(val) =>
              setForm((f) => ({ ...f, payday: val }))
            }
            clearable
            searchable
          />
          <Select
            label="Second Payday"
            description="Leave blank if monthly"
            placeholder="Select day (optional)"
            data={PAYDAY_OPTIONS}
            value={form.payday2}
            onChange={(val) =>
              setForm((f) => ({ ...f, payday2: val }))
            }
            clearable
            searchable
          />
        </SimpleGrid>

        {form.payday && (
          <Text size="xs" c="dimmed" mt="xs">
            Dashboard will show countdown to your next payday
            {form.payday2 ? ` (${form.payday}th and ${form.payday2}th)` : ` (${form.payday}th)`}
          </Text>
        )}
      </Paper>

      {/* Income Settings */}
      <Paper p="md" radius="md" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon size={32} radius="xl" variant="light" color="green">
            <IconCash size={16} />
          </ThemeIcon>
          <div>
            <Text fw={600}>Income Settings</Text>
            <Text size="xs" c="dimmed">
              Used for savings rate calculation and AI suggestions
            </Text>
          </div>
        </Group>

        <NumberInput
          label="Expected Monthly Income (₱)"
          description="This is used as a reference. Log actual income in the Income page."
          placeholder="e.g. 25000"
          min={0}
          decimalScale={2}
          value={form.monthlyIncome}
          onChange={(val) =>
            setForm((f) => ({ ...f, monthlyIncome: Number(val) }))
          }
        />
      </Paper>

      {/* Save Button */}
      <Button
        leftSection={<IconDeviceFloppy size={16} />}
        loading={saving}
        onClick={handleSave}
        size="md"
      >
        Save Settings
      </Button>
    </Stack>
  )
}