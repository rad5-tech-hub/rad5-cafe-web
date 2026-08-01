import React from 'react';

export type GlassVariant = 'surface' | 'surface-2' | 'sheen' | 'sheet' | 'chip';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  padded?: boolean;
  hoverable?: boolean;
  radius?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const variantClass: Record<GlassVariant, string> = {
  surface: 'glass-surface',
  'surface-2': 'glass-surface-2',
  sheen: 'glass-sheen',
  sheet: 'glass-sheet',
  chip: 'glass-chip',
};

const radiusClass: Record<NonNullable<GlassPanelProps['radius']>, string> = {
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-[22px]',
};

/**
 * GlassPanel — the base glass surface used throughout the redesign.
 * Wraps the `.glass-surface` / `.glass-sheen` / `.glass-sheet` utility classes
 * (see app.css) so every card shares the same blur/border/shadow recipe.
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'surface',
  padded = true,
  hoverable = false,
  radius = 'lg',
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${variantClass[variant]} ${radiusClass[radius]} ${padded ? 'p-5' : ''} ${
        hoverable ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-tint-c' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/** Heavier, more opaque variant for modals/drawers — semantic alias of GlassPanel variant="sheet". */
export const GlassSheet: React.FC<Omit<GlassPanelProps, 'variant'>> = (props) => (
  <GlassPanel variant="sheet" radius="xl" {...props} />
);
