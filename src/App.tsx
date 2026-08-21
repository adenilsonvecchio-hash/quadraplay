import React, { useState } from 'react';
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

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [preselectedOpponentId, setPreselectedOpponentId] = useState<string | undefined>(undefined);
  const [bookingSeed, setBookingSeed] = useState<{date?: string; startTime?: string; courtId?: string}>({});

  if (!currentUser) {
    return <LoginView onSuccess={() => setActiveTab('home')} />;
  }

  const handleStartBookingWithOpponent = (opponentId: string) => {
    setPreselectedOpponentId(opponentId);
    setBookingSeed({});
    setActiveTab('book');
  };

  const handleStartGeneralBooking = () => {
    setPreselectedOpponentId(undefined);
    setBookingSeed({});
    setActiveTab('book');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DCE7F5] via-[#E9F1FA] to-[#D5E3F2] text-slate-900 font-sans flex justify-center items-start sm:py-6 selection:bg-[#D4F63D] selection:text-slate-950">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#EDF4FC] via-[#F5F9FE] to-[#E8F2FC] min-h-screen sm:min-h-[92vh] sm:rounded-[36px] flex flex-col shadow-[0_20px_60px_rgba(11,27,56,0.18)] relative border border-white/80 overflow-hidden">
        {/* Top Header (only show when not in full booking wizard) */}
        <Header
          activeTab={activeTab}
          onOpenAdmin={() => setActiveTab('admin')}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 pt-3 pb-28 overflow-y-auto custom-scrollbar">
          {activeTab === 'home' && (
            <HomeView
              onStartBooking={handleStartGeneralBooking}
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
              onSuccess={() => setActiveTab('home')}
              onCancel={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'matches' && (
            <MyMatchesView onStartBooking={handleStartGeneralBooking} />
          )}

          {activeTab === 'schedule' && (
            <CourtScheduleView
              onScheduleSlot={(date, startTime, courtId) => {
                setPreselectedOpponentId(undefined);
                setBookingSeed({ date, startTime: startTime || undefined, courtId });
                setActiveTab('book');
              }}
            />
          )}

          {activeTab === 'players' && (
            <PlayersView onChallengePlayer={handleStartBookingWithOpponent} />
          )}

          {activeTab === 'profile' && (
            <ProfileView onOpenAdmin={() => setActiveTab('admin')} />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard onBack={() => setActiveTab('home')} />
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation */}
        {activeTab !== 'book' && (
          <BottomNav activeTab={activeTab} onChangeTab={(tab) => setActiveTab(tab)} />
        )}
      </div>
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
