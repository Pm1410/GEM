import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { AppShell } from './components/common/AppShell';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { TendersView } from './views/TendersView';
import { TenderOverviewView } from './views/TenderOverviewView';
import { BiddersView } from './views/BiddersView';
import { VerificationWorkspaceView } from './views/VerificationWorkspaceView';
import { ReviewSubmitView } from './views/ReviewSubmitView';
import { DocumentsVaultView } from './views/DocumentsVaultView';
import { ReportsView } from './views/ReportsView';
import { AuditView } from './views/AuditView';
import { EvaluationView } from './views/EvaluationView';
import { SettingsView } from './views/SettingsView';
import { PortalSimulatorModal } from './components/portals/PortalSimulatorModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedTenderId, setSelectedTenderId] = useState<string>('TND-GEM-2025-0012');
  const [selectedBidId, setSelectedBidId] = useState<string>('BID-001');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize active user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to authenticate:', err);
        setLoading(false);
      });
  }, []);

  const handleLogin = async (email: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setCurrentView('dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleSwitchRole = async (role: UserRole) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (view: string, contextId?: string) => {
    if (view === 'tenders' && contextId) {
      setSelectedTenderId(contextId);
      setCurrentView('tender-overview');
    } else if (view === 'verification' && contextId) {
      setSelectedBidId(contextId);
      setCurrentView('verification');
    } else {
      setCurrentView(view);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ambient-grain flex items-center justify-center font-mono-tech text-xs text-[#5F6675]">
        Initializing TenderGuard deterministic procurement engine...
      </div>
    );
  }

  // Not logged in or on login screen
  if (!currentUser || currentView === 'login') {
    return <LoginView onLogin={handleLogin} />;
  }

  // Generate breadcrumbs preserving workflow context
  const getBreadcrumbs = () => {
    switch (currentView) {
      case 'dashboard':
        return [{ label: 'Dashboard' }];
      case 'tenders':
        return [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Tenders' }];
      case 'tender-overview':
        return [
          { label: 'Tenders', view: 'tenders' },
          { label: 'GEM/2025/0012' },
        ];
      case 'bidders':
        return [
          { label: 'Tenders', view: 'tenders' },
          { label: 'GEM/2025/0012', view: 'tender-overview' },
          { label: 'Bidders Queue' },
        ];
      case 'verification':
        return [
          { label: 'Bidders', view: 'bidders' },
          { label: 'ABC Infra Solutions', view: 'bidders' },
          { label: 'Verification Workspace' },
        ];
      case 'review-submit':
        return [
          { label: 'Verification', view: 'verification' },
          { label: 'Final Review & Submit' },
        ];
      case 'documents':
        return [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Document Vault' }];
      case 'reports':
        return [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Evaluation Reports' }];
      case 'audit':
        return [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Audit Trail' }];
      case 'evaluation':
        return [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Scientific Benchmarks' }];
      case 'settings':
        return [{ label: 'Dashboard', view: 'dashboard' }, { label: 'System Settings' }];
      default:
        return [{ label: currentView.charAt(0).toUpperCase() + currentView.slice(1) }];
    }
  };

  return (
    <AppShell
      currentView={currentView}
      onNavigate={handleNavigate}
      user={currentUser}
      onSwitchRole={handleSwitchRole}
      onLogout={handleLogout}
      onOpenPortalSimulator={() => setIsSimulatorOpen(true)}
      breadcrumb={getBreadcrumbs()}
    >
      {/* 1. Dashboard View */}
      {currentView === 'dashboard' && (
        <DashboardView user={currentUser} onNavigate={handleNavigate} />
      )}

      {/* 2. Tenders List View */}
      {currentView === 'tenders' && (
        <TendersView
          onSelectTender={(tId) => {
            setSelectedTenderId(tId);
            setCurrentView('tender-overview');
          }}
        />
      )}

      {/* 3. Tender Overview View */}
      {currentView === 'tender-overview' && (
        <TenderOverviewView
          tenderId={selectedTenderId}
          onNavigateBidders={() => setCurrentView('bidders')}
          onNavigateVerification={(bidId) => {
            setSelectedBidId(bidId);
            setCurrentView('verification');
          }}
          onNavigateAudit={() => setCurrentView('audit')}
        />
      )}

      {/* 4. Bidders Work Queue */}
      {currentView === 'bidders' && (
        <BiddersView
          tenderId={selectedTenderId}
          onSelectBid={(bidId) => {
            setSelectedBidId(bidId);
            setCurrentView('verification');
          }}
        />
      )}

      {/* 5. 3-Pane Persistent Verification Workspace */}
      {currentView === 'verification' && (
        <VerificationWorkspaceView
          bidId={selectedBidId}
          onNavigateReview={(bidId) => {
            setSelectedBidId(bidId);
            setCurrentView('review-submit');
          }}
          onOpenPortalSimulator={() => setIsSimulatorOpen(true)}
        />
      )}

      {/* 6. Review & Submit View */}
      {currentView === 'review-submit' && (
        <ReviewSubmitView
          bidId={selectedBidId}
          onBack={() => setCurrentView('verification')}
          onSubmitSuccess={() => setCurrentView('audit')}
        />
      )}

      {/* 7. Documents Vault View */}
      {currentView === 'documents' && (
        <DocumentsVaultView
          onNavigateVerification={(bidId) => {
            setSelectedBidId(bidId);
            setCurrentView('verification');
          }}
        />
      )}

      {/* 8. Reports View */}
      {currentView === 'reports' && (
        <ReportsView
          onNavigateVerification={(bidId) => {
            setSelectedBidId(bidId);
            setCurrentView('verification');
          }}
          onNavigateAudit={() => setCurrentView('audit')}
        />
      )}

      {/* 9. Audit Trail View */}
      {currentView === 'audit' && <AuditView />}

      {/* 10. Evaluation View */}
      {currentView === 'evaluation' && <EvaluationView />}

      {/* 11. Settings View */}
      {currentView === 'settings' && (
        <SettingsView
          onOpenPortalSimulator={() => setIsSimulatorOpen(true)}
          currentUserRole={currentUser.role}
          onSwitchRole={handleSwitchRole}
        />
      )}

      {/* Simulated Gateway Configuration Modal */}
      {isSimulatorOpen && (
        <PortalSimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
        />
      )}
    </AppShell>
  );
}
