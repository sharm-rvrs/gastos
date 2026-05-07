import {
  IconCash,
  IconBriefcase,
  IconTrendingUp,
  IconBuildingStore,
  IconGift,
  IconPackage,
} from "@tabler/icons-react";

export const INCOME_SOURCES = [
  { value: "SALARY", label: "Salary" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "COMMISSION", label: "Commission" },
  { value: "BUSINESS", label: "Business" },
  { value: "ALLOWANCE", label: "Allowance" },
  { value: "OTHER", label: "Other" },
];

export const SOURCE_COLORS: Record<string, string> = {
  SALARY: "blue",
  FREELANCE: "teal",
  COMMISSION: "green",
  BUSINESS: "grape",
  ALLOWANCE: "orange",
  OTHER: "gray",
};

export const SOURCE_ICONS: Record<string, React.ReactNode> = {
  SALARY: <IconCash size={16} />,
  FREELANCE: <IconBriefcase size={16} />,
  COMMISSION: <IconTrendingUp size={16} />,
  BUSINESS: <IconBuildingStore size={16} />,
  ALLOWANCE: <IconGift size={16} />,
  OTHER: <IconPackage size={16} />,
};
