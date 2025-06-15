
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { User } from '@/contexts/AuthContext';

interface UserProfileProps {
  user: User | null;
  sidebarOpen: boolean;
  onLogout: () => void;
}

export const UserProfile = ({ user, sidebarOpen, onLogout }: UserProfileProps) => {
  return (
    <div className="p-4 border-t">
      {sidebarOpen && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
      )}
      <Button
        variant="ghost"
        onClick={onLogout}
        className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${
          !sidebarOpen ? 'px-2' : ''
        }`}
      >
        <LogOut className="h-4 w-4" />
        {sidebarOpen && <span className="ml-3">Logout</span>}
      </Button>
    </div>
  );
};
