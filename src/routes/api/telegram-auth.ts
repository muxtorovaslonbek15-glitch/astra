import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

// Telegram Login Widget imzosini tekshirish:
// https://core.telegram.org/widgets/login#checking-authorization
async function verifyTelegram(data: Record<string, unknown>, botToken: string) {
  const { hash, ...rest } = data;
  if (typeof hash !== 'string') return false;
  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');
  const secret = await crypto.subtle.digest('SHA-256', enc.encode(botToken));
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = hex(await crypto.subtle.sign('HMAC', key, enc.encode(checkString)));
  if (sig.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const Route = createFileRoute('/api/telegram-auth')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const botToken = process.env['TELEGRAM_BOT_TOKEN'];
        const url = process.env['VITE_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
        const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
        if (!botToken || !url || !serviceKey) return json({ error: 'Server sozlanmagan (env o‘zgaruvchilar yo‘q)' }, 500);

        let data: Record<string, unknown>;
        try {
          data = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: 'Noto‘g‘ri so‘rov' }, 400);
        }

        if (!(await verifyTelegram(data, botToken))) return json({ error: 'Telegram imzosi noto‘g‘ri' }, 401);
        const authDate = Number(data['auth_date']);
        if (!authDate || Date.now() / 1000 - authDate > 86400) return json({ error: 'Telegram so‘rovi eskirgan, qayta urinib ko‘ring' }, 401);

        const tgId = Number(data['id']);
        if (!tgId) return json({ error: 'Telegram ID topilmadi' }, 400);

        const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const email = `tg_${tgId}@telegram.astra.local`;
        const fullName = [data['first_name'], data['last_name']].filter(Boolean).join(' ') || String(data['username'] ?? `Telegram ${tgId}`);

        const created = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            avatar_url: data['photo_url'] ?? null,
            telegram_id: tgId,
            telegram_username: data['username'] ?? null,
          },
        });
        // Allaqachon mavjud bo'lsa — xato emas, davom etamiz
        if (created.error && !/already|registered|exists/i.test(created.error.message)) {
          return json({ error: created.error.message }, 500);
        }

        const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
        const tokenHash = link.data?.properties?.hashed_token;
        if (link.error || !tokenHash) return json({ error: link.error?.message ?? 'Sessiya yaratib bo‘lmadi' }, 500);

        return json({ token_hash: tokenHash });
      },
    },
  },
});
