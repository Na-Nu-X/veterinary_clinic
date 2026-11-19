import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VeterinaryService } from '../../../core/models/clinic.models';
import { DurationPipe, EurPipe } from '../../pipes/format.pipes';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-service-card',
  imports: [RouterLink, IconComponent, EurPipe, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-compact]': '!showImage()' },
  template: `
    <article class="card-service">
      @if (showImage() && service().image_url) {
        <a class="card-service__media" [routerLink]="['/sluzby', service().slug]" tabindex="-1" aria-hidden="true">
          <img [src]="service().image_url" [alt]="''" loading="lazy" width="600" height="380" />
        </a>
      }
      <div class="card-service__body">
        <span class="badge">
          <app-icon [name]="service().department.icon_name" [size]="14" [strokeWidth]="2" />
          {{ service().department.name }}
        </span>
        <h3 class="card-service__title">
          <a [routerLink]="['/sluzby', service().slug]">{{ service().name }}</a>
        </h3>
        <p class="card-service__desc">{{ service().short_description }}</p>

        <div class="card-service__meta">
          <span class="badge badge--neutral tabular">
            <app-icon name="clock" [size]="14" [strokeWidth]="2" />
            {{ service().duration_minutes | duration }}
          </span>
          <span class="card-service__price price">
            <small>od</small> {{ service().price_from | eur }}
          </span>
        </div>

        <div class="card-service__actions">
          <a class="link-arrow" [routerLink]="['/sluzby', service().slug]">
            Viac o vyšetrení <app-icon name="arrow-right" [size]="16" />
          </a>
          <a
            class="btn btn--sm btn--outline"
            routerLink="/objednat-sa"
            [queryParams]="{ service: service().slug }"
            [attr.aria-label]="'Objednať: ' + service().name"
          >
            Objednať
          </a>
        </div>
      </div>
    </article>
  `,
  styles: `
    @use 'styles/mixins' as *;

    :host {
      display: block;
      height: 100%;
    }

    .card-service {
      @include card;
      @include card-hover;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .card-service__media {
      display: block;
      aspect-ratio: 16 / 10;
      overflow: hidden;
      background: var(--color-surface-soft);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 600ms var(--ease-out);
      }
    }

    .card-service:hover .card-service__media img {
      transform: scale(1.04);
    }

    .card-service__body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      flex: 1;
      padding: 1.375rem 1.375rem 1.25rem;
    }

    .card-service__title {
      font-size: 1.25rem;

      a {
        color: inherit;
        text-decoration: none;

        &:hover {
          color: var(--color-primary);
        }
      }
    }

    .card-service__desc {
      @include line-clamp(3);
      color: var(--color-text-muted);
      font-size: 0.9375rem;
      line-height: 1.55;
    }

    .card-service__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      width: 100%;
      margin-top: auto;
      padding-top: 0.75rem;
    }

    .card-service__price {
      font-family: var(--font-serif);
      font-size: 1.375rem;
      font-weight: 600;
      color: var(--color-text);

      small {
        font-family: var(--font-sans);
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-text-muted);
      }
    }

    .card-service__actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      width: 100%;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }
  `,
})
export class ServiceCardComponent {
  readonly service = input.required<VeterinaryService>();
  readonly showImage = input(true);
}
