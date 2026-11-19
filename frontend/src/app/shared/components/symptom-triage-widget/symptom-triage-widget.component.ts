import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../../core/config/site.config';
import { IconComponent } from '../icon/icon.component';
import {
  TRIAGE_PETS,
  TRIAGE_SYMPTOMS,
  TriagePet,
  URGENCY_META,
  resolveGuidance,
} from './triage.data';

/**
 * Interactive helper that gives pet owners calm, structured guidance on how
 * urgently they should seek care. Purely client-side, driven by signals.
 */
@Component({
  selector: 'app-symptom-triage-widget',
  imports: [RouterLink, IconComponent],
  templateUrl: './symptom-triage-widget.component.html',
  styleUrl: './symptom-triage-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymptomTriageWidgetComponent {
  protected readonly config = SITE_CONFIG;
  protected readonly pets = TRIAGE_PETS;
  protected readonly symptoms = TRIAGE_SYMPTOMS;
  protected readonly urgencyMeta = URGENCY_META;

  protected readonly pet = signal<TriagePet>('pes');
  protected readonly symptomId = signal<string | null>(null);

  protected readonly symptom = computed(() => this.symptoms.find((s) => s.id === this.symptomId()) ?? null);

  protected readonly guidance = computed(() => {
    const symptom = this.symptom();
    return symptom ? resolveGuidance(symptom, this.pet()) : null;
  });

  protected readonly petLabel = computed(() => this.pets.find((p) => p.value === this.pet())?.label ?? '');

  /** Query params used to pre-fill the booking wizard. */
  protected readonly bookingParams = computed(() => {
    const g = this.guidance();
    return g ? { pet: this.pet(), reason: g.reason } : {};
  });

  protected selectPet(pet: TriagePet): void {
    this.pet.set(pet);
  }

  protected selectSymptom(id: string): void {
    this.symptomId.set(id);
  }

  protected reset(): void {
    this.symptomId.set(null);
  }
}
