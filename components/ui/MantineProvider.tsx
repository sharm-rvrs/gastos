"use client";

import {
  MantineProvider,
  localStorageColorSchemeManager,
  createTheme,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({});

const colorSchemeManager = localStorageColorSchemeManager({
  key: "gastos-color-scheme",
});

export default function MantineAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
      colorSchemeManager={colorSchemeManager}
    >
      <Notifications />
      {children}
    </MantineProvider>
  );
}
