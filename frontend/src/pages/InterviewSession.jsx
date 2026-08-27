import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const InterviewSession = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <Button variant="outline" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div className="mt-8 text-center">
        <h1 className="text-4xl font-bold">Interview Session</h1>
        <p className="text-slate-600 mt-4">Coming Soon</p>
      </div>
    </div>
  );
};

export default InterviewSession;