export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

export interface Appointment {
  id: string;
  clientName: string;
  phone: string; // Used as unique ID for customer tracking
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: string;
  price: number; // Snapshot of price at booking time
  duration: number; // Total duration in minutes
  observation?: string;
  status: 'pending' | 'completed' | 'no-show';
  createdAt: number;
  isExceptional?: boolean;
}

export interface Customer {
  phone: string;
  name: string;
  cutCount: number;
  noShowCount?: number;
  history: { date: string; time?: string; service: string; price?: number }[];
  photos: { url: string; description?: string; date: string }[];
  avatar?: string; // Base64
}

export interface DayConfig {
  start: string; // "09:00"
  end: string;   // "19:00"
  breaks: string[]; // Array of specific times that are disabled (e.g. ["12:00", "12:30"])
  isOpen: boolean;
}

export interface BarberProfile {
  // Personal
  name: string;
  personalPhone: string;
  photo?: string; // Base64
  
  // Business
  shopName: string;
  businessPhone: string;
  address?: string;
  logo?: string; // Base64
  description?: string;
  instagram?: string;
  website?: string;
}

export interface AppState {
  appointments: Appointment[];
  customers: Record<string, Customer>;
  blockedSlots: Record<string, string[]>; // date -> [times] manually blocked for a specific date
  unblockedSlots: Record<string, string[]>; // date -> [times] manually unblocked for a specific date
  weeklySchedule: Record<number, DayConfig>; // 0-6 (day of week) -> Config
  services: ServiceItem[];
  barberProfile: BarberProfile;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  addAppointment: (apt: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  finishAppointment: (id: string) => void;
  revertAppointment: (id: string) => void;
  markNoShow: (id: string) => void;
  updateCustomerPhoto: (phone: string, base64Photo: string, description?: string) => void;
  updateCustomerAvatar: (phone: string, base64Photo: string) => void;
  updateCustomer: (phone: string, updates: Partial<Customer>) => void;
  deleteAppointment: (id: string) => void;
  toggleSlotAvailability: (date: string, time: string) => void;
  toggleSlotUnblock: (date: string, time: string) => void;
  updateDayConfig: (day: number, config: Partial<DayConfig>) => void;
  toggleWeeklyBreak: (day: number, time: string) => void;
  addService: (service: ServiceItem) => void;
  removeService: (id: string) => void;
  updateService: (service: ServiceItem) => void;
  updateBarberProfile: (profile: BarberProfile) => void;
  addCustomer: (customer: Customer) => void;
  reorderServices: (services: ServiceItem[]) => void;
  skipNextFetch: (date: string) => void;
  fetchAppointmentsByDate: (date: string) => Promise<void>;
}
