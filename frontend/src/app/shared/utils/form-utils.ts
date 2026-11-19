import { AbstractControl } from '@angular/forms';

/** Slovak / international phone number: digits, spaces, +, /, -, parentheses; 9–20 chars. */
export const PHONE_PATTERN = /^\+?[0-9 ()/-]{9,20}$/;

/** Field-specific overrides for the generic "required" message. */
const REQUIRED_MESSAGES: Record<string, string> = {
  pet_species: 'Vyberte, prosím, druh zvieratka.',
  pet_name: 'Napíšte, prosím, meno zvieratka.',
  visit_reason: 'Vyberte, prosím, dôvod návštevy.',
  preferred_date: 'Vyberte, prosím, dátum návštevy.',
  preferred_time_slot: 'Vyberte, prosím, časť dňa.',
  owner_name: 'Napíšte, prosím, vaše meno a priezvisko.',
  phone: 'Zadajte, prosím, telefónne číslo.',
  email: 'Zadajte, prosím, e-mailovú adresu.',
  request_type: 'Vyberte, prosím, typ žiadosti.',
  item_details: 'Uveďte názov lieku alebo krmiva a požadované množstvo.',
};

/** Returns a friendly Slovak validation message for a touched, invalid control. */
export function controlError(control: AbstractControl | null, field: string): string | null {
  if (!control || !control.touched || !control.errors) return null;
  const e = control.errors;

  if (e['required']) {
    if (field === 'gdpr_consent') return 'Na odoslanie potrebujeme váš súhlas so spracovaním osobných údajov.';
    return REQUIRED_MESSAGES[field] ?? 'Toto pole je povinné.';
  }
  if (e['minlength']) return `Zadajte aspoň ${e['minlength'].requiredLength} znaky.`;
  if (e['maxlength']) return `Text je príliš dlhý (najviac ${e['maxlength'].requiredLength} znakov).`;
  if (e['email']) return 'Zadajte platnú e-mailovú adresu, napr. meno@domena.sk.';
  if (e['pattern'] && field === 'phone') return 'Zadajte platné telefónne číslo, napr. +421 900 123 456.';
  if (e['pastDate']) return 'Termín nemôže byť v minulosti.';
  if (e['tooFar']) return 'Online sa dá objednať najviac 6 mesiacov vopred.';
  if (e['sunday']) return 'V nedeľu ordinujeme len v režime pohotovosti. Vyberte, prosím, iný deň.';
  if (e['invalidDate']) return 'Zadajte platný dátum.';
  return 'Skontrolujte, prosím, zadaný údaj.';
}

/** Local calendar date as "YYYY-MM-DD" (no timezone shift). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
