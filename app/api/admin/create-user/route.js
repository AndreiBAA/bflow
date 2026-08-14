import { createClient } from "@supabase/supabase-js";

// Foloseste cheia secreta (server-only, NU e expusa in browser) ca sa creeze useri noi in Supabase Auth.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

export async function POST(request) {
    if (!supabaseUrl || !serviceKey) {
          return Response.json(
            { error: "SUPABASE_SECRET_KEY nu este configurat pe server." },
            { status: 500 }
                );
    }

  const { email, password, full_name, role } = await request.json();
    if (!email || !password) {
          return Response.json({ error: "Email si parola sunt obligatorii." }, { status: 400 });
    }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || null },
  });

  if (error) {
        return Response.json({ error: error.message }, { status: 400 });
  }

  if (role && role !== "member") {
        await admin.from("profiles").update({ role }).eq("id", data.user.id);
  }
    if (full_name) {
          await admin.from("profiles").update({ full_name }).eq("id", data.user.id);
    }

  return Response.json({ ok: true, userId: data.user.id });
}
