import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onAstraTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

export function TelegramLogin({ onAuth }: { onAuth: (user: Record<string, unknown>) => void }) {
  const box = useRef<HTMLDivElement | null>(null);
  const bot = import.meta.env['VITE_TELEGRAM_BOT_USERNAME'] as string | undefined;

  useEffect(() => {
    if (!bot || !box.current) return;
    window.onAstraTelegramAuth = onAuth;
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', 'onAstraTelegramAuth(user)');
    box.current.innerHTML = '';
    box.current.appendChild(script);
    return () => {
      delete window.onAstraTelegramAuth;
    };
  }, [bot, onAuth]);

  if (!bot) {
    return <p className="text-xs text-muted-foreground">Telegram bot sozlanmagan (VITE_TELEGRAM_BOT_USERNAME).</p>;
  }
  return <div ref={box} className="flex min-h-[40px] justify-center" />;
}
