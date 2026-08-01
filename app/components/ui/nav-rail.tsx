import React from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from './icon';

export type NavRailItem = {
  label: string;
  path: string;
  icon: IconName;
  badgeCount?: number;
  active?: boolean;
};

type NavRailProps = {
  items: NavRailItem[];
  sectionLabel: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  roleSwitchLabel: string;
  onRoleSwitch: () => void;
  roleSwitchIcon?: IconName;
};

/**
 * NavRail — collapsible glass sidebar (246px <-> 74px), icon+label nav items,
 * a role-switch action and a collapse toggle at the bottom. Auto-collapses
 * (via the `collapsed` prop driven from a resize hook) under 1040px.
 */
export const NavRail: React.FC<NavRailProps> = ({
  items,
  sectionLabel,
  collapsed,
  onToggleCollapse,
  roleSwitchLabel,
  onRoleSwitch,
  roleSwitchIcon = 'sync',
}) => {
  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen flex-shrink-0 glass-surface-2 border-r border-chip px-3.5 py-5 transition-[width] duration-200 ease-out z-20"
      style={{ width: collapsed ? 74 : 246, borderRadius: 0 }}
    >
      <div className="flex items-center gap-2.5 px-1.5 pb-5">
        <div className="w-[30px] h-[30px] flex-shrink-0 rounded-[9px] bg-tint" />
        <span
          className="font-extrabold text-[16px] tracking-tight whitespace-nowrap overflow-hidden transition-opacity duration-150"
          style={{ opacity: collapsed ? 0 : 1 }}
        >
          RAD5 Café
        </span>
      </div>

      <div
        className="text-[10.5px] font-bold tracking-[0.1em] text-text-secondary px-2 pb-2 whitespace-nowrap transition-opacity duration-150"
        style={{ opacity: collapsed ? 0 : 1 }}
      >
        {sectionLabel}
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={item.label}
            className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm whitespace-nowrap overflow-hidden transition-colors hover:bg-tint-b"
            style={{
              background: item.active ? 'var(--tint-b)' : 'transparent',
              color: item.active ? 'var(--color-tint)' : 'var(--color-text-tertiary)',
              fontWeight: item.active ? 700 : 500,
            }}
          >
            <span
              className="flex-shrink-0 w-[26px] h-[26px] grid place-items-center rounded-lg"
              style={{
                background: item.active ? 'var(--color-tint)' : 'var(--ink-a)',
                color: item.active ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              <Icon name={item.icon} size={15} color="currentColor" />
            </span>
            <span className="transition-opacity duration-150" style={{ opacity: collapsed ? 0 : 1 }}>
              {item.label}
            </span>
            {!!item.badgeCount && (
              <span
                className="ml-auto px-1.5 py-px rounded-full bg-error-val text-white text-[11px] font-bold transition-opacity duration-150"
                style={{ opacity: collapsed ? 0 : 1 }}
              >
                {item.badgeCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-auto grid gap-2">
        <button
          onClick={onRoleSwitch}
          className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl border border-dashed border-border bg-surface text-[13px] font-semibold text-tint whitespace-nowrap overflow-hidden cursor-pointer hover:border-tint transition-colors"
        >
          <span className="flex-shrink-0 w-[26px] h-[26px] grid place-items-center rounded-lg bg-tint-b">
            <Icon name={roleSwitchIcon} size={14} color="currentColor" />
          </span>
          <span className="transition-opacity duration-150" style={{ opacity: collapsed ? 0 : 1 }}>
            {roleSwitchLabel}
          </span>
        </button>
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-[13px] font-semibold text-text-secondary whitespace-nowrap overflow-hidden cursor-pointer hover:text-text-main transition-colors"
        >
          <span className="flex-shrink-0 w-[26px] h-[26px] grid place-items-center rounded-lg bg-ink-a">
            <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={14} color="currentColor" />
          </span>
          <span className="transition-opacity duration-150" style={{ opacity: collapsed ? 0 : 1 }}>
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
};
