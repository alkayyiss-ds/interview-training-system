import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthContext, API } from '@/App';
import { ArrowLeft, TrendingUp, Award, CheckCircle, AlertCircle, Briefcase, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

const ResultsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { language } = useContext(AuthContext);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const content = {
    en: {
      results: 'Interview Results',
      overallScore: 'Overall Score',
      excellent: 'Excellent!',
      good: 'Good Job!',
      needsImprovement: 'Needs Improvement',
      performance: 'Performance by Category',
      strengths: 'Your Strengths',
      weaknesses: 'Areas for Improvement',
      recommendations: 'Job Recommendations',
      position: 'Position Applied',
      backToDashboard: 'Back to Dashboard',
      detailedAnswers: 'Detailed Answers',
    },
    id: {
      results: 'Hasil Interview',
      overallScore: 'Skor Keseluruhan',
      excellent: 'Luar Biasa!',
      good: 'Bagus!',
      needsImprovement: 'Perlu Peningkatan',
      performance: 'Performa per Kategori',
      strengths: 'Kekuatan Anda',
      weaknesses: 'Area yang Perlu Diperbaiki',
      recommendations: 'Rekomendasi Pekerjaan',
      position: 'Posisi yang Dilamar',
      backToDashboard: 'Kembali ke Dasbor',
      detailedAnswers: 'Jawaban Detail',
    },
  };

  const t = content[language];

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await axios.get(`${API}/interview/results/${sessionId}`);
      setResults(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || (language === 'en' ? 'Failed to load results' : 'Gagal memuat hasil'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-slate-600">{language === 'en' ? 'Loading results...' : 'Memuat hasil...'}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">{language === 'en' ? 'Results not found' : 'Hasil tidak ditemukan'}</p>
            <Button onClick={() => navigate('/dashboard')}>{t.backToDashboard}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreLabel = (score) => {
    if (score >= 75) return { label: t.excellent, color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { label: t.good, color: 'text-blue-600', bg: 'bg-blue-100' };
    return { label: t.needsImprovement, color: 'text-amber-600', bg: 'bg-amber-100' };
  };

  const scoreInfo = getScoreLabel(results.score);

  // Prepare chart data
  const categoryData = results.answers.map((answer, index) => ({
    category: answer.category.replace('_', ' '),
    score: answer.score,
    name: `Q${index + 1}`,
  }));

  const radarData = results.answers.map((answer) => ({
    category: answer.category.replace('_', ' ').substring(0, 10),
    score: answer.score,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{t.results}</h1>
            <p className="text-lg text-slate-600">
              {t.position}: <span className="font-semibold">{results.position}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToDashboard}
          </Button>
        </div>

        {/* Score Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl animate-slide-up" data-testid="overall-score-card">
            <CardHeader>
              <CardTitle className="text-lg">{t.overallScore}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">{results.score.toFixed(1)}</div>
                <div className={`inline-block px-4 py-2 rounded-full ${scoreInfo.bg}`}>
                  <span className={`text-sm font-semibold ${scoreInfo.color}`}>{scoreInfo.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {t.strengths}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                {t.weaknesses}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle>{t.performance}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle>{t.performance}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#64748b" />
                  <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Job Recommendations */}
        <Card className="mb-8 bg-white/80 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              {t.recommendations}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {results.recommendations.map((job, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                  data-testid={`job-recommendation-${index}`}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  {job}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Answers */}
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>{t.detailedAnswers}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.answers.map((answer, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`answer-detail-${index}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-900 flex-1">Q{index + 1}: {answer.question}</h4>
                  <Badge variant={answer.score >= 70 ? 'default' : answer.score >= 50 ? 'secondary' : 'destructive'}>
                    {answer.score.toFixed(1)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mt-2">{answer.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsPage;