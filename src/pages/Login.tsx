
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Demo user info
  const validDemoUser = {
    role: "Pemilik (Owner)",
    email: "owner@icha.com",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-2">Icha Bakery</h1>
          <p className="text-muted-foreground">Sistem Manajemen Icha Bakery</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>
              Masuk atau daftar untuk mengakses sistem
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "login" | "signup")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Daftar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm
                  email={email}
                  setEmail={setEmail}
                  onSuccess={() => {}}
                />
              </TabsContent>

              <TabsContent value="signup">
                <SignupForm
                  email={email}
                  setEmail={setEmail}
                  onRegistered={() => {
                    setActiveTab("login");
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col">
            <div className="w-full text-center">
              <p className="text-sm font-medium mb-2">Akun Demo untuk Testing:</p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmail(validDemoUser.email);
                    setActiveTab("login");
                  }}
                  className="text-xs justify-between"
                >
                  <span>{validDemoUser.role}</span>
                  <span className="text-muted-foreground">
                    {validDemoUser.email}
                  </span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Klik untuk mengisi email secara otomatis
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
