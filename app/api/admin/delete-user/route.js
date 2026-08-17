import { createClient } from "@supabase/supabase-js";

// Foloseste cheia secreta (server-only) ca sa stearga useri din Supabase Auth + profilul lor.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

export async function POST(request) {
    if (!supabaseUrl || !serviceKey) {
          return Response.json(
            { error: "SUPABASE_SECRET_KEY nu este configurat pe server." },
            { status: 500 }
                );
    }

  const { userId } = await request.json();
    if (!userId) {
          return Response.json({ error: "userId este obligatoriu." }, { status: 400 });
    }

  const admin = createClient(supabaseUrl, serviceKey);

  const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
          return Response.json({ error: error.message }, { status: 400 });
    }

  await admin.from("profiles").delete().eq("id", userId);

  return Response.json({ ok: true });
}
