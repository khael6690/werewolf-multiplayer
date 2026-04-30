import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase/server";

export default async function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  return <>{children}</>;
}
