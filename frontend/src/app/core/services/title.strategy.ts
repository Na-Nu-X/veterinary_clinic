import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { SITE_CONFIG } from '../config/site.config';

/** Appends the clinic name to every route title and keeps the meta description in sync. */
@Injectable({ providedIn: 'root' })
export class ClinicTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.setTitle(pageTitle);

    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const description = (route.data['description'] as string | undefined) ?? SITE_CONFIG.brand.description;
    this.meta.updateTag({ name: 'description', content: description });
  }

  /** Allows pages with dynamic data (e.g. service detail) to set their own title. */
  setTitle(pageTitle: string | undefined): void {
    const brand = SITE_CONFIG.brand.name;
    this.title.setTitle(pageTitle ? `${pageTitle} | ${brand}` : `${brand} – ${SITE_CONFIG.brand.tagline}`);
  }
}
