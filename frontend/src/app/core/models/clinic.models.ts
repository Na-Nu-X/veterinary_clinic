/** API data contracts mirrored from the Django REST serializers. */

export type PetSpecies = 'pes' | 'macka' | 'drobny_cicavec' | 'ine';
export type VisitReason = 'prevencia' | 'akutny_stav' | 'kontrola' | 'chirurgia' | 'stomatologia';
export type TimeSlot = 'rano' | 'obed' | 'popoludnie';
export type PrescriptionType = 'lieky' | 'antiparazitika' | 'dieta';

export interface DepartmentRef {
  id: number;
  name: string;
  slug: string;
  icon_name: string;
}

export interface ServiceSummary {
  id: number;
  name: string;
  slug: string;
  price_from: string;
  duration_minutes: number;
  is_featured: boolean;
}

export interface Department extends DepartmentRef {
  short_summary: string;
  display_order: number;
  services_count: number;
  services: ServiceSummary[];
}

export interface VeterinaryService extends ServiceSummary {
  department: DepartmentRef;
  short_description: string;
  preparation_notes: string;
  image_url: string;
}

export interface VeterinaryServiceDetail extends VeterinaryService {
  detailed_description: string;
}

export interface Veterinarian {
  id: number;
  full_name_with_titles: string;
  slug: string;
  role: string;
  bio: string;
  education_and_certs: string;
  education_list: string[];
  photo_url: string;
  departments: DepartmentRef[];
  accepts_online_booking: boolean;
  display_order: number;
}

export interface AppointmentPayload {
  pet_species: PetSpecies;
  pet_name: string;
  pet_age: string;
  department: number | null;
  service: string | null;
  preferred_vet: number | null;
  visit_reason: VisitReason;
  preferred_date: string;
  preferred_time_slot: TimeSlot;
  owner_name: string;
  phone: string;
  email: string;
  notes: string;
  gdpr_consent: boolean;
}

export interface AppointmentResponse extends Omit<AppointmentPayload, 'gdpr_consent'> {
  id: number;
  status: string;
  created_at: string;
}

export interface PrescriptionPayload {
  pet_name: string;
  pet_species: PetSpecies;
  request_type: PrescriptionType;
  item_details: string;
  owner_name: string;
  phone: string;
  email: string;
  gdpr_consent: boolean;
}

export interface PrescriptionResponse extends Omit<PrescriptionPayload, 'gdpr_consent'> {
  id: number;
  created_at: string;
}

export interface ServiceQuery {
  department?: string;
  featured?: boolean;
  search?: string;
  ordering?: string;
}

/** DRF validation error body: `{ field: ["message", ...], non_field_errors: [...] }`. */
export type ApiFieldErrors = Record<string, string[]>;

// ---- Slovak labels for choice fields ------------------------------------

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon?: string;
}

export const PET_SPECIES_OPTIONS: Option<PetSpecies>[] = [
  { value: 'pes', label: 'Pes', icon: 'dog' },
  { value: 'macka', label: 'Mačka', icon: 'cat' },
  { value: 'drobny_cicavec', label: 'Drobný cicavec', icon: 'rabbit' },
  { value: 'ine', label: 'Iné zviera', icon: 'paw' },
];

export const VISIT_REASON_OPTIONS: Option<VisitReason>[] = [
  { value: 'prevencia', label: 'Preventívna prehliadka a očkovanie', hint: 'Očkovanie, čipovanie, odčervenie', icon: 'syringe' },
  { value: 'akutny_stav', label: 'Zdravotný problém / Vyšetrenie', hint: 'Zvracanie, krívanie, kožné ťažkosti…', icon: 'stethoscope' },
  { value: 'kontrola', label: 'Kontrolné vyšetrenie', hint: 'Kontrola po liečbe alebo zákroku', icon: 'check-circle' },
  { value: 'chirurgia', label: 'Konzultácia pred zákrokom', hint: 'Kastrácia, operácia, ortopédia', icon: 'scalpel' },
  { value: 'stomatologia', label: 'Dentálna hygiena', hint: 'Zubný kameň, zápach z úst', icon: 'tooth' },
];

export const TIME_SLOT_OPTIONS: Option<TimeSlot>[] = [
  { value: 'rano', label: 'Ráno', hint: '08:00 – 11:00', icon: 'sunrise' },
  { value: 'obed', label: 'Obed', hint: '11:00 – 14:00', icon: 'sun' },
  { value: 'popoludnie', label: 'Popoludní', hint: '14:00 – 18:00', icon: 'sunset' },
];

export const PRESCRIPTION_TYPE_OPTIONS: Option<PrescriptionType>[] = [
  { value: 'lieky', label: 'Opakovaný recept na lieky', icon: 'pill' },
  { value: 'antiparazitika', label: 'Antiparazitiká', icon: 'shield-check' },
  { value: 'dieta', label: 'Veterinárna diéta / Krmivo', icon: 'bowl' },
];

export function labelFor<T extends string>(options: Option<T>[], value: T | null | undefined): string {
  return options.find((o) => o.value === value)?.label ?? '';
}
