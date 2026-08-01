import React from 'react';
import { Link } from 'react-router';
import { Icon } from './icon';
import { IconButton } from './icon-button';
import { useTheme } from '~/context/theme-context';

type TopBarProps = {
  crumb: string;
  title: string;
  unreadCount?: number;
  userName: string;
  initials: string;
  onMenuClick?: () => void;
};

/**
 * TopBar — breadcrumb + page title, theme toggle, notification bell (with
 * unread badge) and a profile chip. Shared across every logged-in screen.
 */
export const TopBar: React.FC<TopBarProps> = ({ crumb, title, unreadCount = 0, userName, initials, onMenuClick }) => {
  const { effectiveTheme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center flex-wrap gap-3 mb-6">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-xl glass-surface grid place-items-center cursor-pointer"
        >
          <Icon name="menu" size={18} />
        </button>
      )}
      <div className="min-w-0">
        <div className="text-xs font-semibold tracking-wide text-text-secondary">{crumb}</div>
        <h1 className="mt-1 text-[22px] sm:text-[27px] font-extrabold tracking-tight">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <IconButton
          icon={effectiveTheme === 'dark' ? 'sun' : 'moon'}
          onClick={toggleTheme}
          title={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        />

        <Link
          to="/notifications"
          className="relative w-10 h-10 rounded-xl glass-surface grid place-items-center text-text-main hover:border-tint hover:text-tint transition-colors"
        >
          <Icon name="bell" size={17} color="currentColor" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error-val text-white text-[10.5px] font-bold grid place-items-center">
              {unreadCount}
            </span>
          )}
        </Link>

        <Link
          to="/profile"
          className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full glass-surface hover:border-tint transition-colors"
        >
          <span
            className="w-[30px] h-[30px] rounded-full grid place-items-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(140deg, #003D99, #3B82F6)' }}
          >
            {initials}
          </span>
          <span className="text-[13px] font-semibold hidden sm:inline">{userName}</span>
        </Link>
      </div>
    </div>
  );
};
