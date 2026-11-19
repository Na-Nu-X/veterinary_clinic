import { VisitReason } from '../../../core/models/clinic.models';

export type TriagePet = 'pes' | 'macka' | 'drobny_cicavec';
export type UrgencyLevel = 'routine' | 'soon' | 'emergency';

export interface Guidance {
  level: UrgencyLevel;
  summary: string;
  checklist: string[];
  reason: VisitReason;
}

export interface TriageSymptom {
  id: string;
  label: string;
  icon: string;
  guidance: Guidance;
  overrides?: Partial<Record<TriagePet, Partial<Guidance>>>;
}

export const TRIAGE_PETS: { value: TriagePet; label: string; icon: string }[] = [
  { value: 'pes', label: 'Pes', icon: 'dog' },
  { value: 'macka', label: 'Mačka', icon: 'cat' },
  { value: 'drobny_cicavec', label: 'Drobný cicavec', icon: 'rabbit' },
];

export const URGENCY_META: Record<UrgencyLevel, { label: string; icon: string }> = {
  routine: { label: 'Bežný termín', icon: 'calendar' },
  soon: { label: 'Odporúčame vyšetrenie do 24h', icon: 'clock' },
  emergency: { label: 'Akútna pohotovosť – volajte ihneď', icon: 'siren' },
};

