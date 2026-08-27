import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthContext } from '@/App';
import { LogOut, Upload, History } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, language } = useContext(AuthContext);

  const content = {
    en: {
      welcome: 'Welcome',
      dashboard: 'Dashboard',
      startInterview: 'Start New Interview',
      history: 'Interview History',
      logout: 'Logout',
    },
    id: {
      welcome: 'Selamat Datang',
      dashboard: 'Dasbor',
      startInterview: 'Mulai Interview Baru',
      history: 'Riwayat Interview',
      logout: 'Keluar',
    },
  };

  const t = content[language];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">{t.dashboard}</h1>
            <p className="text-slate-600 mt-2">{t.welcome}, {user?.username}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            {t.logout}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-600" />
                {t.startInterview}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">Upload your CV and start practicing</p>
              <Button className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-6 h-6 text-blue-600" />
                {t.history}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">View your past interview sessions</p>
              <Button className="w-full" variant="outline">Coming Soon</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;