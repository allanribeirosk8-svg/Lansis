import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "py-3 px-6 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-soft shadow-indigo-500/30",
    secondary: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};