import React from 'react';
import { Link } from 'react-router';
import { GlassPanel } from '../ui/glass-panel';
import { Icon, type IconName } from '../ui/icon';

export type ConsoleTile = {
  key: string;
  title: string;
  sub: string;
  icon: IconName;
  to: string;
};

/** ConsoleTileGrid — the admin-home tile grid linking to every console sub-screen. */
export const ConsoleTileGrid: React.FC<{ tiles: ConsoleTile[] }> = ({ tiles }) => (
  <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
    {tiles.map((tile) => (
      <Link key={tile.key} to={tile.to}>
        <GlassPanel radius="lg" hoverable className="h-full cursor-pointer">
          <span className="inline-grid place-items-center w-8 h-8 rounded-[10px] bg-tint-b text-tint">
            <Icon name={tile.icon} size={16} />
          </span>
          <div className="text-[15px] font-bold mt-3.5 tracking-tight">{tile.title}</div>
          <div className="text-[12.5px] text-text-secondary mt-1 leading-relaxed">{tile.sub}</div>
        </GlassPanel>
      </Link>
    ))}
  </div>
);
