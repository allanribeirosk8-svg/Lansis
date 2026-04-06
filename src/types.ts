import React from 'react';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  clientName: string;
  phone: string;
  service: string;
  price: number;
  duration: number;
  status: 'pending' | 'completed' | 'no-show';
  createdAt: number;
  observation?: string;
}

export interface Customer {
  phone: string;
  name: string;
  cutCount: number;
  noShowCount?: number;
  history: {
    date: string;
    time: string;
    service: string;
    price: number;
  }[];
  photos: {
    url: string;
    description: string;
    date: string;
  }[];
  avatar?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface DayConfig {
  start: string;
  end: string;
  breaks: string[]; // Array of times like ["12:00", "13:00"]
  isOpen: boolean;
}

export interface BarberProfile {
  name: string;
  personalPhone: string;
  photo: string;
  shopName: string;
  businessPhone: string;
  address: string;
  logo: string;
  description: string;
  instagram: string;
  website: string;
}

export interface AppState {
  appointments: Appointment[];
  customers: Record<string, Customer>;
  blockedSlots: Record<string, string[]>;
  unblockedSlots: Record<string, string[]>;
  weeklySchedule: Record<number, DayConfig>;
  services: ServiceItem[];
  barberProfile: BarberProfile;
  isDarkMode: boolean;
  isLoading: boolean;
  addAppointment: (apt: Appointment, isExceptional?: boolean) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  finishAppointment: (id: string) => Promise<void>;
  markNoShow: (id: string) => Promise<void>;
  revertAppointment: (id: string) => Promise<void>;
  updateCustomerPhoto: (phone: string, base64Photo: string, description?: string) => Promise<void>;
  updateCustomerAvatar: (phone: string, base64Photo: string) => Promise<void>;
  updateCustomer: (phone: string, updates: Partial<Customer>) => Promise<void>;
  toggleSlotAvailability: (date: string, time: string) => Promise<void>;
  toggleSlotUnblock: (date: string, time: string) => Promise<void>;
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  setBarberProfile: React.Dispatch<React.SetStateAction<BarberProfile>>;
  setWeeklySchedule: React.Dispatch<React.SetStateAction<Record<number, DayConfig>>>;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  fetchAppointmentsByDate: (date: string) => Promise<void>;
  toggleDarkMode: () => void;
}
