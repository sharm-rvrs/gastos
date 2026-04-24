import {
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconWallet,
} from "@tabler/icons-react";
import { ThemeIcon } from "@mantine/core";

export const WALLET_TYPES = [
  { value: "CASH", label: "Cash", icon: IconCash, color: "green" },
  { value: "GCASH", label: "GCash", icon: IconDeviceMobile, color: "blue" },
  { value: "MAYA", label: "Maya", icon: IconDeviceMobile, color: "teal" },
  {
    value: "CREDIT_CARD",
    label: "Credit Card",
    icon: IconCreditCard,
    color: "grape",
  },
  {
    value: "DEBIT_CARD",
    label: "Debit Card",
    icon: IconCreditCard,
    color: "orange",
  },
  { value: "BANK", label: "Bank", icon: IconBuildingBank, color: "cyan" },
  { value: "OTHER", label: "Other", icon: IconWallet, color: "gray" },
];

export const WALLET_COLORS: Record<string, string> = {
  CASH: "green",
  GCASH: "blue",
  MAYA: "teal",
  CREDIT_CARD: "grape",
  DEBIT_CARD: "orange",
  BANK: "cyan",
  OTHER: "gray",
};

export const WALLET_SELECT_DATA = WALLET_TYPES.map((w) => ({
  value: w.value,
  label: w.label,
}));

export function WalletIcon({
  type,
  size = 16,
}: {
  type: string;
  size?: number;
}) {
  const wallet = WALLET_TYPES.find((w) => w.value === type);
  if (!wallet) return null;
  const Icon = wallet.icon;
  return (
    <ThemeIcon
      size={size + 10}
      radius="xl"
      color={wallet.color}
      variant="light"
    >
      <Icon size={size} />
    </ThemeIcon>
  );
}
