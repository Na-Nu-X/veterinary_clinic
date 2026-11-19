import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import {
  ApiFieldErrors,
  PET_SPECIES_OPTIONS,
  PRESCRIPTION_TYPE_OPTIONS,
  PetSpecies,
  PrescriptionResponse,
  PrescriptionType,
  labelFor,
} from '../../core/models/clinic.models';
import { ClinicApiService, describeApiError } from '../../core/services/clinic-api.service';
import { getOpeningStatus } from '../../core/utils/opening-hours';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PHONE_PATTERN, controlError } from '../../shared/utils/form-utils';

@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './contact.page.html',
  styleUrl: './contact.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(ClinicApiService);

  protected readonly config = SITE_CONFIG;
  protected readonly status = getOpeningStatus(SITE_CONFIG.openingHours);
  protected readonly mapUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(SITE_CONFIG.address.mapEmbedUrl);

  protected readonly redFlags = [
    { icon: 'wind', title: 'Ťažké alebo namáhavé dýchanie', text: 'Dýchanie s otvorenou papuľou (u mačiek vždy), modré sliznice, dusenie.' },
    { icon: 'alert-triangle', title: 'Úraz, pád alebo zrazenie autom', text: 'Aj keď zvieratko pôsobí v poriadku – vnútorné zranenia sa prejavia neskôr.' },
    { icon: 'flask', title: 'Podozrenie na otravu', text: 'Jed na potkany, čokoláda, xylitol, hrozienka, lieky pre ľudí, nemrznúca zmes.' },
    { icon: 'activity', title: 'Nafúknuté brucho a neúspešné zvracanie', text: 'U veľkých psov môže ísť o otočenie žalúdka – rozhodujú minúty.' },
    { icon: 'thermometer', title: 'Kŕče, kolaps alebo bezvedomie', text: 'Aj krátky záchvat, náhla slabosť alebo neschopnosť vstať.' },
    { icon: 'heart', title: 'Silné krvácanie, ťažký pôrod', text: 'Krvácanie, ktoré neustane po 5 minútach tlaku, alebo pôrod bez pokroku viac ako 1 hodinu.' },
  ];

  protected readonly emergencySteps = [
    { title: 'Zavolajte nám', text: 'Pohotovostný lekár vás usmerní ešte počas cesty a tím sa na váš príchod pripraví.' },
    { title: 'Zachovajte pokoj', text: 'Hovorte na zvieratko tichým hlasom. Zranené zviera môže z bolesti hryznúť – buďte opatrní.' },
    { title: 'Prepravte ho bezpečne', text: 'Psa preneste na deke či doske, mačku v boxe. Nepodávajte jedlo, vodu ani lieky.' },
    { title: 'Vezmite so sebou', text: 'Obal od jedu či lieku, očkovací preukaz a zoznam liekov, ktoré zvieratko užíva.' },
  ];

  protected readonly speciesOptions = PET_SPECIES_OPTIONS;
  protected readonly typeOptions = PRESCRIPTION_TYPE_OPTIONS;

  protected readonly form = this.fb.group({
    request_type: this.fb.control<PrescriptionType | ''>('', Validators.required),
    pet_species: this.fb.control<PetSpecies>('pes', Validators.required),
    pet_name: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]),
    item_details: this.fb.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]),
    owner_name: this.fb.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]),
    phone: this.fb.control('', [Validators.required, Validators.pattern(PHONE_PATTERN)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    gdpr_consent: this.fb.control(false, Validators.requiredTrue),
  });

  protected readonly submitting = signal(false);
  protected readonly result = signal<PrescriptionResponse | null>(null);
  protected readonly serverMessage = signal<string | null>(null);
  protected readonly serverErrors = signal<ApiFieldErrors>({});

  protected error(field: string): string | null {
    return this.serverErrors()[field]?.[0] ?? controlError(this.form.get(field), field);
  }

  protected typeLabel(value: PrescriptionType): string {
    return labelFor(this.typeOptions, value);
  }

  protected clearServerError(field: string): void {
    if (this.serverErrors()[field]) {
      this.serverErrors.update(({ [field]: _removed, ...rest }) => rest);
    }
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      setTimeout(() => document.querySelector<HTMLElement>('#recepty .ng-invalid.ng-touched')?.focus());
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    this.serverMessage.set(null);
    this.serverErrors.set({});

    const raw = this.form.getRawValue();
    this.api
      .createPrescriptionRequest({
        ...raw,
        request_type: raw.request_type as PrescriptionType,
        pet_name: raw.pet_name.trim(),
        item_details: raw.item_details.trim(),
        owner_name: raw.owner_name.trim(),
        phone: raw.phone.trim(),
        email: raw.email.trim(),
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.result.set(res);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          const { message, fields } = describeApiError(err);
          this.serverMessage.set(message);
          this.serverErrors.set(fields);
        },
      });
  }

  protected newRequest(): void {
    this.form.reset();
    this.result.set(null);
  }
}
