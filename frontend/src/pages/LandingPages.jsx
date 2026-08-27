import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/App';
import { Briefcase, MessageSquare, TrendingUp, Award, Globe } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useContext(AuthContext);

  const content = {
    en: {
      title: 'Master Your Interview Skills',
      subtitle: 'AI-Powered Interview Practice Platform',
      description: 'Upload your CV, get personalized interview questions, and receive instant feedback to ace your next job interview.',
      getStarted: 'Get Started',
      features: [
        { icon: Briefcase, title: 'CV Analysis', desc: 'Upload your resume and get personalized questions' },
        { icon: MessageSquare, title: 'Interactive AI', desc: 'Practice with AI that speaks your questions aloud' },
        { icon: TrendingUp, title: 'Performance Tracking', desc: 'Get detailed analytics and improvement suggestions' },
        { icon: Award, title: 'Job Recommendations', desc: 'Discover suitable positions based on your performance' },
      ],
    },
    id: {
      title: 'Kuasai Keterampilan Interview Anda',
      subtitle: 'Platform Latihan Interview Berbasis AI',
      description: 'Unggah CV Anda, dapatkan pertanyaan interview personal, dan terima feedback instan untuk sukses di interview berikutnya.',
      getStarted: 'Mulai Sekarang',
      features: [
        { icon: Briefcase, title: 'Analisis CV', desc: 'Unggah resume dan dapatkan pertanyaan personal' },
        { icon: MessageSquare, title: 'AI Interaktif', desc: 'Berlatih dengan AI yang membacakan pertanyaan' },
        { icon: TrendingUp, title: 'Pelacakan Performa', desc: 'Dapatkan analitik detail dan saran perbaikan' },
        { icon: Award, title: 'Rekomendasi Pekerjaan', desc: 'Temukan posisi sesuai dengan performa Anda' },
      ],
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl opacity-10 translate-x-1/2 translate-y-1/2"></div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Briefcase className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-slate-800">InterviewAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className="flex items-center gap-2"
            data-testid="language-toggle"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'ID' : 'EN'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/auth')} data-testid="login-button">
            {language === 'en' ? 'Login' : 'Masuk'}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            {t.title}
          </h1>
          <p className="text-xl sm:text-2xl text-blue-600 font-medium mb-4">
            {t.subtitle}
          </p>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            {t.description}
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl"
            data-testid="get-started-button"
          >
            {t.getStarted}
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {t.features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`feature-card-${index}`}
              >
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;