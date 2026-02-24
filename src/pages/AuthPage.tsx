import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { GraduationCap } from 'lucide-react';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-between gap-12">
        <div className="flex-1 hidden lg:block">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-16 h-16 text-blue-600" />
              <h1 className="text-5xl font-bold text-gray-900">Apex LMS</h1>
            </div>
            <p className="text-2xl text-gray-700 font-light">
              Enterprise Learning Management System
            </p>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span>Multi-tenant architecture for unlimited organizations</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span>Comprehensive course builder with multimedia support</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span>Advanced analytics and reporting for stakeholders</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span>White-label branding for each organization</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {mode === 'login' ? (
            <LoginForm onToggleMode={() => setMode('signup')} />
          ) : (
            <SignupForm onToggleMode={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
