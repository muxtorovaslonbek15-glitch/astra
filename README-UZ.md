# ASTRA — kirish tizimi (Google + Telegram + Admin tasdiqlash)

## 1) GitHub'ga: shu papkadagi fayllarni loyiha ildiziga shu yo'l bilan tashlang (bor fayllarni almashtiring)

YANGI fayllar:
- supabase/schema.sql
- .env.example
- src/lib/supabase.ts
- src/lib/auth.tsx
- src/components/auth-gate.tsx
- src/components/telegram-login.tsx
- src/routes/admin.tsx
- src/routes/api/telegram-auth.ts
- src/routes/api/notify-approved.ts

ALMASHTIRILADIGAN (eski fayl o'rniga):
- package.json            (faqat @supabase/supabase-js qo'shildi)
- src/components/astra-shell.tsx
- src/routes/__root.tsx
- src/routeTree.gen.ts

## 2) Supabase
1. Yangi project oching. SQL Editor -> supabase/schema.sql ni to'liq ishga tushiring.
2. Authentication -> Providers -> Google: yoqing, Client ID/Secret kiriting.
   Google Cloud Console'da OAuth client yarating; "Authorized redirect URI":
   https://<PROJECT>.supabase.co/auth/v1/callback
3. Authentication -> URL Configuration: Site URL = Vercel manzilingiz,
   Redirect URLs ga ham shu manzilni qo'shing.
4. Email provider YOQILGAN bo'lib qolsin (Telegram kirishi shu orqali ishlaydi).

## 3) Telegram bot
1. @BotFather -> /newbot (yoki mavjud bot) -> token oling.
2. @BotFather -> /setdomain -> botni tanlang -> Vercel domeningiz (masalan astra.vercel.app).

## 4) Vercel -> Settings -> Environment Variables (so'ng Redeploy)
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TELEGRAM_BOT_USERNAME,
SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN   (namuna: .env.example)

## 5) Birinchi admin
Saytga o'zingiz bir marta kiring, keyin SQL Editor'da schema.sql oxiridagi
"update ... role='admin'" so'rovini o'zingizning email/Telegram ID bilan ishga tushiring.
Shundan keyin yon menyuda "Admin panel" chiqadi.
