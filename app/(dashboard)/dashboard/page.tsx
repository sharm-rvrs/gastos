import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Text, Title, Stack, SimpleGrid, Paper } from "@mantine/core";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Good day, {session.user?.name?.split(" ")[0]}!</Title>
        <Text c="dimmed" size="sm">
          Here is your financial overview for this month.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {[
          { label: "Total Spent", value: "₱0.00", color: "#1a1a2e" },
          { label: "Total Budget", value: "₱0.00", color: "#1a1a2e" },
          { label: "Remaining", value: "₱0.00", color: "green" },
          { label: "Savings Rate", value: "0%", color: "blue" },
        ].map((card) => (
          <Paper key={card.label} p="md" radius="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
              {card.label}
            </Text>
            <Text size="xl" fw={700} c={card.color} mt={4}>
              {card.value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder>
        <Text c="dimmed" ta="center" py="xl">
          No expenses yet. Start by adding your first expense!
        </Text>
      </Paper>
    </Stack>
  );
}
