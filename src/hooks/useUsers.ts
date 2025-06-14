
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RoleType } from '@/contexts/AuthContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branchId?: string;
  createdAt: Date;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: RoleType;
  branchId: string;
}

export const useUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);

  const addUser = (newUserData: NewUser) => {
    const newId = (users.length + 1).toString();
    const userData: UserData = {
      id: newId,
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
      createdAt: new Date(),
      ...(newUserData.role === 'kasir_cabang' ? { branchId: newUserData.branchId } : {})
    };

    setUsers(prev => [...prev, userData]);
    
    toast({
      title: "Berhasil",
      description: "Pengguna baru berhasil ditambahkan",
    });
  };

  const deleteUser = (id: string) => {
    const userToDelete = users.find(user => user.id === id);
    if (userToDelete?.role === 'owner') {
      toast({
        title: "Tidak diizinkan",
        description: "Owner tidak dapat dihapus dari sistem",
        variant: "destructive",
      });
      return;
    }
    
    setUsers(prev => prev.filter(user => user.id !== id));
    toast({
      title: "Berhasil",
      description: "Pengguna berhasil dihapus",
    });
  };

  const filterUsers = (searchQuery: string) => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return {
    users,
    addUser,
    deleteUser,
    filterUsers
  };
};
