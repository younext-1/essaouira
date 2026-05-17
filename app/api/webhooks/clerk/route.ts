import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    console.error("Invalid webhook signature");
    return new Response("Invalid webhook", { status: 400 });
  }

  const supabase = createAdminClient();

  // ── user.created ──────────────────────
  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url, username } =
      evt.data;

    const fullName = [first_name, last_name].filter(Boolean).join(" ");
    const baseUsername =
      username || email_addresses?.[0]?.email_address?.split("@")[0] || id.slice(0, 8);

    // Ensure unique username
    let finalUsername = baseUsername;
    let counter = 1;
    while (true) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", finalUsername)
        .maybeSingle();
      if (!existing) break;
      finalUsername = `${baseUsername}${counter++}`;
    }

    await supabase.from("profiles").insert({
      clerk_id: id,
      email: email_addresses?.[0]?.email_address ?? null,
      full_name: fullName || finalUsername,
      username: finalUsername,
      avatar_url: image_url || null,
      role: "tourist",
      is_tourist: true,
      is_artisan: false,
      onboarding_done: false,
    });
  }

  // ── user.updated ──────────────────────
  if (evt.type === "user.updated") {
    const { id, first_name, last_name, image_url, username } = evt.data;

    const fullName = [first_name, last_name].filter(Boolean).join(" ");

    await supabase
      .from("profiles")
      .update({
        full_name: fullName || undefined,
        username: username || undefined,
        avatar_url: image_url || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", id);
  }

  // ── user.deleted ──────────────────────
  if (evt.type === "user.deleted") {
    if (evt.data.id) {
      await supabase.from("profiles").delete().eq("clerk_id", evt.data.id);
    }
  }

  return new Response("OK", { status: 200 });
}
