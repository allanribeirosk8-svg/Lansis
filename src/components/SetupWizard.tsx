import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, User, ArrowRight, Check, Scissors } from 'lucide-react';
import { useStore } from '../context/Store';

export const SetupWizard: React.FC = () => {
  const { barberProfile, updateBarberProfile } = useStore();
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState(barberProfile.shopName);
  const [barberName, setBarberName] = useState(barberProfile.name);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      updateBarberProfile({
        ...barberProfile,
        shopName,
        name: barberName
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-4 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Scissors size={32} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 dark:text-white">
            Bem-vindo ao Meu Corte!
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Vamos configurar seu perfil básico para começar.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2].map((i) => (
              <div 
                key={i}
                className={`h-1.5 flex-1 rounded-full mx-1 transition-colors ${
                  i <= step ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                  <Store size={16} /> Nome da Barbearia
                </span>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="Ex: Barbearia do João"
                  autoFocus
                />
              </label>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                  <User size={16} /> Seu Nome Profissional
                </span>
                <input
                  type="text"
                  value={barberName}
                  onChange={(e) => setBarberName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="Ex: João Silva"
                  autoFocus
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleNext}
          disabled={step === 1 ? !shopName : !barberName}
          className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          {step === 2 ? 'Concluir' : 'Próximo'}
          {step === 2 ? <Check size={20} /> : <ArrowRight size={20} />}
        </button>
      </motion.div>
    </div>
  );
};
