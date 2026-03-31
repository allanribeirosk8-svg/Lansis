import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/Store';
import { BarberProfile, DayConfig, ServiceItem } from '../types';
import { 
  Store, 
  Clock, 
  Scissors, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Perfil', icon: Store },
  { id: 2, title: 'Horários', icon: Clock },
  { id: 3, title: 'Serviços', icon: Scissors },
];

const DEFAULT_SERVICES_OPTIONS = [
  { id: 'opt-1', name: 'Corte de Cabelo', price: 30, duration: 30, selected: true },
  { id: 'opt-2', name: 'Barba', price: 20, duration: 30, selected: true },
  { id: 'opt-3', name: 'Sobrancelha', price: 10, duration: 15, selected: false },
];

const DAYS_OF_WEEK = [
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

export const SetupWizard: React.FC = () => {
  const { updateBarberProfile, updateDayConfig, reorderServices } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1 State
  const [profile, setProfile] = useState<BarberProfile>({
    name: '',
    personalPhone: '',
    shopName: '',
    businessPhone: '',
    address: '',
    description: '',
    instagram: '',
    website: ''
  });

  // Step 2 State
  const [schedule, setSchedule] = useState<Record<number, DayConfig>>({
    1: { start: '09:00', end: '19:00', isOpen: true, breaks: [] },
    2: { start: '09:00', end: '19:00', isOpen: true, breaks: [] },
    3: { start: '09:00', end: '19:00', isOpen: true, breaks: [] },
    4: { start: '09:00', end: '19:00', isOpen: true, breaks: [] },
    5: { start: '09:00', end: '19:00', isOpen: true, breaks: [] },
    6: { start: '09:00', end: '19:00', isOpen: true, breaks: [] },
    0: { start: '09:00', end: '19:00', isOpen: false, breaks: [] },
  });

  // Step 3 State
  const [selectedServices, setSelectedServices] = useState(DEFAULT_SERVICES_OPTIONS);
  const [customServices, setCustomServices] = useState<ServiceItem[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '30' });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // 1. Save Profile
      await updateBarberProfile(profile);

      // 2. Save Schedule
      for (const day of Object.keys(schedule)) {
        await updateDayConfig(Number(day), schedule[Number(day)]);
      }

      // 3. Save Services
      const servicesToSave = [
        ...selectedServices.filter(s => s.selected).map(s => ({
          id: crypto.randomUUID(),
          name: s.name,
          price: s.price,
          duration: s.duration
        })),
        ...customServices
      ];

      if (servicesToSave.length > 0) {
        await reorderServices(servicesToSave);
      }

      // Success! The App.tsx will detect the change and hide the wizard
      // We might need to force a reload or just rely on state changes
      window.location.reload(); // Simple way to ensure everything is fresh
    } catch (error) {
      console.error("Error saving setup:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const addCustomService = () => {
    if (newService.name && newService.price) {
      setCustomServices(prev => [...prev, {
        id: crypto.randomUUID(),
        name: newService.name,
        price: Number(newService.price),
        duration: Number(newService.duration)
      }]);
      setNewService({ name: '', price: '', duration: '30' });
      setIsAddingCustom(false);
    }
  };

  const removeCustomService = (id: string) => {
    setCustomServices(prev => prev.filter(s => s.id !== id));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bem-vindo! Como se chama sua barbearia?</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Vamos configurar o básico para você começar.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Barbearia</label>
                <input 
                  autoFocus
                  type="text"
                  value={profile.shopName}
                  onChange={e => setProfile({...profile, shopName: e.target.value})}
                  placeholder="Ex: Barbearia do João"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seu Nome (Barbeiro)</label>
                <input 
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  placeholder="Ex: João Silva"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quais são seus horários de trabalho?</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Você pode ajustar isso detalhadamente depois.</p>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSchedule({...schedule, [day.id]: {...schedule[day.id], isOpen: !schedule[day.id].isOpen}})}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${schedule[day.id].isOpen ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-transparent'}`}
                    >
                      <Check size={14} />
                    </button>
                    <span className={`font-medium ${schedule[day.id].isOpen ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {day.label}
                    </span>
                  </div>

                  {schedule[day.id].isOpen && (
                    <div className="flex items-center gap-2">
                      <input 
                        type="time"
                        value={schedule[day.id].start}
                        onChange={e => setSchedule({...schedule, [day.id]: {...schedule[day.id], start: e.target.value}})}
                        className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg p-1 text-sm text-slate-700 dark:text-slate-300"
                      />
                      <span className="text-slate-400">até</span>
                      <input 
                        type="time"
                        value={schedule[day.id].end}
                        onChange={e => setSchedule({...schedule, [day.id]: {...schedule[day.id], end: e.target.value}})}
                        className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg p-1 text-sm text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  )}

                  {!schedule[day.id].isOpen && (
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fechado</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quais serviços você oferece?</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Selecione os padrões ou adicione os seus.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {selectedServices.map(service => (
                <button 
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                    service.selected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{service.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{service.duration} min • R$ {service.price}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${service.selected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-transparent'}`}>
                    <Check size={14} />
                  </div>
                </button>
              ))}

              {customServices.map(service => (
                <div key={service.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{service.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{service.duration} min • R$ {service.price}</p>
                  </div>
                  <button onClick={() => removeCustomService(service.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {!isAddingCustom ? (
                <button 
                  onClick={() => setIsAddingCustom(true)}
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all"
                >
                  <Plus size={20} />
                  <span className="font-bold uppercase text-xs tracking-widest">Adicionar outro serviço</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl border-2 border-blue-500 bg-white dark:bg-slate-800 space-y-3">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Nome do serviço"
                    value={newService.name}
                    onChange={e => setNewService({...newService, name: e.target.value})}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border-none outline-none"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      placeholder="Preço (R$)"
                      value={newService.price}
                      onChange={e => setNewService({...newService, price: e.target.value})}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border-none outline-none"
                    />
                    <input 
                      type="number"
                      placeholder="Minutos"
                      value={newService.duration}
                      onChange={e => setNewService({...newService, duration: e.target.value})}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border-none outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={addCustomService}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                    >
                      Adicionar
                    </button>
                    <button 
                      onClick={() => setIsAddingCustom(false)}
                      className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between mb-2">
            {STEPS.map(step => {
              const Icon = step.icon;
              const isActive = currentStep >= step.id;
              return (
                <div key={step.id} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <Icon size={14} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-8 pb-32">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 p-4 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          {currentStep > 1 && (
            <button 
              onClick={handleBack}
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft size={18} />
              Voltar
            </button>
          )}
          <button 
            onClick={handleNext}
            disabled={isSaving || (currentStep === 1 && (!profile.name || !profile.shopName))}
            className="flex-[2] h-12 bg-blue-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {currentStep === 3 ? 'Finalizar' : 'Próximo'}
                {currentStep < 3 && <ChevronRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
