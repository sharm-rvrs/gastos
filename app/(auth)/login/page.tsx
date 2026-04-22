"use client";

import { signIn } from "next-auth/react";
import { Button, Container, Paper, Text, Title, Stack } from "@mantine/core";

export default function LoginPage() {
  return (
    <Container size={420} style={{ marginTop: "20vh" }}>
      <Paper radius="md" p="xl" withBorder>
        <Stack align="center" gap="md">
          <Title order={1} style={{ fontSize: 32 }}>
            💸 Gastos
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Your personal budget tracker for Manila life
          </Text>
          <Text c="dimmed" size="xs" ta="center">
            Track expenses, set budgets, and get AI-powered insights
          </Text>
          <Button
            fullWidth
            size="md"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Sign in with Google
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
