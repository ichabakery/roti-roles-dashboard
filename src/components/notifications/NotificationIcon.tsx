
import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationIconProps {
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({
  unreadCount,
  onClick,
  className
}) => {
  return (
    <div 
      className={cn("relative cursor-pointer", className)}
      onClick={onClick}
    >
      <Bell className="h-5 w-5 text-bakery-100 hover:text-white transition-colors" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default NotificationIcon;
