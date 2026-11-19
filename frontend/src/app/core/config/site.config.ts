/**
 * White-label configuration.
 *
 * Every clinic-specific detail (branding, contacts, legal info, opening hours,
 * trust metrics, reviews) lives here so the site can be rebranded for a new
 * client by editing this single file and – optionally – the colour tokens in
 * `src/styles/_variables.scss`.
 */

export interface OpeningHoursRow {
  /** Human readable day range, e.g. "Pondelok – Piatok". */
  days: string;
  /** e.g. "08:00 – 19:00" or a note such as "Len pohotovosť". */
  hours: string;
  /** ISO weekday numbers (1 = Monday … 7 = Sunday) this row applies to. */
  weekdays: number[];
  /** Opening/closing time in 24h "HH:MM" for the "open now" indicator. */
  opens?: string;
  closes?: string;
}

export interface TrustMetric {
  value: string;
  label: string;
}

export interface Review {
  author: string;
  pet: string;
  text: string;
  rating: number;
  source: string;
}

export interface SocialLink {
  label: string;
  url: string;
  icon: 'facebook' | 'instagram';
}

export interface SiteConfig {
  brand: {
    name: string;
    wordmark: string;
    wordmarkSuffix: string;
    tagline: string;
    description: string;
  };
  contact: {
    phone: string;
    phoneHref: string;
    emergencyPhone: string;
    emergencyPhoneHref: string;
    email: string;
    emergencyNote: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    mapUrl: string;
    mapEmbedUrl: string;
    parking: string;
    publicTransport: string;
  };
  legal: {
    companyName: string;
    ico: string;
    dic: string;
    icDph?: string;
    registry: string;
    chamberNote: string;
  };
  openingHours: OpeningHoursRow[];
  social: SocialLink[];
  trustMetrics: TrustMetric[];
  reviews: Review[];
  booking: {
    /** How quickly reception confirms an online booking. */
    confirmationNote: string;
    maxDaysAhead: number;
  };
}

export const SITE_CONFIG: SiteConfig = {
  brand: {
    name: 'Veterinárna klinika Harmónia',
    wordmark: 'Harmónia',
    wordmarkSuffix: 'veterinárna klinika',
    tagline: 'Pokojná a odborná starostlivosť pre vašich najbližších.',
    description:
      'Moderná veterinárna klinika a nemocnica pre malé zvieratá v Bratislave – preventívna medicína, ' +
      'interná diagnostika, chirurgia, stomatológia, dermatológia a nonstop pohotovosť.',
  },
  contact: {
    phone: '+421 2 4820 1100',
    phoneHref: 'tel:+421248201100',
    emergencyPhone: '+421 905 112 911',
    emergencyPhoneHref: 'tel:+421905112911',
    email: 'recepcia@klinika-harmonia.sk',
    emergencyNote:
      'Pohotovostná linka je dostupná nonstop. Prosíme, pred príchodom vždy zavolajte, aby sme sa na vás mohli pripraviť.',
  },
  address: {
    street: 'Ružová dolina 14',
    city: 'Bratislava',
    postalCode: '821 09',
    country: 'Slovensko',
    mapUrl: 'https://www.openstreetmap.org/?mlat=48.1446&mlon=17.1316#map=17/48.1446/17.1316',
    mapEmbedUrl:
      'https://www.openstreetmap.org/export/embed.html?bbox=17.1266%2C48.1421%2C17.1366%2C48.1471&layer=mapnik&marker=48.1446%2C17.1316',
    parking:
      'Bezplatné parkovanie pre klientov priamo pred klinikou (6 miest, 1 vyhradené pre pohotovosť). ' +
      'Ďalšie parkovanie v podzemnej garáži OC Ružinov, 3 minúty pešo.',
    publicTransport: 'Električka č. 9 a autobus č. 50, zastávka Ružová dolina.',
  },
  legal: {
    companyName: 'Harmónia Vet, s. r. o.',
    ico: '53 912 487',
    dic: '2121547896',
    registry: 'Zapísaná v Obchodnom registri Mestského súdu Bratislava III, oddiel Sro, vložka č. 154820/B.',
    chamberNote:
      'Všetci naši lekári sú členmi Komory veterinárnych lekárov Slovenskej republiky (KVLsR) ' +
      'a veterinárnu činnosť vykonávame na základe osvedčenia KVLsR.',
  },
  openingHours: [
    { days: 'Pondelok – Piatok', hours: '08:00 – 19:00', weekdays: [1, 2, 3, 4, 5], opens: '08:00', closes: '19:00' },
    { days: 'Sobota', hours: '09:00 – 13:00', weekdays: [6], opens: '09:00', closes: '13:00' },
    { days: 'Nedeľa a sviatky', hours: 'Len pohotovosť', weekdays: [7] },
  ],
  social: [
    { label: 'Facebook', url: 'https://www.facebook.com/', icon: 'facebook' },
    { label: 'Instagram', url: 'https://www.instagram.com/', icon: 'instagram' },
  ],
  trustMetrics: [
    { value: '15+', label: 'rokov skúseností' },
    { value: '12 400', label: 'spokojných pacientov' },
    { value: '4,9 / 5', label: 'hodnotenie majiteľov' },
    { value: '24/7', label: 'pohotovostná linka' },
  ],
  reviews: [
    {
      author: 'Lucia M.',
      pet: 'fenka Bella, zlatý retríver',
      text:
        'Bella mala v noci ťažkosti s dýchaním. Na pohotovostnej linke nás pokojne usmernili a na klinike už na nás čakali. ' +
        'Doktor nám všetko vysvetlil a ráno sme ju mohli zobrať domov. Ďakujeme za ľudský prístup.',
      rating: 5,
      source: 'Google recenzie',
    },
    {
      author: 'Marek a Zuzana K.',
      pet: 'kocúr Oskar',
      text:
        'Oskar z ciest k veterinárovi vždy panikáril. Oddelená mačacia čakáreň a trpezlivá MVDr. Bieliková sú pre nás zázrak – ' +
        'prvýkrát odchádzal pokojný.',
      rating: 5,
      source: 'Google recenzie',
    },
    {
      author: 'Peter H.',
      pet: 'pes Brix, border kólia',
      text:
        'Výsledky krvi sme mali za štvrť hodinu a liečbu nastavenú v ten istý deň. Online objednanie funguje skvele, ' +
        'potvrdenie prišlo ešte v to dopoludnie.',
      rating: 5,
      source: 'Overená recenzia na webe',
    },
  ],
  booking: {
    confirmationNote: 'Termín vám potvrdíme telefonicky alebo e-mailom spravidla do 2 hodín v otváracích hodinách.',
    maxDaysAhead: 180,
  },
};
