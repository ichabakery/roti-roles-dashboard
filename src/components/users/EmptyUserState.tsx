
import React from 'react';
import { Users } from 'lucide-react';

const EmptyUserState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <Users className="h-10 w-10 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">Belum ada pengguna</h3>
      <p className="text-sm text-muted-foreground">
        Klik "Tambah Pengguna" untuk mulai mengelola pengguna sistem
      </p>
    </div>
  );
};

export default EmptyUserState;
