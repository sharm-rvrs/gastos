import { ThemeIcon } from "@mantine/core";
import type { ComponentType } from "react";
import {
  IconHome,
  IconShoppingCart,
  IconCar,
  IconBowlSpoon,
  IconBulb,
  IconDeviceGamepad2,
  IconHeart,
  IconPigMoney,
  IconPackage,
} from "@tabler/icons-react";

export const CATEGORIES = [
  { value: "RENT", label: "Rent" },
  { value: "GROCERIES", label: "Groceries" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "FOOD", label: "Food" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "LEISURE", label: "Leisure" },
  { value: "HEALTH", label: "Health" },
  { value: "SAVINGS", label: "Savings" },
  { value: "OTHER", label: "Other" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

export const CATEGORY_COLORS: Record<string, string> = {
  RENT: "blue",
  GROCERIES: "green",
  TRANSPORT: "yellow",
  FOOD: "orange",
  UTILITIES: "cyan",
  LEISURE: "grape",
  HEALTH: "red",
  SAVINGS: "teal",
  OTHER: "gray",
};

const CATEGORY_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  RENT: IconHome,
  GROCERIES: IconShoppingCart,
  TRANSPORT: IconCar,
  FOOD: IconBowlSpoon,
  UTILITIES: IconBulb,
  LEISURE: IconDeviceGamepad2,
  HEALTH: IconHeart,
  SAVINGS: IconPigMoney,
  OTHER: IconPackage,
};

export const CATEGORY_SELECT_DATA = CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

export function CategoryIcon({
  category,
  size = 16,
}: {
  category: string;
  size?: number;
}) {
  const Icon = CATEGORY_ICONS[category] ?? IconPackage;
  const color = CATEGORY_COLORS[category] ?? "gray";

  return (
    <ThemeIcon size={size + 10} radius="xl" color={color} variant="light">
      <Icon size={size} />
    </ThemeIcon>
  );
}
