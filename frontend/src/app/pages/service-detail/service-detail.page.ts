import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { SITE_CONFIG } from '../../core/config/site.config';
import { VeterinaryServiceDetail } from '../../core/models/clinic.models';
import { CatalogStore } from '../../core/services/catalog.store';
import { ClinicApiService } from '../../core/services/clinic-api.service';
import { ClinicTitleStrategy } from '../../core/services/title.strategy';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ServiceCardComponent } from '../../shared/components/service-card/service-card.component';
import { DurationPipe, EurPipe, ParagraphsPipe } from '../../shared/pipes/format.pipes';

type DetailState =
  | { status: 'loading' }
  | { status: 'ready'; service: VeterinaryServiceDetail }
  | { status: 'not-found' }
  | { status: 'error' };

interface Faq {
  q: string;
  a: string;
}

const eur = new EurPipe();
const duration = new DurationPipe();

@Component({
  selector: 'app-service-detail-page',
  imports: [RouterLink, IconComponent, ServiceCardComponent, EurPipe, DurationPipe, ParagraphsPipe],
  templateUrl: './service-detail.page.html',
  styleUrl: './service-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDetailPage {
  private readonly api = inject(ClinicApiService);
  private readonly titles = inject(ClinicTitleStrategy);
  protected readonly store = inject(CatalogStore);
  protected readonly config = SITE_CONFIG;

  /** Route param `:slug`. */
  readonly slug = input.required<string>();

  private readonly reload = signal(0);

  protected readonly state = toSignal(
    toObservable(computed(() => ({ slug: this.slug(), attempt: this.reload() }))).pipe(
      switchMap(({ slug }) =>
        this.api.getService(slug).pipe(
          map((service): DetailState => ({ status: 'ready', service })),
          catchError((err: unknown) =>
            of<DetailState>(
              err instanceof HttpErrorResponse && err.status === 404 ? { status: 'not-found' } : { status: 'error' },
            ),
          ),
          startWith<DetailState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as DetailState },
  );

  protected readonly service = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.service : null;
  });

  protected readonly vets = computed(() => {
    const service = this.service();
    if (!service) return [];
    return this.store
      .veterinarians()
      .filter((v) => v.departments.some((d) => d.id === service.department.id));
  });

  protected readonly related = computed(() => {
    const service = this.service();
    if (!service) return [];
    return this.store
      .services()
      .filter((s) => s.department.id === service.department.id && s.id !== service.id)
      .slice(0, 3);
  });

  protected readonly requiresFasting = computed(() =>
    /hladov|nekŕmte|nalačno/i.test(this.service()?.preparation_notes ?? ''),
  );

  protected readonly faqs = computed<Faq[]>(() => {
    const s = this.service();
    if (!s) return [];
    return [
      {
        q: 'Koľko vyšetrenie stojí?',
        a:
          `Orientačná cena začína na ${eur.transform(s.price_from)} vrátane DPH. Konečná suma závisí od hmotnosti zvieratka, ` +
          'použitých liekov a prípadných doplňujúcich vyšetrení. Pred každým zákrokom vám lekár vopred oznámi predpokladanú cenu.',
      },
      {
        q: 'Ako dlho návšteva trvá?',
        a:
          `Počítajte približne s ${duration.transform(s.duration_minutes)}. ` +
          'Odporúčame prísť o 5 – 10 minút skôr, aby sa zvieratko stihlo upokojiť a my mohli vybaviť administratívu.',
      },
      {
        q: 'Musí byť zvieratko nalačno?',
        a: this.requiresFasting()
          ? 'Áno. Postupujte, prosím, podľa pokynov v časti „Ako pripraviť zvieratko“. Lačný žalúdok je dôležitý pre bezpečnosť anestézie aj presnosť výsledkov.'
          : 'Spravidla nie. Ak zvieratko užíva lieky alebo má špeciálnu diétu, pokračujte v nich ako zvyčajne, pokiaľ vám lekár neodporučí inak.',
      },
      {
        q: 'Môžem byť pri vyšetrení so svojím miláčikom?',
        a:
          'Áno, pri väčšine vyšetrení ste s ním a vaša prítomnosť ho upokojí. Pri zákrokoch v anestézii počkáte v čakárni ' +
          'alebo vás zavoláme, keď sa zvieratko prebúdza.',
      },
      {
        q: 'Ako môžem zaplatiť?',
        a: 'Platiť môžete v hotovosti, platobnou kartou alebo cez Apple Pay / Google Pay. Faktúru na firmu vystavíme na požiadanie.',
      },
    ];
  });

  protected readonly openFaq = signal<number | null>(0);

  constructor() {
    effect(() => {
      const service = this.service();
      if (service) this.titles.setTitle(service.name);
    });
  }

  protected toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }

  protected retry(): void {
    this.reload.update((n) => n + 1);
  }
}
