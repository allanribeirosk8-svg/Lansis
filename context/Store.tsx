import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Appointment, AppState, BarberProfile, Customer, DayConfig, ServiceItem } from '../types';
import { normalizePhone } from '../utils/helpers';
import { supabaseService } from '../services/supabaseService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEY_APTS = 'meucorte_appointments_v1';
const STORAGE_KEY_CUSTOMERS = 'meucorte_customers_v1';
const STORAGE_KEY_BLOCKED = 'meucorte_blocked_slots_v1';
const STORAGE_KEY_UNBLOCKED = 'meucorte_unblocked_slots_v1';
const STORAGE_KEY_WEEKLY_V2 = 'meucorte_weekly_schedule_v2';
const STORAGE_KEY_SERVICES = 'meucorte_services_v1';
const STORAGE_KEY_PROFILE = 'meucorte_profile_v2';
const STORAGE_KEY_DARK_MODE = 'meucorte_dark_mode_v1';

export const DEFAULT_DAY_CONFIG: DayConfig = {
  start: "09:00",
  end: "19:00",
  breaks: [],
  isOpen: true
};

const DEFAULT_WEEKLY: Record<number, DayConfig> = {
  0: { ...DEFAULT_DAY_CONFIG, isOpen: false }, // Sun
  1: { ...DEFAULT_DAY_CONFIG }, // Mon
  2: { ...DEFAULT_DAY_CONFIG },
  3: { ...DEFAULT_DAY_CONFIG },
  4: { ...DEFAULT_DAY_CONFIG },
  5: { ...DEFAULT_DAY_CONFIG },
  6: { ...DEFAULT_DAY_CONFIG }  // Sat
};

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: '1', name: 'Corte de Cabelo', price: 35, duration: 30 },
  { id: '2', name: 'Barba', price: 25, duration: 30 },
  { id: '3', name: 'Corte + Barba', price: 50, duration: 60 },
  { id: '4', name: 'Pezinho / Sobrancelha', price: 10, duration: 30 },
];

