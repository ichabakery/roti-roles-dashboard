
import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Eye } from 'lucide-react';
import { Notification } from '@/types/notifications';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'production':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success':
        return 'Berhasil';
      case 'warning':
        return 'Peringatan';
      case 'error':
        return 'Error';
      case 'production':
        return 'Produksi';
      default:
        return 'Info';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { 
        addSuffix: true,
        locale: id 
      });
    } catch (error) {
      return 'Baru saja';
    }
  };

  return (
    <div 
      className={cn(
        "p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
        !notification.is_read && "bg-blue-50 border-blue-100"
      )}
      onClick={() => onClick?.(notification)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              variant="outline" 
              className={cn("text-xs", getTypeColor(notification.type))}
            >
              {getTypeLabel(notification.type)}
            </Badge>
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {notification.title}
          </h4>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {notification.message}
          </p>
          
          <p className="text-xs text-gray-400">
            {formatTime(notification.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
