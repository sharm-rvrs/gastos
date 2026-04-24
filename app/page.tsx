import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db.server";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const dbUser = await db.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!dbUser?.onboardingDone) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
