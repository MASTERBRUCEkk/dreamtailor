import { createSessionClient } from "@/lib/supabase/sessionServer";

export async function getAdminSession() {
  const supabase = createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { isAdmin: false, userId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return { isAdmin: !!profile?.is_admin, userId: user.id };
}
