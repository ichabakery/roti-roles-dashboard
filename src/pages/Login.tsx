
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Email dan password harus diisi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Login gagal",
        description: "Email atau password salah",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Daftar user demo untuk memudahkan testing
  const demoUsers = [
    { role: 'Pemilik (Owner)', email: 'owner@bakeryguru.com' },
    { role: 'Kepala Produksi', email: 'produksi@bakeryguru.com' },
    { role: 'Kasir Cabang', email: 'kasir@bakeryguru.com' },
    { role: 'Admin Pusat', email: 'admin@bakeryguru.com' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-2">Bakery Guru</h1>
          <p className="text-muted-foreground">Sistem Manajemen Toko Roti</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Masuk untuk mengakses dashboard sesuai peran Anda
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan password apapun untuk demo
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col">
              <Button type="submit" className="w-full mb-4" disabled={isLoading}>
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
              
              <div className="w-full text-center">
                <p className="text-sm font-medium mb-2">Akun Demo:</p>
                <div className="grid grid-cols-1 gap-2">
                  {demoUsers.map((user, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEmail(user.email)}
                      className="text-xs justify-between"
                    >
                      <span>{user.role}</span>
                      <span className="text-muted-foreground">{user.email}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
