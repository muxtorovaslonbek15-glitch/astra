import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, X, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { getSupabase, type Profile } from '@/lib/supabase';
import { pageHead } from '@/lib/subjects';

export const Route = createFileRoute('/admin')({
  head: () => pageHead('Admin panel', 'ASTRA foydalanuvchilarini tasdiqlash'),
  component: AdminPage,
});

type Filter = 'pending' | 'approved' | 'rejected' | 'all';
const labels: Record<Filter, string> = { pending: 'Kutilayotgan', approved: 'Tasdiqlangan', rejected: 'Rad etilgan', all: 'Hammasi' };

function AdminPage() {
  const { profile, session } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await getSupabase().from('profiles').select('*').order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setUsers((data as Profile[]) ?? []);
  }, []);

  useEffect(() => {
    if (profile?.role === 'admin') void load();
  }, [profile?.role, load]);

  async function setStatus(u: Profile, status: Profile['status']) {
    setBusyId(u.id);
    setError(null);
    const { error: err } = await getSupabase()
      .from('profiles')
      .update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null })
      .eq('id', u.id);
    if (err) setError(err.message);
    else {
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, status } : x)));
      if (status === 'approved' && u.telegram_id && session) {
        void fetch('/api/notify-approved', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ userId: u.id }),
        }).catch(() => undefined);
      }
    }
    setBusyId(null);
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (filter === 'all' || u.status === filter) &&
        (!q || [u.full_name, u.email, u.telegram_username].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [users, filter, query]);

  if (profile?.role !== 'admin') {
    return (
      <div className="content-page">
        <Link to="/" className="back-link"><ArrowLeft /> Bosh sahifa</Link>
        <div className="empty-state"><ShieldCheck /><h2>Ruxsat yo‘q</h2><p>Bu bo‘lim faqat administratorlar uchun.</p></div>
      </div>
    );
  }

  const count = (f: Filter) => (f === 'all' ? users.length : users.filter((u) => u.status === f).length);

  return (
    <div className="content-page">
      <Link to="/" className="back-link"><ArrowLeft /> Bosh sahifa</Link>
      <div className="page-heading">
        <span className="eyebrow">ASTRA / ADMIN</span>
        <h1>Foydalanuvchilar</h1>
        <p>Yangi foydalanuvchilarni tasdiqlang — shundan so‘ng ularga fanlar ochiladi.</p>
      </div>

      <div className="filter-bar">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(labels) as Filter[]).map((f) => (
            <Button key={f} variant={filter === f ? 'cosmic' : 'glass'} onClick={() => setFilter(f)}>
              {labels[f]} ({count(f)})
            </Button>
          ))}
          <Button variant="ghost" size="icon" aria-label="Yangilash" onClick={() => void load()}><RefreshCw /></Button>
        </div>
        <label className="search-box"><Search /><input placeholder="Ism, email yoki @username…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-3">
        {shown.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card/70 p-4">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="user-avatar">{(u.full_name ?? '?').charAt(0).toUpperCase()}</div>
            )}
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{u.full_name ?? 'Ismsiz'} {u.role === 'admin' && <span className="eyebrow ml-2">ADMIN</span>}</strong>
              <small className="block truncate text-xs text-muted-foreground">
                {u.provider === 'telegram' ? `Telegram${u.telegram_username ? ` · @${u.telegram_username}` : ''} · ID ${u.telegram_id}` : `Google · ${u.email ?? ''}`}
                {' · '}{new Date(u.created_at).toLocaleDateString('uz-UZ')}
              </small>
            </div>
            <span className="eyebrow">{labels[u.status as Filter]?.toUpperCase()}</span>
            {u.role !== 'admin' && (
              <div className="flex gap-2">
                {u.status !== 'approved' && (
                  <Button variant="cosmic" size="sm" disabled={busyId === u.id} onClick={() => void setStatus(u, 'approved')}><Check /> Tasdiqlash</Button>
                )}
                {u.status !== 'rejected' && (
                  <Button variant="glass" size="sm" disabled={busyId === u.id} onClick={() => void setStatus(u, 'rejected')}><X /> {u.status === 'approved' ? 'Bloklash' : 'Rad etish'}</Button>
                )}
              </div>
            )}
          </div>
        ))}
        {!shown.length && <div className="empty-state"><ShieldCheck /><h2>Hech kim topilmadi</h2></div>}
      </div>
    </div>
  );
}
