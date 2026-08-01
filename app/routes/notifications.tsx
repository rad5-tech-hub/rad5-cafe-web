import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { PillButton } from '~/components/ui/pill-button';
import { Icon } from '~/components/ui/icon';
import { NotificationRow, type NotificationItem } from '~/components/notifications/notification-row';

export function meta() {
  return [
    { title: "Notifications - RAD5 Café" },
    { name: "description", content: "Stay updated on your orders and transactions." },
  ];
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return new Date(val).toISOString();
    if (typeof val === 'object') {
      if (typeof val.toDate === 'function') return val.toDate().toISOString();
      if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
      if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
    }
    return new Date(val).toISOString();
  };

  const fetchNotifications = (pageNum: number) => {
    setLoading(true);
    api.notifications.list(pageNum, limit)
      .then((res: any) => {
        const rawList = res.data || res.notifications;
        if (res.success && Array.isArray(rawList)) {
          const parsed = rawList.map((raw: any) => ({
            id: raw.id ?? raw._id,
            title: raw.title ?? 'Alert',
            body: raw.body ?? raw.message ?? '',
            category: raw.category ?? raw.type ?? 'general',
            createdAt: parseDate(raw.createdAt ?? raw.date),
            read: raw.read ?? raw.isRead ?? false,
          }));
          setItems(parsed);
          const total = res.total ?? parsed.length;
          setTotalPages(res.totalPages ?? Math.ceil(total / limit));
        } else {
          setItems([]);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  useEffect(() => {
    if (page > 1) fetchNotifications(page);
  }, [page]);

  const markAsRead = (id: string) => {
    const target = items.find((n) => n.id === id);
    if (target && !target.read) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      api.notifications.read(id).catch((err) => console.error('Failed to mark notification as read on server:', err));
    }
  };

  const markAllRead = () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      unreadIds.forEach((id) => api.notifications.read(id).catch((err) => console.error(`Failed to mark notification ${id} as read on server:`, err)));
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  const groupByDate = (notifs: NotificationItem[]) => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterdayStr = new Date(now.getTime() - 86400000).toDateString();

    notifs.forEach((n) => {
      const d = new Date(n.createdAt).toDateString();
      if (d === todayStr) today.push(n);
      else if (d === yesterdayStr) yesterday.push(n);
      else earlier.push(n);
    });

    return [
      { label: 'Today', list: today },
      { label: 'Yesterday', list: yesterday },
      { label: 'Earlier', list: earlier },
    ].filter((g) => g.list.length > 0);
  };

  const grouped = groupByDate(items);

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
        {unreadCount > 0 && (
          <p className="text-text-secondary text-xs mt-1">
            You have {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <PillButton onClick={markAllRead} disabled={unreadCount === 0} className="disabled:opacity-50 disabled:cursor-not-allowed">
          Mark all read
        </PillButton>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shimmer h-[74px] rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-surface rounded-2xl py-16 flex flex-col items-center justify-center gap-3 text-center">
          <Icon name="bell" size={38} className="text-text-secondary" />
          <span className="font-bold text-base">No notifications</span>
          <span className="text-xs text-text-secondary">You're completely up to date!</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <div key={group.label} className="flex flex-col gap-2.5">
              <span className="text-xs font-bold tracking-wider uppercase text-text-secondary pl-1">{group.label}</span>
              <div className="grid gap-2.5">
                {group.list.map((item) => (
                  <NotificationRow key={item.id} item={item} when={formatTime(item.createdAt)} onClick={() => markAsRead(item.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-1">
          <PillButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</PillButton>
          <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
          <PillButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PillButton>
        </div>
      )}
    </div>
  );
}
