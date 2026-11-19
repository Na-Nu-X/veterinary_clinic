import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Department, VeterinaryService } from '../../core/models/clinic.models';
import { CatalogStore } from '../../core/services/catalog.store';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DurationPipe, EurPipe } from '../../shared/pipes/format.pipes';

type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'duration';

interface ServiceGroup {
  department: Department;
  services: VeterinaryService[];
}

/** Lower-case, diacritics-free string for forgiving Slovak search ("cistenie" matches "čistenie"). */
function normalize(value: string): string {
  return value
    .toLocaleLowerCase('sk')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

@Component({
  selector: 'app-services-page',
  imports: [RouterLink, IconComponent, EurPipe, DurationPipe],
  templateUrl: './services.page.html',
  styleUrl: './services.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesPage {
  protected readonly store = inject(CatalogStore);
  private readonly router = inject(Router);

  /** `?oddelenie=<slug>` – bound automatically via withComponentInputBinding. */
  readonly oddelenie = input<string | undefined>();

  protected readonly search = signal('');
  protected readonly sort = signal<SortKey>('recommended');
  protected readonly expanded = signal<ReadonlySet<number>>(new Set());

  protected readonly sortOptions: { value: SortKey; label: string }[] = [
    { value: 'recommended', label: 'Odporúčané poradie' },
    { value: 'price-asc', label: 'Cena: od najnižšej' },
    { value: 'price-desc', label: 'Cena: od najvyššej' },
    { value: 'duration', label: 'Dĺžka vyšetrenia' },
  ];

  protected readonly activeDepartment = computed(() =>
    this.store.departments().find((d) => d.slug === this.oddelenie()) ?? null,
  );

  protected readonly filtered = computed(() => {
    const term = normalize(this.search().trim());
    const dept = this.activeDepartment();
    let list = this.store.services().filter((s) => {
      if (dept && s.department.id !== dept.id) return false;
      if (!term) return true;
      return normalize(`${s.name} ${s.short_description} ${s.department.name}`).includes(term);
    });

    const price = (s: VeterinaryService) => Number.parseFloat(s.price_from);
    switch (this.sort()) {
      case 'price-asc':
        list = [...list].sort((a, b) => price(a) - price(b));
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => price(b) - price(a));
        break;
      case 'duration':
        list = [...list].sort((a, b) => a.duration_minutes - b.duration_minutes);
        break;
    }
    return list;
  });

  protected readonly groups = computed<ServiceGroup[]>(() => {
    const services = this.filtered();
    return this.store
      .departments()
      .map((department) => ({
        department,
        services: services.filter((s) => s.department.id === department.id),
      }))
      .filter((g) => g.services.length > 0);
  });

  protected readonly resultLabel = computed(() => {
    const n = this.filtered().length;
    if (n === 1) return '1 služba';
    if (n >= 2 && n <= 4) return `${n} služby`;
    return `${n} služieb`;
  });

  protected setDepartment(slug: string | null): void {
    this.router.navigate([], {
      queryParams: { oddelenie: slug },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as SortKey);
  }

  protected toggle(id: number): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected clearFilters(): void {
    this.search.set('');
    this.setDepartment(null);
  }
}
