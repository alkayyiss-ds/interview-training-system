import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AuthContext, API } from '@/App';
import { ArrowLeft, Briefcase } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const { setUser, language } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', confirmPassword: '' });

  const content = {
    en: {
      login: 'Login',
      register: 'Register',
      welcome: 'Welcome Back',
      createAccount: 'Create Account',
      loginDesc: 'Login to continue your interview practice',
      registerDesc: 'Sign up to start your journey',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      confirmPassword: 'Confirm Password',
      backToHome: 'Back to Home',
    },
    id: {
      login: 'Masuk',
      register: 'Daftar',
      welcome: 'Selamat Datang Kembali',
      createAccount: 'Buat Akun',
      loginDesc: 'Masuk untuk melanjutkan latihan interview',
      registerDesc: 'Daftar untuk memulai perjalanan Anda',
      email: 'Email',
      password: 'Kata Sandi',
      username: 'Nama Pengguna',
      confirmPassword: 'Konfirmasi Kata Sandi',
      backToHome: 'Kembali ke Beranda',
    },
  };

  const t = content[language];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      toast.success(language === 'en' ? 'Login successful!' : 'Berhasil masuk!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || (language === 'en' ? 'Login failed' : 'Gagal masuk'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error(language === 'en' ? 'Passwords do not match' : 'Kata sandi tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...dataToSend } = registerData;
      const response = await axios.post(`${API}/auth/register`, dataToSend);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      toast.success(language === 'en' ? 'Account created successfully!' : 'Akun berhasil dibuat!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || (language === 'en' ? 'Registration failed' : 'Gagal mendaftar'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl opacity-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
          data-testid="back-to-home-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToHome}
        </Button>

        <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">InterviewAI</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">{t.login}</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">{t.register}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">{t.email}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">{t.password}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      data-testid="login-password-input"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-button">
                    {loading ? (language === 'en' ? 'Loading...' : 'Memuat...') : t.login}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="register-username">{t.username}</Label>
                    <Input
                      id="register-username"
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                      data-testid="register-username-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-email">{t.email}</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      data-testid="register-email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password">{t.password}</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      data-testid="register-password-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-confirm-password">{t.confirmPassword}</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      data-testid="register-confirm-password-input"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="register-submit-button">
                    {loading ? (language === 'en' ? 'Loading...' : 'Memuat...') : t.register}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;