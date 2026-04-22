import type { Metadata } from "next";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/ui/SessionProvider";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";

export const metadata: Metadata = {
  title: "Gastos — Personal Budget Tracker",
  description: "Track your expenses and budget smarter in Manila",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <SessionProvider session={session}>
          <MantineProvider>
            <Notifications />
            {children}
          </MantineProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
