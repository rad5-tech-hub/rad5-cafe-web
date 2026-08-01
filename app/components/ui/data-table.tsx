import React from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  /** fr width, e.g. "1.5fr" or "0.8fr" — defaults to "1fr" */
  width?: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
  minWidth?: number;
  footer?: React.ReactNode;
  className?: string;
};

/**
 * DataTable — generic, config-driven table used by every admin/history/ledger
 * screen: glass container, tinted header row with tracked uppercase labels,
 * hover-tinted rows, horizontally scrollable on overflow.
 */
export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  emptyMessage = 'No records to show.',
  loading = false,
  minWidth = 680,
  footer,
  className = '',
}: DataTableProps<T>) {
  const gridTemplateColumns = columns.map((c) => c.width || '1fr').join(' ');

  return (
    <div className={`glass-surface rounded-2xl overflow-x-auto overflow-y-hidden ${className}`}>
      <div
        className="grid gap-3 px-5 py-3.5 bg-tint-a text-[11.5px] font-bold tracking-wider text-text-secondary uppercase"
        style={{ gridTemplateColumns, minWidth }}
      >
        {columns.map((c) => (
          <span key={c.key} className={c.align === 'right' ? 'text-right' : ''}>
            {c.header}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-14" style={{ minWidth }}>
          <span className="w-6 h-6 rounded-full border-2 border-tint border-t-transparent animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-14 text-center text-sm text-text-secondary" style={{ minWidth }}>
          {emptyMessage}
        </div>
      ) : (
        rows.map((row) => (
          <div
            key={keyExtractor(row)}
            className="grid gap-3 items-center px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-tint-a transition-colors"
            style={{ gridTemplateColumns, minWidth }}
          >
            {columns.map((c) => (
              <div key={c.key} className={c.align === 'right' ? 'text-right' : 'min-w-0'}>
                {c.render(row)}
              </div>
            ))}
          </div>
        ))
      )}

      {footer}
    </div>
  );
}
