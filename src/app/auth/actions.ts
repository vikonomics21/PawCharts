"use server";

import { redirect } from "next/navigation";

import { getSiteUrl } from "@/lib/site-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/?auth=signin-error");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
