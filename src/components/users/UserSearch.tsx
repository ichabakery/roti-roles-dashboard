
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';

interface UserSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredUsersCount: number;
  totalUsersCount: number;
}

const UserSearch: React.FC<UserSearchProps> = ({ 
  searchQuery, 
  onSearchChange, 
  filteredUsersCount, 
  totalUsersCount 
}) => {
  return (
    <div className="border rounded-md p-4">
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari pengguna..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {filteredUsersCount === 0 && totalUsersCount > 0 && (
        <div className="flex flex-col items-center justify-center py-10">
          <Users className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">Tidak ada pengguna ditemukan</h3>
          <p className="text-sm text-muted-foreground">
            Coba kata kunci yang berbeda atau tambahkan pengguna baru
          </p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
