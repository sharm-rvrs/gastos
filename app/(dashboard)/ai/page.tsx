import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  ThemeIcon,
} from "@mantine/core";
import { IconRobot } from "@tabler/icons-react";
import AIChat from "@/components/ai/AIChat";

export default function AIPage() {
  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Group gap="sm" mb={4}>
            <ThemeIcon size={34} radius="xl" variant="light">
              <IconRobot size={18} />
            </ThemeIcon>
            <Title order={2}>Peso Buddy AI</Title>
            <Badge color="teal" variant="light" size="sm">
              Powered by Groq
            </Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Your personal Filipino finance assistant — tipid tips, budget
            advice, and more!
          </Text>
        </div>
      </Group>

      {/* Feature hints */}
      <Group gap="xs">
        {[
          "Knows your expenses",
          "Tracks your budgets",
          "Monitors your goals",
          "Manila-aware tips",
        ].map((hint) => (
          <Badge key={hint} variant="light" color="gray" size="sm">
            {hint}
          </Badge>
        ))}
      </Group>

      {/* Chat */}
      <Paper p="md" radius="md" withBorder>
        <AIChat />
      </Paper>
    </Stack>
  );
}
