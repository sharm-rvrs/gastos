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
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconWallet,
  IconCreditCard,
} from "@tabler/icons-react";
import {
  WalletIcon,
  WALLET_TYPES,
  WALLET_COLORS,
  WALLET_SELECT_DATA,
} from "@/components/ui/WalletIcon";

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: string;
  color: string | null;
  icon: string | null;
}

const emptyForm = {
  name: "",
  type: "",
  balance: 0 as number,
};

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/wallets");
      const data = await res.json();
      setWallets(data);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to load wallets",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleOpen = (wallet?: Wallet) => {
    if (wallet) {
      setEditingWallet(wallet);
      setForm({
        name: wallet.name,
        type: wallet.type,
        balance: parseFloat(wallet.balance),
      });
    } else {
      setEditingWallet(null);
      setForm(emptyForm);
    }
    open();
  };

  const handleSave = async () => {
    if (!form.name || !form.type) {
      notifications.show({
        title: "Missing fields",
        message: "Please fill in name and type",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingWallet
        ? `/api/wallets/${editingWallet.id}`
        : "/api/wallets";
      const method = editingWallet ? "PUT" : "POST";

      const walletType = WALLET_TYPES.find((w) => w.value === form.type);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          balance: form.balance,
          color: walletType?.color ?? "gray",
          icon: walletType?.value ?? "OTHER",
        }),
      });

      if (!res.ok) throw new Error("Failed to save wallet");

      notifications.show({
        title: editingWallet ? "Wallet updated!" : "Wallet added!",
        message: `${form.name} has been ${editingWallet ? "updated" : "added"} successfully`,
        color: "green",
      });

      close();
      fetchWallets();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save wallet",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setWallets((prev) => prev.filter((w) => w.id !== id));
      notifications.show({
        title: "Deleted",
        message: "Wallet removed successfully",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete wallet",
        color: "red",
      });
    }
  };

  const totalBalance = wallets.reduce(
    (sum, w) => sum + parseFloat(w.balance),
    0,
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Group gap="sm" align="center">
            <ThemeIcon size={34} radius="xl" variant="light">
              <IconCreditCard size={18} />
            </ThemeIcon>
            <Title order={2}>Wallets</Title>
          </Group>
          <Text c="dimmed" size="sm">
            Track your GCash, Maya, Cash and other balances
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleOpen()}
        >
          Add Wallet
        </Button>
      </Group>

      {/* Total Balance */}
      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
          Total Balance Across All Wallets
        </Text>
        <Text size="2rem" fw={700} c="blue" mt={4}>
          ₱{totalBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          {wallets.length} wallet{wallets.length !== 1 ? "s" : ""} tracked
        </Text>
      </Paper>

      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : wallets.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <ThemeIcon size={48} radius="xl" variant="light" color="blue">
              <IconWallet size={24} />
            </ThemeIcon>
            <Text fw={500}>No wallets yet</Text>
            <Text c="dimmed" size="sm" ta="center">
              Add your GCash, Maya, cash, or bank accounts to track your money
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => handleOpen()}
            >
              Add your first wallet
            </Button>
          </Stack>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {wallets.map((wallet) => (
            <Paper key={wallet.id} p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Group gap="sm">
                  <WalletIcon type={wallet.type} size={18} />
                  <div>
                    <Text fw={600} size="sm">
                      {wallet.name}
                    </Text>
                    <Badge
                      size="xs"
                      color={WALLET_COLORS[wallet.type] ?? "gray"}
                      variant="light"
                    >
                      {WALLET_TYPES.find((t) => t.value === wallet.type)
                        ?.label ?? wallet.type}
                    </Badge>
                  </div>
                </Group>
                <Group gap={4}>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    size="sm"
                    onClick={() => handleOpen(wallet)}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => handleDelete(wallet.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
              <Text size="xl" fw={700} c={WALLET_COLORS[wallet.type] ?? "gray"}>
                ₱
                {parseFloat(wallet.balance).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      {/* Add / Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingWallet ? "Edit Wallet" : "Add New Wallet"}
        centered
      >
        <Stack gap="sm">
          <Select
            label="Wallet Type"
            placeholder="Select type"
            data={WALLET_SELECT_DATA}
            value={form.type}
            onChange={(val) => {
              const walletType = WALLET_TYPES.find((w) => w.value === val);
              setForm((f) => ({
                ...f,
                type: val ?? "",
                name: walletType?.label ?? f.name,
              }));
            }}
            required
          />
          <TextInput
            label="Wallet Name"
            placeholder="e.g. My GCash, BDO Savings..."
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <NumberInput
            label="Current Balance (₱)"
            placeholder="0.00"
            min={0}
            decimalScale={2}
            value={form.balance}
            onChange={(val) => setForm((f) => ({ ...f, balance: Number(val) }))}
          />

          {/* Preview */}
          {form.type && (
            <Paper p="sm" radius="md" withBorder>
              <Group gap="sm">
                <WalletIcon type={form.type} size={18} />
                <div>
                  <Text size="sm" fw={600}>
                    {form.name || "Wallet Preview"}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ₱
                    {form.balance.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </div>
              </Group>
            </Paper>
          )}

          <Button onClick={handleSave} loading={saving} fullWidth>
            {editingWallet ? "Save Changes" : "Add Wallet"}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
