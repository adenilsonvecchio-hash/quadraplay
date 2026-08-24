import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { LoginView } from './components/auth/LoginView';
import { HomeView } from './components/home/HomeView';
import { BookingWizard } from './components/booking/BookingWizard';
import { MyMatchesView } from './components/matches/MyMatchesView';
import { CourtScheduleView } from './components/schedule/CourtScheduleView';
import { PlayersView } from './components/players/PlayersView';
import { ProfileView } from './components/profile/ProfileView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ScheduledGamesView } from './components/matches/ScheduledGamesView';

function MainApp() {
  const { currentUser, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [preselectedOpponentId, setPreselectedOpponentId] = useState<string | undefined>();
  const [bookingSeed, setBookingSeed] = useState<{date?: string; startTime?: string; courtId?: string}>({});

  const navigate = (tab: TabType) => {
    setActiveTab(tab);
    const route = tab === 'schedule' ? 'agenda' : tab === 'games' ? 'jogos-agendados' : tab === 'matches' ? 'meus-jogos' : tab === 'profile' ? 'perfil' : tab;
    window.history.replaceState(null, '', `#${route}`);
  };

  useEffect(() => {
    const readRoute = () => {
      const route = window.location.hash.replace('#', '');
      const routes: Record<string, TabType> = {
        inicio: 'home', home: 'home', agenda: 'schedule', 'jogos-agendados': 'games',
        'meus-jogos': 'matches', jogadores: 'players', perfil: 'profile', agendar: 'book',
      };
      if (routes[route]) setActiveTab(routes[route]);
    };
    readRoute();
    window.addEventListener('hashchange', readRoute);
    return () => window.removeEventListener('hashchange', readRoute);
  }, []);

  useEffect(() => {
    const openProfile = () => setActiveTab('profile');
    window.addEventListener('quadraplay:navigate-profile', openProfile);
    return () => window.removeEventListener('quadraplay:navigate-profile', openProfile);
  }, []);

  if (authLoading) return <div className="min-h-screen grid place-items-center bg-[#eef1f8] text-[#6855df] font-black">Carregando QuadraPlay+...</div>;
  if (!currentUser) return <LoginView onSuccess={() => setActiveTab('home')} />;

  const startGeneralBooking = () => {
    setPreselectedOpponentId(undefined);
    setBookingSeed({});
    navigate('book');
  };

  const startBookingWithOpponent = (opponentId: string) => {
    setPreselectedOpponentId(opponentId);
    setBookingSeed({});
    navigate('book');
  };

  return (
    <div className="min-h-screen bg-[#eef1f8] text-[#0b1742] flex justify-center items-start sm:py-5 selection:bg-violet-200">
      <div className="qp-shell qp-app-shell w-full max-w-md lg:max-w-6xl min-h-screen sm:min-h-[94vh] sm:rounded-[38px] flex flex-col relative overflow-hidden border border-white">
        {activeTab !== 'home' && <Header activeTab={activeTab} onOpenAdmin={() => navigate('admin')} onNavigate={navigate} />}

        <main className={`qp-main ${activeTab === 'home' ? 'flex-1 min-h-0' : 'flex-1 px-4 lg:px-8 pt-1 pb-24 lg:pb-24 overflow-y-auto custom-scrollbar'}`}>
          {activeTab === 'home' && (
            <HomeView
              onStartBooking={startGeneralBooking}
              onViewAllMatches={() => navigate('matches')}
              onViewSchedule={() => navigate('schedule')}
              onViewPlayers={() => navigate('players')}
            />
          )}

          {activeTab === 'book' && (
            <BookingWizard
              preselectedOpponentId={preselectedOpponentId}
              preselectedDate={bookingSeed.date}
              preselectedStartTime={bookingSeed.startTime}
              preselectedCourtId={bookingSeed.courtId}
              onSuccess={() => navigate('games')}
              onCancel={() => navigate('home')}
            />
          )}

          {activeTab === 'matches' && <PageGuard name="Meus jogos" onBack={() => navigate('home')}><MyMatchesView onStartBooking={startGeneralBooking} /></PageGuard>}
          {activeTab === 'games' && <PageGuard name="Jogos agendados" onBack={() => navigate('home')}><ScheduledGamesView /></PageGuard>}
          {activeTab === 'schedule' && (
            <PageGuard name="Agenda" onBack={() => navigate('home')}><CourtScheduleView
              onScheduleSlot={(date, startTime, courtId) => {
                setPreselectedOpponentId(undefined);
                setBookingSeed({ date, startTime: startTime || undefined, courtId });
                navigate('book');
              }}
            /></PageGuard>
          )}
          {activeTab === 'players' && <PlayersView onChallengePlayer={startBookingWithOpponent} />}
          {activeTab === 'profile' && <PageGuard name="Perfil" onBack={() => navigate('home')}><ProfileView onOpenAdmin={() => navigate('admin')} /></PageGuard>}
          {activeTab === 'admin' && <PageGuard name="Painel administrativo" onBack={() => navigate('home')}><AdminDashboard onBack={() => navigate('home')} /></PageGuard>}
        </main>

        <BottomNav activeTab={activeTab} onChangeTab={navigate} />
      </div>
    </div>
  );
}

class PageGuard extends React.Component<{ name: string; onBack: () => void; children: React.ReactNode }, { failed: boolean }> {
  declare readonly props: { name: string; onBack: () => void; children: React.ReactNode };
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error(`Falha ao abrir ${this.props.name}`, error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="qp-card rounded-[26px] p-6 mt-3 text-center"><h2 className="text-lg font-black text-[#101b3d]">Não foi possível abrir {this.props.name}</h2><p className="mt-2 text-xs text-slate-500">Os dados desta página apresentaram um erro. A tela inicial continua protegida.</p><button type="button" onClick={this.props.onBack} className="qp-primary rounded-2xl px-5 py-3 mt-5 text-xs font-black">Voltar ao início</button></div>;
  }
}

export default function App() {
  return <AuthProvider><MainApp /></AuthProvider>;
}
