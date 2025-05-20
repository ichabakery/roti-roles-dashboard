
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const {
    user,
    login
  } = useAuth();
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Email dan password harus diisi",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password);
      // Redirect dilakukan oleh useEffect ketika user state berubah
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMsg = "Email atau password salah";
      if (error?.message) {
        if (error.message.includes("Invalid login")) {
          errorMsg = "Email atau password salah";
        } else if (error.message.includes("Email not confirmed")) {
          errorMsg = "Email belum dikonfirmasi. Periksa kotak masuk email Anda.";
        } else {
          errorMsg = error.message;
        }
      }
      
      setErrorMessage(errorMsg);
      toast({
        title: "Login gagal",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Daftar user demo untuk memudahkan testing
  const demoUsers = [{
    role: 'Pemilik (Owner)',
    email: 'owner@icha.com'
  }, {
    role: 'Kepala Produksi',
    email: 'produksi@bakeryguru.com'
  }, {
    role: 'Kasir Cabang',
    email: 'kasir@bakeryguru.com'
  }, {
    role: 'Admin Pusat',
    email: 'admin@bakeryguru.com'
  }];
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-2">Icha Bakery</h1>
          <p className="text-muted-foreground">Sistem Manajemen Icha Bakery</p>
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
                  onChange={e => setEmail(e.target.value)} 
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
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan password akun Supabase Anda
                </p>
              </div>
              
              {errorMessage && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {errorMessage}
                </div>
              )}
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