const DEFAULT_PROFILE: BarberProfile = {
  name: 'Barbeiro',
  personalPhone: '',
  photo: '',
  shopName: 'Meu Corte',
  businessPhone: '',
  address: '',
  logo: '',
  description: '',
  instagram: '',
  website: ''
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [blockedSlots, setBlockedSlots] = useState<Record<string, string[]>>({});
  const [unblockedSlots, setUnblockedSlots] = useState<Record<string, string[]>>({});
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DayConfig>>(DEFAULT_WEEKLY);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [barberProfile, setBarberProfile] = useState<BarberProfile>(DEFAULT_PROFILE);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const appointmentsRef = useRef(appointments);
  appointmentsRef.current = appointments;

  const customersRef = useRef<Record<string, Customer>>({});
  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  const skipNextFetchRef = useRef<Record<string, boolean>>({});

  const normalizeTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5); // "17:45:00" → "17:45"
  };

  const normalizeDate = (date: string) => {
    if (!date) return '';
    return date.substring(0, 10); // "2026-03-17T00:00:00+00:00" → "2026-03-17"
  };

  const normalizeAppointment = (apt: any): Appointment => ({
    ...apt,
    time: normalizeTime(apt.time),
    date: normalizeDate(apt.date)
  });

  const fetchAppointmentsByDate = useCallback(async (date: string) => {
    try {
      if (skipNextFetchRef.current[date]) {
        skipNextFetchRef.current[date] = false;
        return;
      }

      if (!isSupabaseConfigured() || !sessionRef.current) return;

      const dbApts = await supabaseService.getAppointmentsByDate(date);
      
      const normalizedApts = (dbApts || []).map(normalizeAppointment);

      setAppointments(prev => {
        const otherDates = prev.filter(a => a.date !== date);
        
        // Para appointments do dia, preservar clientName
        // local se o appointment já existia no estado
        const merged = normalizedApts.map(newApt => {
          const existing = prev.find(a => a.id === newApt.id);
          if (existing) {
            // Manter clientName local pois pode ter sido
            // atualizado via edição de cliente
            return { ...newApt, clientName: existing.clientName };
          }
          return newApt;
        });
        
        return [...otherDates, ...merged];
      });
    } catch (e) {
      console.error("Error fetching appointments by date", e);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const isConfigured = isSupabaseConfigured();
      
      if (isConfigured) {
        // Use the current session from ref if available, or fetch it once
        let currentSession = sessionRef.current;
        if (!currentSession) {
          const result = await supabase.auth.getSession();
          const fetchedSession = result?.data?.session || null;
          currentSession = fetchedSession;
          setSession(fetchedSession);
        }
        
        // Determine which user's data to fetch
        let targetId = currentSession?.user?.id || null;
        
        if (!targetId) {
          // If not logged in, try to find a public barber profile
          targetId = await supabaseService.getPublicBarberId();
        }

        setBarberId(targetId);
        
        if (targetId) {
          const [
            dbApts,
            dbCustomers,
            dbServices,
            dbProfile,
            dbWeekly,
            dbBlocked,
            dbUnblocked
          ] = await Promise.all([
            supabaseService.getAppointments(targetId),
            supabaseService.getCustomers(targetId),
            supabaseService.getServices(targetId),
            supabaseService.getProfile(targetId),
            supabaseService.getWeeklySchedule(targetId),
            supabaseService.getBlockedSlots(targetId),
            supabaseService.getUnblockedSlots(targetId)
          ]);

          setAppointments((dbApts || []).map(normalizeAppointment));
          if (dbCustomers) {
            const custMap: Record<string, Customer> = {};
            dbCustomers.forEach((c: any) => {
              custMap[normalizePhone(c.phone)] = {
                ...c,
                photos: c.customer_photos || []
              };
            });
            setCustomers(custMap);
          }
          setServices(dbServices && dbServices.length > 0 ? dbServices : DEFAULT_SERVICES);
          setBarberProfile(dbProfile || DEFAULT_PROFILE);
          setWeeklySchedule({ ...DEFAULT_WEEKLY, ...(dbWeekly || {}) });
          setBlockedSlots(dbBlocked || {});
          setUnblockedSlots(dbUnblocked || {});
        } else {
          // If configured but no barber found, we don't fallback to LocalStorage
          // to keep it "totally via Supabase"
          setAppointments([]);
          setCustomers({});
          setServices(DEFAULT_SERVICES);
          setBarberProfile(DEFAULT_PROFILE);
        }
      } else {
        loadFromLocalStorage();
      }

      const storedDarkMode = localStorage.getItem(STORAGE_KEY_DARK_MODE);
      if (storedDarkMode) setIsDarkMode(JSON.parse(storedDarkMode));
    } catch (e) {
      console.error("Failed to load data", e);
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFromLocalStorage = () => {
    const storedApts = localStorage.getItem(STORAGE_KEY_APTS);
    const storedCustomers = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    const storedBlocked = localStorage.getItem(STORAGE_KEY_BLOCKED);
    const storedUnblocked = localStorage.getItem(STORAGE_KEY_UNBLOCKED);
    const storedWeekly = localStorage.getItem(STORAGE_KEY_WEEKLY_V2);
    const storedServices = localStorage.getItem(STORAGE_KEY_SERVICES);
    const storedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
    
    if (storedApts) setAppointments(JSON.parse(storedApts));
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    if (storedBlocked) setBlockedSlots(JSON.parse(storedBlocked));
    if (storedUnblocked) setUnblockedSlots(JSON.parse(storedUnblocked));
    if (storedWeekly) setWeeklySchedule(JSON.parse(storedWeekly));
    if (storedServices) setServices(JSON.parse(storedServices));
    if (storedProfile) setBarberProfile(JSON.parse(storedProfile));
  };

  // Load from Supabase (Primary) and LocalStorage (Fallback/Cache)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      const authResult = supabase.auth.onAuthStateChange((event, newSession) => {
        console.log("Auth event:", event);
        setSession(newSession);
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          loadData();
        }
      });

      return () => {
        if (authResult?.data?.subscription) {
          authResult.data.subscription.unsubscribe();
        }
      };
    } else {
      loadData();
    }
  }, [loadData]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let channel: any;

    const setupRealtime = async () => {
      const currentSession = sessionRef.current;
      if (!currentSession) return;

      channel = supabase
        .channel('appointments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `user_id=eq.${currentSession.user.id}`
          },
          (payload) => {
            console.log("Realtime evento recebido:", payload);
            const { eventType, new: newRecord, old: oldRecord } = payload;

            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              const apt = {
                id: newRecord.id,
                date: normalizeDate(newRecord.date),
                time: normalizeTime(newRecord.time),
                clientName: newRecord.client_name,
                phone: newRecord.phone,
                service: newRecord.service,
                price: Number(newRecord.price),
                duration: newRecord.duration,
                status: newRecord.status,
                createdAt: new Date(newRecord.created_at).getTime()
              } as Appointment;
              
              setAppointments(prev => {
                const index = prev.findIndex(a => a.id === apt.id);
                
                if (index !== -1) {
                  // If it exists, update it but ONLY if the new data is complete
                  // This prevents REPLICA IDENTITY issues where 'new' might be incomplete
                  if (!apt.date || !apt.time || !apt.clientName) {
                    console.log('Ignoring incomplete Realtime update for existing appointment:', apt.id);
                    return prev;
                  }
                  const next = [...prev];
                  next[index] = apt;
                  return next;
                }

                if (eventType === 'INSERT') {
                  // If the record is incomplete, don't add it - wait for the manual fetch or a better event
                  if (!apt.date || !apt.time || !apt.clientName) {
                    console.log('Ignoring incomplete Realtime INSERT:', apt.id);
                    return prev;
                  }

                  // Check for a temporary appointment (non-UUID id) that matches
                  const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                  const tempIndex = prev.findIndex(a => 
                    !isUUID(a.id) && 
                    a.date === apt.date && 
                    a.time === apt.time && 
                    a.clientName === apt.clientName
                  );

                  if (tempIndex !== -1) {
                    const next = [...prev];
                    next[tempIndex] = apt;
                    return next;
                  }
                  return [...prev, apt];
                }
                
                return prev;
              });
            } else if (eventType === 'DELETE') {
              setAppointments(prev => prev.filter(a => a.id !== oldRecord.id));
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Sync to LocalStorage (Cache) - Apenas se NÃO estiver logado como barbeiro
  useEffect(() => {
    const syncLocal = async () => {
      if (isLoading) return;
      
      const currentSession = sessionRef.current;

      // Se o Supabase estiver configurado, não usamos LocalStorage para dados de negócio
      if (!isSupabaseConfigured()) {
        localStorage.setItem(STORAGE_KEY_APTS, JSON.stringify(appointments));
        localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
        localStorage.setItem(STORAGE_KEY_BLOCKED, JSON.stringify(blockedSlots));
        localStorage.setItem(STORAGE_KEY_UNBLOCKED, JSON.stringify(unblockedSlots));
        localStorage.setItem(STORAGE_KEY_WEEKLY_V2, JSON.stringify(weeklySchedule));
        localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(barberProfile));
      }
    };
    
    syncLocal();
  }, [appointments, customers, blockedSlots, unblockedSlots, weeklySchedule, services, barberProfile, isLoading]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DARK_MODE, JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addAppointment = useCallback(async (apt: Appointment, isExceptional?: boolean) => {
    console.log("1. Iniciando criação do agendamento");
    
    // 1. Time normalization
    const normalizedTimeValue = normalizeTime(apt.time);
    if (!normalizedTimeValue) {
      console.error("Horário inválido");
      return;
    }

    // 2. Exceptional handling
    let finalObservation = apt.observation || '';
    if (isExceptional && !finalObservation.startsWith('[EXCEPCIONAL]')) {
      finalObservation = `[EXCEPCIONAL] ${finalObservation}`.trim();
    }

    const finalApt = {
      ...apt,
      time: normalizedTimeValue,
      observation: finalObservation
    };

    // 3. Conflict validation
    const isConflict = appointmentsRef.current.some(a => 
      a.date === finalApt.date && 
      a.time === finalApt.time && 
      a.id !== finalApt.id
    );

    if (isConflict) {
      console.error("Este horário já está ocupado por outro agendamento.");
      alert("Este horário já está ocupado por outro agendamento.");
      return;
    }

    console.log("2. Dados do agendamento:", finalApt);
    
    setAppointments(prev => {
      const next = [...prev, finalApt];
      console.log("5. Estado local atualizado:", next);
      return next;
    });
    
    const normalizedPhone = normalizePhone(finalApt.phone);
    
    setCustomers(prev => {
      const existing = prev[normalizedPhone];
      if (existing) return { ...prev, [normalizedPhone]: { ...existing, name: finalApt.clientName, phone: finalApt.phone } };
      return {
        ...prev,
        [normalizedPhone]: { phone: finalApt.phone, name: finalApt.clientName, cutCount: 0, history: [], photos: [] }
      };
    });

    // Optional: Add to unblocked_slots for consistency if exceptional
    if (isExceptional) {
      setUnblockedSlots(prev => {
        const dateSlots = prev[finalApt.date] || [];
        if (!dateSlots.includes(finalApt.time)) {
          const next = { ...prev, [finalApt.date]: [...dateSlots, finalApt.time] };
          if (isSupabaseConfigured()) {
            supabaseService.saveUnblockedSlot(finalApt.date, finalApt.time, true).catch(console.error);
          }
          return next;
        }
        return prev;
      });
    }

    try {
      const targetId = sessionRef.current?.user?.id || barberId;

      if (targetId) {
        console.log("3. Enviando para Supabase...");
        try {
          const savedApt = await supabaseService.saveAppointment(finalApt, targetId);
          console.log("4. Resposta do Supabase:", { data: savedApt, error: null });
          
          const normalizedSavedApt = normalizeAppointment(savedApt);

          // Update state with the real ID from Supabase
          setAppointments(prev => {
            const next = prev.map(a => a.id === finalApt.id ? normalizedSavedApt : a);
            console.log("5. Estado local atualizado (com ID real):", next);
            return next;
          });
          
          // Mark this date to skip the next fetch to avoid race conditions
          skipNextFetchRef.current[finalApt.date] = true;
          
          // Also save/update customer
          // Instead of fetching all customers, we just upsert the current one.
          // Supabase upsert will handle creation or update based on the phone (PK).
          await supabaseService.saveCustomer({ 
            phone: finalApt.phone, 
            name: finalApt.clientName, 
            cutCount: 0, 
            history: [], 
            photos: [] 
          }, targetId);
        } catch (err) {
          console.log("4. Resposta do Supabase:", { data: null, error: err });
          throw err;
        }
      }
    } catch (e) {
      console.error("Supabase sync error", e);
    }
  }, [barberId]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    let updatedApt: Appointment | undefined;
    
    setAppointments(prev => {
      const updated = prev.map(apt => {
        if (apt.id === id) {
          updatedApt = { ...apt, ...updates };
          return updatedApt;
        }
        return apt;
      });
      return updated;
    });

    if (updatedApt) {
      try {
        const currentSession = sessionRef.current;
        if (currentSession) {
          const savedApt = await supabaseService.saveAppointment(updatedApt);
          const normalizedSavedApt = normalizeAppointment(savedApt);
          // Ensure local state has the correct ID (though for update it should already match)
          if (normalizedSavedApt.id !== id) {
             setAppointments(prev => prev.map(a => a.id === id ? normalizedSavedApt : a));
          }
        }
      } catch (e) {
        console.error("Supabase sync error", e);
      }
    }
  }, []);

  const finishAppointment = useCallback(async (id: string) => {
    const apt = appointmentsRef.current.find(a => a.id === id);
    if (!apt || apt.status === 'completed') return;

    const updatedApt = { ...apt, status: 'completed' as const };
    setAppointments(prevApts => 
      prevApts.map(a => a.id === id ? updatedApt : a)
    );

    setCustomers(prevCusts => {
      const normalizedPhone = normalizePhone(apt.phone);
      const customer = prevCusts[normalizedPhone] || { phone: apt.phone, name: apt.clientName, cutCount: 0, history: [], photos: [] };
      const updatedCust = {
        ...customer,
        cutCount: (customer.cutCount || 0) + 1,
        history: [{ date: apt.date, time: apt.time, service: apt.service, price: apt.price }, ...(customer.history || [])]
      };
      
      const sync = async () => {
        const currentSession = sessionRef.current;
        if (currentSession) {
          const savedApt = await supabaseService.saveAppointment(updatedApt);
          setAppointments(prev => prev.map(a => a.id === id ? normalizeAppointment(savedApt) : a));
          supabaseService.saveCustomer(updatedCust).catch(console.error);
        }
      };
      sync();
      
      return {
        ...prevCusts,
        [normalizedPhone]: updatedCust
      };
    });
  }, []);

  const markNoShow = useCallback(async (id: string) => {
    const apt = appointmentsRef.current.find(a => a.id === id);
    if (!apt || apt.status !== 'pending') return;

    const updatedApt = { ...apt, status: 'no-show' as const };
    setAppointments(prevApts => 
      prevApts.map(a => a.id === id ? updatedApt : a)
    );

    setCustomers(prevCusts => {
      const normalizedPhone = normalizePhone(apt.phone);
      const customer = prevCusts[normalizedPhone] || { phone: apt.phone, name: apt.clientName, cutCount: 0, noShowCount: 0, history: [], photos: [] };
      const updatedCust = {
        ...customer,
        noShowCount: (customer.noShowCount || 0) + 1,
        history: [{ date: apt.date, time: apt.time, service: 'Falta registrada', price: 0 }, ...(customer.history || [])]
      };

      const sync = async () => {
        const currentSession = sessionRef.current;
        if (currentSession) {
          const savedApt = await supabaseService.saveAppointment(updatedApt);
          setAppointments(prev => prev.map(a => a.id === id ? normalizeAppointment(savedApt) : a));
          supabaseService.saveCustomer(updatedCust).catch(console.error);
        }
      };
      sync();

      return {
        ...prevCusts,
        [normalizedPhone]: updatedCust
      };
    });
  }, []);

  const revertAppointment = useCallback(async (id: string) => {
    const apt = appointmentsRef.current.find(a => a.id === id);
    if (!apt || apt.status === 'pending') return;
    const currentStatus = apt.status;

    const updatedApt = { ...apt, status: 'pending' as const };
    setAppointments(prevApts => 
      prevApts.map(a => a.id === id ? updatedApt : a)
    );

    setCustomers(prevCusts => {
      const normalizedPhone = normalizePhone(apt.phone);
      const customer = prevCusts[normalizedPhone];
      if (!customer) return prevCusts;
      
      const historySearchService = currentStatus === 'no-show' 
        ? 'Falta registrada' 
        : apt.service;
        
      const historyIndex = customer.history.findIndex(h => h.date === apt.date && h.service === historySearchService);
      let newHistory = [...customer.history];
      if (historyIndex !== -1) newHistory.splice(historyIndex, 1);
      
      const updatedCust = { 
        ...customer, 
        cutCount: currentStatus === 'completed' ? Math.max(0, (customer.cutCount || 0) - 1) : customer.cutCount,
        noShowCount: currentStatus === 'no-show' ? Math.max(0, (customer.noShowCount || 0) - 1) : customer.noShowCount,
        history: newHistory 
      };

      const sync = async () => {
        const currentSession = sessionRef.current;
        if (currentSession) {
          const savedApt = await supabaseService.saveAppointment(updatedApt);
          setAppointments(prev => prev.map(a => a.id === id ? normalizeAppointment(savedApt) : a));
          supabaseService.saveCustomer(updatedCust).catch(console.error);
        }
      };
      sync();

      return {
        ...prevCusts,
        [normalizedPhone]: updatedCust
      };
    });
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    let aptToDelete: Appointment | undefined;
    let updatedCust: Customer | undefined;

    setAppointments(prevApts => {
      const apt = prevApts.find(a => a.id === id);
      if (!apt) return prevApts;
      aptToDelete = apt;

      if (apt.status === 'completed') {
        setCustomers(prevCusts => {
          const normalizedPhone = normalizePhone(apt.phone);
          const customer = prevCusts[normalizedPhone];
          if (!customer) return prevCusts;
          const historyIndex = customer.history.findIndex(h => h.date === apt.date && h.service === apt.service);
          let newHistory = [...customer.history];
          if (historyIndex !== -1) newHistory.splice(historyIndex, 1);
          updatedCust = { ...customer, cutCount: Math.max(0, (customer.cutCount || 0) - 1), history: newHistory };
          
          return {
            ...prevCusts,
            [normalizedPhone]: updatedCust
          };
        });
      }
      return prevApts.filter(a => a.id !== id);
    });

    try {
      const currentSession = sessionRef.current;
      if (currentSession) {
        if (aptToDelete) await supabaseService.deleteAppointment(id);
        if (updatedCust) await supabaseService.saveCustomer(updatedCust);
      }
    } catch (e) {
      console.error("Supabase sync error", e);
    }
  }, []);

  const updateCustomerPhoto = useCallback(async (phone: string, base64Photo: string, description?: string) => {
    const normalizedPhone = normalizePhone(phone);
    const newPhoto = {
      url: base64Photo,
      description: description || '',
      date: new Date().toISOString().substring(0, 10)
    };

    setCustomers(prev => {
      const customer = prev[normalizedPhone];
      if (!customer) return prev;
      const updatedCust = { ...customer, photos: [newPhoto, ...customer.photos] };
      return { ...prev, [normalizedPhone]: updatedCust };
    });

    const currentSession = sessionRef.current;
    if (currentSession) {
      supabaseService.addCustomerPhoto(phone, newPhoto).catch(console.error);
    }
  }, []);

  const updateCustomerAvatar = useCallback(async (phone: string, base64Photo: string) => {
    const normalizedPhone = normalizePhone(phone);
    let updatedCust: Customer | null = null;

    setCustomers(prev => {
      const customer = prev[normalizedPhone];
      if (!customer) return prev;
      updatedCust = { ...customer, avatar: base64Photo };
      return { ...prev, [normalizedPhone]: updatedCust };
    });

    if (updatedCust) {
      const currentSession = sessionRef.current;
      if (currentSession) {
        supabaseService.saveCustomer(updatedCust).catch(console.error);
      }
    }
  }, []);

  const updateCustomer = useCallback(async (
    phone: string,
    updates: Partial<Customer>
  ) => {
    const normalizedPhone = normalizePhone(phone);

    // Ler o cliente atual FORA do setCustomers
    // usando a ref que mantém o estado atualizado
    const currentCustomer = customersRef.current[normalizedPhone];
    if (!currentCustomer) return;

    // Montar o objeto atualizado de forma síncrona
    const updatedCustomer: Customer = { ...currentCustomer, ...updates };
    const newPhone = updates.phone
      ? normalizePhone(updates.phone)
      : normalizedPhone;
    const phoneChanged = newPhone !== normalizedPhone;

    // Atualizar estado local
    setCustomers(prev => {
      if (phoneChanged) {
        const { [normalizedPhone]: _, ...rest } = prev;
        return { ...rest, [newPhone]: updatedCustomer };
      }
      return { ...prev, [normalizedPhone]: updatedCustomer };
    });

    // Atualizar appointments
    if (updates.name || updates.phone) {
      setAppointments(prev => prev.map(apt => {
        if (normalizePhone(apt.phone) === normalizedPhone) {
          return {
            ...apt,
            clientName: updates.name ?? apt.clientName,
            phone: updates.phone ?? apt.phone
          };
        }
        return apt;
      }));
    }

    // Chamar Supabase com o objeto já montado (nunca null)
    const currentSession = sessionRef.current;

    if (currentSession) {
      try {
        await supabaseService.updateCustomer(phone, updatedCustomer);
      } catch (err) {
        console.error('Erro ao atualizar cliente no Supabase:', err);
      }
    }
  }, []);

  const toggleSlotAvailability = useCallback(async (date: string, time: string) => {
    let isNowBlocked = false;
    setBlockedSlots(prev => {
      const dateSlots = prev[date] || [];
      if (dateSlots.includes(time)) {
        isNowBlocked = false;
        return { ...prev, [date]: dateSlots.filter(t => t !== time) };
      }
      isNowBlocked = true;
      return { ...prev, [date]: [...dateSlots, time] };
    });
    
    const sync = async () => {
      const currentSession = sessionRef.current;
      if (currentSession) supabaseService.saveBlockedSlot(date, time, isNowBlocked).catch(console.error);
    };
    sync();

    // When manually blocking/unblocking, we should also clear any "unblock" exception for that slot
    setUnblockedSlots(prev => {
      const dateSlots = prev[date] || [];
      if (dateSlots.includes(time)) {
        const syncUnblock = async () => {
          const currentSession = sessionRef.current;
          if (currentSession) supabaseService.saveUnblockedSlot(date, time, false).catch(console.error);
        };
        syncUnblock();
        return { ...prev, [date]: dateSlots.filter(t => t !== time) };
      }
      return prev;
    });
  }, []);

  const toggleSlotUnblock = useCallback(async (date: string, time: string) => {
    let isNowUnblocked = false;
    setUnblockedSlots(prev => {
      const dateSlots = prev[date] || [];
      if (dateSlots.includes(time)) {
        isNowUnblocked = false;
        return { ...prev, [date]: dateSlots.filter(t => t !== time) };
      }
      isNowUnblocked = true;
      return { ...prev, [date]: [...dateSlots, time] };
    });

    const sync = async () => {
      const currentSession = sessionRef.current;
      if (currentSession) supabaseService.saveUnblockedSlot(date, time, isNowUnblocked).catch(console.error);
    };
    sync();

    // When unblocking, we should also clear any manual block for that slot
    setBlockedSlots(prev => {
      const dateSlots = prev[date] || [];
      if (dateSlots.includes(time)) {
        const syncBlock = async () => {
          const currentSession = sessionRef.current;
          if (currentSession) supabaseService.saveBlockedSlot(date, time, false).catch(console.error);
        };
        syncBlock();
        return { ...prev, [date]: dateSlots.filter(t => t !== time) };
      }
      return prev;
    });
  }, []);

  const updateDayConfig = useCallback(async (day: number, config: Partial<DayConfig>) => {
    setWeeklySchedule(prev => {
      const newConfig = { ...prev[day], ...config };
      const sync = async () => {
        const currentSession = sessionRef.current;
        if (currentSession) supabaseService.saveWeeklySchedule(day, newConfig).catch(console.error);
      };
      sync();
      return {
        ...prev,
        [day]: newConfig
      };
    });
  }, []);

  const toggleWeeklyBreak = useCallback(async (day: number, time: string) => {
    setWeeklySchedule(prev => {
      const currentConfig = prev[day];
      const breaks = currentConfig.breaks || [];
      const newBreaks = breaks.includes(time) ? breaks.filter(t => t !== time) : [...breaks, time];
      const newConfig = { ...currentConfig, breaks: newBreaks };
      const sync = async () => {
        const currentSession = sessionRef.current;
        if (currentSession) supabaseService.saveWeeklySchedule(day, newConfig).catch(console.error);
      };
      sync();
      return { ...prev, [day]: newConfig };
    });
  }, []);

  const addService = useCallback(async (service: ServiceItem) => {
    let newList: ServiceItem[] = [];
    setServices(prev => {
      newList = [...prev, service];
      return newList;
    });

    try {
      const currentSession = sessionRef.current;
      if (currentSession) {
        const savedServices = await supabaseService.saveServices(newList);
        setServices(savedServices);
      }
    } catch (e) {
      console.error("Supabase sync error in addService", e);
    }
  }, []);

  const removeService = useCallback(async (id: string) => {
    setServices(prev => {
      const newList = prev.filter(s => s.id !== id);
      const sync = async () => {
        const currentSession = sessionRef.current;
        if (currentSession) supabaseService.deleteService(id).catch(console.error);
      };
      sync();
      return newList;
    });
  }, []);

  const updateService = useCallback(async (service: ServiceItem) => {
    setServices(prev => {
      const newList = prev.map(s => s.id === service.id ? service : s);
      const sync = async () => {
        const currentSession = sessionRef.current;
        if (currentSession) {
          const savedServices = await supabaseService.saveServices(newList);
          setServices(savedServices);
        }
      };
      sync();
      return newList;
    });
  }, []);

  const updateBarberProfile = useCallback(async (profile: BarberProfile) => {
    setBarberProfile(profile);
    try {
      const currentSession = sessionRef.current;
      if (currentSession) await supabaseService.updateProfile(profile);
    } catch (e) {
      console.error("Supabase sync error in updateBarberProfile", e);
    }
  }, []);

  const addCustomer = useCallback(async (customer: Customer) => {
    const normalized = normalizePhone(customer.phone);
    let isNew = false;

    setCustomers(prev => {
      if (prev[normalized]) return prev;
      isNew = true;
      return { ...prev, [normalized]: customer };
    });

    if (isNew) {
      try {
        const targetId = sessionRef.current?.user?.id || barberId;
        if (targetId) {
          await supabaseService.saveCustomer(customer, targetId);
          console.log("Customer saved to Supabase successfully");
        }
      } catch (e) {
        console.error("Supabase sync error in addCustomer", e);
        throw e;
      }
    }
  }, [barberId]);

  const reorderServices = useCallback(async (newServices: ServiceItem[]) => {
    setServices(newServices);
    const sync = async () => {
      const currentSession = sessionRef.current;
      if (currentSession) {
        const savedServices = await supabaseService.saveServices(newServices);
        setServices(savedServices);
      }
    };
    sync();
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  return (
    <AppContext.Provider value={{ 
      appointments, 
      customers, 
      blockedSlots, 
      unblockedSlots,
      weeklySchedule, 
      services,
      barberProfile,
      isDarkMode,
      isLoading,
      toggleDarkMode,
      addAppointment, 
      updateAppointment,
      finishAppointment, 
      revertAppointment, 
      markNoShow,
      updateCustomerPhoto, 
      updateCustomerAvatar,
      updateCustomer,
      deleteAppointment, 
      toggleSlotAvailability,
      toggleSlotUnblock,
      updateDayConfig,
      toggleWeeklyBreak,
      addService,
      removeService,
      updateService,
      updateBarberProfile,
      addCustomer,
      reorderServices,
      fetchAppointmentsByDate
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useStore must be used within AppProvider");
  return context;
};
