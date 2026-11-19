import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import {
  AppointmentPayload,
  AppointmentResponse,
  ApiFieldErrors,
  PET_SPECIES_OPTIONS,
  PetSpecies,
  TIME_SLOT_OPTIONS,
  TimeSlot,
  VISIT_REASON_OPTIONS,
  VisitReason,
  labelFor,
} from '../../core/models/clinic.models';
import { CatalogStore } from '../../core/services/catalog.store';
import { ClinicApiService, describeApiError } from '../../core/services/clinic-api.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DurationPipe, EurPipe } from '../../shared/pipes/format.pipes';
import { PHONE_PATTERN, controlError, toIsoDate } from '../../shared/utils/form-utils';

type StepKey = 'pet' | 'visit' | 'term' | 'contact';

interface Step {
  key: StepKey;
  title: string;
  short: string;
}

const STEP_FIELDS: Record<StepKey, string[]> = {
  pet: ['pet_species', 'pet_name', 'pet_age'],
  visit: ['visit_reason', 'service', 'preferred_vet', 'department'],
  term: ['preferred_date', 'preferred_time_slot'],
  contact: ['owner_name', 'phone', 'email', 'notes', 'gdpr_consent'],
};

const DEPARTMENT_REASON: Record<string, VisitReason> = {
  'preventivna-medicina-a-ockovanie': 'prevencia',
  'chirurgia-a-ortopedia': 'chirurgia',
  stomatologia: 'stomatologia',
};

const MAX_DAYS_AHEAD = SITE_CONFIG.booking.maxDaysAhead;

function bookingDateValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return { invalidDate: true };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return { pastDate: true };
  const max = new Date(today);
  max.setDate(max.getDate() + MAX_DAYS_AHEAD);
  if (date > max) return { tooFar: true };
  if (date.getDay() === 0) return { sunday: true };
  return null;
}

