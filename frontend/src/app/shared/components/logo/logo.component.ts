import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SITE_CONFIG } from '../../../core/config/site.config';

/** Clinic wordmark built from `site.config.ts` – no raster logo needed. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.logo--inverse]': 'inverse()' },
  template: `
    <span class="logo__mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" class="logo__bg" />
        <path
          class="logo__leaf"
          d="M20 31c-5.5-2.6-9-7.2-9-12.4 0-3.3 2.4-5.6 5.3-5.6 1.6 0 2.8.7 3.7 1.8.9-1.1 2.1-1.8 3.7-1.8 2.9 0 5.3 2.3 5.3 5.6C29 23.8 25.5 28.4 20 31Z"
        />
        <path class="logo__cross" d="M20 16.5v8M16 20.5h8" />
      </svg>
    </span>
    <span class="logo__text">
      <span class="logo__name">{{ brand.wordmark }}</span>
      <span class="logo__suffix">{{ brand.wordmarkSuffix }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
      color: var(--color-text);
    }
    .logo__mark {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }
    .logo__bg {
      fill: var(--color-primary);
    }
    .logo__leaf {
      fill: #fff;
    }
    .logo__cross {
      stroke: var(--color-accent);
      stroke-width: 2.6;
      stroke-linecap: round;
    }
    .logo__text {
      display: grid;
      line-height: 1;
    }
    .logo__name {
      font-family: var(--font-serif);
      font-size: 1.375rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .logo__suffix {
      margin-top: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }
    :host(.logo--inverse) {
      color: #fff;
      .logo__bg {
        fill: #fff;
      }
      .logo__leaf {
        fill: var(--color-primary);
      }
      .logo__suffix {
        color: rgb(255 255 255 / 0.7);
      }
    }
  `,
})
export class LogoComponent {
  readonly inverse = input(false);
  protected readonly brand = SITE_CONFIG.brand;
}
