import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  requiredField?: boolean;
  optionalField?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, requiredField, optionalField, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className={`text-[10px] font-bold ml-1 uppercase tracking-widest flex items-center gap-1 ${error ? 'text-red-500' : 'text-slate-400 dark:text-[#CCCCCC]'}`}>
        {label}
        {requiredField && <span className="text-red-500 ml-0.5">*</span>}
        {optionalField && <span className="text-slate-400 dark:text-slate-500 lowercase font-normal ml-1">(opcional)</span>}
      </label>
      <div className="relative">
        <input 
          className={`
            w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#2A2A2A] text-slate-800 dark:text-[#F0F0F0] placeholder-slate-400 dark:placeholder-slate-500
            transition-colors focus:outline-none focus:ring-2 text-sm
            ${error ? 'border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20' : 'border-slate-100 dark:border-[#444444] focus:ring-brand-100 dark:focus:ring-brand-900/20 focus:border-brand-500'}
            ${error ? 'pr-10' : ''}
          `}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertTriangle size={16} />
          </div>
        )}
      </div>
    </div>
  );
};