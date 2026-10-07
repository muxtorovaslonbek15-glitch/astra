import { useCallback, useState } from 'react';
import { Lock, Clock, ShieldX, LogOut, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TelegramLogin } from '@/components/telegram-login';
import { useAuth } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

function Panel({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-lg border border-border bg-card/80 p-8 text-center backdrop-blur">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border border-border bg-accent text-[var(--cyan)] [&_svg]:h-6 [&_svg]:w-6">
          {icon}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
        <div className="mt-6 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}

export function AuthGate() {
  const { session, profile, loading, signInWithGoogle, signInWithTelegram, signOut, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onTelegram = useCallback(
    async (data: Record<string, unknown>) => {
      setBusy(true);
      setError(await signInWithTelegram(data));
      setBusy(false);
    },
    [signInWithTelegram],
  );

  if (!isSupabaseConfigured()) {
    return (
      <Panel
        icon={<ShieldX />}
        title="Supabase ulanmagan"
        text="Vercel → Settings → Environment Variables ichiga VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY qo‘shing, so‘ng qayta deploy qiling."
      />
    );
  }

  if (loading) {
    return <Panel icon={<Sparkles />} title="Yuklanmoqda…" text="Iltimos, kuting." />;
  }

  if (!session) {
    return (
      <Panel icon={<Lock />} title="ASTRA’ga kirish" text="Fanlar olamiga kirish uchun hisobingiz bilan tizimga kiring. Ro‘yxatdan o‘tgach, admin tasdiqlashi kerak.">
        <Button variant="cosmic" size="lg" disabled={busy} onClick={() => void signInWithGoogle()}>
          <svg viewBox="0 0 24 24" className="!size-4" aria-hidden="true">
            <path fill="#fff" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.64 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.7 14.55 2.8 12 2.8 6.99 2.8 2.94 6.85 2.94 11.86S6.99 20.92 12 20.92c5.78 0 9.6-4.06 9.6-9.78 0-.66-.07-1.16-.25-1.64z" />
          </svg>
          Google orqali kirish
        </Button>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          yoki
          <span className="h-px flex-1 bg-border" />
        </div>
        <TelegramLogin onAuth={onTelegram} />
        {busy && <p className="text-xs text-muted-foreground">Telegram tekshirilmoqda…</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </Panel>
    );
  }

  if (!profile) {
    return (
      <Panel icon={<Sparkles />} title="Profil tayyorlanmoqda…" text="Agar bu uzoq davom etsa, sahifani yangilang yoki qayta kiring.">
        <Button variant="glass" onClick={() => void refreshProfile()}><RefreshCw /> Yangilash</Button>
        <Button variant="ghost" onClick={() => void signOut()}><LogOut /> Chiqish</Button>
      </Panel>
    );
  }

  if (profile.status === 'rejected') {
    return (
      <Panel icon={<ShieldX />} title="Kirish rad etildi" text="Hisobingiz admin tomonidan tasdiqlanmadi. Savollar bo‘lsa, administrator bilan bog‘laning.">
        <Button variant="ghost" onClick={() => void signOut()}><LogOut /> Chiqish</Button>
      </Panel>
    );
  }

  // pending
  return (
    <Panel
      icon={<Clock />}
      title="Tasdiqlanish kutilmoqda"
      text={`Salom, ${profile.full_name ?? 'foydalanuvchi'}! Barcha fanlar hozircha qulflangan. Admin hisobingizni tasdiqlagach, ular avtomatik ochiladi.`}
    >
      <Button variant="glass" onClick={() => void refreshProfile()}><RefreshCw /> Holatni tekshirish</Button>
      <Button variant="ghost" onClick={() => void signOut()}><LogOut /> Chiqish</Button>
    </Panel>
  );
}
