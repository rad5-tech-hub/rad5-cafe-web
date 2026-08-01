import React from 'react';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  read: boolean;
};

type NotificationRowProps = {
  item: NotificationItem;
  when: string;
  onClick: () => void;
};

/** NotificationRow — single glass row; unread = tinted background + bold title + colored dot. */
export const NotificationRow: React.FC<NotificationRowProps> = ({ item, when, onClick }) => {
  const unread = !item.read;

  return (
    <div
      onClick={onClick}
      className="flex gap-3.5 px-4.5 py-4 rounded-2xl cursor-pointer transition-colors hover:border-tint-c"
      style={{
        background: unread ? 'var(--tint-a)' : 'var(--surface)',
        border: `1px solid ${unread ? 'var(--tint-c)' : 'var(--glass-border)'}`,
        backdropFilter: 'blur(18px) saturate(150%)',
      }}
    >
      <span
        className="w-[9px] h-[9px] flex-shrink-0 mt-1.5 rounded-full"
        style={{ background: unread ? 'var(--color-tint)' : 'var(--color-border-strong)' }}
      />
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${unread ? 'font-bold' : 'font-semibold'}`}>{item.title}</div>
        <div className="text-[13px] text-text-secondary mt-0.5 leading-relaxed">{item.body}</div>
      </div>
      <span className="font-money text-[11.5px] text-text-secondary flex-shrink-0 whitespace-nowrap">{when}</span>
    </div>
  );
};
