import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  read: boolean;
};



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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return new Date(val).toISOString();
    if (typeof val === 'object') {
      if (typeof val.toDate === 'function') {
        return val.toDate().toISOString();
      }
      if (typeof val._seconds === 'number') {
        return new Date(val._seconds * 1000).toISOString();
      }
      if (typeof val.seconds === 'number') {
        return new Date(val.seconds * 1000).toISOString();
      }
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
          setTotal(res.total ?? parsed.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? parsed.length) / limit));
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
    // Only call API if it is currently unread
    const target = items.find((n) => n.id === id);
    if (target && !target.read) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      api.notifications.read(id).catch((err) => {
        console.error("Failed to mark notification as read on server:", err);
      });
    }
  };

  const markAllRead = () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      unreadIds.forEach((id) => {
        api.notifications.read(id).catch((err) => {
          console.error(`Failed to mark notification ${id} as read on server:`, err);
        });
      });
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
      if (d === todayStr) {
        today.push(n);
      } else if (d === yesterdayStr) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return [
      { label: 'Today', list: today },
      { label: 'Yesterday', list: yesterday },
      { label: 'Earlier', list: earlier },
    ].filter((g) => g.list.length > 0);
  };

  const grouped = groupByDate(items);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-2xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Notifications Log</h1>
          {unreadCount > 0 && (
            <span className="text-xs text-text-secondary mt-1 block">
              You have {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-tint hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-text-secondary text-sm flex flex-col items-center justify-center gap-3 bg-card border border-border rounded-xl">
          <Icon name="bell" size={40} className="text-text-secondary animate-pulse-slow" />
          <span className="font-semibold text-text-main">No Notifications</span>
          <span className="text-xs">You're completely up to date!</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <span className="text-xs font-bold text-text-secondary tracking-wider uppercase pl-2">
                {group.label}
              </span>
              <Card padded={false} className="overflow-hidden">
                <div className="divide-y divide-border">
                  {group.list.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => markAsRead(item.id)}
                      className={`flex gap-3.5 p-4 hover:bg-bg-selected/35 transition-colors cursor-pointer relative ${
                        !item.read ? 'bg-tint/[0.02]' : ''
                      }`}
                    >
                      <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-tint/10 text-tint">
                        <Icon name="bell" size={18} />
                      </div>
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <span className={`text-sm text-text-main truncate ${!item.read ? 'font-extrabold' : 'font-semibold'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-text-secondary whitespace-nowrap">
                            {formatTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-text-secondary text-xs leading-relaxed break-words">
                          {item.body}
                        </p>
                      </div>

                      {/* Unread Indicator Dot */}
                      {!item.read && (
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-2 rounded-full bg-tint" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs font-bold cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-xs font-bold text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs font-bold cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
