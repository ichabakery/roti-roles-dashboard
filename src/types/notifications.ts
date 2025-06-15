
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'production';
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewNotification {
  user_id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'production';
  related_id?: string;
  related_type?: string;
}