@Component({
  selector: 'app-booking-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, DatePipe, EurPipe, DurationPipe],
  templateUrl: './booking.page.html',
  styleUrl: './booking.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(ClinicApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly store = inject(CatalogStore);
  protected readonly config = SITE_CONFIG;

  // ---- Query-param pre-selection (bound by the router) ---------------------
  readonly service = input<string | undefined>();
  readonly vet = input<string | undefined>();
  readonly pet = input<string | undefined>();
  readonly reason = input<string | undefined>();

  protected readonly petOptions = PET_SPECIES_OPTIONS;
  protected readonly reasonOptions = VISIT_REASON_OPTIONS;
  protected readonly slotOptions = TIME_SLOT_OPTIONS;

  protected readonly steps: Step[] = [
    { key: 'pet', title: 'Vaše zvieratko', short: 'Zvieratko' },
    { key: 'visit', title: 'Dôvod návštevy a lekár', short: 'Dôvod' },
    { key: 'term', title: 'Preferovaný termín', short: 'Termín' },
    { key: 'contact', title: 'Kontaktné údaje', short: 'Kontakt' },
  ];

  protected readonly form = this.fb.group({
    pet_species: this.fb.control<PetSpecies | ''>('', Validators.required),
    pet_name: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
    pet_age: this.fb.control('', Validators.maxLength(40)),
    visit_reason: this.fb.control<VisitReason | ''>('', Validators.required),
    service: this.fb.control(''),
    preferred_vet: this.fb.control<number | null>(null),
    preferred_date: this.fb.control('', [Validators.required, bookingDateValidator]),
    preferred_time_slot: this.fb.control<TimeSlot | ''>('', Validators.required),
    owner_name: this.fb.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]),
    phone: this.fb.control('', [Validators.required, Validators.pattern(PHONE_PATTERN)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    notes: this.fb.control('', Validators.maxLength(1000)),
    gdpr_consent: this.fb.control(false, Validators.requiredTrue),
  });

  protected readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly stepIndex = signal(0);
  protected readonly currentStep = computed(() => this.steps[this.stepIndex()]);
  protected readonly maxReached = signal(0);
  protected readonly submitting = signal(false);
  protected readonly result = signal<AppointmentResponse | null>(null);
  protected readonly serverMessage = signal<string | null>(null);
  protected readonly serverErrors = signal<ApiFieldErrors>({});

  // ---- Derived view state -----------------------------------------------------
  protected readonly selectedService = computed(() => this.store.serviceBySlug(this.value().service));
  protected readonly selectedVet = computed(() => this.store.vetById(this.value().preferred_vet));

  protected readonly vetsForService = computed(() => {
    const dept = this.selectedService()?.department.id;
    return new Set(
      dept ? this.store.bookableVets().filter((v) => v.departments.some((d) => d.id === dept)).map((v) => v.id) : [],
    );
  });

  protected readonly todayIso = toIsoDate(new Date());
  protected readonly maxIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + MAX_DAYS_AHEAD);
    return toIsoDate(d);
  })();

  /** Next few bookable days for one-tap selection (no Sundays). */
  protected readonly quickDates = (() => {
    const days: { iso: string; date: Date }[] = [];
    const cursor = new Date();
    if (cursor.getHours() >= 15) cursor.setDate(cursor.getDate() + 1);
    while (days.length < 6) {
      if (cursor.getDay() !== 0) days.push({ iso: toIsoDate(cursor), date: new Date(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  })();

  protected readonly requiresFasting = computed(() =>
    /hladov|nekŕmte|nalačno/i.test(this.selectedService()?.preparation_notes ?? ''),
  );

  protected readonly petLabel = computed(() => labelFor(this.petOptions, this.value().pet_species || null));
  protected readonly reasonLabel = computed(() => labelFor(this.reasonOptions, this.value().visit_reason || null));
  protected readonly slotOption = computed(() => this.slotOptions.find((o) => o.value === this.value().preferred_time_slot));

  /** Preparation checklist shown after a successful booking. */
  protected readonly checklist = computed(() => {
    const items: string[] = [];
    const service = this.selectedService();
    if (service?.preparation_notes) items.push(service.preparation_notes);
    const species = this.value().pet_species;
    if (species === 'macka') items.push('Mačku prineste v uzatvárateľnom prepravnom boxe – použite náš oddelený mačací vchod a čakáreň.');
    else if (species === 'pes') items.push('Psa majte na vôdzke, prípadne s náhubkom, ak býva v neznámom prostredí nervózny.');
    else items.push('Drobné zvieratko prineste v uzavretej prepravke s kúskom známeho steliva a krmiva.');
    items.push('Prineste očkovací preukaz alebo pas spoločenského zvieraťa a zoznam liekov, ktoré užíva.');
    items.push('Prídite, prosím, 5 – 10 minút pred dohodnutým časom.');
    if (this.value().visit_reason === 'akutny_stav') {
      items.push('Ak sa stav zhorší ešte pred termínom, neváhajte volať pohotovostnú linku.');
    }
    return items;
  });

  constructor() {
    // Apply query-param pre-selection once the catalogue is available.
    let applied = false;
    effect(() => {
      if (this.store.state() !== 'ready' || applied) return;
      applied = true;
      untracked(() => this.applyPreselection());
    });
  }

  private applyPreselection(): void {
    const patch: Partial<ReturnType<typeof this.form.getRawValue>> = {};

    const petParam = this.pet();
    if (petParam && this.petOptions.some((o) => o.value === petParam)) {
      patch.pet_species = petParam as PetSpecies;
    }

    const service = this.store.serviceBySlug(this.service());
    if (service) {
      patch.service = service.slug;
      patch.visit_reason = DEPARTMENT_REASON[service.department.slug] ?? 'akutny_stav';
    }

    const reasonParam = this.reason();
    if (reasonParam && this.reasonOptions.some((o) => o.value === reasonParam)) {
      patch.visit_reason = reasonParam as VisitReason;
    }

    const vet = this.store.vetBySlug(this.vet());
    if (vet?.accepts_online_booking) patch.preferred_vet = vet.id;

    this.form.patchValue(patch);
  }

  // ---- Template helpers -----------------------------------------------------------
  protected error(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server?.length) return server[0];
    return controlError(this.form.get(field), field);
  }

  protected setControl<K extends keyof typeof this.form.controls>(
    name: K,
    value: (typeof this.form.controls)[K]['value'],
  ): void {
    const control = this.form.controls[name];
    control.setValue(value as never);
    control.markAsTouched();
    this.clearServerError(name);
  }

  protected selectService(event: Event): void {
    const slug = (event.target as HTMLSelectElement).value;
    this.setControl('service', slug);
    const service = this.store.serviceBySlug(slug);
    if (service && !this.form.controls.visit_reason.value) {
      this.setControl('visit_reason', DEPARTMENT_REASON[service.department.slug] ?? 'akutny_stav');
    }
  }

  protected clearServerError(field: string): void {
    if (this.serverErrors()[field]) {
      this.serverErrors.update(({ [field]: _removed, ...rest }) => rest);
    }
  }

  protected goTo(index: number): void {
    if (index <= this.maxReached()) {
      this.stepIndex.set(index);
      this.scrollToTop();
    }
  }

  protected back(): void {
    this.stepIndex.update((i) => Math.max(0, i - 1));
    this.scrollToTop();
  }

  protected next(): void {
    if (!this.validateStep(this.currentStep().key)) return;
    if (this.stepIndex() === this.steps.length - 1) {
      this.submit();
      return;
    }
    this.stepIndex.update((i) => i + 1);
    this.maxReached.update((m) => Math.max(m, this.stepIndex()));
    this.scrollToTop();
  }

  private validateStep(step: StepKey): boolean {
    const fields = STEP_FIELDS[step];
    let valid = true;
    for (const name of fields) {
      const control = this.form.get(name);
      control?.markAsTouched();
      control?.updateValueAndValidity({ emitEvent: false });
      if (control?.invalid) valid = false;
    }
    if (!valid) this.focusFirstInvalid();
    return valid;
  }

  private submit(): void {
    if (this.submitting()) return;
    this.serverMessage.set(null);
    this.serverErrors.set({});
    this.submitting.set(true);

    const raw = this.form.getRawValue();
    const service = this.store.serviceBySlug(raw.service);
    const payload: AppointmentPayload = {
      pet_species: raw.pet_species as PetSpecies,
      pet_name: raw.pet_name.trim(),
      pet_age: raw.pet_age.trim(),
      department: service?.department.id ?? null,
      service: raw.service || null,
      preferred_vet: raw.preferred_vet,
      visit_reason: raw.visit_reason as VisitReason,
      preferred_date: raw.preferred_date,
      preferred_time_slot: raw.preferred_time_slot as TimeSlot,
      owner_name: raw.owner_name.trim(),
      phone: raw.phone.trim(),
      email: raw.email.trim(),
      notes: raw.notes.trim(),
      gdpr_consent: raw.gdpr_consent,
    };

    this.api.createAppointment(payload).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.result.set(response);
        this.scrollToTop();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const { message, fields } = describeApiError(err);
        this.serverMessage.set(message);
        this.serverErrors.set(fields);
        // Jump to the first step that contains a server-side error.
        const stepWithError = this.steps.findIndex((s) => STEP_FIELDS[s.key].some((f) => fields[f]));
        if (stepWithError >= 0 && stepWithError !== this.stepIndex()) {
          this.stepIndex.set(stepWithError);
        }
        this.scrollToTop();
      },
    });
  }

  protected restart(): void {
    this.form.reset();
    this.result.set(null);
    this.stepIndex.set(0);
    this.maxReached.set(0);
    this.scrollToTop();
  }

  private scrollToTop(): void {
    queueMicrotask(() => {
      const el = this.host.nativeElement.querySelector<HTMLElement>('#wizard-top');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private focusFirstInvalid(): void {
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector<HTMLElement>(
        '.wizard__panel .ng-invalid.ng-touched, .wizard__panel [aria-invalid="true"]',
      );
      el?.focus();
    });
  }
}
