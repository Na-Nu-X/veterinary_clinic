import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'sluzby',
    title: 'Služby a orientačný cenník',
    data: { description: 'Prehľad veterinárnych vyšetrení a zákrokov s orientačnými cenami, dĺžkou trvania a pokynmi na prípravu.' },
    loadComponent: () => import('./pages/services/services.page').then((m) => m.ServicesPage),
  },
  {
    path: 'sluzby/:slug',
    title: 'Detail vyšetrenia',
    loadComponent: () => import('./pages/service-detail/service-detail.page').then((m) => m.ServiceDetailPage),
  },
  {
    path: 'nas-tim',
    title: 'Náš tím lekárov',
    data: { description: 'Spoznajte veterinárnych lekárov kliniky – ich špecializácie, vzdelanie a certifikáty.' },
    loadComponent: () => import('./pages/team/team.page').then((m) => m.TeamPage),
  },
  {
    path: 'objednat-sa',
    title: 'Online objednanie na vyšetrenie',
    data: { description: 'Objednajte svojho psa, mačku či drobného cicavca na vyšetrenie online v niekoľkých krokoch.' },
    loadComponent: () => import('./pages/booking/booking.page').then((m) => m.BookingPage),
  },
  {
    path: 'pohotovost-a-kontakt',
    title: 'Pohotovosť, recepty a kontakt',
    data: { description: 'Nonstop pohotovostná linka, kedy vyhľadať okamžitú pomoc, ordinačné hodiny, parkovanie a žiadosť o recept.' },
    loadComponent: () => import('./pages/contact/contact.page').then((m) => m.ContactPage),
  },
  {
    path: 'ochrana-osobnych-udajov',
    title: 'Ochrana osobných údajov',
    loadComponent: () => import('./pages/privacy/privacy.page').then((m) => m.PrivacyPage),
  },
  {
    path: '**',
    title: 'Stránka sa nenašla',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
