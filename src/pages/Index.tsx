
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect ke dashboard jika sudah login
    if (user) {
      navigate('/dashboard');
    } else {
      // Redirect ke login jika belum login
      navigate('/login');
    }
  }, [user, navigate]);

  return null; // Halaman ini hanya untuk redirect
};

export default Index;
