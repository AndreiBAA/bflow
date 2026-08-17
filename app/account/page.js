"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

useEffect(() => {
  async function load() {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      router.push("/login");
      return;
    }
    setUser(data.user);
    const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    setProfile(profileRow || null);
    setFullName(profileRow?.full_name || "");
    setLoading(false);
  }
  load();
}, [router]);

async function handleSaveName(e) {
  e.preventDefault();
  setSavingName(true);
  setError(null);
  setMessage(null);
  const { error: updErr } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  setSavingName(false);
  if (updErr) {
    setError(updErr.message);
    return;
  }
  setProfile((prev) => ({ ...prev, full_name: fullName }));
  setMessage("Nume actualizat.");
}

async function handleChangePassword(e) {
  e.preventDefault();
  if (!newPassword || newPassword.length < 6) {
    setError("Parola trebuie sa aiba cel putin 6 caractere.");
    return;
  }
  setSavingPassword(true);
  setError(null);
  setMessage(null);
  const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
  setSavingPassword(false);
  if (updErr) {
    setError(updErr.message);
    return;
  }
  setNewPassword("");
  setMessage("Parola a fost schimbata.");
}

async function handleAvatarUpload(e) {
  const file = e.target.files?.[0];
  if (!file || !user) return;
  setUploadingAvatar(true);
  setError(null);
  setMessage(null);
  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (upErr) {
    setUploadingAvatar(false);
    setError(upErr.message);
    return;
  }
  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = urlData?.publicUrl || null;
  const { error: updErr } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
  setUploadingAvatar(false);
  if (updErr) {
    setError(updErr.message);
    return;
  }
  setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
  setMessage("Poza de profil a fost actualizata.");
  e.target.value = "";
}

if (loading) {
  return (
    <main className="min-h-screen flex items-center justify-center">
    <div className="text-gray-500 text-sm">Se incarca...</div>
    </main>
  );
}

return (
  <main className="min-h-screen flex flex-col items-center px-4 py-10">
  <div className="w-full max-w-md space-y-6">
  <div className="flex items-center justify-between">
  <h1 className="text-lg font-semibold text-gray-100">Contul meu</h1>
  <Link href="/" className="text-sm text-gray-400 hover:text-gray-200">
  Inapoi la board
  </Link>
  </div>

  {error && (
    <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-md">
  {error}
    </div>
   )}
{message && (
  <div className="bg-green-950 border border-green-800 text-green-300 text-sm px-3 py-2 rounded-md">
{message}
  </div>
 )}

<div className="bg-[#151824] border border-gray-800 rounded-lg p-5 space-y-3">
  <div>
  <div className="text-xs text-gray-500">Email</div>
  <div className="text-sm text-gray-200">{user?.email}</div>
  </div>
<div>
  <div className="text-xs text-gray-500">Rol</div>
<div className="text-sm text-gray-200 capitalize">{profile?.role || "member"}</div>
  </div>
  </div>

<div className="bg-[#151824] border border-gray-800 rounded-lg p-5 space-y-3">
  <div className="text-sm font-medium text-gray-200">Poza de profil</div>
<div className="flex items-center gap-4">
  <span className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold uppercase overflow-hidden shrink-0">
{profile?.avatar_url ? (
  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
  ) : (
    (profile?.full_name || user?.email || "?").slice(0, 1)
)}
</span>
<label className="cursor-pointer bg-[#0f1117] border border-gray-700 hover:border-gray-500 rounded-md px-3 py-1.5 text-sm text-gray-300">
{uploadingAvatar ? "Se incarca..." : "Alege o poza"}
<input
type="file"
accept="image/*"
onChange={handleAvatarUpload}
disabled={uploadingAvatar}
className="hidden"
/>
  </label>
  </div>
  </div>

<form onSubmit={handleSaveName} className="bg-[#151824] border border-gray-800 rounded-lg p-5 space-y-3">
  <div className="text-sm font-medium text-gray-200">Nume complet</div>
<input
type="text"
value={fullName}
onChange={(e) => setFullName(e.target.value)}
placeholder="Nume si prenume"
className="w-full bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
  />
  <button
type="submit"
disabled={savingName}
className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-md"
>
{savingName ? "Se salveaza..." : "Salveaza numele"}
</button>
  </form>

<form onSubmit={handleChangePassword} className="bg-[#151824] border border-gray-800 rounded-lg p-5 space-y-3">
  <div className="text-sm font-medium text-gray-200">Schimba parola</div>
<input
type="password"
value={newPassword}
onChange={(e) => setNewPassword(e.target.value)}
placeholder="Parola noua (min. 6 caractere)"
className="w-full bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
/>
  <button
type="submit"
disabled={savingPassword}
className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-md"
>
{savingPassword ? "Se salveaza..." : "Schimba parola"}
</button>
  </form>
  </div>
  </main>
);
}
