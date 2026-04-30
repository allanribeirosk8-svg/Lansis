import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useStore, DEFAULT_DAY_CONFIG } from '../context/Store';
import { DebugPanel } from '../components/DebugPanel';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { compressImage, formatDate, getTodayString, generateTimeSlots, formatCurrency, formatPhone, getOccupiedSlots, normalizePhone, normalizeTime, formatDateLong, capitalizeName, getInitials, getAvatarColor } from '../utils/helpers';
import { useSwipe } from '../hooks/useSwipe';
import { Customer, ServiceItem, Appointment, BarberProfile } from '../types';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Ban, 
  X, 
  Plus, 
  User, 
  LogOut, 
  Settings2, 
  Settings,
  Moon,
  Sun,
  Users, 
  Scissors, 
  BarChart3, 
  Clock, 
  Check, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronsRight,
  ChevronsLeft,
  Search,
  UserPlus,
  Camera,
  AlertTriangle,
  Instagram,
  MapPin,
  Phone,
  Save,
  Lock,
  Unlock,
  ThumbsDown,
  Repeat,
  Home,
  GripVertical,
  TrendingUp,
  TrendingDown,
  Zap,
  CheckCircle2,
  XCircle,
  Minus,
  DollarSign,
  Users2,
  Activity,
  Award,
  UserX,
  PieChart as PieChartIcon,
  LayoutDashboard,
  Pencil,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const useLockBodyScroll = (locked: boolean = true) => {
  useEffect(() => {
    if (!locked) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [locked]);
};

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const PhotoActionSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (source: 'camera' | 'gallery') => void;
}> = ({ isOpen, onClose, onSelect }) => {
  useLockBodyScroll();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-md bg-white dark:bg-[#242424] rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-3">
          <h3 className="text-center text-xs font-black uppercase tracking-widest text-[#8A98A8] mb-4">Adicionar Foto</h3>
          <button 
            onClick={() => onSelect('camera')}
            className="w-full h-14 bg-[#F4F7FB] dark:bg-[#303030] rounded-2xl flex items-center justify-center gap-3 text-[#5A6878] dark:text-[#F8F8F8] font-bold hover:bg-[#E8EEF5] transition-colors"
          >
            <Camera size={20} className="text-[#2898D8]" />
            Tirar foto agora
          </button>
          <button 
            onClick={() => onSelect('gallery')}
            className="w-full h-14 bg-[#F4F7FB] dark:bg-[#303030] rounded-2xl flex items-center justify-center gap-3 text-[#5A6878] dark:text-[#F8F8F8] font-bold hover:bg-[#E8EEF5] transition-colors"
          >
            <Plus size={20} className="text-[#2898D8]" />
            Escolher da galeria
          </button>
          <button 
            onClick={onClose}
            className="w-full h-14 bg-white dark:bg-[#242424] text-[#8A98A8] font-bold uppercase tracking-widest text-xs"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PhotoDescriptionModal: React.FC<{
  isOpen: boolean;
  photo: string;
  onClose: () => void;
  onConfirm: (description: string) => void;
}> = ({ isOpen, photo, onClose, onConfirm }) => {
  useLockBodyScroll();
  const [description, setDescription] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-md bg-white dark:bg-[#242424] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[40vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#D0D8E4] dark:border-[#3A3A3A] shrink-0">
              <img src={photo} className="w-full h-full object-cover" alt="Preview" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#8A98A8]">Descrição da Foto</h3>
              <p className="text-[10px] text-[#8A98A8] dark:text-[#5A6878]">Adicione um detalhe sobre este atendimento</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <textarea 
              autoFocus
              placeholder="Ex: Degradê com franja"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#F4F7FB] dark:bg-[#303030] border-none rounded-2xl p-4 text-sm text-[#5A6878] dark:text-[#F8F8F8] focus:ring-2 ring-[#2898D8] h-20 resize-none"
            />
          </div>
          
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-12 rounded-2xl text-[#8A98A8] font-bold uppercase tracking-widest text-[10px] bg-[#F4F7FB] dark:bg-[#303030]">Cancelar</button>
            <button 
              onClick={() => onConfirm(description)}
              className="flex-1 h-12 bg-[#2898D8] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#2898D8]/20"
            >
              Confirmar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SettingsModal: React.FC<{ 
  onClose: () => void;
  onOpenWeekly: () => void;
  onLogout: () => void;
}> = ({ onClose, onOpenWeekly, onLogout }) => {
  useLockBodyScroll();
  const { isDarkMode, toggleDarkMode } = useStore();
  
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#242424]/40 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-[#FFFFFF] dark:bg-[#242424] w-full max-w-md rounded-t-[2.5rem] shadow-[0_-1px_20px_rgba(0,0,0,0.1)] overflow-hidden p-8 pt-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-[#D0D8E4] dark:bg-[#3A3A3A] rounded-full mx-auto mb-8" />
        
        <h2 className="text-xl font-black text-[#1A2332] dark:text-[#F8F8F8] uppercase tracking-tight mb-8">Configurações</h2>
        
        <div className="space-y-4">
          <button 
            onClick={() => {
              onOpenWeekly();
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#F4F7FB] dark:bg-[#2F2F2F] hover:bg-[#E4E7EB] dark:hover:bg-[#3A3A3A] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] dark:bg-[#242424] flex items-center justify-center text-[#2898D8] shadow-sm">
                <Calendar size={20} />
              </div>
              <span className="font-bold text-[#1A2332] dark:text-[#F8F8F8]">Padrão Semanal</span>
            </div>
            <ChevronRight size={18} className="text-[#B0BCC7] group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#F4F7FB] dark:bg-[#2F2F2F]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] dark:bg-[#242424] flex items-center justify-center text-amber-500 shadow-sm">
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <span className="font-bold text-[#1A2332] dark:text-[#F8F8F8]">Modo Escuro</span>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-[#2898D8]' : 'bg-[#D0D8E4]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] dark:bg-[#242424] flex items-center justify-center text-red-500 shadow-sm">
                <LogOut size={20} />
              </div>
              <span className="font-bold text-red-600">Sair da conta</span>
            </div>
          </button>
        </div>
        
        <div className="mt-8 pb-safe">
          <button onClick={onClose} className="w-full py-4 text-xs font-black uppercase tracking-widest text-[#8A98A8] hover:text-[#1A2332] transition-colors">Fechar</button>
        </div>
      </motion.div>
    </div>
  );
};

const useScrollDirection = () => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Detectar fim da página
      const isAtBottom = 
        window.innerHeight + window.scrollY >= 
        document.body.offsetHeight - 10;

      if (isAtBottom) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Detectar inatividade
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      // Show if scrolling up or at the top
      if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide if scrolling down and not at the top
      else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  return isVisible;
};

const AuthScreen: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const mapError = (err: any) => {
    const message = err.message || '';
    if (message === 'Preencha todos os campos' || message === 'As senhas não coincidem') return message;
    if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos';
    if (message.includes('User already registered')) return 'Este e-mail já possui uma conta';
    if (message.includes('Password should be at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres';
    return 'Ocorreu um erro. Tente novamente.';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado');
      }

      if (view === 'login') {
        if (!email || !password) throw new Error('Preencha todos os campos');
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginErr) throw loginErr;
        onAuthenticated();
      } else {
        if (!email || !password || !confirmPassword) throw new Error('Preencha todos os campos');
        if (password.length < 6) throw new Error('Password should be at least 6 characters');
        if (password !== confirmPassword) throw new Error('As senhas não coincidem');
        
        const { error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) throw signUpErr;
        
        setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar.');
        setTimeout(() => {
          setView('login');
          setSuccessMsg('');
          setPassword('');
          setConfirmPassword('');
        }, 2000);
      }
    } catch (err: any) {
      setError(mapError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setView(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div 
      className="h-screen flex flex-col items-center justify-between px-6 py-8 relative transition-colors duration-500 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1A3A6E 0%, #2563E8 45%, #4A8FFF 75%, #94D4FF 100%)'
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.03
        }}
      />

      {/* Decorative Orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(148,212,255,0.20) 0%, transparent 70%)' }}
      />
      <div className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(37,99,232,0.25) 0%, transparent 70%)' }}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center relative z-10 flex-shrink-0 mt-2"
      >
        <div className="w-20 h-20 bg-white/15 backdrop-blur-sm border border-white/25 rounded-[2rem] flex items-center justify-center text-white mb-4 shadow-xl">
          <Scissors size={40} />
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-[0.3em]">MEU CORTE</h1>
        <AnimatePresence mode="wait">
          <motion.p 
            key={view}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-white/50 text-sm mt-2 font-medium"
          >
            {view === 'login' ? 'Faça login para continuar' : 'Crie sua conta'}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl relative z-10 flex-shrink min-h-0 ${view === 'register' ? 'p-6' : 'p-8'}`}
        style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, x: view === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: view === 'login' ? 20 : -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <form onSubmit={handleAuth} className={view === 'register' ? "space-y-3" : "space-y-4"}>
              <div className={view === 'register' ? "space-y-3" : "space-y-4"}>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-2xl h-14 pl-12 pr-4 focus:ring-2 focus:ring-[#2898D8]/60 focus:border-[#2898D8]/60 outline-none transition-all shadow-inner"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
                    <Lock size={20} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-2xl h-14 pl-12 pr-12 focus:ring-2 focus:ring-[#2898D8]/60 focus:border-[#2898D8]/60 outline-none transition-all shadow-inner"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {view === 'register' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="relative group overflow-hidden"
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors">
                      <Lock size={20} />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirmar Senha"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-2xl h-14 pl-12 pr-4 focus:ring-2 focus:ring-[#2898D8]/60 focus:border-[#2898D8]/60 outline-none transition-all shadow-inner"
                      required
                    />
                  </motion.div>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-2xl p-3 text-sm text-center font-bold"
                  >
                    {error}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-500/20 border border-green-400/30 text-green-300 rounded-2xl p-3 text-sm text-center font-bold"
                  >
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={isLoading}
                className="bg-white text-[#1A3A6E] hover:bg-white/90 disabled:opacity-70 disabled:cursor-not-allowed h-14 rounded-2xl font-black uppercase tracking-widest w-full transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#1A3A6E]/30 border-t-[#1A3A6E] rounded-full animate-spin" />
                    <span>{view === 'login' ? 'Entrando...' : 'Criando conta...'}</span>
                  </div>
                ) : (
                  <span>{view === 'login' ? 'Entrar' : 'Criar conta'}</span>
                )}
              </button>
            </form>
          </motion.div>
        </AnimatePresence>

        <div className={`${view === 'register' ? 'mt-4' : 'mt-8'} text-center flex flex-col gap-1`}>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
            {view === 'login' ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
          </p>
          <button 
            onClick={toggleView}
            className="text-white text-xs font-bold hover:text-white/80 transition-colors"
          >
            {view === 'login' ? 'Criar conta' : 'Fazer login'}
          </button>
        </div>
      </motion.div>

      <div className="mt-4 mb-2 relative z-10 flex-shrink-0">
        <Link to="/" className="text-white/25 hover:text-white/50 font-black uppercase tracking-[0.2em] text-[11px] transition-colors">
          Sou Cliente
        </Link>
      </div>
    </div>
  );
};

export const AdminApp: React.FC = () => {
  const { barberProfile, appointments, isDarkMode, toggleDarkMode } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'clientes' | 'servicos' | 'relatorios'>('agenda');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [targetCustomerPhone, setTargetCustomerPhone] = useState<string | null>(null);
  
  const [prefilledSlot, setPrefilledSlot] = useState<{ date: string, time: string } | null>(null);
  const [isExceptionalMode, setIsExceptionalMode] = useState(false);
  const [prefilledCustomer, setPrefilledCustomer] = useState<Customer | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [photoTargetPhone, setPhotoTargetPhone] = useState<string | null>(null);
  const [showPhotoActionSheet, setShowPhotoActionSheet] = useState(false);
  const [showPhotoDescription, setShowPhotoDescription] = useState(false);

  const isVisible = useScrollDirection();
  const isAnyModalOpen = showAddModal || showAddCustomerModal || showWeeklyModal || 
                         showProfileModal || showSettingsModal || showCalendarModal || 
                         !!reschedulingApt || showPhotoActionSheet || showPhotoDescription;
  
  const footerVisible = isVisible && !isAnyModalOpen;
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { updateCustomerPhoto } = useStore();

  const handleCameraClick = (phone: string) => {
    setPhotoTargetPhone(phone);
    setShowPhotoActionSheet(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && photoTargetPhone) {
      try {
        const base64 = await compressImage(e.target.files[0]);
        setTempPhoto(base64);
        setShowPhotoDescription(true);
      } catch (err) {
        console.error("Erro ao processar foto:", err);
      } finally {
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
      }
    }
  };

  const handleConfirmPhoto = (description: string) => {
    if (tempPhoto && photoTargetPhone) {
      updateCustomerPhoto(photoTargetPhone, tempPhoto, description);
      setSuccessMessage('Foto adicionada ao histórico!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setTempPhoto(null);
      setShowPhotoDescription(false);
      setPhotoTargetPhone(null);
    }
  };

  const pendingTodayCount = useMemo(() => {
    const today = getTodayString();
    return appointments.filter(a => a.date === today && a.status === 'pending').length;
  }, [appointments]);

  useEffect(() => {
    const checkSession = async () => {
      if (isSupabaseConfigured()) {
        const result = await supabase.auth.getSession();
        if (result?.data?.session) {
          setIsAuthenticated(true);
        }
      }
    };
    checkSession();

    if (isSupabaseConfigured()) {
      const authResult = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
      });

      return () => {
        if (authResult?.data?.subscription) {
          authResult.data.subscription.unsubscribe();
        }
      };
    }
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setShowSettingsModal(false);
  };

  const handleNavigateToCustomer = (phone: string) => {
    setTargetCustomerPhone(phone);
    setActiveTab('clientes');
  };

  const openAddWithSlot = (date: string, time: string, isExceptional: boolean = false) => {
    setPrefilledSlot({ date, time });
    setIsExceptionalMode(isExceptional);
    setShowAddModal(true);
  };

  const openAddForCustomer = (customer: Customer) => {
    setPrefilledCustomer(customer);
    setShowAddModal(true);
  };

  const getGreetingOnly = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia,';
    if (hour >= 12 && hour < 18) return 'Boa tarde,';
    return 'Boa noite,';
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '☀️';
    if (hour >= 12 && hour < 18) return '👋';
    return '🌙';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = barberProfile.name || 'Barbeiro';
    if (hour >= 5 && hour < 12) return `Bom dia, ${name}! ☀️`;
    if (hour >= 12 && hour < 18) return `Boa tarde, ${name}! 👋`;
    return `Boa noite, ${name}! 🌙`;
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-[#181818] relative">
      <motion.header 
        className="sticky top-0 z-[100] h-20 bg-white dark:bg-[#242424] backdrop-blur-md border-b border-[#D0D8E4] dark:border-[#3A3A3A] px-6 flex items-center justify-between"
        initial={false}
        animate={{ 
          y: footerVisible ? 0 : -100,
          opacity: footerVisible ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Left: Identity & Profile */}
        <div className="flex items-center gap-3">
          {activeTab === 'agenda' ? (
            <div className="flex items-center gap-3">
              {/* Foto de perfil — maior e com ring colorido */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="relative flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#2898D8]/30 shadow-md shadow-[#2898D8]/10 bg-[#E8F4FC] dark:bg-[#1A3A58]">
                  {barberProfile.photo ? (
                    <img src={barberProfile.photo} alt={barberProfile.name}
                      className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={22} className="text-[#2898D8]" />
                    </div>
                  )}
                </div>
                {/* Dot de status online */}
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#3CB878] rounded-full border-2 border-white dark:border-slate-900" />
              </button>
              {/* Texto em 2 linhas */}
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-medium text-[#8A98A8] dark:text-[#707070] uppercase tracking-wider">
                  {getGreetingOnly()}
                </span>
                <span className="text-base font-bold text-[#1A2332] dark:text-[#F8F8F8] leading-snug">
                  {barberProfile.name || 'Barbeiro'} {getGreetingEmoji()}
                </span>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab('agenda')}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#2A2A2A] text-[#5A6878] dark:text-[#CCCCCC] flex items-center justify-center hover:bg-[#F4F7FB] border border-[#D0D8E4] dark:border-[#444444] transition-colors shadow-sm"
              title="Voltar para Agenda"
            >
              <Home size={20} />
            </button>
          )}
        </div>

        {/* Center: Title (Only for other tabs) */}
        {activeTab !== 'agenda' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <h2 className="text-lg font-bold uppercase tracking-tight text-[#1A2332] dark:text-[#FFFFFF]">
              {activeTab === 'clientes' ? 'Clientes' : activeTab === 'servicos' ? 'Serviços' : 'Relatórios'}
            </h2>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSettingsModal(true)} className="w-9 h-9 rounded-full bg-white dark:bg-[#303030] text-[#8A98A8] dark:text-[#5A6878] flex items-center justify-center hover:bg-[#F4F7FB] dark:hover:bg-[#374151] transition-colors border border-[#D0D8E4] dark:border-[#3A3A3A] shadow-sm" title="Configurações">
            <Settings size={18} />
          </button>
        </div>
      </motion.header>

      <main className="px-4 pt-3 pb-20 relative">
        {activeTab === 'agenda' && (
            <AgendaView 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onOpenCustomer={handleNavigateToCustomer} 
                showWeeklyModal={showWeeklyModal}
                setShowWeeklyModal={setShowWeeklyModal}
                onReschedule={setReschedulingApt}
                onAddInSlot={openAddWithSlot}
                handleCameraClick={handleCameraClick}
                onSuccess={(msg) => {
                  setSuccessMessage(msg);
                  setTimeout(() => setSuccessMessage(null), 3000);
                }}
            />
        )}
        {activeTab === 'clientes' && (
          <CustomersView 
            initialPhone={targetCustomerPhone} 
            clearInitial={() => setTargetCustomerPhone(null)} 
            onNewAppointment={openAddForCustomer}
            onAddCustomer={() => setShowAddCustomerModal(true)}
            onSuccess={(msg) => {
              setSuccessMessage(msg);
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
          />
        )}
        {activeTab === 'relatorios' && <ReportsView />}
        {activeTab === 'servicos' && (
          <ServicesView 
            onSuccess={(msg) => {
              setSuccessMessage(msg);
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
          />
        )}
      </main>

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[10px]"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={14} />
            </div>
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modais Globais */}
      <AnimatePresence>
        {showSettingsModal && (
          <SettingsModal 
            onClose={() => setShowSettingsModal(false)}
            onOpenWeekly={() => setShowWeeklyModal(true)}
            onLogout={handleLogout}
          />
        )}
        {showWeeklyModal && (
          <WeeklyConfigModal onClose={() => setShowWeeklyModal(false)} />
        )}
      </AnimatePresence>

      {showAddModal && (
        <AddAppointmentModal 
          selectedDate={prefilledSlot?.date || getTodayString()} 
          selectedTime={prefilledSlot?.time || ''}
          prefilledCustomer={prefilledCustomer}
          isExceptional={isExceptionalMode}
          onClose={() => { 
            setShowAddModal(false); 
            setPrefilledSlot(null); 
            setPrefilledCustomer(null);
            setIsExceptionalMode(false);
          }} 
          onSuccess={() => {
            setSuccessMessage('Agendamento realizado com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#2898D8', '#ffffff', '#3CB878']
            });
          }}
        />
      )}
      {showAddCustomerModal && (
        <AddCustomerModal 
          onClose={() => setShowAddCustomerModal(false)}
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)} 
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
      {reschedulingApt && (
        <RescheduleModal 
          appointment={reschedulingApt} 
          onClose={() => setReschedulingApt(null)} 
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      <motion.div 
        className="fixed bottom-0 left-0 w-full z-40 pointer-events-none"
        initial={false}
        animate={{ 
          y: footerVisible ? 0 : 100,
          opacity: footerVisible ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
          <nav className="bg-[#FFFFFF] dark:bg-[#242424] border-t border-[#D0D8E4] dark:border-[#3A3A3A] pb-safe px-2 flex justify-between items-center h-[54px] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pointer-events-auto">
            {[
              { id: 'agenda', label: 'Agenda', icon: <Calendar size={20} /> },
              { id: 'clientes', label: 'Clientes', icon: <Users size={20} /> },
              { id: 'servicos', label: 'Serviços', icon: <Scissors size={20} /> },
              { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={20} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                    setActiveTab(item.id as any);
                    if(item.id !== 'clientes') setTargetCustomerPhone(null);
                }}
                className={`flex-1 flex flex-col items-center justify-center transition-all gap-0.5 h-full min-h-[44px]
                  ${activeTab === item.id ? 'text-[#2898D8] dark:text-[#2098F0]' : 'text-[#C0CAD4] dark:text-[#4A4A4A] hover:text-[#8A98A8] dark:hover:text-[#F8F8F8]'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 relative ${activeTab === item.id ? 'bg-[#2898D8]/10' : 'bg-transparent'}`}>
                  <div className={`transition-transform ${activeTab === item.id ? 'scale-105' : ''}`}>
                    {item.icon}
                  </div>
                  {item.id === 'agenda' && pendingTodayCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-[#FFFFFF] dark:border-[#242424]">
                      {pendingTodayCount}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 ${activeTab === item.id ? 'opacity-100 font-bold' : 'opacity-100'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
      </motion.div>

      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} />
      <input type="file" accept="image/*" ref={galleryInputRef} className="hidden" onChange={handleFileChange} />

      <AnimatePresence>
        {showPhotoActionSheet && (
          <PhotoActionSheet 
            isOpen={showPhotoActionSheet}
            onClose={() => setShowPhotoActionSheet(false)}
            onSelect={(source) => {
              setShowPhotoActionSheet(false);
              if (source === 'camera') cameraInputRef.current?.click();
              else galleryInputRef.current?.click();
            }}
          />
        )}
        {showPhotoDescription && tempPhoto && (
          <PhotoDescriptionModal 
            isOpen={showPhotoDescription}
            photo={tempPhoto}
            onClose={() => {
              setShowPhotoDescription(false);
              setTempPhoto(null);
              setPhotoTargetPhone(null);
            }}
            onConfirm={handleConfirmPhoto}
          />
        )}
      </AnimatePresence>
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  );
};

const AgendaView: React.FC<{ 
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    onOpenCustomer: (phone: string) => void; 
    showWeeklyModal: boolean; 
    setShowWeeklyModal: (show: boolean) => void; 
    onReschedule: (apt: Appointment) => void;
    onAddInSlot: (date: string, time: string, isExceptional?: boolean) => void;
    handleCameraClick: (phone: string) => void;
    onSuccess?: (msg: string) => void;
}> = ({ selectedDate, setSelectedDate, onOpenCustomer, showWeeklyModal, setShowWeeklyModal, onReschedule, onAddInSlot, handleCameraClick, onSuccess }) => {
  const { appointments, finishAppointment, revertAppointment, deleteAppointment, blockedSlots, unblockedSlots, toggleSlotAvailability, toggleSlotUnblock, weeklySchedule, markNoShow, toggleWeeklyBreak, fetchAppointmentsByDate } = useStore();
  
  useEffect(() => {
    fetchAppointmentsByDate(selectedDate);
    setViewDate(new Date(selectedDate + 'T12:00:00'));
  }, [selectedDate]);

  const [activeSlotMenu, setActiveSlotMenu] = useState<string | null>(null);
  const [activeCancelMenu, setActiveCancelMenu] = useState<string | null>(null);
  const [activeNoShowMenu, setActiveNoShowMenu] = useState<string | null>(null);
  const [activeFinishMenu, setActiveFinishMenu] = useState<string | null>(null);
  const [activeRevertMenu, setActiveRevertMenu] = useState<string | null>(null);
  const [activeUnlockMenu, setActiveUnlockMenu] = useState<string | null>(null);
  const [expandedCompletedId, setExpandedCompletedId] = useState<string | null>(null);
  const [finishingId, setFinishingId] = useState<string | null>(null);
  const [weeklyUnlockSlot, setWeeklyUnlockSlot] = useState<string | null>(null);

  // Inline Calendar States
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(selectedDate + 'T12:00:00'));
  const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
  const [slideDirection, setSlideDirection] = useState(0);

  const getAppointmentsCount = (dateStr: string) => {
    return appointments.filter(a => a.date === dateStr && a.status === 'pending').length;
  };

  const formatMonthYear = (date: Date) => {
    const formatted = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const weekDays = useMemo(() => {
    const current = new Date(selectedDate + 'T12:00:00');
    const day = current.getDay();
    // Monday is 1, Sunday is 0. Let's start week on Monday.
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(current.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const dayLabel = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"][dayOfWeek];
      const dayNum = d.getDate().toString().padStart(2, '0');
      const hasAppointments = appointments.some(a => a.date === dateStr);
      const isOpen = weeklySchedule[dayOfWeek]?.isOpen;
      return { dateStr, dayLabel, dayNum, hasAppointments, isOpen };
    });
  }, [selectedDate, appointments, weeklySchedule]);

  const stats = useMemo(() => {
    const today = getTodayString();
    
    // Day stats for selectedDate
    const dayApts = appointments.filter(a => a.date === selectedDate && a.status === 'completed');
    const dayRevenue = dayApts.reduce((sum, a) => sum + (a.price || 0), 0);
    
    // Week stats based on selectedDate's week
    const current = new Date(selectedDate + 'T12:00:00');
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];
    
    const weekApts = appointments.filter(a => a.date >= mondayStr && a.date <= sundayStr && a.status === 'completed');
    const weekRevenue = weekApts.reduce((sum, a) => sum + (a.price || 0), 0);

    // Labels
    const isToday = selectedDate === today;
    const dayLabel = isToday ? "HOJE" : new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
    
    // Check if selectedDate is in current week
    const now = new Date();
    const nowDay = now.getDay();
    const nowDiff = now.getDate() - nowDay + (nowDay === 0 ? -6 : 1);
    const currentMonday = new Date(now.setDate(nowDiff));
    const currentMondayStr = currentMonday.toISOString().split('T')[0];
    
    const isCurrentWeek = mondayStr === currentMondayStr;
    const weekLabel = isCurrentWeek ? "Semana atual" : `${monday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')} - ${sunday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}`;
    
    return {
      dayCount: dayApts.length,
      dayRevenue,
      weekCount: weekApts.length,
      weekRevenue,
      dayLabel,
      weekLabel
    };
  }, [appointments, selectedDate]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleAgendaSwipeLeft = () => {
    if (isCalendarExpanded) {
      if (viewMode !== 'days') return;
      setSlideDirection(1);
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    } else {
      navigateWeek('next');
    }
  };

  const handleAgendaSwipeRight = () => {
    if (isCalendarExpanded) {
      if (viewMode !== 'days') return;
      const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      if (newDate.getFullYear() >= 2026) {
        setSlideDirection(-1);
        setViewDate(newDate);
      }
    } else {
      navigateWeek('prev');
    }
  };

  const agendaSwipeHandlers = useSwipe(handleAgendaSwipeLeft, handleAgendaSwipeRight);

  // Outside click detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container') && !target.closest('.slot-trigger')) {
        setActiveSlotMenu(null);
        setActiveCancelMenu(null);
        setActiveNoShowMenu(null);
        setActiveFinishMenu(null);
        setActiveRevertMenu(null);
        setActiveUnlockMenu(null);
      }
    };

    if (activeSlotMenu || activeCancelMenu || activeNoShowMenu || activeFinishMenu || activeRevertMenu || activeUnlockMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSlotMenu, activeCancelMenu, activeNoShowMenu, activeFinishMenu, activeRevertMenu, activeUnlockMenu]);

  const handleFinish = (id: string) => {
    setFinishingId(id);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#2898D8', '#3CB878', '#ffffff'],
      zIndex: 100
    });

    // Delay the actual state update to allow animation to play in place
    setTimeout(() => {
      finishAppointment(id);
      setFinishingId(null);
    }, 1000);
  };

  useLockBodyScroll(!!weeklyUnlockSlot);

  const dayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();
  const dateBlockedSlots = blockedSlots[selectedDate] || [];
  const dayConfig = weeklySchedule[dayOfWeek];
  const currentDayAppointments = appointments.filter(a => a.date === selectedDate);

  const generatedSlots = useMemo(() => {
    if (!dayConfig) return [];
    
    // 1. Base slots from weekly schedule - only if open
    const baseSlots = dayConfig.isOpen ? generateTimeSlots(dayConfig.start, dayConfig.end) : [];
    
    // 2. Map appointment times for the current day
    const appointmentTimes = currentDayAppointments.map(a => a.time);
    
    // 3. Merge, remove duplicates, and sort
    const allSlots = Array.from(new Set([...baseSlots, ...appointmentTimes]));
    return allSlots.sort((a, b) => a.localeCompare(b));
  }, [dayConfig, appointments, selectedDate, currentDayAppointments]);

  const isPast = (time: string) => {
    const today = getTodayString();
    if (selectedDate < today) return true;
    if (selectedDate > today) return false;
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate < now;
  };

  const activeSlots = useMemo(() => {
    const items = generatedSlots.map(slot => {
        const apt = currentDayAppointments.find(a => {
          const occupied = getOccupiedSlots(a.time, a.duration || 30);
          return occupied.includes(slot);
        });
        
        const isStartSlot = apt?.time === slot;
        return { slot, apt, isStartSlot };
    });

    return items.filter(({ slot, apt, isStartSlot }) => {
        const isCompleted = apt?.status === 'completed' || apt?.status === 'no-show';
        if (isCompleted) return false;
        
        if (isPast(slot)) return !!apt && isStartSlot;
        return true;
    });
  }, [generatedSlots, currentDayAppointments, selectedDate]);

  const completedAppointments = useMemo(() => {
    return currentDayAppointments
      .filter(a => a.status === 'completed' || a.status === 'no-show')
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [currentDayAppointments]);

  return (
    <div className="space-y-4">
      <div {...agendaSwipeHandlers} className="bg-white dark:bg-[#242424] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden mx-2">
        {/* Integrated Calendar Header */}
        <div className="pt-3 pb-1 flex flex-col items-center relative">
          <div className="flex items-center justify-center w-full relative h-8">
            {/* Left aligned previous month button (when expanded) */}
            <div className="absolute left-4">
              {isCalendarExpanded && (
                <button 
                  onClick={() => {
                    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
                    if (newDate.getFullYear() >= 2026) {
                      setSlideDirection(-1);
                      setViewDate(newDate);
                    }
                  }}
                  className="p-1.5 text-[#2898D8] hover:bg-[#E8F4FC] rounded-full transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
            </div>

            {/* Centered Month/Year button */}
            <button 
              onClick={() => {
                if (isCalendarExpanded) {
                  if (viewMode === 'years') setViewMode('days');
                  else setIsCalendarExpanded(false);
                } else {
                  setIsCalendarExpanded(true);
                  setViewDate(new Date(selectedDate + 'T12:00:00'));
                  setViewMode('days');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 hover:bg-[#F2F5F8] dark:hover:bg-[#303030] rounded-xl transition-colors z-10"
            >
              <span className="text-[14px] font-bold text-[#1A2332] dark:text-[#F8F8F8]">
                {formatMonthYear(viewDate)}
              </span>
              <motion.div
                animate={{ rotate: isCalendarExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight size={14} className="text-[#2898D8] rotate-90" />
              </motion.div>
            </button>

            {/* Right aligned next month button OR Hoje button */}
            <div className="absolute right-4 flex items-center gap-2">
              <AnimatePresence>
                {!isCalendarExpanded && selectedDate !== getTodayString() && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      setSelectedDate(getTodayString());
                      setViewDate(new Date(getTodayString() + 'T12:00:00'));
                    }}
                    className="px-3 h-6 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={10} strokeWidth={3} />
                    Hoje
                  </motion.button>
                )}
              </AnimatePresence>
              {isCalendarExpanded && (
                <button 
                  onClick={() => {
                    setSlideDirection(1);
                    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
                  }}
                  className="p-1.5 text-[#2898D8] hover:bg-[#E8F4FC] rounded-full transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inline Calendar Content */}
        <AnimatePresence mode="wait">
          {isCalendarExpanded && (
            <motion.div
              key={viewMode === 'days' ? `days-${viewDate.getMonth()}-${viewDate.getFullYear()}` : 'years'}
              initial={{ height: 0, opacity: 0, x: slideDirection * 20 }}
              animate={{ height: 'auto', opacity: 1, x: 0 }}
              exit={{ height: 0, opacity: 0, x: -slideDirection * 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden bg-white dark:bg-[#242424] px-4"
            >
              {viewMode === 'days' ? (
                <div className="pb-3">
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((d) => (
                      <div key={d} className="h-6 flex items-center justify-center text-[9px] font-black text-[#8A98A8] uppercase">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                      const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
                      const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
                      
                      const days = [];
                      // Previous month days
                      const prevMonthLastDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
                      for (let i = offset - 1; i >= 0; i--) {
                        const d = prevMonthLastDay - i;
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, d);
                        const dateStr = date.toISOString().split('T')[0];
                        const count = getAppointmentsCount(dateStr);
                        days.push(
                          <div key={`prev-${d}`} className="h-9 flex items-center justify-center relative opacity-20">
                            <span className="text-[11px] font-bold text-[#8A98A8]">{d}</span>
                            {count > 0 && (
                              <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-[#8A98A8] text-white rounded-full flex items-center justify-center text-[6px] font-bold">
                                {count > 9 ? '9+' : count}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Current month days
                      for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = dateStr === selectedDate;
                        const isToday = dateStr === getTodayString();
                        const dayOfWeek = date.getDay();
                        const isClosed = !weeklySchedule[dayOfWeek]?.isOpen;
                        const count = getAppointmentsCount(dateStr);
                        
                        days.push(
                          <button
                            key={d}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setIsCalendarExpanded(false);
                            }}
                            className={`h-9 w-full rounded-xl flex items-center justify-center text-[12px] font-bold transition-all relative
                              ${isSelected ? 'bg-[#2898D8] text-white shadow-sm' : isToday ? 'bg-[#F59E0B] text-white' : isClosed ? 'text-[#B8C0C0] line-through dark:text-[#707070]' : 'hover:bg-[#F2F5F8] dark:hover:bg-[#303030] text-[#1A2332] dark:text-[#F8F8F8]'}`}
                          >
                            {d}
                            {count > 0 && (
                              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold border bg-[#2898D8] text-white border-white dark:border-slate-900">
                                {count > 9 ? '9+' : count}
                              </div>
                            )}
                          </button>
                        );
                      }

                      // Next month days
                      const remaining = 42 - days.length;
                      for (let d = 1; d <= remaining; d++) {
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, d);
                        const dateStr = date.toISOString().split('T')[0];
                        const count = getAppointmentsCount(dateStr);
                        days.push(
                          <div key={`next-${d}`} className="h-9 flex items-center justify-center relative opacity-20">
                            <span className="text-[11px] font-bold text-[#8A98A8]">{d}</span>
                            {count > 0 && (
                              <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-[#8A98A8] text-white rounded-full flex items-center justify-center text-[6px] font-bold">
                                {count > 9 ? '9+' : count}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return days;
                    })()}
                  </div>
                </div>
              ) : (
                <div className="pb-4 grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }, (_, i) => 2026 + i).map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        setViewDate(new Date(year, viewDate.getMonth(), 1));
                        setViewMode('days');
                      }}
                      className={`h-11 rounded-xl flex items-center justify-center font-bold text-sm transition-all
                        ${viewDate.getFullYear() === year ? 'bg-[#2898D8] text-white shadow-sm' : 'bg-[#F2F5F8] dark:bg-[#303030] text-[#1A2332] dark:text-[#F8F8F8] hover:bg-[#E2E8F0]'}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weekly Selector */}
        {!isCalendarExpanded && (
          <div className="px-2 pb-2 h-[60px] flex items-center gap-1">
            <button 
              onClick={() => navigateWeek('prev')}
              className="w-8 h-10 flex items-center justify-center text-[#8A98A8] hover:text-[#2898D8] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex-1 flex justify-between gap-1">
              {weekDays.map((day) => {
                const isSelected = day.dateStr === selectedDate;
                const isToday = day.dateStr === getTodayString();
                const isClosed = !day.isOpen;
                const count = getAppointmentsCount(day.dateStr);
                
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`flex-1 flex flex-col items-center justify-center rounded-xl transition-all py-1.5 relative
                      ${isSelected 
                        ? 'bg-[#2898D8] text-white ring-2 ring-[#2898D8] ring-offset-2 dark:ring-offset-[#242424]' 
                        : isToday 
                          ? 'bg-[#F59E0B] text-white' 
                          : isClosed
                            ? 'text-[#B8C0C0] line-through dark:text-[#707070]'
                            : 'hover:bg-[#F2F5F8] dark:hover:bg-[#303030] text-[#8A98A8]'}`}
                  >
                    <span className={`text-[9px] font-bold uppercase tracking-tighter 
                      ${isSelected ? 'text-white/80' : isToday ? 'text-white/90' : isClosed ? 'line-through' : 'text-[#8A98A8]'}`}>
                      {day.dayLabel}
                    </span>
                    <span className={`text-sm font-black 
                      ${isSelected ? 'text-white' : isToday ? 'text-white' : isClosed ? 'text-[#B8C0C0] dark:text-[#707070]' : 'text-[#5A6878] dark:text-[#B8C0C0]'}`}>
                      {day.dayNum}
                    </span>
                    {count > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border-2 bg-[#2898D8] text-white border-white dark:border-slate-900">
                        {count > 9 ? '9+' : count}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => navigateWeek('next')}
              className="w-8 h-10 flex items-center justify-center text-[#8A98A8] hover:text-[#2898D8] transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-2 h-[80px]">
        <div 
          className="rounded-2xl p-3 flex flex-col justify-center shadow-lg shadow-[#2898D8]/20 relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #1E7FB8 0%, #2898D8 45%, #3AABFF 100%)'
          }}
        >
          {/* Decoração — círculo grande translúcido */}
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
          />
          <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
          />
          
          <span className="text-[10px] font-black text-[#FFFFFF]/60 uppercase tracking-widest leading-none mb-1 relative z-10">{stats.dayLabel}</span>
          <div className="flex flex-col relative z-10">
            <span className="text-2xl font-black text-white leading-tight">{formatCurrency(stats.dayRevenue)}</span>
            <span className="text-xs text-white/70 leading-none mt-0.5">{stats.dayCount} {stats.dayCount === 1 ? 'atendimento' : 'atendimentos'}</span>
          </div>
          <DollarSign size={48} className="text-white/10 absolute right-4 bottom-2 pointer-events-none transition-transform group-hover:scale-110 duration-500" />
        </div>

        <div className="bg-white dark:bg-[#242424] rounded-2xl p-3 flex flex-col justify-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative overflow-hidden group">
          <span className="text-[9px] font-black text-[#8A98A8] dark:text-[#707070] uppercase tracking-widest leading-none mb-1 relative z-10">{stats.weekLabel}</span>
          <div className="flex flex-col relative z-10">
            <span className="text-[20px] font-black text-[#2898D8] leading-tight">{formatCurrency(stats.weekRevenue)}</span>
            <span className="text-[11px] font-medium text-[#8A98A8] dark:text-[#707070] leading-none mt-0.5">{stats.weekCount} {stats.weekCount === 1 ? 'atendimento' : 'atendimentos'}</span>
          </div>
          <DollarSign size={48} className="text-[#2898D8]/5 absolute right-4 bottom-2 pointer-events-none transition-transform group-hover:scale-110 duration-500" />
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-2 px-4 mb-2">
            <div className="w-1 h-4 bg-[#2898D8] rounded-full"></div>
            <span className="text-xs font-black uppercase tracking-widest text-[#1A2332] dark:text-[#F8F8F8]">
              Grade do Dia
            </span>
            {/* Contador de slots total do dia */}
            <span className="ml-1 text-xs font-bold text-[#2898D8] bg-[#E8F4FC] dark:bg-[#1A3A58] dark:text-[#2098F0] px-2 py-0.5 rounded-full">
              {currentDayAppointments.filter(a => a.status === 'pending').length}
            </span>
        </div>

        {(!dayConfig?.isOpen && currentDayAppointments.length === 0) ? (
            <div className="bg-white dark:bg-[#242424] p-12 rounded-[2rem] border-2 border-dashed border-[#D0D8E4] dark:border-[#3A3A3A] text-center space-y-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="w-12 h-12 bg-[#F8FAFB] dark:bg-[#303030] rounded-full flex items-center justify-center mx-auto text-[#B0BCC7]">
                    <Lock size={24} />
                </div>
                <p className="text-[#8A98A8] dark:text-[#707070] font-bold text-sm uppercase tracking-widest">Fechado hoje</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-3">
                {activeSlots.map(({ slot, apt, isStartSlot }) => {
                    const isManualBlocked = dateBlockedSlots.some(s => normalizeTime(s) === slot);
                    const isManualUnblocked = (unblockedSlots[selectedDate] || []).some(s => normalizeTime(s) === slot);
                    const isWeeklyBreak = dayConfig.breaks.some(b => normalizeTime(b) === slot);
                    const isBlocked = (isWeeklyBreak && !isManualUnblocked) || isManualBlocked;
                    
                    // If it's occupied by a duration but not the start slot
                    if (apt && !isStartSlot) {
                        return (
                            <div key={slot} className="bg-[#F4F7FB] dark:bg-[#2A2A2A] p-3 rounded-2xl flex items-center gap-4 opacity-50 pointer-events-none shadow-[0_1px_4px_rgba(0,0,0,0.06)] min-h-[44px]">
                                <div className="text-lg font-black text-[#8A98A8] dark:text-[#707070] w-14 shrink-0">{slot}</div>
                                <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs text-[#8A98A8] dark:text-[#707070] truncate">
                                    <span className="font-semibold flex items-center gap-1 shrink-0">
                                        <Lock size={14} />
                                        Ocupado
                                    </span>
                                    <span className="text-[#D0D8E4] dark:text-[#3A3A3A]">|</span>
                                    <span className="font-normal truncate">
                                        {apt.service} de {capitalizeName(apt.clientName)}
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    const isActuallyCompleted = apt?.status === 'completed';
                    const isNoShow = apt?.status === 'no-show';
                    const isFinishing = finishingId === apt?.id;
                    const isCompleted = isActuallyCompleted || isFinishing || isNoShow;
                    const past = isPast(slot);
                    
                    const isQuickActionOpen = activeSlotMenu === slot;
                    const isCancelOpen = apt && activeCancelMenu === apt.id;
                    const isNoShowOpen = apt && activeNoShowMenu === apt.id;
                    const isFinishOpen = apt && activeFinishMenu === apt.id;
                    const isRevertOpen = apt && activeRevertMenu === apt.id;
                    const isUnlockOpen = activeUnlockMenu === slot;

                    if (isBlocked && !apt) {
                         return (
                            <div key={slot} className="relative">
                                <div 
                                    onClick={() => {
                                        if (isManualBlocked) {
                                            setActiveUnlockMenu(isUnlockOpen ? null : slot);
                                        } else {
                                            setWeeklyUnlockSlot(slot);
                                        }
                                    }}
                                    className="bg-red-50/20 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/30 p-3 rounded-2xl flex items-center justify-between opacity-70 dark:opacity-90 cursor-pointer min-h-[44px]"
                                >
                                    <div className="text-lg font-black text-[#8A98A8] dark:text-[#AAAAAA] w-14">{slot}</div>
                                    <div className="flex flex-col items-end flex-1 pr-4">
                                        <div className="flex items-center gap-1.5 text-red-400 dark:text-red-500">
                                            {!isManualBlocked && isWeeklyBreak && <Repeat size={12} className="animate-pulse" />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {!isManualBlocked && isWeeklyBreak ? 'BLOQUEADO PELO PADRÃO SEMANAL' : 'BLOQUEADO'}
                                            </span>
                                        </div>
                                        {!isManualBlocked && isWeeklyBreak && (
                                            <span className="text-[8px] text-[#8A98A8] dark:text-[#AAAAAA] font-bold uppercase tracking-tighter">Regra Recorrente</span>
                                        )}
                                    </div>
                                    <div className="w-10 h-10 flex items-center justify-center text-red-200 dark:text-red-900/40">
                                        <Lock size={20} />
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isUnlockOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="menu-container absolute inset-0 bg-[#111827]/95 rounded-2xl flex items-center justify-center gap-3 z-10 px-3"
                                        >
                                            <p className="text-white text-[9px] font-black uppercase tracking-widest flex-1">Deseja desbloquear?</p>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => { toggleSlotAvailability(selectedDate, slot); setActiveUnlockMenu(null); onSuccess?.('Horário liberado para hoje!'); }}
                                                    className="h-8 px-4 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                                                >
                                                    Sim
                                                </button>
                                                <button 
                                                    onClick={() => setActiveUnlockMenu(null)}
                                                    className="h-8 px-4 bg-[#374151] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Não
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                         );
                    }

                    if (!apt) {
                        return (
                            <div key={slot} className="relative group">
                                <div 
                                    onClick={() => setActiveSlotMenu(isQuickActionOpen ? null : slot)} 
                                    className={`slot-trigger bg-white dark:bg-[#242424] min-h-[44px] hover:bg-[#E8F4FC] dark:hover:bg-[#1A3A58] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-3 rounded-2xl flex items-center gap-4 transition-colors cursor-pointer group ${past ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                >
                                    <div className="text-lg font-black text-[#1A2332] dark:text-[#F8F8F8] w-14 shrink-0">{slot}</div>
                                    <div className="flex items-center gap-2 text-[#8A98A8] dark:text-[#707070] font-black text-[10px] uppercase tracking-widest group-hover:text-[#2898D8] transition-colors">
                                        <Plus size={16} strokeWidth={3} />
                                        DISPONÍVEL
                                    </div>
                                </div>
                                
                                <AnimatePresence>
                                    {isQuickActionOpen && (
                                        <motion.div 
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -10, opacity: 0 }}
                                            className="menu-container absolute top-0 bottom-0 right-0 left-[calc(3.5rem+1rem+0.75rem)] bg-white/90 backdrop-blur-md shadow-lg rounded-r-2xl flex items-center z-50 overflow-hidden border-y-2 border-r-2 border-[#D0D8E4]"
                                        >
                                            <div className="flex-1 h-full flex items-stretch">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleSlotAvailability(selectedDate, slot); setActiveSlotMenu(null); }}
                                                    className="flex-[0.75] flex flex-col items-center justify-center gap-1 bg-red-400 hover:bg-red-500 text-white/90 transition-colors"
                                                >
                                                    <Ban size={16} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Bloquear</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onAddInSlot(selectedDate, slot); setActiveSlotMenu(null); }}
                                                    className="flex-[1.25] flex flex-col items-center justify-center gap-1 bg-[#2898D8] hover:bg-[#1E7FB8] text-white transition-colors"
                                                >
                                                    <Calendar size={18} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Agendar</span>
                                                </button>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveSlotMenu(null); }}
                                                className="w-10 h-full flex items-center justify-center text-[#8A98A8] hover:text-[#1A2332] bg-[#F4F7FB]/50 border-l border-[#D0D8E4]"
                                            >
                                                <X size={20} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    }

                    return (
                        <motion.div 
                            key={apt.id} 
                            layout
                            initial={false}
                            animate={isFinishing ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className={`relative rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] min-h-[44px] overflow-hidden transition-all duration-500 flex
                                ${isActuallyCompleted ? 'bg-[#D1FAE5] border-green-200 opacity-60' : 
                                  isNoShow ? 'bg-amber-50 border-amber-200 opacity-50' : 
                                  isFinishing ? 'bg-[#D1FAE5] border-green-200' : 'bg-[#EBF5FF] dark:bg-[#1A3A58] border-l-4 border-l-[#2898D8] dark:border-l-[#2098F0]'}`}
                        >
                            <div className="flex-1 min-w-0">
                                {/* Header do Card */}
                                <div className="px-4 py-3 flex items-start justify-between border-b border-[#D0D8E4]/20 dark:border-[#3A3A3A]/40">
                                    <div className="flex gap-4 min-w-0">
                                        <div className={`text-base font-bold shrink-0 mt-1 ${isActuallyCompleted ? 'text-green-700' : isNoShow ? 'text-amber-700' : 'text-[#1A2332] dark:text-[#F8F8F8]'}`}>
                                            {apt.time}
                                        </div>
                                        <div className="flex flex-col gap-1.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-base font-bold truncate tracking-tight ${isActuallyCompleted ? 'text-green-800 line-through opacity-70' : isNoShow ? 'text-amber-800 line-through opacity-70' : 'text-[#1A2332] dark:text-[#F8F8F8]'}`}>
                                                    {capitalizeName(apt.clientName)}
                                                </span>
                                                {isNoShow && (
                                                    <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">FALTA</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 flex-wrap ${isActuallyCompleted ? 'text-green-700/60' : isNoShow ? 'text-amber-700/60' : 'text-[#2898D8]'}`}>
                                                    {isActuallyCompleted ? 'Atendimento Finalizado ✨' : isNoShow ? 'Falta Registrada' : (() => {
                                                        const numServices = apt.service.split(',').length;
                                                        const serviceLabel = numServices > 1 ? `${numServices} serviços` : apt.service;
                                                        return (
                                                            <>
                                                                <span>{serviceLabel}</span>
                                                                <span className="text-[11px] font-medium text-emerald-500 normal-case tracking-normal">
                                                                    · {formatCurrency(apt.price || 0)}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </span>
                                                {apt.observation?.includes('[EXCEPCIONAL]') && (
                                                    <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full w-fit shrink-0">
                                                        <Zap size={10} className="fill-amber-700" />
                                                        <span>EXCEPCIONAL</span>
                                                    </div>
                                                )}
                                                {apt.observation && (() => {
                                                    const cleanObs = apt.observation.replace('[EXCEPCIONAL]', '').trim();
                                                    if (!cleanObs) return null;
                                                    return (
                                                        <p className={`text-[10px] italic leading-tight ${isActuallyCompleted ? 'text-green-800 line-through opacity-40' : isNoShow ? 'text-amber-800 line-through opacity-40' : 'text-[#8A98A8] dark:text-[#707070]'}`}>
                                                            Obs: {cleanObs}
                                                        </p>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            {/* Rodapé - Barra de Ferramentas */}
                            <div className="px-4 py-3 flex items-center justify-between bg-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <button 
                                            disabled={isNoShow}
                                            onClick={() => handleCameraClick(apt.phone)}
                                            className={`w-10 h-10 flex items-center justify-center transition-colors rounded-xl ${isNoShow ? 'text-slate-200' : 'text-amber-500 hover:bg-amber-50'}`}
                                        >
                                            <Camera size={18} />
                                        </button>
                                        <span className="text-[10px] text-[#8A98A8] dark:text-[#707070]">Foto</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <button 
                                            onClick={() => onOpenCustomer(apt.phone)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors text-[#2898D8] hover:bg-blue-50"
                                        >
                                            <User size={18} />
                                        </button>
                                        <span className="text-[10px] text-[#8A98A8] dark:text-[#707070]">Cliente</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <button 
                                            disabled={isActuallyCompleted || isNoShow}
                                            onClick={() => onReschedule(apt)}
                                            className={`w-10 h-10 flex items-center justify-center transition-colors rounded-xl ${isActuallyCompleted || isNoShow ? 'text-slate-200' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <span className="text-[10px] text-[#8A98A8] dark:text-[#707070]">Editar</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <button 
                                            disabled={isActuallyCompleted || isNoShow}
                                            onClick={() => setActiveNoShowMenu(apt.id)}
                                            className={`w-10 h-10 flex items-center justify-center transition-colors rounded-xl ${isActuallyCompleted || isNoShow ? 'text-slate-200' : 'text-red-500 hover:bg-red-50'}`}
                                        >
                                            <ThumbsDown size={18} />
                                        </button>
                                        <span className="text-[10px] text-[#8A98A8] dark:text-[#707070]">Falta</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botões de Ação Laterais */}
                            <div className="w-14 flex flex-col items-center justify-center gap-4 border-l border-[#D0D8E4]/30 dark:border-[#3A3A3A]/40 bg-[#F2F5F8]/50 dark:bg-[#FFFFFF]/5 shrink-0">
                                <button 
                                    disabled={isActuallyCompleted || isNoShow}
                                    onClick={() => setActiveCancelMenu(apt.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${isActuallyCompleted || isNoShow ? 'text-[#8A98A8] opacity-30' : 'text-[#EF4444] hover:bg-red-50'}`}
                                    title="Cancelar"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button 
                                    disabled={isFinishing}
                                    onClick={() => (isActuallyCompleted || isNoShow) ? setActiveRevertMenu(apt.id) : setActiveFinishMenu(apt.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${isActuallyCompleted ? 'bg-white text-green-600 shadow-sm border border-green-100' : isNoShow ? 'bg-white text-amber-600 shadow-sm border border-amber-100' : 'bg-[#10B981] text-white shadow-md active:scale-90'}`}
                                    title={(isActuallyCompleted || isNoShow) ? "Retornar atendimento" : "Confirmar"}
                                >
                                    {(isActuallyCompleted || isNoShow) ? <RotateCcw size={16} /> : <Check size={16} />}
                                </button>
                            </div>

                            {/* Menu de Cancelamento */}
                            <AnimatePresence>
                                {isCancelOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="menu-container absolute inset-0 bg-[#111827]/95 rounded-2xl flex items-center justify-center gap-3 z-10 px-3"
                                    >
                                        <p className="text-white text-[9px] font-black uppercase tracking-widest flex-1">Deseja cancelar?</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => { 
                                                    deleteAppointment(apt.id); 
                                                    setActiveCancelMenu(null); 
                                                    onSuccess?.('Agendamento excluído com sucesso!');
                                                }}
                                                className="h-8 px-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                                            >
                                                Sim
                                            </button>
                                            <button 
                                                onClick={() => setActiveCancelMenu(null)}
                                                className="h-8 px-4 bg-[#374151] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Não
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Menu de Não Compareceu */}
                            <AnimatePresence>
                                {isNoShowOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="menu-container absolute inset-0 bg-[#111827]/95 rounded-2xl flex items-center justify-center gap-3 z-10 px-3"
                                    >
                                        <p className="text-white text-[9px] font-black uppercase tracking-widest flex-1">Confirmar falta?</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => { 
                                                    markNoShow(apt.id); 
                                                    setActiveNoShowMenu(null); 
                                                    onSuccess?.('Falta registrada com sucesso!');
                                                }}
                                                className="h-8 px-4 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                                            >
                                                Sim
                                            </button>
                                            <button 
                                                onClick={() => setActiveNoShowMenu(null)}
                                                className="h-8 px-4 bg-[#374151] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Não
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Menu de Conclusão */}
                            <AnimatePresence>
                                {isFinishOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="menu-container absolute inset-0 bg-[#111827]/95 rounded-2xl flex items-center justify-center gap-3 z-10 px-3"
                                    >
                                        <p className="text-white text-[9px] font-black uppercase tracking-widest flex-1">Finalizar atendimento?</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => { handleFinish(apt.id); setActiveFinishMenu(null); }}
                                                className="h-8 px-4 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                                            >
                                                Sim
                                            </button>
                                            <button 
                                                onClick={() => setActiveFinishMenu(null)}
                                                className="h-8 px-4 bg-[#374151] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Não
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Menu de Retorno */}
                            <AnimatePresence>
                                {isRevertOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="menu-container absolute inset-0 bg-[#111827]/95 rounded-2xl flex items-center justify-center gap-3 z-10 px-3"
                                    >
                                        <p className="text-white text-[9px] font-black uppercase tracking-widest flex-1">Retornar atendimento?</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => { 
                                                    revertAppointment(apt.id); 
                                                    setActiveRevertMenu(null); 
                                                    onSuccess?.('Atendimento retornado com sucesso!');
                                                }}
                                                className="h-8 px-4 bg-[#2898D8] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                                            >
                                                Sim
                                            </button>
                                            <button 
                                                onClick={() => setActiveRevertMenu(null)}
                                                className="h-8 px-4 bg-[#374151] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Não
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        )}

        {/* Exceptional Slot - Compact Style */}
        <div className="mt-6">
            <div 
                onClick={() => onAddInSlot(selectedDate, '', true)}
                className="bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-500/40 h-[52px] px-4 rounded-2xl flex items-center gap-3 transition-all hover:opacity-80 cursor-pointer group"
            >
                <Zap size={18} className="text-amber-500 fill-amber-500 shrink-0" />
                <div className="text-amber-600 dark:text-amber-500 font-black text-[11px] uppercase tracking-widest">
                    AGENDAR FORA DO EXPEDIENTE
                </div>
            </div>
        </div>

        {/* Completed Section */}
        {completedAppointments.length > 0 && (
            <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <h3 className="font-semibold text-[#5A6878] dark:text-[#8A98A8] text-sm uppercase tracking-widest">
                            CONCLUÍDOS ({completedAppointments.length})
                        </h3>
                    </div>
                </div>

                <div className="space-y-1.5">
                    {completedAppointments.map((apt) => {
                        const isExpanded = expandedCompletedId === apt.id;
                        const isNoShow = apt.status === 'no-show';
                        const isRevertOpen = activeRevertMenu === apt.id;

                        return (
                            <div 
                                key={apt.id}
                                className={`border rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 border-l-[3px] border-l-[#10B981] ${
                                    isExpanded 
                                        ? 'bg-green-50 dark:bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.2)] opacity-100' 
                                        : 'bg-green-50 dark:bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.2)] opacity-70'
                                }`}
                            >
                                {/* Accordion Header */}
                                <div 
                                    onClick={() => setExpandedCompletedId(isExpanded ? null : apt.id)}
                                    className="h-[48px] px-4 flex items-center justify-between cursor-pointer hover:bg-[#F4F7FB]/30 dark:hover:bg-[#303030]/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`text-xs font-bold line-through shrink-0 ${isExpanded ? 'text-[#8A98A8]' : 'text-[#5A6878] dark:text-[#8A98A8] opacity-70'}`}>
                                            {apt.time}
                                        </span>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={`text-sm font-semibold truncate ${isExpanded ? 'text-[#5A6878] dark:text-[#8A98A8]' : 'text-[#5A6878] dark:text-[#8A98A8] opacity-70'}`}>
                                                {capitalizeName(apt.clientName)}
                                                <span className="text-xs font-normal text-[#8A98A8] ml-1">
                                                    ({apt.service})
                                                </span>
                                            </span>
                                            {!isNoShow && <Check size={14} className="text-green-500 shrink-0" />}
                                        </div>
                                        {isNoShow && (
                                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest shrink-0">
                                                FALTA
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight 
                                        size={16} 
                                        className={`text-[#10B981] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} 
                                    />
                                </div>

                                {/* Accordion Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        >
                                            <div className="px-4 pb-3 pt-1.5 border-t border-[#D0D8E4]/60 dark:border-[#3A3A3A] relative">
                                                <div className="flex items-center justify-between bg-[#F4F7FB] dark:bg-[#303030] p-2 rounded-xl border border-[#D0D8E4] dark:border-[#3A3A3A] w-full">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <button 
                                                                disabled={isNoShow}
                                                                onClick={(e) => { e.stopPropagation(); handleCameraClick(apt.phone); }}
                                                                className={`w-8 h-8 flex items-center justify-center transition-colors rounded-xl ${isNoShow ? 'text-slate-200 opacity-20 grayscale' : 'text-[#F59E0B] hover:bg-amber-50'}`}
                                                            >
                                                                <Camera size={16} />
                                                            </button>
                                                            <span className="text-[10px] font-medium text-[#8A98A8]">Foto</span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onOpenCustomer(apt.phone); }}
                                                                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors text-[#3B82F6] hover:bg-blue-50"
                                                            >
                                                                <User size={16} />
                                                            </button>
                                                            <span className="text-[10px] font-medium text-[#8A98A8]">Cliente</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 flex justify-end">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setActiveRevertMenu(apt.id); }}
                                                            className="flex items-center gap-1.5 py-1 px-3 text-red-400 hover:text-red-500 transition-colors text-[11px] font-bold uppercase tracking-tight bg-transparent border-none outline-none"
                                                        >
                                                            <RotateCcw size={14} />
                                                            <span>Retornar</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Revert Menu Overlay */}
                                                <AnimatePresence>
                                                    {isRevertOpen && (
                                                        <motion.div 
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 bg-[#111827]/95 flex items-center justify-center gap-3 z-20 px-4"
                                                        >
                                                            <p className="text-white text-[9px] font-black uppercase tracking-widest flex-1">Retornar atendimento?</p>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => { 
                                                                        revertAppointment(apt.id); 
                                                                        setActiveRevertMenu(null); 
                                                                        onSuccess?.('Atendimento retornado com sucesso!');
                                                                    }}
                                                                    className="h-8 px-4 bg-[#2898D8] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                                                                >
                                                                    Sim
                                                                </button>
                                                                <button 
                                                                    onClick={() => setActiveRevertMenu(null)}
                                                                    className="h-8 px-4 bg-[#374151] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                                >
                                                                    Não
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>


      {/* Decision Modal for Weekly Unlock */}
      <AnimatePresence>
        {weeklyUnlockSlot && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWeeklyUnlockSlot(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-[90%] max-w-sm rounded-[32px] shadow-2xl p-8 relative z-[200] border border-white/20 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-[#E8F4FC] rounded-full flex items-center justify-center mx-auto text-[#2898D8]">
                <Repeat size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-[#1A2332] uppercase tracking-tighter">Liberar Horário</h3>
                <p className="text-sm text-[#5A6878] font-medium">Como deseja liberar este horário das <span className="font-bold text-[#1A2332]">{weeklyUnlockSlot}</span>?</p>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    toggleSlotUnblock(selectedDate, weeklyUnlockSlot);
                    setWeeklyUnlockSlot(null);
                    onSuccess?.('Liberado apenas para hoje!');
                  }}
                  className="w-full h-14 bg-[#E8EEF5] text-[#5A6878] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Liberar apenas para hoje
                </button>
                <button 
                  onClick={() => {
                    toggleWeeklyBreak(dayOfWeek, weeklyUnlockSlot);
                    setWeeklyUnlockSlot(null);
                    onSuccess?.('Removido do padrão semanal!');
                  }}
                  className="w-full h-14 bg-[#2898D8] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#2898D8]/20 hover:bg-[#1E7FB8] transition-all"
                >
                  Remover do padrão semanal
                </button>
                <button 
                  onClick={() => setWeeklyUnlockSlot(null)}
                  className="w-full py-2 text-[#8A98A8] font-black uppercase tracking-widest text-[9px] hover:text-[#1A2332] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AddCustomerModal: React.FC<{ onClose: () => void, onSuccess: (msg: string) => void }> = ({ onClose, onSuccess }) => {
  useLockBodyScroll();
  const { addCustomer } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{name?: boolean, phone?: boolean}>({});
  const [showErrorMsg, setShowErrorMsg] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const validatingPromiseRef = useRef<Promise<void> | null>(null);

  const checkDuplicate = async (phoneToCheck: string) => {
    const normalized = normalizePhone(phoneToCheck);
    if (!normalized || !isSupabaseConfigured()) return;
    
    setIsValidating(true);
    const promise = (async () => {
      try {
        const existing = await supabaseService.checkDuplicateCustomer(normalized) as { name: string } | null;
        if (existing) {
          setDuplicateError(`Este número já está cadastrado para o cliente ${existing.name}.`);
        } else {
          setDuplicateError(null);
        }
      } catch (error) {
        console.error('Error checking duplicate:', error);
      } finally {
        setIsValidating(false);
        validatingPromiseRef.current = null;
      }
    })();
    validatingPromiseRef.current = promise;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      name: !name.trim(),
      phone: !phone.trim()
    };
    setErrors(newErrors);
    
    // Aguarda validação em andamento antes de prosseguir
    if (validatingPromiseRef.current) {
      await validatingPromiseRef.current;
    }

    if (newErrors.name || newErrors.phone || duplicateError) {
      setShowErrorMsg(true);
      return;
    }

    try {
      await addCustomer({
        name: capitalizeName(name),
        phone,
        cutCount: 0,
        history: [],
        photos: []
      });
      onSuccess('Cliente cadastrado com sucesso!');
      onClose();
    } catch (error: any) {
      if (error?.code === '23505' || error?.message?.includes('duplicate key value')) {
        const normalized = normalizePhone(phone);
        const existing = await supabaseService.checkDuplicateCustomer(normalized) as { name: string } | null;
        setDuplicateError(`Este número já está cadastrado para o cliente ${existing?.name || 'outro cliente'}.`);
      } else {
        console.error('Error adding customer:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#242424]/40 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-[#242424] w-full max-w-[95%] sm:max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative border border-white/20 dark:border-[#3A3A3A]">
        <header className="p-6 border-b border-[#D0D8E4]/60 dark:border-[#3A3A3A] flex justify-between items-center shrink-0 bg-white dark:bg-[#242424] sticky top-0 z-10">
            <h2 className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8] uppercase tracking-tight">Novo Cliente</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#E8EEF5] dark:bg-[#303030] text-[#8A98A8] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#374151] transition-colors">
              <X size={20} />
            </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            <Input 
              label="Nome Completo" 
              value={name} 
              onChange={e => { setName(e.target.value); setErrors(prev => ({...prev, name: false})); setShowErrorMsg(false); }} 
              placeholder="Ex: Allan Ribeiro" 
              requiredField
              error={errors.name}
            />
            <div className="space-y-1">
              <Input 
                label="Telefone / WhatsApp" 
                value={phone} 
                onChange={e => { 
                  setPhone(formatPhone(e.target.value)); 
                  setErrors(prev => ({...prev, phone: false})); 
                  setShowErrorMsg(false); 
                  setDuplicateError(null);
                }} 
                onBlur={() => checkDuplicate(phone)}
                placeholder="(00) 00000-0000" 
                maxLength={15} 
                requiredField
                error={errors.phone || !!duplicateError}
                className={duplicateError ? 'border-red-500 ring-red-500' : ''}
              />
              {duplicateError && (
                <p className="text-red-500 text-[11px] font-bold ml-1 animate-in slide-in-from-top-1">
                  {duplicateError}
                </p>
              )}
            </div>
          </div>
          
          <footer className="p-6 border-t border-[#D0D8E4]/60 dark:border-[#3A3A3A] shrink-0 bg-white dark:bg-[#242424] sticky bottom-0 z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {showErrorMsg && !duplicateError && <p className="text-red-500 text-[13px] font-bold text-center mb-4">Preencha todos os campos obrigatórios</p>}
            <Button 
              type="submit" 
              fullWidth 
              disabled={!!duplicateError}
              className="h-14 font-black uppercase tracking-widest shadow-xl shadow-[#2898D8]/20 disabled:opacity-50 disabled:shadow-none"
            >
              {isValidating ? 'Validando...' : 'Cadastrar Cliente'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};

const AddAppointmentModal: React.FC<{ 
  selectedDate: string; 
  selectedTime?: string; 
  prefilledCustomer?: Customer | null;
  isExceptional?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ selectedDate: initialDate, selectedTime: initialTime, prefilledCustomer, isExceptional = false, onClose, onSuccess }) => {
  useLockBodyScroll();
  const { addAppointment, appointments, weeklySchedule, services, customers, addCustomer } = useStore();

  const getRoundedCurrentTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const d = new Date(now.getTime());
    d.setMinutes(roundedMinutes);
    d.setSeconds(0);
    return d.toTimeString().substring(0, 5);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(prefilledCustomer || null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [saveToContacts, setSaveToContacts] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: prefilledCustomer?.name || '',
    phone: prefilledCustomer?.phone || '',
    date: initialDate,
    time: isExceptional ? getRoundedCurrentTime() : (initialTime || ''),
    serviceIds: [] as string[],
    observation: ''
  });

  const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);
  const [isDuplicateDetected, setIsDuplicateDetected] = useState(false);
  const [isButtonFlashing, setIsButtonFlashing] = useState(false);
  const warningRef = useRef<HTMLDivElement>(null);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (searchTerm.length < 2) return [];
    
    const searchDigits = searchTerm.replace(/\D/g, '');
    const termLower = searchTerm.toLowerCase();
    
    return (Object.values(customers) as Customer[]).filter(c => {
      const normalizedName = c.name.toLowerCase();
      const customerDigits = c.phone.replace(/\D/g, '');
      
      // Flexible search logic (ignoring 9th digit if necessary)
      // Brazilian numbers: (XX) 9 XXXX-XXXX (11 digits)
      const customerWithoutNinth = customerDigits.replace(/^(\d{2})(\d{1})(\d{8})$/, '$1$3');
      
      const nameMatch = normalizedName.includes(termLower);
      const phoneMatch = searchDigits.length > 0 && (
        customerDigits.includes(searchDigits) || 
        customerWithoutNinth.includes(searchDigits)
      );

      return nameMatch || phoneMatch;
    }).slice(0, 5); // Limit to 5 results for better UI
  }, [customers, searchTerm]);

  const isSearchPhone = /^\d+$/.test(searchTerm.replace(/\D/g, '')) && searchTerm.replace(/\D/g, '').length >= 8;
  const searchNormalized = searchTerm.replace(/\D/g, '');
  const phoneAlreadyExists = isSearchPhone && (Object.values(customers) as Customer[]).some(c => c.phone.replace(/\D/g, '') === searchNormalized);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      name: capitalizeName(customer.name),
      phone: customer.phone
    }));
    setSearchTerm('');
    setShowDropdown(false);
    setIsNewCustomer(false);
    setDuplicateCustomer(null);
  };

  const handleCreateNew = () => {
    setIsNewCustomer(true);
    const digitsOnly = searchTerm.replace(/\D/g, '');
    const hasLetters = /[a-zA-Z]/.test(searchTerm);

    if (!hasLetters && digitsOnly.length > 0) {
      setFormData(prev => ({
        ...prev,
        name: '',
        phone: formatPhone(digitsOnly)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: capitalizeName(searchTerm),
        phone: ''
      }));
    }
    setSelectedCustomer(null);
    setSearchTerm('');
    setShowDropdown(false);
    setDuplicateCustomer(null);
  };

  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setDuplicateCustomer(null);
    setFormData(prev => ({
      ...prev,
      name: '',
      phone: ''
    }));
  };
  const [errors, setErrors] = useState<{name?: boolean, phone?: boolean, time?: boolean, services?: boolean}>({});
  const [showErrorMsg, setShowErrorMsg] = useState(false);

  const dayOfWeek = new Date(formData.date + 'T12:00:00').getDay();
  const dayConfig = weeklySchedule[dayOfWeek];
  const generatedSlots = useMemo(() => dayConfig?.isOpen ? generateTimeSlots(dayConfig.start, dayConfig.end) : [], [dayConfig]);

  const isWithinRegularHours = useMemo(() => {
    if (!formData.time || !dayConfig?.isOpen) return false;
    const normalized = normalizeTime(formData.time);
    return generatedSlots.includes(normalized);
  }, [formData.time, generatedSlots, dayConfig]);

  const isSlotPast = (slot: string) => {
    const today = getTodayString();
    if (formData.date < today) return true;
    if (formData.date > today) return false;
    const [h, m] = slot.split(':').map(Number);
    const now = new Date();
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate < now;
  };

  const toggleService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id) 
        ? prev.serviceIds.filter(sid => sid !== id)
        : [...prev.serviceIds, id]
    }));
    setErrors(prev => ({...prev, services: false}));
    setShowErrorMsg(false);
  };

  const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 15), 0);

  const bookedSlots = useMemo(() => {
    const booked: string[] = [];
    appointments.filter(a => a.date === formData.date).forEach(a => {
      const slots = getOccupiedSlots(a.time, a.duration || 15);
      booked.push(...slots);
    });
    return booked;
  }, [appointments, formData.date]);

  const isSlotAvailable = (slot: string) => {
    if (bookedSlots.includes(slot)) return false;
    const requiredSlots = getOccupiedSlots(slot, totalDuration);
    return requiredSlots.every(s => generatedSlots.includes(s) && !bookedSlots.includes(s));
  };

  const executeFinalSave = async (data: typeof formData, isNew: boolean, save: boolean) => {
    // If new customer and "save to contacts" is checked
    if (isNew && save) {
      try {
        await addCustomer({
          phone: normalizePhone(data.phone),
          name: capitalizeName(data.name),
          cutCount: 0,
          history: [],
          photos: []
        });
      } catch (err) {
        console.error("Error saving customer:", err);
      }
    }

    addAppointment({
      id: Date.now().toString(),
      clientName: capitalizeName(data.name),
      phone: normalizePhone(data.phone),
      date: data.date,
      time: data.time,
      service: selectedServices.map(s => s.name).join(', '),
      price: totalPrice,
      duration: totalDuration,
      observation: data.observation,
      status: 'pending',
      createdAt: Date.now()
    }, isExceptional);
    onSuccess?.();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      name: !formData.name.trim(),
      phone: !formData.phone.trim(),
      time: !formData.time,
      services: formData.serviceIds.length === 0
    };
    setErrors(newErrors);
    if (newErrors.name || newErrors.phone || newErrors.time || newErrors.services) {
      setShowErrorMsg(true);
      return;
    }

    if (isNewCustomer && !duplicateCustomer) {
      const normalizedInputPhone = formData.phone.replace(/\D/g, '');
      const existing = (Object.values(customers) as Customer[]).find(c => c.phone.replace(/\D/g, '') === normalizedInputPhone);
      
      if (existing) {
        setDuplicateCustomer(existing);
        setIsDuplicateDetected(true);
        setIsButtonFlashing(true);
        
        // Trigger button flash reset
        setTimeout(() => setIsButtonFlashing(false), 300);

        // Scroll to warning
        setTimeout(() => {
          warningRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);

        // Reset shake after animation
        setTimeout(() => {
          setIsDuplicateDetected(false);
        }, 400);

        return;
      }
    }

    await executeFinalSave(formData, isNewCustomer, saveToContacts);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]"
      />
      
      {/* Modal Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-[#FFFFFF] dark:bg-[#242424] w-[90%] max-w-md rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] relative z-[200] border border-[#D0D8E4] dark:border-[#3A3A3A] overflow-hidden"
      >
        <header className="px-6 pt-6 pb-4 flex justify-between items-center shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky top-0 z-10 mb-6">
          <div className="flex items-center gap-2">
            {isExceptional && <Zap size={20} className="text-amber-500 fill-amber-500" />}
            <h2 className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8] uppercase tracking-tight">
              {isExceptional ? 'Agendamento Excepcional' : 'Novo Agendamento'}
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#F0F2F5] dark:bg-[#2F2F2F] flex items-center justify-center text-[#8A98A8] hover:bg-[#E4E7EB] dark:hover:bg-[#3A3A3A] transition-colors">
            <X size={20} />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 pb-6 space-y-6 overflow-y-auto flex-1 min-h-0 pr-4">
            {isExceptional && (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
                    Atenção: Este agendamento está fora do horário padrão. O horário deve ser inserido manualmente.
                  </p>
                </div>
                
                {isWithinRegularHours && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-red-800 dark:text-red-200 leading-relaxed">
                      Este horário está dentro do expediente normal. Por favor, use a grade principal para agendar neste horário.
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* Client Selection Section */}
            <div className="relative space-y-4">
              {!selectedCustomer && !isNewCustomer ? (
                <div className="relative">
                  <Input 
                    label="Buscar ou adicionar cliente..." 
                    value={searchTerm} 
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                      setShowErrorMsg(false);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Digite nome ou WhatsApp..."
                    autoFocus
                    icon={<Search size={18} className="text-[#8A98A8]" />}
                  />
                  
                  {showDropdown && searchTerm.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#FFFFFF] dark:bg-[#2F2F2F] rounded-2xl shadow-2xl border border-[#D0D8E4] dark:border-[#3A3A3A] overflow-hidden z-[300] animate-in fade-in slide-in-from-top-2">
                      {filteredCustomers.length > 0 ? (
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredCustomers.map(customer => (
                            <button
                              key={customer.phone}
                              type="button"
                              onClick={() => handleSelectCustomer(customer)}
                              className="w-full flex items-center gap-3 py-2 px-3 hover:bg-[#F4F7FB] dark:hover:bg-[#2F2F2F]/50 transition-colors border-b border-[#D0D8E4] dark:border-[#3A3A3A]/50 last:border-0"
                            >
                              <div className="w-10 h-10 rounded-full bg-[#E8F4FC] dark:bg-[#1A3A58]/30 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                {customer.avatar ? (
                                  <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={20} className="text-[#2898D8] dark:text-[#2098F0]" />
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-semibold text-[#1A2332] dark:text-[#F8F8F8] truncate">{capitalizeName(customer.name)}</p>
                                <p className="text-xs text-[#8A98A8] dark:text-[#707070]">{customer.phone}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      
                      {!phoneAlreadyExists && (
                        <button
                          type="button"
                          onClick={handleCreateNew}
                          className="w-full flex items-center gap-3 p-4 bg-[#E8F4FC] dark:bg-[#1A3A58] hover:bg-[#D8EBF8] dark:hover:bg-[#1A3A58]/20 transition-colors text-[#2898D8] dark:text-[#2098F0]"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#D8EBF8] dark:bg-[#1A3A58]/30 flex items-center justify-center shrink-0">
                            <UserPlus size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold uppercase tracking-tight">Criar novo cliente</p>
                            <p className="text-xs opacity-80">"{capitalizeName(searchTerm)}"</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 relative group bg-[#E8F4FC]/30 border-[#D8EBF8] dark:bg-[#1A3A58]/10 dark:border-[#1A3A58]/30`}>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-[#3A3A3A] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {selectedCustomer?.avatar ? (
                        <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-[#2898D8] dark:text-[#2098F0]" />
                      )}
                    </div>
                    <div className="sm:hidden flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-[#2898D8] dark:text-[#2098F0] uppercase tracking-widest mb-0.5">
                        {selectedCustomer ? 'Cliente Selecionado' : 'Novo Cliente'}
                      </p>
                      {selectedCustomer && (
                        <p className="text-xs text-[#8A98A8] dark:text-[#707070] font-medium truncate">
                          {selectedCustomer.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 w-full min-w-0 flex flex-col">
                    <p className="hidden sm:block text-[10px] font-bold text-[#2898D8] dark:text-[#2098F0] uppercase tracking-widest mb-1 ml-1">
                      {selectedCustomer ? 'Cliente Selecionado' : 'Novo Cliente'}
                    </p>
                    <div className="relative flex w-full">
                      <input 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="bg-[#FFFFFF] dark:bg-[#2F2F2F] border border-[#D0D8E4] dark:border-[#3A3A3A] px-3 h-10 rounded-xl text-base font-semibold text-[#1A2332] dark:text-[#F8F8F8] tracking-tight focus:ring-2 focus:ring-[#2898D8] outline-none flex-1 w-full min-w-0 shadow-sm transition-all"
                        placeholder="Nome do Cliente"
                      />
                    </div>
                    <div className="hidden sm:block mt-1 ml-1">
                      {selectedCustomer && (
                        <p className="text-xs text-[#8A98A8] dark:text-[#707070] font-medium">
                          {selectedCustomer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={clearSelectedCustomer}
                    className="absolute top-3 right-3 sm:relative sm:top-0 sm:right-0 w-8 h-8 rounded-full bg-[#FFFFFF] dark:bg-[#3A3A3A] text-[#8A98A8] hover:text-red-500 shadow-sm flex items-center justify-center transition-all hover:scale-110"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {isNewCustomer && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  <div className="relative">
                    <Input 
                      label="WhatsApp do Novo Cliente" 
                      value={formData.phone} 
                      onChange={e => { 
                        setFormData({...formData, phone: formatPhone(e.target.value)}); 
                        setErrors(prev => ({...prev, phone: false})); 
                        setShowErrorMsg(false); 
                        setDuplicateCustomer(null);
                      }} 
                      maxLength={15} 
                      requiredField
                      error={errors.phone}
                      warning={!!duplicateCustomer}
                      className={isDuplicateDetected ? 'animate-shake' : ''}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  {duplicateCustomer && (
                    <div 
                      ref={warningRef}
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-tight">
                          ⚠️ Este número já está cadastrado como <strong>{capitalizeName(duplicateCustomer.name)}</strong>. O que deseja fazer?
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => handleSelectCustomer(duplicateCustomer)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-2 rounded-xl transition-colors"
                        >
                          Usar {capitalizeName(duplicateCustomer.name.split(' ')[0])}
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setSaveToContacts(false);
                            executeFinalSave(formData, isNewCustomer, false);
                          }}
                          className="flex-1 text-[#8A98A8] dark:text-[#707070] text-[10px] font-bold py-2 rounded-xl hover:bg-[#F0F2F5] dark:hover:bg-[#2F2F2F] transition-colors"
                        >
                          Continuar assim mesmo
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-[#F4F7FB] dark:bg-[#2F2F2F] cursor-pointer group transition-colors hover:bg-[#E4E7EB] dark:hover:bg-[#3A3A3A]">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={saveToContacts}
                        onChange={e => setSaveToContacts(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-[#D0D8E4] dark:border-[#4B4B4B] rounded-md peer-checked:bg-[#2898D8] peer-checked:border-[#2898D8] transition-all" />
                      <Check size={14} className="absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs font-bold text-[#1A2332] dark:text-[#F8F8F8] uppercase tracking-tight">Salvar nos contatos</span>
                  </label>
                </motion.div>
              )}
            </div>
            <div className="space-y-3">
              <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1 ${errors.services ? 'text-red-500' : 'text-[#8A98A8] dark:text-[#707070]'}`}>
                Serviços
                <span className="text-red-500">*</span>
              </label>
              <div className={`flex flex-wrap gap-2 p-1 rounded-2xl transition-all ${errors.services ? 'ring-2 ring-red-500 bg-red-50/50' : ''}`}>
                {services.map(s => (
                  <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.serviceIds.includes(s.id) ? 'bg-[#2898D8] text-white border-[#2898D8] shadow-md' : 'bg-[#FFFFFF] dark:bg-[#242424] text-[#8A98A8] border-[#D0D8E4] dark:border-[#3A3A3A]'}`}>{s.name}</button>
                ))}
              </div>
              {errors.services && (
                <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold ml-1">
                  <AlertTriangle size={12} />
                  <span>Selecione pelo menos um serviço</span>
                </div>
              )}
            </div>
            <Input 
              label="Data" 
              type="date" 
              value={formData.date} 
              min={getTodayString()} 
              onChange={e => { setFormData({...formData, date: e.target.value, time: ''}); setShowErrorMsg(false); }} 
              requiredField
            />

            {isExceptional ? (
              <Input 
                label="Horário (Manual)" 
                type="time" 
                value={formData.time} 
                onChange={e => { setFormData({...formData, time: e.target.value}); setErrors(prev => ({...prev, time: false})); setShowErrorMsg(false); }} 
                requiredField
                error={errors.time}
              />
            ) : (
              <div className="space-y-3">
                <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1 ${errors.time ? 'text-red-500' : 'text-[#8A98A8] dark:text-[#707070]'}`}>
                  Horário
                  <span className="text-red-500">*</span>
                </label>
                <div className={`grid grid-cols-4 gap-2 p-1 rounded-2xl transition-all ${errors.time ? 'ring-2 ring-red-500 bg-red-50/50' : ''}`}>
                    {generatedSlots.map(slot => {
                      const available = isSlotAvailable(slot);
                      if (isSlotPast(slot)) return null;
                      return (
                        <button key={slot} type="button" disabled={!available} onClick={() => { setFormData({...formData, time: slot}); setErrors(prev => ({...prev, time: false})); setShowErrorMsg(false); }} className={`py-2 rounded-xl text-xs font-bold transition-all border ${formData.time === slot ? 'bg-[#2898D8] text-white border-[#2898D8]' : !available ? 'bg-[#F4F7FB] dark:bg-[#2F2F2F] text-[#D0D8E4] dark:text-[#4B4B4B] border-[#D0D8E4] dark:border-[#3A3A3A]' : 'bg-[#FFFFFF] dark:bg-[#242424] text-[#1A2332] dark:text-[#F8F8F8] border-[#D0D8E4] dark:border-[#3A3A3A]'}`}>{slot}</button>
                      );
                    })}
                </div>
                {errors.time && (
                  <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold ml-1">
                    <AlertTriangle size={12} />
                    <span>Selecione um horário disponível</span>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8A98A8] dark:text-[#707070] uppercase tracking-widest ml-1 flex items-center gap-1">
                Observação
                <span className="text-[#8A98A8] dark:text-[#707070] lowercase font-normal ml-1">(opcional)</span>
              </label>
              <textarea value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-[#F4F7FB] dark:bg-[#2F2F2F] border-none text-sm min-h-[80px] dark:text-[#F8F8F8]" />
            </div>
          </div>
          
          <footer className="px-6 pt-4 pb-2 shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky bottom-0 z-10">
            {showErrorMsg && <p className="text-red-500 text-[13px] font-bold text-center mb-4">Preencha todos os campos obrigatórios</p>}
            <Button 
              type="submit" 
              fullWidth 
              disabled={isExceptional && isWithinRegularHours}
              className={`h-14 font-black uppercase tracking-widest shadow-xl shadow-[#2898D8]/20 text-sm px-4 disabled:opacity-50 transition-colors duration-300 ${isButtonFlashing ? '!bg-amber-500 !shadow-amber-500/40' : ''}`}
            >
              Agendar Atendimento
            </Button>
          </footer>
        </form>
      </motion.div>
    </div>
  );
};

const RescheduleModal: React.FC<{ 
  appointment: Appointment; 
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}> = ({ appointment, onClose, onSuccess }) => {
  useLockBodyScroll();
  const { updateAppointment, appointments, weeklySchedule, services } = useStore();
  const [newDate, setNewDate] = useState(appointment.date);
  const [newTime, setNewTime] = useState(appointment.time);
  const [observation, setObservation] = useState(appointment.observation || '');
  const [errors, setErrors] = useState<{time?: boolean, services?: boolean}>({});
  const [showErrorMsg, setShowErrorMsg] = useState(false);
  
  const initialServiceIds = useMemo(() => {
    const aptServices = appointment.service.split(', ').map(s => s.trim());
    return services.filter(s => aptServices.includes(s.name)).map(s => s.id);
  }, [appointment.service, services]);

  const [serviceIds, setServiceIds] = useState<string[]>(initialServiceIds);

  const dayOfWeek = new Date(newDate + 'T12:00:00').getDay();
  const dayConfig = weeklySchedule[dayOfWeek];
  const generatedSlots = useMemo(() => dayConfig?.isOpen ? generateTimeSlots(dayConfig.start, dayConfig.end) : [], [dayConfig]);

  const isSlotPast = (slot: string) => {
    const today = getTodayString();
    if (newDate < today) return true;
    if (newDate > today) return false;
    const [h, m] = slot.split(':').map(Number);
    const now = new Date();
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate < now;
  };

  const toggleService = (id: string) => {
    setServiceIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    setErrors(prev => ({...prev, services: false}));
    setShowErrorMsg(false);
  };

  const selectedServices = services.filter(s => serviceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 15), 0);

  const bookedSlots = useMemo(() => {
    const booked: string[] = [];
    appointments.filter(a => a.date === newDate && a.id !== appointment.id).forEach(a => {
      const slots = getOccupiedSlots(a.time, a.duration || 15);
      booked.push(...slots);
    });
    return booked;
  }, [appointments, newDate, appointment.id]);

  const isSlotAvailable = (slot: string) => {
    if (bookedSlots.includes(slot)) return false;
    const requiredSlots = getOccupiedSlots(slot, totalDuration);
    return requiredSlots.every(s => generatedSlots.includes(s) && !bookedSlots.includes(s));
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      time: !newTime,
      services: serviceIds.length === 0
    };
    setErrors(newErrors);
    if (newErrors.time || newErrors.services) {
      setShowErrorMsg(true);
      return;
    }
    updateAppointment(appointment.id, { 
      date: newDate, 
      time: newTime,
      service: selectedServices.map(s => s.name).join(', '),
      price: totalPrice,
      duration: totalDuration,
      observation: observation
    });
    onSuccess?.('Agendamento atualizado com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#242424]/40 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#FFFFFF] dark:bg-[#242424] w-full max-w-[95%] sm:max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative border border-[#D0D8E4] dark:border-[#3A3A3A]">
        <header className="p-6 border-b border-[#D0D8E4] dark:border-[#3A3A3A] flex justify-between items-center shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky top-0 z-10">
            <h2 className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8] uppercase tracking-tight">Editar Agendamento</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#F0F2F5] dark:bg-[#2F2F2F] text-[#8A98A8] flex items-center justify-center hover:bg-[#E4E7EB] dark:hover:bg-[#3A3A3A] transition-colors">
              <X size={20} />
            </button>
        </header>
        
        <form onSubmit={handleConfirm} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1 ${errors.services ? 'text-red-500' : 'text-[#8A98A8] dark:text-[#707070]'}`}>
                Serviços
                <span className="text-red-500">*</span>
              </label>
              <div className={`flex flex-wrap gap-2 p-1 rounded-2xl transition-all ${errors.services ? 'ring-2 ring-red-500 bg-red-50/50' : ''}`}>
                {services.map(s => (
                  <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${serviceIds.includes(s.id) ? 'bg-[#2898D8] text-white border-[#2898D8]' : 'bg-[#FFFFFF] dark:bg-[#242424] text-[#8A98A8] border-[#D0D8E4] dark:border-[#3A3A3A]'}`}>{s.name}</button>
                ))}
              </div>
              {errors.services && (
                <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold ml-1">
                  <AlertTriangle size={12} />
                  <span>Selecione pelo menos um serviço</span>
                </div>
              )}
            </div>
            <Input 
              label="Nova Data" 
              type="date" 
              value={newDate} 
              min={getTodayString()} 
              onChange={e => { setNewDate(e.target.value); setNewTime(''); setShowErrorMsg(false); }} 
              requiredField
            />
            <div className="space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1 ${errors.time ? 'text-red-500' : 'text-[#8A98A8] dark:text-[#707070]'}`}>
                Novo Horário
                <span className="text-red-500">*</span>
              </label>
              <div className={`grid grid-cols-4 gap-2 p-1 rounded-2xl transition-all ${errors.time ? 'ring-2 ring-red-500 bg-red-50/50' : ''}`}>
                  {generatedSlots.map(slot => {
                    const available = isSlotAvailable(slot);
                    if (isSlotPast(slot)) return null;
                    return (
                      <button key={slot} type="button" disabled={!available} onClick={() => { setNewTime(slot); setErrors(prev => ({...prev, time: false})); setShowErrorMsg(false); }} className={`py-2 rounded-xl text-xs font-bold transition-all border ${newTime === slot ? 'bg-[#2898D8] text-white border-[#2898D8]' : !available ? 'bg-[#F4F7FB] dark:bg-[#2F2F2F] text-[#D0D8E4] dark:text-[#4B4B4B] border-[#D0D8E4] dark:border-[#3A3A3A]' : 'bg-[#FFFFFF] dark:bg-[#242424] text-[#1A2332] dark:text-[#F8F8F8] border-[#D0D8E4] dark:border-[#3A3A3A]'}`}>{slot}</button>
                    );
                  })}
              </div>
              {errors.time && (
                <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold ml-1">
                  <AlertTriangle size={12} />
                  <span>Selecione um horário disponível</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8A98A8] dark:text-[#707070] uppercase tracking-widest ml-1 flex items-center gap-1">
                Observação
                <span className="text-[#8A98A8] dark:text-[#707070] lowercase font-normal ml-1">(opcional)</span>
              </label>
              <textarea value={observation} onChange={e => setObservation(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-[#F4F7FB] dark:bg-[#2F2F2F] border-none text-sm min-h-[80px] dark:text-[#F8F8F8]" />
            </div>
          </div>
          
          <footer className="p-6 border-t border-[#D0D8E4] dark:border-[#3A3A3A] shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky bottom-0 z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {showErrorMsg && <p className="text-red-500 text-[13px] font-bold text-center mb-4">Preencha todos os campos obrigatórios</p>}
            <Button type="submit" fullWidth className="h-14 font-black uppercase tracking-widest shadow-xl shadow-[#2898D8]/20">
              Salvar Alterações
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};

const ProfileModal: React.FC<{ 
    onClose: () => void;
    onSuccess?: (msg: string) => void;
}> = ({ onClose, onSuccess }) => {
    useLockBodyScroll();
    const { barberProfile, updateBarberProfile, isDarkMode, toggleDarkMode } = useStore();
    const [formData, setFormData] = useState<BarberProfile>(barberProfile);
    const [modalTab, setModalTab] = useState<'personal' | 'business'>('personal');
    const logoInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateBarberProfile(formData);
        onSuccess?.('Perfil atualizado com sucesso!');
        onClose();
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const base64 = await compressImage(e.target.files[0]);
            setFormData(prev => ({ ...prev, logo: base64 }));
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const base64 = await compressImage(e.target.files[0]);
            setFormData(prev => ({ ...prev, photo: base64 }));
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#242424]/40 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#FFFFFF] dark:bg-[#242424] w-full max-w-[95%] sm:max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative border border-[#D0D8E4] dark:border-[#3A3A3A]">
                <header className="p-6 border-b border-[#D0D8E4] dark:border-[#3A3A3A] flex justify-between items-center shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8] uppercase tracking-tight">Meu Perfil</h2>
                        <p className="text-[10px] text-[#8A98A8] font-medium uppercase tracking-widest">Personalize seu Aplicativo</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#F0F2F5] dark:bg-[#2F2F2F] flex items-center justify-center text-[#8A98A8] hover:bg-[#E4E7EB] dark:hover:bg-[#3A3A3A] transition-colors">
                      <X size={20} />
                    </button>
                </header>
                
                <div className="flex border-b border-[#D0D8E4] dark:border-[#3A3A3A] shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky top-[88px] z-10">
                   <button onClick={() => setModalTab('personal')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${modalTab === 'personal' ? 'text-[#2898D8] border-b-2 border-[#2898D8]' : 'text-[#B0BCC7]'}`}>Pessoal</button>
                   <button onClick={() => setModalTab('business')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${modalTab === 'business' ? 'text-[#2898D8] border-b-2 border-[#2898D8]' : 'text-[#B0BCC7]'}`}>Negócio</button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
                      {modalTab === 'personal' ? (
                        <div className="space-y-4">
                          <div className="flex flex-col items-center gap-3">
                              <div onClick={() => photoInputRef.current?.click()} className="w-20 h-20 rounded-full bg-[#F4F7FB] dark:bg-[#2F2F2F] border-2 border-dashed border-[#D0D8E4] dark:border-[#3A3A3A] flex items-center justify-center overflow-hidden cursor-pointer">
                                  {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" alt="Foto" /> : <User size={32} className="text-[#B0BCC7]" />}
                              </div>
                              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                              <p className="text-[10px] font-bold text-[#8A98A8] uppercase tracking-widest">Sua Foto de Perfil</p>
                          </div>
                          <Input label="Seu Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                          <Input label="Telefone Pessoal" value={formData.personalPhone} onChange={e => setFormData({...formData, personalPhone: formatPhone(e.target.value)})} maxLength={15} />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex flex-col items-center gap-3">
                              <div onClick={() => logoInputRef.current?.click()} className="w-20 h-20 rounded-2xl bg-[#F4F7FB] dark:bg-[#2F2F2F] border-2 border-dashed border-[#D0D8E4] dark:border-[#3A3A3A] flex items-center justify-center overflow-hidden cursor-pointer">
                                  {formData.logo ? <img src={formData.logo} className="w-full h-full object-cover" alt="Logo" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#B0BCC7]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                              </div>
                              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          </div>
                          <Input label="Nome da Barbearia" value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} />
                          <Input label="Endereço" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                          <Input label="Instagram (@)" value={formData.instagram || ''} onChange={e => setFormData({...formData, instagram: e.target.value})} />
                        </div>
                      )}
                  </div>
                  
                  <footer className="p-6 border-t border-[#D0D8E4] dark:border-[#3A3A3A] shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky bottom-0 z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                    <Button type="submit" fullWidth className="h-14 font-black uppercase tracking-widest shadow-xl shadow-[#2898D8]/20">
                      Salvar Perfil
                    </Button>
                  </footer>
                </form>
            </div>
        </div>
    );
};

const ServicesView: React.FC<{ onSuccess?: (msg: string) => void }> = ({ onSuccess }) => {
  const { services, addService, removeService, updateService, reorderServices } = useStore();
  const [formData, setFormData] = useState({ name: '', price: '', duration: '30' });
  const [errors, setErrors] = useState({ name: '', price: '' });
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  
  // States for the bottom sheet form
  const [editFormData, setEditFormData] = useState({ name: '', price: '', duration: '30' });
  const [editErrors, setEditErrors] = useState({ name: '', price: '' });

  const durationOptions = useMemo(() => {
    const options = [];
    for (let i = 15; i <= 480; i += 15) {
      const hours = Math.floor(i / 60);
      const mins = i % 60;
      let label = `${i} min`;
      if (hours > 0) {
        label = `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
      }
      options.push({ value: i.toString(), label });
    }
    return options;
  }, []);

  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const number = parseInt(digits) / 100;
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setFormData({ ...formData, price: formatted });
    if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = { name: '', price: '' };
    let hasError = false;

    if (!formData.name.trim()) {
      newErrors.name = 'Informe o nome do serviço';
      hasError = true;
    }

    const numericPrice = parseInt(formData.price.replace(/\D/g, '')) / 100;
    if (!formData.price || numericPrice <= 0) {
      newErrors.price = 'Informe um preço válido';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    const duration = parseInt(formData.duration);
    
    if (duration % 15 !== 0) {
      alert("A duração deve ser múltipla de 15 minutos.");
      return;
    }
    
    const serviceData = { 
      id: Date.now().toString(), 
      name: formData.name, 
      price: numericPrice,
      duration: duration
    };
    
    addService(serviceData);
    onSuccess?.('Serviço adicionado com sucesso!');

    setFormData({ name: '', price: '', duration: '30' });
    setErrors({ name: '', price: '' });
  };

  const startEditing = (s: ServiceItem) => {
    setEditFormData({ 
      name: s.name, 
      price: s.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
      duration: s.duration.toString() 
    });
    setEditErrors({ name: '', price: '' });
    setEditingService(s);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    const newErrors = { name: '', price: '' };
    let hasError = false;

    if (!editFormData.name.trim()) {
      newErrors.name = 'Informe o nome do serviço';
      hasError = true;
    }

    const numericPrice = parseInt(editFormData.price.replace(/\D/g, '')) / 100;
    if (!editFormData.price || numericPrice <= 0) {
      newErrors.price = 'Informe um preço válido';
      hasError = true;
    }

    if (hasError) {
      setEditErrors(newErrors);
      return;
    }
    
    const duration = parseInt(editFormData.duration);
    
    if (duration % 15 !== 0) {
      alert("A duração deve ser múltipla de 15 minutos.");
      return;
    }
    
    const serviceData = { 
      id: editingService.id, 
      name: editFormData.name, 
      price: numericPrice,
      duration: duration
    };
    
    updateService(serviceData);
    onSuccess?.('Serviço atualizado com sucesso!');
    setEditingService(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] dark:bg-[#242424] p-4 rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3">
        <h2 className="font-semibold text-sm text-[#1A2332] dark:text-[#F8F8F8] uppercase tracking-widest">Novo Serviço</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input 
            label="Nome do Serviço" 
            placeholder="Ex: Corte de Cabelo"
            value={formData.name} 
            onChange={e => {
              setFormData({...formData, name: e.target.value});
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }} 
            errorMessage={errors.name}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input 
                label="Preço" 
                placeholder="R$ 0,00"
                value={formData.price} 
                onChange={handlePriceChange} 
                errorMessage={errors.price}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#8A98A8] dark:text-[#707070] ml-1 uppercase tracking-widest">Duração</label>
              <select 
                value={formData.duration} 
                onChange={e => setFormData({...formData, duration: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D0D8E4] dark:border-[#3A3A3A] bg-[#FFFFFF] dark:bg-[#2F2F2F] text-[#1A2332] dark:text-[#F8F8F8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2898D8]/20 transition-colors h-[42px]"
              >
                {durationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" fullWidth className="h-11">Adicionar Serviço</Button>
        </form>
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-[#D0D8E4] dark:bg-[#3A3A3A]"></div>
          <h3 className="text-[10px] font-black text-[#8A98A8] uppercase tracking-[0.2em]">Serviços Cadastrados</h3>
          <div className="h-px flex-1 bg-[#D0D8E4] dark:bg-[#3A3A3A]"></div>
        </div>
        <Reorder.Group axis="y" values={services} onReorder={reorderServices} className="space-y-2">
          {services.map((s) => (
            <Reorder.Item 
              key={s.id}
              value={s}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FFFFFF] dark:bg-[#242424] p-3 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex items-center gap-3 group"
            >
              <div className="cursor-grab active:cursor-grabbing text-[#B0BCC7] dark:text-[#707070] hover:text-[#8A98A8] transition-colors shrink-0">
                <GripVertical size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A2332] dark:text-[#F8F8F8] text-base truncate">{s.name}</p>
                <p className="text-[#2898D8] dark:text-[#2098F0] font-medium text-xs">
                  {formatCurrency(s.price)} | {s.duration} min
                </p>
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => startEditing(s)} 
                  className="p-2 text-[#8A98A8] hover:text-[#2898D8] transition-colors"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => removeService(s.id)} 
                  className="p-2 text-red-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <AnimatePresence>
        {editingService && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setEditingService(null)}
              className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) setEditingService(null);
              }}
              className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#242424] rounded-t-3xl sm:rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-[#D0D8E4] dark:bg-[#3A3A3A] rounded-full mx-auto my-3 shrink-0" />
              <div className="px-6 flex justify-between items-center pb-2 shrink-0">
                <h2 className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8]">Editar Serviço</h2>
                <button 
                  onClick={() => setEditingService(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F4F7FB] dark:bg-[#2F2F2F] text-[#8A98A8] hover:bg-[#E4E7EB] dark:hover:bg-[#3A3A3A] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="edit-service-form" onSubmit={handleEditSubmit} className="space-y-4">
                  <Input 
                    label="Nome do Serviço" 
                    placeholder="Ex: Corte de Cabelo"
                    value={editFormData.name} 
                    onChange={e => {
                      setEditFormData({...editFormData, name: e.target.value});
                      if (editErrors.name) setEditErrors(prev => ({ ...prev, name: '' }));
                    }} 
                    errorMessage={editErrors.name}
                  />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input 
                        label="Preço" 
                        placeholder="R$ 0,00"
                        value={editFormData.price} 
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          setEditFormData({ ...editFormData, price: formatted });
                          if (editErrors.price) setEditErrors(prev => ({ ...prev, price: '' }));
                        }} 
                        errorMessage={editErrors.price}
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[#8A98A8] dark:text-[#707070] ml-1 uppercase tracking-widest">Duração</label>
                      <select 
                        value={editFormData.duration} 
                        onChange={e => setEditFormData({...editFormData, duration: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D0D8E4] dark:border-[#3A3A3A] bg-[#FFFFFF] dark:bg-[#2F2F2F] text-[#1A2332] dark:text-[#F8F8F8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2898D8]/20 transition-colors h-[42px]"
                      >
                        {durationOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-[#D0D8E4] dark:border-[#3A3A3A] shrink-0">
                <Button fullWidth form="edit-service-form" type="submit" className="h-12 shadow-md">
                  Salvar Alterações
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const WeeklyConfigModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useLockBodyScroll();
  const { weeklySchedule, updateDayConfig, toggleWeeklyBreak } = useStore();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const currentConfig = weeklySchedule[selectedDay] || DEFAULT_DAY_CONFIG;
  const previewSlots = generateTimeSlots(currentConfig.start, currentConfig.end);

  // Calculate summary
  const blockedCount = currentConfig.breaks.length;
  const availableCount = previewSlots.length - blockedCount;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]"
      />
      
      {/* Modal Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-[#FFFFFF] dark:bg-[#242424] w-[90%] max-w-md rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] relative z-[200] overflow-hidden"
      >
        <header className="px-6 pt-6 pb-4 flex justify-between items-center shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky top-0 z-10">
          <h2 className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8] uppercase tracking-tight">Padrão Semanal</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#F0F2F5] dark:bg-[#2F2F2F] text-[#8A98A8] flex items-center justify-center hover:bg-[#E4E7EB] dark:hover:bg-[#3A3A3A] transition-colors">
            <X size={20} />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-2 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-medium text-[#8A98A8] dark:text-[#707070] uppercase tracking-widest ml-1">Selecione o Dia</label>
              <div className="grid grid-cols-7 gap-1 shrink-0">
                {WEEKDAYS.map((name, idx) => {
                  const dayConfig = weeklySchedule[idx];
                  const isSelected = selectedDay === idx;
                  return (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedDay(idx)} 
                      className={`flex flex-col items-center py-2.5 rounded-xl transition-all 
                        ${isSelected ? 'bg-[#2898D8] text-white shadow-md' : 'bg-[#F4F7FB] dark:bg-[#2F2F2F] text-[#8A98A8] dark:text-[#707070]'}`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-tighter">{name.substring(0, 3)}</span>
                      {dayConfig && (
                        <div className={`w-1 h-1 rounded-full mt-1 ${dayConfig.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Day Status Line */}
            <div className="py-4 border-y border-[#D0D8E4] dark:border-[#3A3A3A] flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#1A2332] dark:text-[#F8F8F8]">Aberto para agendamentos</span>
              <button 
                onClick={() => updateDayConfig(selectedDay, { isOpen: !currentConfig?.isOpen })} 
                className={`w-12 h-7 rounded-full transition-colors relative ${currentConfig?.isOpen ? 'bg-green-500' : 'bg-[#D0D8E4] dark:bg-[#3A3A3A]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${currentConfig?.isOpen ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>
            
            {currentConfig?.isOpen && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Abertura" type="time" value={currentConfig.start} onChange={(e) => updateDayConfig(selectedDay, { start: e.target.value })} />
                  <Input label="Fechamento" type="time" value={currentConfig.end} onChange={(e) => updateDayConfig(selectedDay, { end: e.target.value })} />
                </div>

                {/* Summary Line */}
                <div className="text-center">
                  <p className="text-[12px] text-[#8A98A8] font-medium">
                    {availableCount} disponíveis · {blockedCount} bloqueados
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-1 ml-1">
                    <label className="text-[10px] font-medium text-[#8A98A8] dark:text-[#707070] uppercase tracking-widest">Horários Disponíveis</label>
                    <span className="text-[11px] text-[#8A98A8] font-medium">Toque para bloquear/desbloquear</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                      {previewSlots.map(slot => (
                        <button 
                          key={slot} 
                          onClick={() => toggleWeeklyBreak(selectedDay, slot)} 
                          className={`h-[44px] flex items-center justify-center rounded-xl text-[10px] font-bold transition-all shadow-[0_1px_4px_rgba(0,0,0,0.06)]
                            ${!currentConfig.breaks.includes(slot) 
                              ? 'bg-[#FFFFFF] dark:bg-[#242424] text-[#1A2332] dark:text-[#F8F8F8]' 
                              : 'bg-red-50 dark:bg-red-500/10 text-red-400 opacity-60'}`}
                        >
                          {slot}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
            {/* Spacer for gradient */}
            <div className="h-4" />
          {/* Bottom Fade Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FFFFFF] dark:from-[#242424] to-transparent pointer-events-none z-20"></div>
        </div>
        
        <footer className="px-6 pt-4 pb-6 shrink-0 bg-[#FFFFFF] dark:bg-[#242424] sticky bottom-0 z-10 border-t border-[#F1F5F9] dark:border-[#333333]">
          <Button fullWidth onClick={onClose} className="h-14 font-black uppercase tracking-widest shadow-xl shadow-[#2898D8]/20">
            Salvar e Fechar
          </Button>
        </footer>
      </motion.div>
    </div>
  );
};

const CustomersView: React.FC<{ 
  initialPhone: string | null; 
  clearInitial: () => void;
  onNewAppointment: (customer: Customer) => void;
  onAddCustomer: () => void;
  onSuccess?: (msg: string) => void;
}> = ({ initialPhone, clearInitial, onNewAppointment, onAddCustomer, onSuccess }) => {
  const { customers } = useStore();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const liveCustomer = selectedPhone ? customers[normalizePhone(selectedPhone)] : null;

  React.useEffect(() => {
    const normalized = initialPhone ? normalizePhone(initialPhone) : null;
    if (normalized && customers[normalized]) {
      setSelectedPhone(normalized);
      clearInitial();
    }
  }, [initialPhone, customers, clearInitial]);

  if (liveCustomer) return (
    <CustomerDetail 
      customer={liveCustomer} 
      onBack={() => setSelectedPhone(null)} 
      onPhoneChange={(newPhone) => setSelectedPhone(normalizePhone(newPhone))}
      onNewAppointment={onNewAppointment}
      onSuccess={onSuccess}
    />
  );
  const customerList = (Object.values(customers) as Customer[]).filter(c => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.trim().toLowerCase();
    const searchDigits = searchTerm.replace(/\D/g, '');
    const customerDigits = c.phone.replace(/\D/g, '');
    
    const nameMatch = c.name.toLowerCase().includes(searchLower);
    
    // Only match phone if search term has numbers
    const hasNumbers = /\d/.test(searchTerm);
    const phoneMatch = hasNumbers && (
      customerDigits.includes(searchDigits) || 
      c.phone.includes(searchTerm)
    );
    
    return nameMatch || phoneMatch;
  });

  return (
    <div className="space-y-2 relative pb-24">
      <div className="space-y-2">
        <Input label="Buscar Cliente" placeholder="Nome ou telefone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <p className="text-[10px] text-[#8A98A8] dark:text-[#707070] font-medium ml-1">
          {searchTerm 
            ? `${customerList.length} ${customerList.length === 1 ? 'resultado' : 'resultados'} para "${searchTerm}"`
            : `${customerList.length} ${customerList.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`
          }
        </p>
      </div>

      {customerList.length === 0 ? (
        <div className="bg-[#FFFFFF] dark:bg-[#242424] p-12 rounded-[2rem] border-2 border-dashed border-[#D0D8E4] dark:border-[#3A3A3A] text-center space-y-3">
          <div className="w-12 h-12 bg-[#F4F7FB] dark:bg-[#2F2F2F] rounded-full flex items-center justify-center mx-auto text-[#B0BCC7] dark:text-[#4B4B4B]">
            <UserX size={24} />
          </div>
          <p className="text-[#8A98A8] font-bold text-sm uppercase tracking-widest">Nenhum cliente encontrado</p>
        </div>
      ) : (
        customerList.map(cust => {
          return (
            <div 
              key={cust.phone} 
              onClick={() => setSelectedPhone(normalizePhone(cust.phone))} 
              className="bg-[#FFFFFF] dark:bg-[#242424] px-4 py-[10px] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-pointer flex items-center h-16"
            >
              <div className={`w-9 h-9 rounded-full ${getAvatarColor(cust.name)} flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-sm overflow-hidden mr-3`}>
                {cust.avatar ? (
                  <img src={cust.avatar} className="w-full h-full object-cover" alt={cust.name} referrerPolicy="no-referrer" />
                ) : (
                  getInitials(cust.name)
                )}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-semibold text-[#1A2332] dark:text-[#F8F8F8] text-sm truncate leading-tight">
                  {capitalizeName(cust.name)}
                </h3>
                <p className="text-xs text-[#8A98A8] dark:text-[#707070] leading-tight">
                  {cust.phone}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {cust.cutCount === 0 && (
                  <div className="bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-md border border-green-100 dark:border-green-500/20">
                    <span className="text-[9px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest">NOVO</span>
                  </div>
                )}
                
                <a 
                  href={`https://wa.me/55${cust.phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <FaWhatsapp size={18} />
                </a>
              </div>
            </div>
          );
        })
      )}

      {/* FAB */}
      <button 
        onClick={onAddCustomer}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#2898D8] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#2098F0] active:scale-90 transition-all z-50 pointer-events-auto"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
};

const CustomerDetail: React.FC<{ 
  customer: Customer; 
  onBack: () => void;
  onPhoneChange?: (newPhone: string) => void;
  onNewAppointment: (customer: Customer) => void;
  onSuccess?: (msg: string) => void;
}> = ({ customer, onBack, onPhoneChange, onNewAppointment, onSuccess }) => {
  const { updateCustomerPhoto, updateCustomerAvatar, updateCustomer } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone);

  useEffect(() => {
    if (!isEditing) {
      setEditName(customer.name);
      setEditPhone(customer.phone);
    }
  }, [customer.name, customer.phone, isEditing]);
  
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<'avatar' | 'history'>('history');

  // Local state for history and photos to avoid "disappearing" issue
  const [localHistory, setLocalHistory] = useState(customer.history || []);
  const [localPhotos, setLocalPhotos] = useState(customer.photos || []);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const buscarDadosDoCliente = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    
    setIsLoadingData(true);
    try {
      const result = await supabase.auth.getSession();
      const session = result?.data?.session;
      if (!session) return;

      // Fetch history (completed and no-show appointments)
      const { data: appointmentsData, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('phone', customer.phone)
        .in('status', ['completed', 'no-show'])
        .order('date', { ascending: false });

      if (aptError) throw aptError;

      // Recalculate counts to ensure they match history
      const actualCutCount = (appointmentsData || []).filter(a => a.status === 'completed').length;
      const actualNoShowCount = (appointmentsData || []).filter(a => a.status === 'no-show').length;

      if (actualCutCount !== customer.cutCount || actualNoShowCount !== (customer.noShowCount || 0)) {
        console.log(`Sincronizando contadores para ${customer.name}: Cortes ${customer.cutCount} -> ${actualCutCount}, Faltas ${customer.noShowCount || 0} -> ${actualNoShowCount}`);
        updateCustomer(customer.phone, { cutCount: actualCutCount, noShowCount: actualNoShowCount });
      }

      // Fetch photos
      const { data: photosData, error: photoError } = await supabase
        .from('customer_photos')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('customer_phone', customer.phone)
        .order('date', { ascending: false });

      if (photoError) throw photoError;

      // Normalize and set history
      const normalizedHistory = (appointmentsData || []).map(apt => ({
        date: apt.date.substring(0, 10),
        time: apt.time.substring(0, 5),
        service: apt.status === 'no-show' ? 'Falta registrada' : apt.service,
        price: apt.status === 'no-show' ? 0 : Number(apt.price),
        status: apt.status
      }));
      setLocalHistory(normalizedHistory);

      // Normalize and set photos
      const normalizedPhotos = (photosData || []).map(p => ({
        url: p.url,
        description: p.description || '',
        date: p.date.substring(0, 10)
      }));
      setLocalPhotos(normalizedPhotos);
    } catch (error) {
      console.error("Erro ao buscar dados do cliente:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [customer.phone]);

  useEffect(() => {
    buscarDadosDoCliente();
  }, [customer.phone, buscarDadosDoCliente]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressedBase64 = await compressImage(e.target.files[0]);
      setTempPhoto(compressedBase64);
      setShowDescription(true);
    }
  };

  const handleConfirmPhoto = (description: string) => {
    if (tempPhoto) {
      if (photoType === 'avatar') {
        updateCustomerAvatar(customer.phone, tempPhoto);
        onSuccess?.('Avatar atualizado!');
      } else {
        // Update local state immediately for real-time feel
        const newPhoto = {
          url: tempPhoto,
          description: description || '',
          date: new Date().toISOString().substring(0, 10)
        };
        setLocalPhotos(prev => [newPhoto, ...prev]);
        
        updateCustomerPhoto(customer.phone, tempPhoto, description);
        onSuccess?.('Foto adicionada ao histórico!');
      }
      setTempPhoto(null);
      setShowDescription(false);
    }
  };

  const handleSaveEdit = () => {
    const oldPhone = customer.phone;
    updateCustomer(oldPhone, { name: editName, phone: editPhone });
    if (normalizePhone(editPhone) !== normalizePhone(oldPhone)) {
      onPhoneChange?.(editPhone);
    }
    setIsEditing(false);
    onSuccess?.('Dados atualizados!');
  };

  const handleCancelEdit = () => {
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setIsEditing(false);
  };
  return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-[10px] font-black text-[#8A98A8] flex items-center gap-1 uppercase tracking-widest hover:text-[#2898D8] transition-colors">
          <ChevronLeft size={16} />
          Voltar
        </button>
        <button 
          onClick={() => onNewAppointment(customer)}
          className="text-[10px] font-black text-white flex items-center gap-2 bg-[#2898D8] px-4 py-2 rounded-full uppercase tracking-widest shadow-md shadow-[#2898D8]/20 active:scale-95 transition-all"
        >
          <Calendar size={14} />
          Novo Agendamento
        </button>
      </div>
      <div className="bg-[#FFFFFF] dark:bg-[#242424] p-6 rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6 text-center relative overflow-hidden">
        <button 
          onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
          className="absolute top-4 right-4 w-10 h-10 bg-[#F4F7FB] dark:bg-[#2F2F2F] text-[#8A98A8] rounded-full flex items-center justify-center hover:bg-[#E4E7EB] transition-colors"
        >
          {isEditing ? <X size={18} /> : <Edit3 size={18} />}
        </button>

        <div className="flex flex-col items-center mb-4">
          <div className="relative group">
            <div className={`w-24 h-24 rounded-full ${getAvatarColor(customer.name)} flex items-center justify-center text-white font-black text-2xl shadow-xl overflow-hidden border-4 border-[#FFFFFF] dark:border-[#242424]`}>
              {customer.avatar ? (
                <img src={customer.avatar} className="w-full h-full object-cover" alt={customer.name} />
              ) : (
                getInitials(customer.name)
              )}
            </div>
            <button 
              onClick={() => { setPhotoType('avatar'); setShowActionSheet(true); }}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#2898D8] text-white rounded-full flex items-center justify-center border-2 border-[#FFFFFF] dark:border-[#242424] shadow-lg hover:bg-[#2098F0] transition-colors"
            >
              <Camera size={14} />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3 mb-4">
            <input 
              type="text" 
              value={editName} 
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-[#F4F7FB] dark:bg-[#2F2F2F] border-none rounded-xl p-3 text-center font-bold text-[#1A2332] dark:text-[#F8F8F8]"
              placeholder="Nome do cliente"
            />
            <input 
              type="tel" 
              value={editPhone} 
              onChange={e => setEditPhone(e.target.value)}
              className="w-full bg-[#F4F7FB] dark:bg-[#2F2F2F] border-none rounded-xl p-3 text-center text-[#8A98A8] dark:text-[#707070]"
              placeholder="Telefone"
            />
            <Button fullWidth onClick={handleSaveEdit} className="h-10 rounded-xl bg-green-600">Salvar</Button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8]">{capitalizeName(customer.name)}</h2>
            <p className="text-[#8A98A8] dark:text-[#707070] text-xs mb-4">{customer.phone}</p>
          </>
        )}
        <div className="flex justify-center gap-3">
          <div className="bg-[#2898D8] text-white px-6 py-2 rounded-2xl shadow-lg shadow-[#2898D8]/20 flex-1 max-w-[120px]">
            <span className="font-black text-xl">{customer.cutCount}</span>
            <span className="text-[8px] ml-2 uppercase font-black tracking-widest opacity-80">
              {customer.cutCount === 1 ? 'corte' : 'cortes'}
            </span>
          </div>
          <div className={`px-6 py-2 rounded-2xl shadow-lg flex-1 max-w-[120px] transition-all ${
            (customer.noShowCount || 0) > 0 
              ? 'bg-amber-500 text-white shadow-amber-100' 
              : 'bg-[#F4F7FB] dark:bg-[#2F2F2F] text-[#B0BCC7] dark:text-[#4B4B4B] border border-[#D0D8E4] dark:border-[#3A3A3A] shadow-none'
          }`}>
            <span className="font-black text-xl">{customer.noShowCount || 0}</span>
            <span className="text-[8px] ml-2 uppercase font-black tracking-widest opacity-80">
              {(customer.noShowCount || 0) === 1 ? 'falta' : 'faltas'}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <h3 className="font-semibold text-[#1A2332] dark:text-[#F8F8F8] text-sm uppercase tracking-widest mb-4">Histórico</h3>
        <div className="bg-[#FFFFFF] dark:bg-[#242424] rounded-3xl border border-[#D0D8E4] dark:border-[#3A3A3A] overflow-hidden divide-y divide-[#D0D8E4] dark:divide-[#3A3A3A]">
          {isLoadingData && localHistory.length === 0 ? (
            <div className="p-8 text-center text-[#8A98A8] text-xs animate-pulse">Carregando histórico...</div>
          ) : localHistory.length === 0 ? (
            <div className="p-8 text-center text-[#8A98A8] text-xs italic">Nenhum histórico encontrado.</div>
          ) : (
            localHistory.map((h: any, i) => {
              const isNoShow = h.status === 'no-show' || h.service.includes('Falta registrada');
              return (
                <div key={i} className={`p-4 flex justify-between items-center ${isNoShow ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                  <div>
                    <span className={`text-xs font-bold block ${isNoShow ? 'text-amber-700 dark:text-amber-500' : 'text-[#1A2332] dark:text-[#F8F8F8]'}`}>{h.service}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#1A2332] dark:text-[#F8F8F8] font-bold uppercase">{formatDate(h.date)}</span>
                      {h.time && <span className="text-[9px] text-[#8A98A8] dark:text-[#707070] font-medium uppercase">{h.time}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.price && h.price > 0 ? (
                      <span className="text-[10px] font-black text-[#8A98A8]">{formatCurrency(h.price)}</span>
                    ) : null}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isNoShow ? 'bg-amber-100 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                      {isNoShow ? <ThumbsDown size={14} /> : '✓'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-[#1A2332] dark:text-[#F8F8F8] text-sm uppercase tracking-widest">Fotos</h3>
            <button onClick={() => { setPhotoType('history'); setShowActionSheet(true); }} className="text-[9px] bg-[#2898D8] text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest">+ Adicionar foto</button>
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} />
            <input type="file" accept="image/*" ref={galleryInputRef} className="hidden" onChange={handleFileChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {isLoadingData && localPhotos.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-[#8A98A8] text-xs animate-pulse">Carregando fotos...</div>
          ) : localPhotos.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-[#8A98A8] text-xs italic">Nenhuma foto encontrada.</div>
          ) : (
            localPhotos.map((photo, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#FFFFFF] dark:border-[#242424] shadow-sm">
                  <img src={photo.url} className="w-full h-full object-cover" loading="lazy" />
                </div>
                {photo.description && (
                  <p className="text-[10px] text-[#8A98A8] dark:text-[#707070] italic px-1 leading-tight">
                    {photo.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showActionSheet && (
          <PhotoActionSheet 
            isOpen={showActionSheet}
            onClose={() => setShowActionSheet(false)}
            onSelect={(source) => {
              setShowActionSheet(false);
              if (source === 'camera') cameraInputRef.current?.click();
              else galleryInputRef.current?.click();
            }}
          />
        )}
        {showDescription && tempPhoto && (
          <PhotoDescriptionModal 
            isOpen={showDescription}
            photo={tempPhoto}
            onClose={() => {
              setShowDescription(false);
              setTempPhoto(null);
            }}
            onConfirm={handleConfirmPhoto}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportsView: React.FC = () => {
  const { appointments, customers, isDarkMode } = useStore();
  const [period, setPeriod] = useState<'dia' | 'semana' | 'mes' | 'ano'>('dia');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'resumo' | 'clientes' | 'servicos'>('resumo');
  const [showSelector, setShowSelector] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
  const [slideDirection, setSlideDirection] = useState(0);

  const handleReportsSwipeLeft = () => {
    if (viewMode !== 'days') return;
    setSlideDirection(1);
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleReportsSwipeRight = () => {
    if (viewMode !== 'days') return;
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    setSlideDirection(-1);
  };

  const reportsSwipeHandlers = useSwipe(handleReportsSwipeLeft, handleReportsSwipeRight);

  const getRange = (p: 'dia' | 'semana' | 'mes' | 'ano', date: Date) => {
    const d = new Date(date);
    if (p === 'dia') {
      const s = d.toISOString().split('T')[0];
      return { start: s, end: s };
    }
    if (p === 'semana') {
      const start = new Date(d);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    if (p === 'mes') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    if (p === 'ano') {
      const start = new Date(d.getFullYear(), 0, 1);
      const end = new Date(d.getFullYear(), 11, 31);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    return { start: '', end: '' };
  };

  const getPreviousRange = (p: 'dia' | 'semana' | 'mes' | 'ano', date: Date) => {
    const d = new Date(date);
    if (p === 'dia') {
      d.setDate(d.getDate() - 1);
    } else if (p === 'semana') {
      d.setDate(d.getDate() - 7);
    } else if (p === 'mes') {
      d.setMonth(d.getMonth() - 1);
    } else if (p === 'ano') {
      d.setFullYear(d.getFullYear() - 1);
    }
    return getRange(p, d);
  };

  const currentRange = getRange(period, currentDate);
  const previousRange = getPreviousRange(period, currentDate);

  const stats = useMemo(() => {
    const filterApts = (range: { start: string, end: string }) => 
      appointments.filter(a => a.date >= range.start && a.date <= range.end);

    const currentApts = filterApts(currentRange);
    const previousApts = filterApts(previousRange);

    const calcMetrics = (apts: Appointment[]) => {
      const completed = apts.filter(a => a.status === 'completed');
      const revenueApts = apts.filter(a => a.status === 'completed');
      const noShows = apts.filter(a => a.status === 'no-show');
      
      const count = completed.length;
      const revenue = revenueApts.reduce((sum, a) => sum + (a.price || 0), 0);
      const ticket = count > 0 ? revenue / count : 0;
      const noShowRate = (count + noShows.length) > 0 ? (noShows.length / (count + noShows.length)) * 100 : 0;
      
      return { count, revenue, ticket, noShowRate, apts };
    };

    const current = calcMetrics(currentApts);
    const previous = calcMetrics(previousApts);

    // Chart Data
    let chartData: any[] = [];
    let chartTitle = "";
    if (period === 'dia') {
      chartTitle = "Atendimentos por Hora";
      for (let h = 8; h <= 20; h++) {
        const hourStr = h.toString().padStart(2, '0');
        const count = current.apts.filter(a => a.status === 'completed' && a.time.startsWith(hourStr)).length;
        chartData.push({ name: `${h}h`, value: count });
      }
    } else if (period === 'semana') {
      chartTitle = "Atendimentos por Dia";
      const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
      const start = new Date(currentRange.start + 'T12:00:00');
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const count = current.apts.filter(a => a.status === 'completed' && a.date === dateStr).length;
        chartData.push({ name: days[i], value: count });
      }
    } else if (period === 'mes') {
      chartTitle = "Atendimentos por Semana";
      const start = new Date(currentRange.start + 'T12:00:00');
      const end = new Date(currentRange.end + 'T12:00:00');
      let week = 1;
      let curr = new Date(start);
      while (curr <= end) {
        const wStart = new Date(curr);
        const wEnd = new Date(curr);
        wEnd.setDate(curr.getDate() + 6);
        const count = current.apts.filter(a => a.status === 'completed' && a.date >= wStart.toISOString().split('T')[0] && a.date <= wEnd.toISOString().split('T')[0]).length;
        chartData.push({ name: `Sem ${week}`, value: count });
        curr.setDate(curr.getDate() + 7);
        week++;
      }
    } else if (period === 'ano') {
      chartTitle = "Atendimentos por Mês";
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      for (let m = 0; m < 12; m++) {
        const count = current.apts.filter(a => {
          const aptDate = new Date(a.date + 'T12:00:00');
          return a.status === 'completed' && aptDate.getMonth() === m;
        }).length;
        chartData.push({ name: months[m], value: count });
      }
    }

    // Clientes Tab Data
    const clientStats: Record<string, { name: string, count: number, spent: number, noShows: number }> = {};
    current.apts.forEach(a => {
      if (!clientStats[a.phone]) {
        clientStats[a.phone] = { name: a.clientName, count: 0, spent: 0, noShows: 0 };
      }
      if (a.status === 'completed') {
        clientStats[a.phone].count++;
        clientStats[a.phone].spent += (a.price || 0);
      } else if (a.status === 'no-show') {
        clientStats[a.phone].noShows++;
      }
    });

    const topClients = Object.values(clientStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const newClients = Object.keys(clientStats).filter(phone => {
      const firstApt = appointments.find(a => a.phone === phone);
      return firstApt && firstApt.date >= currentRange.start && firstApt.date <= currentRange.end;
    }).length;

    const returningClients = Object.values(clientStats).filter(c => c.count > 1).length;
    const totalClientsWithApts = Object.keys(clientStats).filter(phone => {
      return current.apts.some(a => a.phone === phone && a.status === 'completed');
    }).length;
    const returnRate = totalClientsWithApts > 0 ? (returningClients / totalClientsWithApts) * 100 : 0;

    // Serviços Tab Data
    const serviceStats: Record<string, { count: number, revenue: number }> = {};
    current.apts.forEach(a => {
      if (a.status === 'completed') {
        if (!serviceStats[a.service]) {
          serviceStats[a.service] = { count: 0, revenue: 0 };
        }
        serviceStats[a.service].count++;
        serviceStats[a.service].revenue += (a.price || 0);
      }
    });

    const topServices = Object.entries(serviceStats)
      .map(([name, s]) => ({ name, ...s, ticket: s.count > 0 ? s.revenue / s.count : 0 }))
      .sort((a, b) => b.count - a.count);

    const highestTicketService = [...topServices].sort((a, b) => b.ticket - a.ticket)[0];

    const pieData = topServices.map(s => ({ name: s.name, value: s.revenue }));

    return {
      current,
      previous,
      chartData,
      chartTitle,
      topClients,
      newClients,
      returnRate,
      topServices,
      highestTicketService,
      pieData,
      totalCustomers: totalClientsWithApts
    };
  }, [appointments, customers, period, currentDate, currentRange, previousRange]);

  const renderComparison = (current: number, previous: number, isPercentage = false) => {
    if (previous === 0) return <p className="text-[9px] text-[#9CA3AF] mt-0.5">✦ Primeiro registro neste período</p>;
    const diff = ((current - previous) / previous) * 100;
    const isUp = diff > 0;
    const isDown = diff < 0;
    const absDiff = Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

    if (diff === 0) return <p className="text-[9px] text-[#8A98A8] mt-0.5">Mesmo que o período anterior</p>;
    
    return (
      <p className={`text-[9px] flex items-center gap-0.5 mt-0.5 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
        {isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
        {isUp ? '↑' : '↓'} {absDiff}% vs período anterior
      </p>
    );
  };

  const formatPeriodDisplay = () => {
    const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthsFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    if (period === 'dia') {
      return `${currentDate.getDate()} de ${monthsShort[currentDate.getMonth()]}. ${currentDate.getFullYear()}`;
    }
    if (period === 'semana') {
      const start = new Date(currentRange.start + 'T12:00:00');
      const end = new Date(currentRange.end + 'T12:00:00');
      return `${start.getDate()}–${end.getDate()} ${monthsShort[start.getMonth()]}. ${start.getFullYear()}`;
    }
    if (period === 'mes') {
      return `${monthsFull[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (period === 'ano') {
      return currentDate.getFullYear().toString();
    }
    return '';
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const renderCalendar = () => {
    if (viewMode === 'years') {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let y = 2026; y <= currentYear + 2; y++) {
        years.push(y);
      }

      return (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#5A6878] dark:text-[#F8F8F8]">Selecionar Ano</h4>
            <button onClick={() => setViewMode('days')} className="text-[10px] font-bold text-[#2898D8]">Voltar</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => {
                  setViewDate(new Date(year, viewDate.getMonth(), 1));
                  setViewMode('days');
                }}
                className={`h-10 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all
                  ${viewDate.getFullYear() === year ? 'bg-[#2898D8] text-white shadow-sm' : 'bg-[#F4F7FB] dark:bg-[#303030] text-[#5A6878] dark:text-[#8A98A8] hover:bg-[#E8EEF5]'}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      );
    }

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const offset = firstDayOfMonth; // 0 is Sunday
    
    const days = [];
    const prevMonthLastDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
    
    // Previous month
    for (let i = offset - 1; i >= 0; i--) {
      days.push(<div key={`prev-${i}`} className="h-8 flex items-center justify-center opacity-20 text-[10px] font-bold text-[#8A98A8]">{prevMonthLastDay - i}</div>);
    }
    
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const dateStr = date.toISOString().split('T')[0];
      const isSelected = period === 'dia' && dateStr === currentDate.toISOString().split('T')[0];
      const isWeekSelected = period === 'semana' && dateStr >= currentRange.start && dateStr <= currentRange.end;
      const isToday = dateStr === getTodayString();
      const isBefore2026 = date.getFullYear() < 2026;

      days.push(
        <button
          key={d}
          disabled={isBefore2026 && (period === 'semana' || period === 'mes')}
          onClick={() => {
            setCurrentDate(date);
            setShowSelector(false);
          }}
          className={`h-8 w-full rounded-lg flex items-center justify-center text-[11px] font-bold transition-all relative
            ${isSelected || isWeekSelected ? 'bg-[#2898D8] text-white shadow-sm' : isToday ? 'bg-[#E8F4FC] text-[#2898D8]' : 'hover:bg-[#F4F7FB] dark:hover:bg-slate-800 text-[#5A6878] dark:text-slate-200'}
            ${isBefore2026 && (period === 'semana' || period === 'mes') ? 'opacity-20 cursor-not-allowed' : ''}`}
        >
          {d}
        </button>
      );
    }
    
    // Next month
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push(<div key={`next-${d}`} className="h-8 flex items-center justify-center opacity-20 text-[10px] font-bold text-[#8A98A8]">{d}</div>);
    }

    return (
      <div {...reportsSwipeHandlers} className="p-4 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <button onClick={handleReportsSwipeRight} className="p-1 text-[#8A98A8] hover:text-[#2898D8]">
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setViewMode('years')}
            className="text-xs font-bold text-[#5A6878] dark:text-[#F8F8F8] capitalize hover:text-[#2898D8] transition-colors"
          >
            {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </button>
          <button onClick={handleReportsSwipeLeft} className="p-1 text-[#8A98A8] hover:text-[#2898D8]">
            <ChevronRight size={16} />
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`month-${viewDate.getTime()}`}
            initial={{ opacity: 0, x: slideDirection * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slideDirection * 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-7 gap-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                <div key={d} className="h-8 flex items-center justify-center text-[9px] font-black text-[#8A98A8] uppercase">{d}</div>
              ))}
              {days}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const renderMonthGrid = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const isBefore2026 = viewDate.getFullYear() < 2026;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))} className="p-1 text-[#8A98A8] hover:text-[#2898D8]">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-[#5A6878] dark:text-[#F8F8F8]">
            {viewDate.getFullYear()}
          </span>
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))} className="p-1 text-[#8A98A8] hover:text-[#2898D8]">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((m, idx) => {
            const isSelected = currentDate.getMonth() === idx && currentDate.getFullYear() === viewDate.getFullYear();
            const isBefore2026 = viewDate.getFullYear() < 2026;

            return (
              <button
                key={m}
                disabled={isBefore2026}
                onClick={() => {
                  setCurrentDate(new Date(viewDate.getFullYear(), idx, 1));
                  setShowSelector(false);
                }}
                className={`h-10 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all
                  ${isSelected ? 'bg-[#2898D8] text-white shadow-sm' : 'bg-[#F4F7FB] dark:bg-[#303030] text-[#5A6878] dark:text-[#8A98A8] hover:bg-[#E8EEF5]'}
                  ${isBefore2026 ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearGrid = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = 2026; y <= currentYear + 1; y++) {
      years.push(y);
    }

    return (
      <div className="p-4 grid grid-cols-3 gap-2">
        {years.map(year => (
          <button
            key={year}
            onClick={() => {
              setCurrentDate(new Date(year, 0, 1));
              setShowSelector(false);
            }}
            className={`h-10 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all
              ${currentDate.getFullYear() === year ? 'bg-[#2898D8] text-white shadow-sm' : 'bg-[#F4F7FB] dark:bg-[#303030] text-[#5A6878] dark:text-[#8A98A8] hover:bg-[#E8EEF5]'}`}
          >
            {year}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Filtros de Período */}
      <div className="space-y-3">
        <div className="flex bg-[#F4F7FB] dark:bg-[#2F2F2F] p-1 rounded-2xl">
          {(['dia', 'semana', 'mes', 'ano'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setCurrentDate(new Date());
                setShowSelector(false);
              }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                period === p ? 'bg-[#2898D8] text-white shadow-md' : 'text-[#8A98A8] dark:text-[#707070] hover:text-[#1A2332]'
              }`}
            >
              {p === 'dia' ? 'Dia' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <button 
            onClick={() => {
              setShowSelector(!showSelector);
              setViewDate(currentDate);
              setViewMode('days');
            }}
            className="flex items-center gap-2 px-5 py-[10px] bg-[#FFFFFF] dark:bg-[#242424] rounded-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:bg-[#F3F4F6] dark:hover:bg-[#2A3544] active:scale-[0.97] transition-all duration-100 w-fit"
          >
            <Calendar size={18} className="text-[#2898D8]" />
            <span className="text-[15px] font-semibold text-[#1A2332] dark:text-[#F8F8F8]">
              {formatPeriodDisplay()}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-[#B0BCC7] transition-transform duration-300 ${showSelector ? 'rotate-180' : ''}`} 
            />
          </button>

          <AnimatePresence>
            {showSelector && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[320px] overflow-hidden bg-[#FFFFFF] dark:bg-[#242424] rounded-2xl mt-3 shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-50"
              >
                {(period === 'dia' || period === 'semana') && renderCalendar()}
                {period === 'mes' && renderMonthGrid()}
                {period === 'ano' && renderYearGrid()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-[#D0D8E4] dark:border-[#3A3A3A]">
        {(['resumo', 'clientes', 'servicos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all relative ${
              activeTab === t ? 'text-[#2898D8]' : 'text-[#B0BCC7]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {t === 'resumo' && <LayoutDashboard size={14} />}
              {t === 'clientes' && <Users2 size={14} />}
              {t === 'servicos' && <Scissors size={14} />}
              {t === 'servicos' ? 'SERVIÇOS' : t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
            {activeTab === t && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2898D8]" />
            )}
          </button>
        ))}
      </div>


      <AnimatePresence mode="wait">
        {activeTab === 'resumo' && (
          <motion.div
            key="resumo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Cards de Métricas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FFFFFF] dark:bg-[#242424] py-3 px-4 rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col items-center text-center">
                <div className="w-7 h-7 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-1">
                  <DollarSign size={14} />
                </div>
                <p className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8]">{formatCurrency(stats.current.revenue)}</p>
                <p className="text-[#8A98A8] dark:text-[#707070] text-[9px] font-medium uppercase tracking-widest">Receita</p>
                {renderComparison(stats.current.revenue, stats.previous.revenue)}
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#242424] py-3 px-4 rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col items-center text-center">
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-500/10 text-[#2898D8] rounded-full flex items-center justify-center mb-1">
                  <Scissors size={14} />
                </div>
                <p className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8]">{stats.current.count}</p>
                <p className="text-[#8A98A8] dark:text-[#707070] text-[9px] font-medium uppercase tracking-widest">Atendimentos</p>
                {renderComparison(stats.current.count, stats.previous.count)}
              </div>
              
              <div className="bg-[#FFFFFF] dark:bg-[#242424] py-3 px-4 rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col items-center text-center">
                <div className="w-7 h-7 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-1">
                  <TrendingUp size={14} />
                </div>
                <p className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8]">{formatCurrency(stats.current.ticket)}</p>
                <p className="text-[#8A98A8] dark:text-[#707070] text-[9px] font-medium uppercase tracking-widest">Ticket Médio</p>
                {renderComparison(stats.current.ticket, stats.previous.ticket)}
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#242424] py-3 px-4 rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col items-center text-center opacity-80">
                <div className="w-7 h-7 bg-red-50 dark:bg-red-500/10 text-[#EF4444]/80 rounded-full flex items-center justify-center mb-1">
                  <UserX size={14} />
                </div>
                <p className="text-lg font-bold text-[#1A2332] dark:text-[#F8F8F8]">{stats.current.noShowRate.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%</p>
                <p className="text-[#8A98A8] dark:text-[#707070] text-[9px] font-medium uppercase tracking-widest">Taxa de Faltas</p>
                {renderComparison(stats.current.noShowRate, stats.previous.noShowRate)}
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-[#FFFFFF] dark:bg-[#242424] p-5 rounded-[2rem] shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-medium uppercase tracking-widest text-[#8A98A8] dark:text-[#707070]">
                  {stats.chartTitle}
                </h4>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#2898D8" />
                        <stop offset="100%" stopColor="#81c784" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#3A3A3A' : '#D0D8E4'} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 500, fill: isDarkMode ? '#707070' : '#8A98A8' }}
                      dy={10}
                      interval={0}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: isDarkMode ? '#2F2F2F' : '#F4F7FB' }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDarkMode ? '#242424' : '#FFFFFF',
                        color: isDarkMode ? '#F8F8F8' : '#1A2332',
                        fontSize: '11px'
                      }}
                      labelStyle={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', marginBottom: '4px' }}
                      formatter={(value: number) => [`${value} atendimento(s)`, '']}
                      separator=""
                    />

                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={period === 'dia' ? 10 : 20}>
                      {stats.chartData.map((entry, index) => {
                        const max = Math.max(...stats.chartData.map(d => d.value));
                        const ratio = max > 0 ? entry.value / max : 0;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill="url(#barGradient)"
                            fillOpacity={0.4 + (ratio * 0.6)}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'clientes' && (
          <motion.div
            key="clientes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#FFFFFF] dark:bg-[#242424] p-3 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
                <p className="text-2xl font-black text-[#1A2332] dark:text-[#F8F8F8] leading-none">{stats.totalCustomers}</p>
                <p className="text-[10px] text-[#8A98A8] uppercase tracking-widest font-bold mt-1">Total</p>
              </div>
              <div className="bg-[#FFFFFF] dark:bg-[#242424] p-3 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
                <p className="text-xl font-bold text-[#2898D8] leading-none">{stats.newClients}</p>
                <p className="text-[10px] text-[#8A98A8] uppercase tracking-widest font-bold mt-1">Novos</p>
              </div>
              <div className="bg-[#FFFFFF] dark:bg-[#242424] p-3 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
                <p className="text-xl font-medium text-[#8A98A8] leading-none">{stats.returnRate.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%</p>
                <p className="text-[10px] text-[#8A98A8] uppercase tracking-widest font-bold mt-1">Retorno</p>
              </div>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-[#242424] p-5 rounded-[2rem] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8A98A8] mb-4">Top 5 Clientes</h4>
              <div className="space-y-4">
                {stats.topClients.length > 0 ? stats.topClients.map((client, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(client.name)}`}>
                      {getInitials(client.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1A2332] dark:text-[#F8F8F8] truncate">{client.name}</p>
                      <p className="text-[10px] text-[#8A98A8]">{client.count} visitas • {formatCurrency(client.spent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-red-500">{client.noShows} faltas</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-[#8A98A8] text-sm py-4">Nenhum dado no período</p>
                )}
              </div>
            </div>
          </motion.div>
        )}


        {activeTab === 'servicos' && (
          <motion.div
            key="servicos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {stats.highestTicketService && (
              <div className="bg-[#2898D8] p-4 rounded-3xl shadow-lg flex items-center gap-4 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#FFFFFF]/80">Maior Ticket Médio</p>
                  <p className="text-sm font-bold">{stats.highestTicketService.name}</p>
                  <p className="text-xs text-[#FFFFFF]/70">{formatCurrency(stats.highestTicketService.ticket)} por atendimento</p>
                </div>
              </div>
            )}

            <div className="bg-[#FFFFFF] dark:bg-[#242424] p-5 rounded-[2rem] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8A98A8] mb-4">Distribuição de Receita</h4>
              
              {stats.pieData.length === 0 || stats.pieData.every(d => d.value === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 min-h-[200px]">
                  <PieChartIcon size={40} className="text-[#B0BCC7]" />
                  <p className="text-sm font-bold text-[#8A98A8]">Sem atendimentos neste período</p>
                  <p className="text-[10px] text-[#8A98A8]">Selecione outro período para ver a distribuição</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-6 px-4 min-h-[200px]">
                  <div className="h-[200px] w-full max-w-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#2898D8', '#42b4e6', '#1e88e5', '#60a5fa', '#3b82f6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px', backgroundColor: isDarkMode ? '#242424' : '#FFFFFF', color: isDarkMode ? '#F8F8F8' : '#1A2332' }}
                          formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 w-full sm:w-auto space-y-2">
                    {stats.pieData.map((entry, index) => {
                      const total = stats.pieData.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (entry.value / total * 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 0;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ['#2898D8', '#42b4e6', '#1e88e5', '#60a5fa', '#3b82f6'][index % 5] }} />
                          <p className="text-[10px] font-medium text-[#8A98A8] truncate flex-1">{entry.name}</p>
                          <p className="text-[10px] font-bold text-[#1A2332] dark:text-[#F8F8F8]">{percent}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#FFFFFF] dark:bg-[#242424] p-5 rounded-[2rem] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8A98A8] mb-4">Ranking de Serviços</h4>
              <div className="space-y-4">
                {stats.topServices.length > 0 ? stats.topServices.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1A2332] dark:text-[#F8F8F8] truncate">{service.name}</p>
                      <p className="text-[10px] text-[#8A98A8]">{service.count} realizados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#2898D8]">{formatCurrency(service.revenue)}</p>
                      <p className="text-[9px] text-[#8A98A8]">Ticket: {formatCurrency(service.ticket)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-[#8A98A8] text-sm py-4">Nenhum dado no período</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
