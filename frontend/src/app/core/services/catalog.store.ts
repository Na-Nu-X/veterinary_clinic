import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Department, Veterinarian, VeterinaryService } from '../models/clinic.models';
import { ClinicApiService } from './clinic-api.service';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Signal-based store for the (small, rarely changing) clinic catalogue:
 * departments, services and veterinarians. Loaded once and shared by all pages.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly api = inject(ClinicApiService);

  private readonly _departments = signal<Department[]>([]);
  private readonly _services = signal<VeterinaryService[]>([]);
  private readonly _veterinarians = signal<Veterinarian[]>([]);
  private readonly _state = signal<LoadState>('idle');

  readonly departments = this._departments.asReadonly();
  readonly services = this._services.asReadonly();
  readonly veterinarians = this._veterinarians.asReadonly();
  readonly state = this._state.asReadonly();

  readonly loading = computed(() => this._state() === 'loading' || this._state() === 'idle');
  readonly error = computed(() => this._state() === 'error');
  readonly featuredServices = computed(() => this._services().filter((s) => s.is_featured));
  readonly bookableVets = computed(() => this._veterinarians().filter((v) => v.accepts_online_booking));

  /** Loads the catalogue unless it is already loaded or in flight. */
  load(force = false): void {
    const state = this._state();
    if (!force && (state === 'loading' || state === 'ready')) return;

    this._state.set('loading');
    forkJoin({
      departments: this.api.getDepartments(),
      services: this.api.getServices(),
      veterinarians: this.api.getVeterinarians(),
    }).subscribe({
      next: ({ departments, services, veterinarians }) => {
        this._departments.set(departments);
        this._services.set(services);
        this._veterinarians.set(veterinarians);
        this._state.set('ready');
      },
      error: () => this._state.set('error'),
    });
  }

  retry(): void {
    this.load(true);
  }

  serviceBySlug(slug: string | null | undefined): VeterinaryService | undefined {
    return slug ? this._services().find((s) => s.slug === slug) : undefined;
  }

  vetById(id: number | null | undefined): Veterinarian | undefined {
    return id == null ? undefined : this._veterinarians().find((v) => v.id === id);
  }

  vetBySlug(slug: string | null | undefined): Veterinarian | undefined {
    return slug ? this._veterinarians().find((v) => v.slug === slug) : undefined;
  }
}
