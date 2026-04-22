"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Avatar,
  Menu,
  Stack,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLayoutDashboard,
  IconReceipt,
  IconWallet,
  IconPigMoney,
  IconRobot,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "Expenses", href: "/expenses", icon: IconReceipt },
  { label: "Budgets", href: "/budgets", icon: IconWallet },
  { label: "Goals", href: "/goals", icon: IconPigMoney },
  { label: "Peso Buddy AI", href: "/ai", icon: IconRobot },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text fw={700} size="lg">
              💸 Gastos
            </Text>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Avatar
                src={session?.user?.image}
                alt={session?.user?.name ?? "User"}
                radius="xl"
                size="sm"
                style={{ cursor: "pointer" }}
              />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{session?.user?.email}</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />}>
                {session?.user?.name}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={14} />}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={4}>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              label={item.label}
              leftSection={<item.icon size={18} />}
              active={pathname === item.href}
              onClick={() => router.push(item.href)}
              style={{ borderRadius: 8 }}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
