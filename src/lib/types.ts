export type AppointmentStatus = "pending" | "confirmed" | "rescheduled" | "canceled" | "completed";
export type AppointmentModality = "presencial" | "online";
export type AppRole = "admin" | "receptionist" | "professional";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  modalities: AppointmentModality[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Professional {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  registration_number: string | null;
  bio: string | null;
  specialties: string[] | null;
  modalities: AppointmentModality[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string | null;
  is_minor: boolean;
  guardian_name: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  code: string;
  client_id: string | null;
  professional_id: string | null;
  service_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  modality: AppointmentModality;
  status: AppointmentStatus;
  reason_for_visit: string | null;
  online_meeting_link: string | null;
  internal_notes: string | null;
  canceled_reason: string | null;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: Client;
  professional?: Professional;
  service?: Service;
}

export interface BookingFormData {
  serviceId: string;
  professionalId: string | null;
  modality: AppointmentModality;
  date: Date | null;
  time: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientBirthDate: string;
  isMinor: boolean;
  guardianName: string;
  reasonForVisit: string;
  acceptTerms: boolean;
}
