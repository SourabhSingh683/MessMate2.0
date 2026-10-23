import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, ActiveView } from './components/Navbar.tsx';
import { PublicLanding } from './components/PublicLanding.tsx';
import { StudentPortal } from './components/StudentPortal.tsx';
import { OwnerPortal } from './components/OwnerPortal.tsx';
import { ForOwnersLanding } from './components/ForOwnersLanding.tsx';
import { AuthModal } from './components/AuthModal.tsx';

function MainApp() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('public');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Central Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalRole, setAuthModalRole] = useState<'student' | 'owner'>('student');
  const [authModalPrompt, setAuthModalPrompt] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'owner') {
        setActiveView('owner');
      } else if (user.role === 'student') {
        if ((user as any).hasActiveSubscription) {
          setActiveView('student');
        } else {
          setActiveView('public');
        }
      }
    }
  }, [user?.id, (user as any)?.hasActiveSubscription]);

  const handleOpenAuth = (
    mode: 'login' | 'register',
    role: 'student' | 'owner' = 'student',
    prompt?: string
  ) => {
    setAuthModalMode(mode);
    setAuthModalRole(role);
    setAuthModalPrompt(prompt || null);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F4] text-[#182320]">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Role-Segregated Navigation Bar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1">
        {activeView === 'public' && (
          <PublicLanding
            onNavigatePortal={(portal) => setActiveView(portal)}
            onOpenAuth={handleOpenAuth}
          />
        )}
        {activeView === 'for-owners' && (
          <ForOwnersLanding
            onOpenRegister={() =>
              handleOpenAuth(
                'register',
                'owner',
                'Register your commercial mess or tiffin kitchen to access headcount forecasts and 1-click attendance.'
              )
            }
            onOpenLogin={() =>
              handleOpenAuth('login', 'owner', 'Sign in to access your kitchen attendance and weekly menu roster.')
            }
            onExploreMesses={() => setActiveView('public')}
          />
        )}
        {activeView === 'student' && <StudentPortal />}
        {activeView === 'owner' && <OwnerPortal />}
      </main>

      {/* Central Unified Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        initialRole={authModalRole}
        promptMessage={authModalPrompt}
        onSuccessRole={(role) => setActiveView(role)}
      />

      {/* Footer */}
      <footer className="bg-[#0F2922] text-emerald-100 border-t border-[#1d4338] py-5 text-sm text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium">MessMate made by Sourabh</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
