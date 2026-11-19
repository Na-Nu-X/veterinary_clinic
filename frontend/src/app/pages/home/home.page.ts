import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { CatalogStore } from '../../core/services/catalog.store';
import { getOpeningStatus } from '../../core/utils/opening-hours';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ServiceCardComponent } from '../../shared/components/service-card/service-card.component';
import { SymptomTriageWidgetComponent } from '../../shared/components/symptom-triage-widget/symptom-triage-widget.component';
import { DurationPipe, EurPipe } from '../../shared/pipes/format.pipes';

interface Standard {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, IconComponent, ServiceCardComponent, SymptomTriageWidgetComponent, EurPipe, DurationPipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly store = inject(CatalogStore);
  protected readonly config = SITE_CONFIG;
  protected readonly status = getOpeningStatus(SITE_CONFIG.openingHours);

  protected readonly heroImage =
    'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1100&q=80';
  protected readonly standardsImage =
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1000&q=80';

  protected readonly standards: Standard[] = [
    {
      icon: 'flask',
      title: 'Vlastné laboratórium – výsledky do 15 minút',
      text: 'Hematologický a biochemický analyzátor priamo na klinike. Diagnózu a liečbu nastavíme počas jednej návštevy.',
    },
    {
      icon: 'scan',
      title: 'Digitálny RTG a farebný doppler USG',
      text: 'Ostré snímky v priebehu sekúnd a ultrazvuk s dopplerom pre presnú diagnostiku srdca aj brušných orgánov.',
    },
    {
      icon: 'wind',
      title: 'Bezpečná inhalačná anestézia',
      text: 'Každý zákrok s kontinuálnym monitoringom EKG, saturácie a tlaku. Rýchle a pokojné prebúdzanie.',
    },
    {
      icon: 'cat',
      title: 'Oddelená čakáreň pre mačky',
      text: 'Tichý priestor bez psov, feromónové difúzory a „Cat Friendly“ prístup – menej stresu pre mačky aj pre vás.',
    },
  ];

  /** Interactive department explorer. */
  protected readonly selectedSlug = signal<string | null>(null);
  protected readonly selectedDepartment = computed(() => {
    const departments = this.store.departments();
    const slug = this.selectedSlug();
    return departments.find((d) => d.slug === slug) ?? departments[0] ?? null;
  });

  protected readonly featured = computed(() => this.store.featuredServices().slice(0, 3));
  protected readonly vets = computed(() => this.store.veterinarians().slice(0, 4));

  protected readonly stars = [1, 2, 3, 4, 5];

  protected selectDepartment(slug: string): void {
    this.selectedSlug.set(slug);
  }
}
