import { getServerSession } from "next-auth";
import { LoginPanel } from "@/app/login-panel";
import { DashboardClient } from "@/app/dashboard-client";
import { getAuthOptions } from "@/lib/auth";
import { getDevBypassUser } from "@/lib/dev-auth";

export default async function Home() {
  const devUser = getDevBypassUser();
  if (devUser) {
    return (
      <DashboardClient
        user={{
          id: devUser.id,
          name: devUser.name,
          email: devUser.email,
        }}
      />
    );
  }

  const session = await getServerSession(getAuthOptions());

  if (!session?.user?.id) {
    return <LoginPanel />;
  }

  return (
    <DashboardClient
      user={{
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? "User",
        email: session.user.email ?? null,
      }}
    />
  );
}
