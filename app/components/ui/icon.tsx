import React from 'react';
import * as Lucide from 'lucide-react';

export type IconName =
  | 'bell'
  | 'bank'
  | 'sync'
  | 'arrow-down'
  | 'arrow-up'
  | 'check'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'trending-up'
  | 'cart'
  | 'plus'
  | 'package-variant-closed'
  | 'alert-triangle'
  | 'block-helper'
  | 'account-group'
  | 'dollar'
  | 'chart-bar'
  | 'file-document'
  | 'x'
  | 'minus'
  | 'user'
  | 'lock'
  | 'phone'
  | 'mail'
  | 'trash'
  | 'search'
  | 'camera'
  | 'edit'
  | 'log-out'
  | 'shield-check'
  | 'smartphone'
  | 'upload'
  | 'settings'
  | 'calendar'
  | 'more-vertical'
  | 'star-circle'
  | 'star-outline'
  | 'loading'
  | 'clock'
  | 'cash'
  | 'shopping-cart';


interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, color, className }) => {
  const getIcon = () => {
    switch (name) {
      case 'bell':
        return Lucide.Bell;
      case 'bank':
        return Lucide.Building2;
      case 'sync':
        return Lucide.RefreshCw;
      case 'arrow-down':
        return Lucide.ArrowDown;
      case 'arrow-up':
        return Lucide.ArrowUp;
      case 'check':
        return Lucide.Check;
      case 'chevron-right':
        return Lucide.ChevronRight;
      case 'chevron-left':
        return Lucide.ChevronLeft;
      case 'chevron-down':
        return Lucide.ChevronDown;
      case 'trending-up':
        return Lucide.TrendingUp;
      case 'cart':
        return Lucide.ShoppingCart;
      case 'plus':
        return Lucide.Plus;
      case 'minus':
        return Lucide.Minus;
      case 'package-variant-closed':
        return Lucide.Package;
      case 'alert-triangle':
        return Lucide.AlertTriangle;
      case 'block-helper':
        return Lucide.Ban;
      case 'account-group':
        return Lucide.Users;
      case 'dollar':
        return Lucide.CircleDollarSign;
      case 'chart-bar':
        return Lucide.BarChart3;
      case 'file-document':
        return Lucide.FileText;
      case 'x':
        return Lucide.X;
      case 'user':
        return Lucide.User;
      case 'lock':
        return Lucide.Lock;
      case 'phone':
        return Lucide.Phone;
      case 'mail':
        return Lucide.Mail;
      case 'trash':
        return Lucide.Trash2;
      case 'search':
        return Lucide.Search;
      case 'camera':
        return Lucide.Camera;
      case 'edit':
        return Lucide.Edit3;
      case 'log-out':
        return Lucide.LogOut;
      case 'shield-check':
        return Lucide.ShieldCheck;
      case 'smartphone':
        return Lucide.Smartphone;
      case 'upload':
        return Lucide.Upload;
      case 'settings':
        return Lucide.Settings;
      case 'calendar':
        return Lucide.Calendar;
      case 'more-vertical':
        return Lucide.MoreVertical;
      case 'star-circle':
        return Lucide.Award;
      case 'star-outline':
        return Lucide.Star;
      case 'loading':
        return Lucide.Loader2;
      case 'clock':
        return Lucide.Clock;
      case 'cash':
        return Lucide.Banknote;
      case 'shopping-cart':
        return Lucide.ShoppingCart;
      default:
        return Lucide.HelpCircle;
    }
  };

  const Component = getIcon();
  return <Component size={size} color={color} className={className} />;
};
