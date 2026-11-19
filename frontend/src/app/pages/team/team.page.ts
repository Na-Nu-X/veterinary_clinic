import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../core/config/site.config';
import { CatalogStore } from '../../core/services/catalog.store';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-team-page',
  imports: [RouterLink, IconComponent],
  templateUrl: './team.page.html',
  styleUrl: './team.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  protected readonly store = inject(CatalogStore);
  protected readonly config = SITE_CONFIG;

  protected readonly supportTeam = [
    {
      title: 'Veterinárni technici',
      text: 'Asistujú pri zákrokoch, sledujú anestéziu, odoberajú krv a starajú sa o hospitalizovaných pacientov.',
      icon: 'activity',
    },
    {
      title: 'Recepcia',
      text: 'Pomôže s objednaním, receptami a krmivom, a vždy vás usmerní, ak si nie ste istí, čo robiť.',
      icon: 'phone',
    },
    {
      title: 'Pohotovostný tím',
      text: 'Lekár a technik v pohotovosti sú k dispozícii nonstop pre akútne stavy, úrazy a otravy.',
      icon: 'siren',
    },
  ];
}