export const TRIAGE_SYMPTOMS: TriageSymptom[] = [
  {
    id: 'prevencia',
    label: 'Preventívne očkovanie / čipovanie',
    icon: 'syringe',
    guidance: {
      level: 'routine',
      reason: 'prevencia',
      summary:
        'Pokojne si vyberte termín, ktorý vám vyhovuje. Preventívnu prehliadku odporúčame aspoň raz ročne, u seniorov každých 6 mesiacov.',
      checklist: [
        'Prineste očkovací preukaz alebo pas spoločenského zvieraťa.',
        'Zvieratko môžete normálne nakŕmiť.',
        'Psa majte na vôdzke, mačku v uzatvárateľnom prepravnom boxe.',
        'Zapíšte si otázky ohľadom výživy, odčervenia či ochrany proti kliešťom.',
      ],
    },
    overrides: {
      drobny_cicavec: {
        summary:
          'Králiky očkujeme proti myxomatóze a moru králikov (RHD). Pri prehliadke skontrolujeme aj zúbky, ktoré drobným cicavcom rastú celý život.',
        checklist: [
          'Prineste zvieratko v uzavretej prepravke so stelivom.',
          'Pribaľte trochu sena alebo obľúbeného krmiva – nehladujte ho.',
          'Ak máte, prineste očkovací preukaz.',
        ],
      },
    },
  },
  {
    id: 'travenie',
    label: 'Tráviace ťažkosti / zvracanie',
    icon: 'activity',
    guidance: {
      level: 'soon',
      reason: 'akutny_stav',
      summary:
        'Jednorazové zvracanie pri inak čulom zvieratku môže počkať do nasledujúceho dňa. Ak sa zvracanie opakuje, je v ňom krv, alebo je zvieratko apatické a odmieta piť, volajte pohotovosť.',
      checklist: [
        'Na 6 – 12 hodín vynechajte jedlo, vodu podávajte po malých dávkach.',
        'Zapíšte si, koľkokrát a kedy zvieratko zvracalo či malo hnačku.',
        'Odfoťte alebo prineste vzorku zvratkov či stolice.',
        'Zistite, či nemohlo zjesť niečo nevhodné (kosť, hračku, jed, lieky).',
      ],
    },
    overrides: {
      drobny_cicavec: {
        level: 'emergency',
        summary:
          'U králikov a morčiat je nechutenstvo či zastavenie trávenia vždy akútny stav – tráviaci trakt sa môže zastaviť v priebehu niekoľkých hodín. Volajte nám, prosím, ihneď.',
        checklist: [
          'Zvieratko udržujte v teple a pokoji.',
          'Nepodávajte žiadne lieky bez porady s lekárom.',
          'Všimnite si, kedy naposledy žralo a kedy malo bobky.',
          'Prineste vzorku krmiva, ktoré bežne dostáva.',
        ],
      },
    },
  },
  {
    id: 'krivanie',
    label: 'Krívanie alebo bolesť',
    icon: 'bone',
    guidance: {
      level: 'soon',
      reason: 'akutny_stav',
      summary:
        'Ak zvieratko na končatinu čiastočne došľapuje, odporúčame vyšetrenie do 24 hodín. Pri zjavnej zlomenine, otvorenej rane alebo ak vôbec nedokáže vstať, volajte pohotovosť.',
      checklist: [
        'Obmedzte pohyb – len krátke venčenie na vôdzke, žiadne skákanie.',
        'Nepodávajte humánne lieky proti bolesti (ibuprofén či paracetamol sú pre zvieratá jedovaté).',
        'Ak krívanie vidno len občas, natočte ho na video.',
        'Skontrolujte labku – vankúšiky a medzery medzi prstami.',
      ],
    },
  },
  {
    id: 'dychanie',
    label: 'Ťažké dýchanie / úraz / otrava',
    icon: 'siren',
    guidance: {
      level: 'emergency',
      reason: 'akutny_stav',
      summary:
        'Toto je akútny stav, ktorý nesmie čakať. Zavolajte nám ihneď na pohotovostnú linku – počas cesty vás usmerníme a tím sa na váš príchod pripraví.',
      checklist: [
        'Zachovajte pokoj a zvieratko čo najmenej presúvajte.',
        'Pri otrave prineste obal od látky, ktorú zvieratko zjedlo.',
        'Nevyvolávajte zvracanie bez pokynu lekára.',
        'Zranené zvieratko prenášajte na deke alebo v boxe, krvácajúcu ranu jemne pritlačte čistou látkou.',
      ],
    },
  },
  {
    id: 'mocenie',
    label: 'Problémy s močením',
    icon: 'thermometer',
    guidance: {
      level: 'soon',
      reason: 'akutny_stav',
      summary:
        'Časté močenie, krv v moči alebo nehody doma treba vyšetriť do 24 hodín. Ak zvieratko tlačí na moč a nič nevychádza, volajte pohotovosť.',
      checklist: [
        'Ak sa dá, zachyťte vzorku moču do čistej nádobky (nie staršiu ako 2 hodiny).',
        'Sledujte, koľko zvieratko pije a ako často močí.',
        'Pred vyšetrením ho nevenčite – plný močový mechúr nám pomôže pri ultrazvuku.',
      ],
    },
    overrides: {
      macka: {
        level: 'emergency',
        summary:
          'U mačiek – najmä kocúrov – môže byť opakované sedenie na toalete bez moču znakom upchatej močovej rúry. Je to život ohrozujúci stav, volajte, prosím, ihneď.',
        checklist: [
          'Sledujte, či z mačky vychádza aspoň malé množstvo moču.',
          'Neodkladajte návštevu na ráno – stav sa môže rýchlo zhoršiť.',
          'Mačku prepravujte v uzatvárateľnom boxe na mäkkej deke.',
        ],
      },
    },
  },
  {
    id: 'koza',
    label: 'Svrbenie, koža alebo uši',
    icon: 'skin',
    guidance: {
      level: 'routine',
      reason: 'akutny_stav',
      summary:
        'Kožné ťažkosti zvyčajne nie sú akútne, no neliečené svrbenie zvieratko veľmi trápi. Objednajte sa na najbližší vhodný termín.',
      checklist: [
        '3 dni pred vyšetrením zvieratko nekúpte a nečistite mu uši.',
        'Spíšte zoznam krmív, maškŕt a antiparazitík, ktoré používate.',
        'Odfoťte kožné zmeny, ak sa v priebehu dňa menia.',
      ],
    },
  },
  {
    id: 'zuby',
    label: 'Zápach z úst / zubný kameň',
    icon: 'tooth',
    guidance: {
      level: 'routine',
      reason: 'stomatologia',
      summary:
        'Najskôr zuby skontrolujeme pri bežnej prehliadke a podľa nálezu naplánujeme dentálnu hygienu v krátkej anestézii.',
      checklist: [
        'Na úvodnú kontrolu netreba hladovať.',
        'Všimnite si, či zvieratko nežuje len na jednej strane alebo nevypadáva mu potrava.',
        'Ak už máte termín čistenia, dodržte 12-hodinovú hladovku.',
      ],
    },
    overrides: {
      drobny_cicavec: {
        level: 'soon',
        reason: 'akutny_stav',
        summary:
          'Drobným cicavcom rastú zuby celý život a prerastené zuby im môžu znemožniť príjem potravy. Odporúčame vyšetrenie do 24 hodín.',
      },
    },
  },
];

export function resolveGuidance(symptom: TriageSymptom, pet: TriagePet): Guidance {
  return { ...symptom.guidance, ...(symptom.overrides?.[pet] ?? {}) };
}
