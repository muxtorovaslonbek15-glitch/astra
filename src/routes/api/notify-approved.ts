import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// Admin foydalanuvchini tasdiqlaganda, u Telegram orqali kirgan bo'lsa bot xabar yuboradi.
export const Route = createFileRoute('/api/notify-approved')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const botToken = process.env['TELEGRAM_BOT_TOKEN'];
        const url = process.env['VITE_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
        const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
        if (!botToken || !url || !serviceKey) return json({ error: 'Server sozlanmagan' }, 500);

        const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!token) return json({ error: 'Token yo‘q' }, 401);

        const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data: caller } = await admin.auth.getUser(token);
        if (!caller.user) return json({ error: 'Ruxsat yo‘q' }, 401);
        const { data: me } = await admin.from('profiles').select('role').eq('id', caller.user.id).maybeSingle();
        if (me?.role !== 'admin') return json({ error: 'Faqat admin' }, 403);

        const { userId } = (await request.json().catch(() => ({}))) as { userId?: string };
        if (!userId) return json({ error: 'userId kerak' }, 400);
        const { data: target } = await admin
          .from('profiles')
          .select('telegram_id,status,full_name')
          .eq('id', userId)
          .maybeSingle();
        if (!target?.telegram_id || target.status !== 'approved') return json({ sent: false });

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: target.telegram_id,
            text: '✅ ASTRA: hisobingiz tasdiqlandi! Endi saytga kirib barcha fanlardan foydalanishingiz mumkin.',
          }),
        });
        return json({ sent: res.ok });
      },
    },
  },
});
