
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onOpenChange
}) => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.related_type === 'production_request' && notification.related_id) {
      onOpenChange(false);
      navigate('/production');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-96 sm:max-w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Notifikasi
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tandai Semua Dibaca
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            {unreadCount > 0 ? (
              `Anda memiliki ${unreadCount} notifikasi yang belum dibaca`
            ) : (
              'Semua notifikasi telah dibaca'
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Memuat notifikasi...</span>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">📱</div>
              <p className="text-sm text-gray-500">Belum ada notifikasi</p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="space-y-0">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
