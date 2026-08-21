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
    setActiveTab('book');
  };

  const startBookingWithOpponent = (opponentId: string) => {
    setPreselectedOpponentId(opponentId);
    setBookingSeed({});
    setActiveTab('book');
  };

  return (
    <div className="min-h-screen bg-[#eef1f8] text-[#0b1742] flex justify-center items-start sm:py-5 selection:bg-violet-200">
      <div className="qp-shell qp-app-shell w-full max-w-md lg:max-w-6xl min-h-screen sm:min-h-[94vh] sm:rounded-[38px] flex flex-col relative overflow-hidden border border-white">
        {activeTab !== 'home' && <Header activeTab={activeTab} onOpenAdmin={() => setActiveTab('admin')} />}

        <main className={`qp-main ${activeTab === 'home' ? 'flex-1 min-h-0' : 'flex-1 px-4 lg:px-8 pt-1 pb-24 lg:pb-24 overflow-y-auto custom-scrollbar'}`}>
          {activeTab === 'home' && (
            <HomeView
              onStartBooking={startGeneralBooking}
              onViewAllMatches={() => setActiveTab('matches')}
              onViewSchedule={() => setActiveTab('schedule')}
              onViewPlayers={() => setActiveTab('players')}
            />
          )}

          {activeTab === 'book' && (
            <BookingWizard
              preselectedOpponentId={preselectedOpponentId}
              preselectedDate={bookingSeed.date}
              preselectedStartTime={bookingSeed.startTime}
              preselectedCourtId={bookingSeed.courtId}
              onSuccess={() => setActiveTab('matches')}
              onCancel={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'matches' && <MyMatchesView onStartBooking={startGeneralBooking} />}
          {activeTab === 'games' && <ScheduledGamesView />}
          {activeTab === 'schedule' && (
            <CourtScheduleView
              onScheduleSlot={(date, startTime, courtId) => {
                setPreselectedOpponentId(undefined);
                setBookingSeed({ date, startTime: startTime || undefined, courtId });
                setActiveTab('book');
              }}
            />
          )}
          {activeTab === 'players' && <PlayersView onChallengePlayer={startBookingWithOpponent} />}
          {activeTab === 'profile' && <ProfileView onOpenAdmin={() => setActiveTab('admin')} />}
          {activeTab === 'admin' && <AdminDashboard onBack={() => setActiveTab('home')} />}
        </main>

        {activeTab !== 'admin' && <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />}
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><MainApp /></AuthProvider>;
}
