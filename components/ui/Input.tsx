import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  warning?: boolean;
  errorMessage?: string;
  requiredField?: boolean;
  optionalField?: boolean;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, warning, errorMessage, requiredField, optionalField, icon, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className={`text-[10px] font-bold ml-1 uppercase tracking-widest flex items-center gap-1 ${error || errorMessage ? 'text-red-500' : warning ? 'text-amber-500' : 'text-slate-400 dark:text-[#CCCCCC]'}`}>
        {label}
        {requiredField && <span className="text-red-500 ml-0.5">*</span>}
        {optionalField && <span className="text-slate-400 dark:text-slate-500 lowercase font-normal ml-1">(opcional)</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        <input 
          className={`
            w-full ${icon ? 'pl-11' : 'px-4'} py-2.5 rounded-xl border bg-white dark:bg-[#2A2A2A] text-slate-800 dark:text-[#F0F0F0] placeholder-slate-400 dark:placeholder-slate-500
            transition-colors focus:outline-none focus:ring-2 text-sm
            ${error || errorMessage ? 'border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20' : warning ? 'border-amber-500 focus:ring-amber-100 dark:focus:ring-amber-900/20' : 'border-slate-100 dark:border-[#444444] focus:ring-brand-100 dark:focus:ring-brand-900/20 focus:border-brand-500'}
            ${error || errorMessage ? 'pr-10' : ''}
          `}
          {...props}
        />
        {(error || errorMessage) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertTriangle size={16} />
          </div>
        )}
      </div>
      {errorMessage && (
        <p className="text-xs text-red-500 ml-1 mt-0.5">{errorMessage}</p>
      )}
    </div>
  );
};