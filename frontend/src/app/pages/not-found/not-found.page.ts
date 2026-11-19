import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container--narrow nf">
        <span class="nf__icon"><app-icon name="paw" [size]="40" /></span>
        <span class="eyebrow">Chyba 404</span>
        <h1 class="h2">Táto stránka sa niekam zatúlala</h1>
        <p class="lead">Adresa mohla byť zmenená alebo zadaná s preklepom. Skúste začať od úvodnej stránky.</p>
        <div class="nf__actions">
          <a routerLink="/" class="btn">Späť na úvod</a>
          <a routerLink="/sluzby" class="btn btn--outline">Služby a cenník</a>
        </div>
        <p class="muted small">
          Potrebujete urgentnú pomoc? Volajte
          <a class="phone" [href]="config.contact.emergencyPhoneHref">{{ config.contact.emergencyPhone }}</a>.
        </p>
      </div>
    </section>
  `,
  styles: `
    .nf {
      display: grid;
      gap: 1.25rem;
      justify-items: center;
      text-align: center;
    }
    .nf__icon {
      display: grid;
      place-items: center;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }
    .nf__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
    }
  `,
})
export class NotFoundPage {
  protected readonly config = SITE_CONFIG;
}
