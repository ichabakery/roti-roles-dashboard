
import { supabase } from "@/integrations/supabase/client";

export const signInWithEmail = async (email: string, password: string) => {
  console.log('Attempting login for:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  console.log('Login successful for:', email);
  return data;
};

export const signOut = async () => {
  console.log('Logging out user');
  return await supabase.auth.signOut();
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
