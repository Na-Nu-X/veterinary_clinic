# Veterinárna klinika – white-label clinic website

Full-stack website for a modern veterinary clinic and animal hospital: service
catalogue with pricing, doctor profiles, a symptom triage helper, a 4-step
online appointment wizard and repeat-prescription / diet requests, backed by a
Slovak-language Django admin for the reception team.

All code and docs are in English; all user-facing copy is in Slovak.

| Part | Stack |
| --- | --- |
| `backend/` | Python 3, Django, Django REST Framework, django-filter, django-cors-headers, Pillow |
| `frontend/` | Angular (standalone components, Signals, strict TypeScript), pure modular SCSS |

---

## Quick start

### 1. Backend (http://localhost:8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # optional – defaults work for local dev
python manage.py migrate
python manage.py seed_data         # 6 departments, 15 services, 4 veterinarians (idempotent)
python manage.py createsuperuser   # account for /admin
python manage.py runserver
```

### 2. Frontend (http://localhost:4200)

```bash
cd frontend
npm install
npm start                          # = ng serve
```

The dev build calls the API at `http://localhost:8000/api`
(`frontend/src/environments/environment.ts`).

> `frontend/.npmrc` sets `legacy-peer-deps=true` to work around an npm 10.9
> resolver crash (`Cannot read properties of null (reading 'edgesOut')`)
> triggered by vitest's optional peer dependencies.

### 3. Admin panel

Open http://localhost:8000/admin and sign in with the superuser created above.
Receptionists and veterinarians can manage:

- **Online objednávky na vyšetrenie** – incoming bookings with status
  (`Nová → Potvrdená → Dokončená / Zrušená`), inline status editing, bulk
  actions, filters by date, doctor, species and reason.
- **Žiadosti o recepty a krmivá** – repeat prescription / diet requests with a
  "Vybavené" flag and bulk action.
- **Oddelenia**, **Veterinárne služby a cenník**, **Veterinárni lekári** –
  catalogue content, prices, durations, preparation notes, photos, ordering.

---

## REST API

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/departments/` | Departments with `services_count` and nested service summaries |
| GET | `/api/services/` | Filters: `department` (id or slug), `featured`, `max_price`, `search`, `ordering` (`price_from`, `duration_minutes`, `name`) |
| GET | `/api/services/<slug>/` | Full detail incl. `detailed_description`, `preparation_notes`, department |
| GET | `/api/veterinarians/` | Doctors with departments and `education_list` |
| POST | `/api/appointments/` | Online booking (validated: phone, e-mail, date not in past / ≤ 6 months / not Sunday, GDPR consent, service ↔ department consistency) |
| POST | `/api/prescriptions/` | Repeat prescription / antiparasitics / diet request |

POST endpoints are write-only and throttled (`API_SUBMISSION_THROTTLE`,
default 20/hour per IP). Validation messages are returned in Slovak.

Example:

```bash
curl "http://localhost:8000/api/services/?department=stomatologia&ordering=price_from"
```

---

## Frontend overview

| Route | Page |
| --- | --- |
| `/` | Home – hero, trust metrics, department explorer, clinic standards, symptom triage widget, featured services, team, reviews |
| `/sluzby` | Services & pricing – search, department filter (`?oddelenie=<slug>`), sorting, expandable preparation notes |
| `/sluzby/:slug` | Service detail – patient guide, preparation, FAQ, related services |
| `/nas-tim` | Doctor profiles with "Objednať k lekárovi" |
| `/objednat-sa` | 4-step booking wizard; pre-selection via `?service=<slug>`, `?vet=<slug>`, `?pet=<species>`, `?reason=<reason>` |
| `/pohotovost-a-kontakt` | Emergency guide (`#pohotovost`), contact, map & hours (`#kontakt`), prescription form (`#recepty`) |
| `/ochrana-osobnych-udajov` | GDPR information |

Structure:

```
frontend/src/
├── styles/                 _variables, _mixins, _typography, _base, _buttons, _forms
├── styles.scss             composes the design system + emits :root CSS custom properties
└── app/
    ├── core/
    │   ├── config/site.config.ts   ← white-label configuration
    │   ├── models/                 API contracts + Slovak option labels
    │   ├── services/               API client, signal-based CatalogStore, title strategy
    │   └── utils/                  opening-hours helper
    ├── shared/                     navbar, footer, logo, icon, service card, triage widget, pipes
    └── pages/                      lazy-loaded route components
```

### Rebranding for a new clinic

1. **`frontend/src/app/core/config/site.config.ts`** – clinic name & wordmark,
   tagline, phone / emergency phone / e-mail, address, map, parking & public
   transport, IČO / DIČ / registry, KVLsR note, opening hours, social links,
   trust metrics, reviews.
2. **`frontend/src/styles/_variables.scss`** – brand colours, fonts, radii
   (emitted as CSS custom properties on `:root`).
3. **`frontend/src/index.html`** + **`frontend/public/favicon.svg`** – default
   `<title>`, meta description, theme colour, favicon.
4. Clinic content (departments, services, prices, doctors) – via `/admin`, or
   adapt `backend/clinic/management/commands/seed_data.py`.

---

## Production notes

- Set `DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`
  and `DATABASE_URL=postgres://…` (install a driver, e.g. `pip install "psycopg[binary]"`).
- Set `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` to the public frontend origin.
- `python manage.py collectstatic` and serve `backend/staticfiles/` (admin assets).
- `ng build` outputs to `frontend/dist/frontend/browser`; serve it with SPA
  fallback to `index.html`. The production build calls the API at the same
  origin (`/api`, see `environment.production.ts`) – proxy `/api` and `/admin`
  to Django, or change `apiUrl` to an absolute URL.

## Verification

```bash
cd backend && python manage.py check && python manage.py test clinic
cd frontend && npx ng build
```
