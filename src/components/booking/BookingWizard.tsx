import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Player, CourtSlot } from '../../types';
import { storageService } from '../../services/storageService';
import {
  getBrasiliaToday,
  addDays,
  formatFriendlyDate,
  formatDayAndMonth,
  isBeforeDate,
} from '../../utils/dateUtils';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  User,
  Users,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookingWizardProps {
  preselectedOpponentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

export const BookingWizard: React.FC<BookingWizardProps> = ({
  preselectedOpponentId,
  onSuccess,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<Step>(1);

  // Form State
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getBrasiliaToday());
  const [selectedSlot, setSelectedSlot] = useState<CourtSlot | null>(null);

  // Available Data
  const [classOpponents, setClassOpponents] = useState<Player[]>([]);
  const [daySlots, setDaySlots] = useState<CourtSlot[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const today = getBrasiliaToday();

  // Load class opponents
  useEffect(() => {
    if (!currentUser) return;
    const sameClassPlayers = storageService
      .getPlayersByClass(currentUser.tennisClass)
      .filter((p) => p.id !== currentUser.id);

    setClassOpponents(sameClassPlayers);

    if (preselectedOpponentId) {
      const opp = sameClassPlayers.find((p) => p.id === preselectedOpponentId);
      if (opp) {
        setSelectedOpponent(opp);
        setStep(2);
      }
    }
  }, [currentUser, preselectedOpponentId]);

  // Load court slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const slots = storageService.getCourtScheduleForDate(selectedDate);
    setDaySlots(slots);
    // Reset selected slot if not valid for this date
    setSelectedSlot(null);
  }, [selectedDate]);

  if (!currentUser) return null;

  // Next 14 days quick selector
  const availableDates: { dateStr: string; label: string; weekday: string; day: string }[] = [];
  for (let i = 0; i < 14; i++) {
    const dStr = addDays(today, i);
    const parts = formatDayAndMonth(dStr);
    let label = `${parts.weekday}, ${parts.day}`;
    if (i === 0) label = 'Hoje';
    if (i === 1) label = 'Amanhã';

    availableDates.push({
      dateStr: dStr,
      label,
      weekday: parts.weekday,
      day: parts.day,
    });
  }

  const handleSelectOpponent = (player: Player) => {
    setSelectedOpponent(player);
    setErrorMsg(null);
    setStep(2);
  };

  const handleSelectDate = (dateStr: string) => {
    if (isBeforeDate(dateStr, today)) return;
    setSelectedDate(dateStr);
    setErrorMsg(null);
    setStep(3);
  };

  const handleSelectSlot = (slot: CourtSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setErrorMsg(null);
    setStep(4);
  };

  const handleConfirmBooking = () => {
    if (!selectedOpponent || !selectedDate || !selectedSlot) {
      setErrorMsg('Por favor, complete todas as etapas do agendamento.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Call service to validate atomic collision and store
    setTimeout(() => {
      const result = storageService.createMatch({
        player1Id: currentUser.id,
        player2Id: selectedOpponent.id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      setIsSubmitting(false);

      if (result.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1800);
      } else {
        setErrorMsg(result.error || 'Erro ao realizar agendamento.');
      }
    }, 300);
  };

  // Step names for top indicator
  const stepTitles = [
    'Adversário',
    'Data',
    'Horário',
    'Confirmação',
  ];

  return (
    <div className="bg-white min-h-[calc(100vh-140px)] rounded-3xl p-4 md:p-6 border border-slate-200 shadow-sm relative">
      {/* Header & Step progress */}
      <div className="border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <button
            id="btn-booking-back"
            onClick={() => {
              if (step > 1) {
                setStep((s) => (s - 1) as Step);
                setErrorMsg(null);
              } else {
                onCancel();
              }
            }}
            className="p-1.5 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{step === 1 ? 'Cancelar' : 'Voltar'}</span>
          </button>

          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Etapa {step} de 4
          </span>

          <span className="text-xs font-bold text-[#0F1E36] bg-slate-100 px-2 py-0.5 rounded-full">
            Classe {currentUser.tennisClass}
          </span>
        </div>

        {/* Progress pills */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-[#0F1E36]'
                    : s < step
                    ? 'bg-[#D4F63D]'
                    : 'bg-slate-200'
                }`}
              />
              <span
                className={`text-[9px] text-center font-bold truncate ${
                  s === step ? 'text-[#0F1E36]' : 'text-slate-400'
                }`}
              >
                {stepTitles[s - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {bookingSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 text-center bg-white rounded-2xl flex flex-col items-center justify-center my-8"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Agendamento Confirmado!</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-xs">
            A quadra foi reservada com sucesso para você e {selectedOpponent?.name}.
          </p>
          <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {formatFriendlyDate(selectedDate)} às {selectedSlot?.startTime}
          </div>
        </motion.div>
      )}

      {!bookingSuccess && (
        <>
          {/* STEP 1: Escolher Adversário */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              <div>
                <h3 className="text-base font-black text-slate-900">1. Escolha seu adversário</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mostrando os 9 atletas cadastrados na sua categoria (Classe {currentUser.tennisClass}).
                </p>
              </div>

              <div className="space-y-2 mt-3 max-h-[60vh] overflow-y-auto pr-1">
                {classOpponents.map((opponent) => {
                  const isSelected = selectedOpponent?.id === opponent.id;
                  return (
                    <button
                      key={opponent.id}
                      id={`btn-opponent-${opponent.id}`}
                      onClick={() => handleSelectOpponent(opponent)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-[#0F1E36] bg-slate-50 ring-2 ring-[#0F1E36]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#0F1E36] font-bold text-sm flex items-center justify-center border border-slate-200">
                          {opponent.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{opponent.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-semibold text-slate-500">
                              {opponent.phone || opponent.email}
                            </span>
                            <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                              Classe {opponent.tennisClass}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Escolher Data */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-black text-slate-900">2. Escolha a data do jogo</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adversário selecionado:{' '}
                  <strong className="text-slate-800">{selectedOpponent?.name}</strong> (Classe{' '}
                  {selectedOpponent?.tennisClass})
                </p>
              </div>

              {/* Date horizontal/grid picker */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {availableDates.map((item) => {
                  const isSelected = selectedDate === item.dateStr;
                  return (
                    <button
                      key={item.dateStr}
                      id={`btn-date-${item.dateStr}`}
                      onClick={() => handleSelectDate(item.dateStr)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#0F1E36] text-white border-[#0F1E36] shadow-md ring-2 ring-slate-900'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`text-[10px] uppercase font-bold ${
                          isSelected ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {item.weekday}
                      </span>
                      <span className="text-lg font-black my-0.5">{item.day}</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isSelected ? 'text-[#D4F63D]' : 'text-slate-500'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Manual date input fallback if needed */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ou selecione no calendário:
                </label>
                <div className="relative">
                  <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-booking-date"
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) handleSelectDate(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Escolher Horário */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              <div>
                <h3 className="text-base font-black text-slate-900">3. Escolha o horário</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quadra Central em <strong className="text-slate-800">{formatFriendlyDate(selectedDate)}</strong>
                </p>
              </div>

              {/* Slot Legend */}
              <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span>Ocupado</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>Bloqueado</span>
                </div>
              </div>

              {/* Slots List */}
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[55vh] overflow-y-auto pr-1">
                {daySlots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;

                  if (slot.isBlocked) {
                    return (
                      <div
                        key={slot.startTime}
                        className="p-3 rounded-2xl border border-amber-200 bg-amber-50/60 opacity-70 text-left cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-900">{slot.startTime}</span>
                          <span className="text-[9px] font-bold uppercase bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
                            Bloqueado
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800 mt-1 truncate">{slot.blockReason}</p>
                      </div>
                    );
                  }

                  if (!slot.available) {
                    return (
                      <div
                        key={slot.startTime}
                        className="p-3 rounded-2xl border border-slate-200 bg-slate-100 opacity-60 text-left cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">{slot.startTime}</span>
                          <span className="text-[9px] font-bold uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            Reservado
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">
                          {slot.match ? `Jogo Classe ${slot.match.tennisClass}` : 'Indisponível'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slot.startTime}
                      id={`btn-slot-${slot.startTime}`}
                      onClick={() => handleSelectSlot(slot)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#0F1E36] text-white border-[#0F1E36] shadow-sm'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-98'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black">{slot.startTime} às {slot.endTime}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-[#D4F63D] text-slate-950'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Livre
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        1 hora de jogo
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Confirmar Agendamento */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-black text-slate-900">4. Conferir e confirmar</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revise os detalhes da partida antes de confirmar a reserva.
                </p>
              </div>

              {/* Match Card Summary required by prompt */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                {/* Players */}
                <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jogador 1</span>
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {currentUser.name} (Você)
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-[#D4F63D] text-slate-950 text-xs font-black">
                    VS
                  </div>
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jogador 2</span>
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {selectedOpponent?.name}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Classe</span>
                    <span className="font-extrabold text-[#0F1E36] bg-slate-200/80 px-2 py-0.5 rounded-md">
                      Classe {currentUser.tennisClass}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Data</span>
                    </span>
                    <span className="font-bold text-slate-900">{formatFriendlyDate(selectedDate)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Horário</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedSlot?.startTime} às {selectedSlot?.endTime} (Fuso de Brasília)
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Quadra</span>
                    </span>
                    <span className="font-bold text-slate-900">Quadra Central (Saibro)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Button (Tennis Yellow) */}
              <button
                id="btn-confirm-booking-final"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="w-full py-4 px-4 bg-[#D4F63D] hover:bg-[#c4ea2b] active:scale-98 text-slate-950 font-black text-base rounded-2xl shadow-md shadow-lime-900/15 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Reservando horário...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};
