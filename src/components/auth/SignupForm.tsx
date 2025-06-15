
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SignupFormProps {
  email: string;
  setEmail: (val: string) => void;
  onRegistered?: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({
  email,
  setEmail,
  onRegistered,
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Password dan konfirmasi password tidak cocok",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password harus minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast({
        title: "Berhasil!",
        description:
          "Akun berhasil dibuat. Periksa email Anda untuk verifikasi.",
        variant: "default",
      });

      setPassword("");
      setConfirmPassword("");

      if (onRegistered) onRegistered();
    } catch (error: any) {
      let errorMsg = "Gagal membuat akun";
      if (error?.message) {
        if (error.message.includes("User already registered")) {
          errorMsg =
            "Email sudah terdaftar. Silakan login atau gunakan email lain.";
        } else if (error.message.includes("Password should be")) {
          errorMsg = "Password harus minimal 6 karakter";
        } else {
          errorMsg = error.message;
        }
      }
      setErrorMessage(errorMsg);
      toast({
        title: "Pendaftaran gagal",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="******"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Password minimal 6 karakter
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Konfirmasi Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="******"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Memproses..." : "Daftar"}
      </Button>
    </form>
  );
};

export default SignupForm;
