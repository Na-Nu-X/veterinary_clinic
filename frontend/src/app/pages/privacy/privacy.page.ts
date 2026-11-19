import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';

@Component({
  selector: 'app-privacy-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="container">
        <nav class="breadcrumb" aria-label="Omrvinková navigácia">
          <a routerLink="/">Domov</a><span aria-hidden="true">/</span><span>Ochrana osobných údajov</span>
        </nav>
        <h1>Ochrana osobných údajov</h1>
        <p class="lead">
          Informácie o spracúvaní osobných údajov podľa nariadenia (EÚ) 2016/679 (GDPR) a zákona č. 18/2018 Z. z.
        </p>
      </div>
    </header>

    <section class="section section--tight">
      <article class="container--narrow prose">
        <h2 class="h3">Prevádzkovateľ</h2>
        <p>
          {{ config.legal.companyName }}, {{ config.address.street }}, {{ config.address.postalCode }}
          {{ config.address.city }}, IČO: <span class="tabular">{{ config.legal.ico }}</span>.
          {{ config.legal.registry }} Kontakt: <a [href]="'mailto:' + config.contact.email">{{ config.contact.email }}</a>,
          <a [href]="config.contact.phoneHref" class="phone">{{ config.contact.phone }}</a>.
        </p>

        <h2 class="h3">Aké údaje spracúvame a prečo</h2>
        <ul>
          <li>
            <strong>Online objednávka na vyšetrenie</strong> – meno a priezvisko, telefón, e-mail, údaje o zvieratku
            a dôvod návštevy. Účelom je dohodnutie a potvrdenie termínu (čl. 6 ods. 1 písm. b) GDPR).
          </li>
          <li>
            <strong>Žiadosť o recept alebo krmivo</strong> – kontaktné údaje a požadovaný liek či krmivo. Účelom je
            vybavenie vašej žiadosti (čl. 6 ods. 1 písm. b) GDPR).
          </li>
          <li>
            <strong>Zdravotná dokumentácia zvieraťa</strong> – vedieme ju v rozsahu stanovenom veterinárnymi predpismi
            (čl. 6 ods. 1 písm. c) GDPR).
          </li>
        </ul>

        <h2 class="h3">Ako dlho údaje uchovávame</h2>
        <p>
          Údaje z online formulárov uchovávame najviac 12 mesiacov od vybavenia žiadosti, pokiaľ sa nestanú súčasťou
          zdravotnej dokumentácie pacienta, ktorú archivujeme po dobu stanovenú právnymi predpismi.
        </p>

        <h2 class="h3">Vaše práva</h2>
        <p>
          Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť a právo namietať.
          Sťažnosť môžete podať na Úrade na ochranu osobných údajov SR. Svoje práva uplatníte e-mailom na
          <a [href]="'mailto:' + config.contact.email">{{ config.contact.email }}</a>.
        </p>

        <h2 class="h3">Príjemcovia</h2>
        <p>
          Údaje neposkytujeme tretím stranám na marketingové účely. Príjemcami môžu byť len poskytovatelia IT služieb
          (hosting, e-mail), laboratóriá pri odoslaní vzoriek a orgány verejnej moci, ak to vyžaduje zákon.
        </p>
      </article>
    </section>
  `,
  styles: `
    .prose {
      display: grid;
      gap: 1rem;
      color: var(--color-text-muted);

      h2 {
        margin-top: 1.5rem;
        color: var(--color-text);
      }

      ul {
        display: grid;
        gap: 0.75rem;
        padding-left: 1.25rem;
        margin: 0;
      }

      strong {
        color: var(--color-text);
      }
    }
  `,
})
export class PrivacyPage {
  protected readonly config = SITE_CONFIG;
}
