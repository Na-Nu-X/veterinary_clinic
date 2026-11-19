"""Idempotent seed command: `python manage.py seed_data`.

Records are matched by their natural key (name), so running the command
repeatedly updates existing rows instead of creating duplicates.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from clinic.models import Department, Veterinarian, VeterinaryService


def unsplash(photo_id: str, width: int = 1200) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={width}&q=80"


DEPARTMENTS = [
    {
        "name": "Preventívna medicína a očkovanie",
        "slug": "preventivna-medicina-a-ockovanie",
        "icon_name": "syringe",
        "short_summary": "Pravidelné prehliadky, očkovacie programy, čipovanie a odčervenie – najlepšia starostlivosť je tá, ktorá chorobám predchádza.",
    },
    {
        "name": "Interná medicína a diagnostika",
        "slug": "interna-medicina-a-diagnostika",
        "icon_name": "stethoscope",
        "short_summary": "Vlastné laboratórium s výsledkami do 15 minút, farebný dopplerovský ultrazvuk a kardiológia pre presnú diagnózu bez zbytočného čakania.",
    },
    {
        "name": "Chirurgia a ortopédia",
        "slug": "chirurgia-a-ortopedia",
        "icon_name": "scalpel",
        "short_summary": "Mäkkotkanivová chirurgia, ortopedické zákroky a digitálny RTG v bezpečnej inhalačnej anestézii s nepretržitým monitoringom.",
    },
    {
        "name": "Stomatológia",
        "slug": "stomatologia",
        "icon_name": "tooth",
        "short_summary": "Ultrazvukové odstránenie zubného kameňa, dentálny RTG a šetrné extrakcie – zdravé zuby sú základom zdravia celého tela.",
    },
    {
        "name": "Dermatológia a alergológia",
        "slug": "dermatologia-a-alergologia",
        "icon_name": "skin",
        "short_summary": "Diagnostika svrbenia, kožných zápalov, alergií a ušných infekcií vrátane cytológie, alergologických testov a dlhodobých liečebných plánov.",
    },
    {
        "name": "Pohotovosť a intenzívna starostlivosť",
        "slug": "pohotovost-a-intenzivna-starostlivost",
        "icon_name": "siren",
        "short_summary": "Akútne stavy, úrazy a otravy riešime bez objednania. Hospitalizácia s infúznou terapiou a starostlivosťou veterinárneho tímu.",
    },
]


VETERINARIANS = [
    {
        "full_name_with_titles": "MVDr. Katarína Kováčová",
        "slug": "mvdr-katarina-kovacova",
        "role": "Hlavná lekárka – Interná medicína a kardiológia",
        "bio": (
            "Kliniku vedie od jej založenia a za viac ako 15 rokov praxe sa venuje najmä internej medicíne "
            "a kardiológii psov a mačiek. Pacientom aj majiteľom dáva čas – každú diagnózu vysvetlí "
            "zrozumiteľne a spolu s vami nastaví liečbu, ktorá bude fungovať aj v bežnom živote doma."
        ),
        "education_and_certs": (
            "Univerzita veterinárskeho lekárstva a farmácie v Košiciach (UVLF), 2009\n"
            "Certifikát ESVPS GPCert v kardiológii malých zvierat\n"
            "Pravidelná účastníčka kongresov ECVIM-CA\n"
            "Členka Komory veterinárnych lekárov SR"
        ),
        "photo": "1559839734-2b71ea197ec2",
        "departments": ["interna-medicina-a-diagnostika", "preventivna-medicina-a-ockovanie"],
        "accepts_online_booking": True,
    },
    {
        "full_name_with_titles": "MVDr. Martin Hudák",
        "slug": "mvdr-martin-hudak",
        "role": "Chirurgia, ortopédia a anestéziológia",
        "bio": (
            "Špecializuje sa na mäkkotkanivovú chirurgiu, ortopédiu a bezpečnú anestéziu. Vďaka nemu "
            "u nás každý zákrok prebieha v inhalačnej anestézii s kontinuálnym monitoringom vitálnych "
            "funkcií. Majiteľom vždy podrobne vysvetlí priebeh operácie aj domácu starostlivosť po nej."
        ),
        "education_and_certs": (
            "UVLF Košice, 2012\n"
            "Stáž na chirurgickej klinike Vetsuisse, Univerzita v Zürichu\n"
            "Kurz AO VET – Principles in Small Animal Fracture Management\n"
            "Certifikovaný kurz veterinárnej anestéziológie a analgézie"
        ),
        "photo": "1612349317150-e413f6a5b16d",
        "departments": ["chirurgia-a-ortopedia", "pohotovost-a-intenzivna-starostlivost"],
        "accepts_online_booking": True,
    },
    {
        "full_name_with_titles": "MVDr. Zuzana Bieliková",
        "slug": "mvdr-zuzana-bielikova",
        "role": "Dermatológia, alergológia a starostlivosť o mačky",
        "bio": (
            "Venuje sa chronickým kožným ochoreniam, alergiám a ušným zápalom. Je certifikovanou "
            "„Cat Friendly“ lekárkou – vie, ako mačkám čo najviac uľahčiť návštevu kliniky, a preto "
            "u nás nájdete oddelenú mačaciu čakáreň aj ordináciu."
        ),
        "education_and_certs": (
            "UVLF Košice, 2015\n"
            "ESAVS kurz veterinárnej dermatológie (Dermatology I & II)\n"
            "ISFM certifikát Cat Friendly Clinic\n"
            "Členka Slovenskej asociácie veterinárnych lekárov malých zvierat"
        ),
        "photo": "1594824476967-48c8b964273f",
        "departments": ["dermatologia-a-alergologia", "preventivna-medicina-a-ockovanie"],
        "accepts_online_booking": True,
    },
    {
        "full_name_with_titles": "MVDr. Tomáš Novotný",
        "slug": "mvdr-tomas-novotny",
        "role": "Stomatológia a urgentná medicína",
        "bio": (
            "Na klinike vedie stomatológiu – od dentálnej hygieny cez dentálny RTG až po zložité extrakcie. "
            "Zároveň je súčasťou pohotovostného tímu, kde mu pomáha pokoj a rozvaha aj v tých "
            "najnáročnejších situáciách."
        ),
        "education_and_certs": (
            "Veterinární univerzita Brno, 2017\n"
            "Kurz veterinárnej stomatológie a dentálnej rádiológie (EVDS)\n"
            "Certifikát RECOVER – kardiopulmonálna resuscitácia malých zvierat"
        ),
        "photo": "1622902046580-2b47f47f5471",
        "departments": ["stomatologia", "pohotovost-a-intenzivna-starostlivost"],
        "accepts_online_booking": True,
    },
]


FASTING_NOTE = (
    "Pred zákrokom je potrebná 12-hodinová hladovka, voda môže byť podávaná do 2 hodín pred príchodom. "
    "Ráno vyveďte psa na prechádzku, aby sa stihol vyvenčiť. Mačku prineste v uzatvárateľnom prepravnom boxe."
)

SERVICES = [
    # --- Preventívna medicína a očkovanie
    {
        "department": "preventivna-medicina-a-ockovanie",
        "name": "Komplexné klinické vyšetrenie a vakcinácia",
        "slug": "komplexne-klinicke-vysetrenie-a-vakcinacia",
        "short_description": "Celková prehliadka od hlavy po chvost, kontrola srdca, zubov a kože, očkovanie podľa individuálneho plánu.",
        "detailed_description": (
            "Pri preventívnej prehliadke lekár skontroluje celkový stav zvieratka – hmotnosť a kondíciu, "
            "srdce a pľúca fonendoskopom, oči, uši, zuby, lymfatické uzliny, kožu a srsť a prehmatá brušnú dutinu.\n\n"
            "Následne spolu s vami nastavíme očkovací plán podľa veku, životného štýlu a cestovania – u psov "
            "proti psinke, parvoviróze, hepatitíde, leptospiróze a povinne proti besnote, u mačiek proti "
            "panleukopénii, kaliciviróze a herpesviróze. Každé očkovanie zapíšeme do pasu a elektronicky "
            "vám pripomenieme ďalší termín.\n\n"
            "Súčasťou návštevy je aj poradenstvo k výžive, odčerveniu a ochrane proti kliešťom a blchám."
        ),
        "price_from": "35.00",
        "duration_minutes": 30,
        "preparation_notes": (
            "Prineste očkovací preukaz alebo pas spoločenského zvieraťa. Zvieratko by malo byť zdravé – "
            "ak má hnačku, kašle alebo je apatické, dajte nám vedieť, očkovanie presunieme. Kŕmiť môžete normálne."
        ),
        "photo": "1593134257782-e89567b7718a",
        "is_featured": True,
    },
    {
        "department": "preventivna-medicina-a-ockovanie",
        "name": "Čipovanie a vystavenie pasu spoločenského zvieraťa",
        "slug": "cipovanie-a-vystavenie-pasu",
        "short_description": "Rýchla a takmer bezbolestná aplikácia mikročipu vrátane registrácie do Centrálneho registra spoločenských zvierat.",
        "detailed_description": (
            "Mikročip veľkosti zrnka ryže aplikujeme pod kožu na ľavej strane krku. Zákrok trvá niekoľko sekúnd "
            "a väčšina zvierat ho takmer nezaregistruje. Na Slovensku je čipovanie psov povinné.\n\n"
            "Číslo čipu zaregistrujeme do Centrálneho registra spoločenských zvierat (CRSZ) a na požiadanie "
            "vystavíme európsky pas spoločenského zvieraťa, ktorý potrebujete na cestovanie v rámci EÚ."
        ),
        "price_from": "25.00",
        "duration_minutes": 15,
        "preparation_notes": "Prineste občiansky preukaz majiteľa kvôli registrácii a prípadný doterajší očkovací preukaz.",
        "photo": "1576201836106-db1758fd1c97",
        "is_featured": False,
    },
    {
        "department": "preventivna-medicina-a-ockovanie",
        "name": "Preventívna prehliadka králikov a drobných cicavcov",
        "slug": "preventivna-prehliadka-kralikov-a-drobnych-cicavcov",
        "short_description": "Kontrola zubov, hmotnosti a tráviaceho traktu u králikov, morčiat, škrečkov a činčíl, očkovanie králikov.",
        "detailed_description": (
            "Drobné cicavce dlho skrývajú príznaky ochorenia, preto sú pravidelné prehliadky mimoriadne dôležité. "
            "Skontrolujeme rast rezákov aj stoličkových zubov, stav srsti, kože a pazúrikov, hmotnosť a činnosť čriev.\n\n"
            "Králiky očkujeme proti myxomatóze a moru králikov (RHD1 a RHD2). Poradíme vám aj so správnym "
            "zložením stravy a ustajnením."
        ),
        "price_from": "28.00",
        "duration_minutes": 20,
        "preparation_notes": "Zvieratko prineste v uzavretej prepravke so stelivom a kúskom obľúbeného sena či krmiva. Nehladujte ho – drobné cicavce musia prijímať potravu nepretržite.",
        "photo": "1585110396000-c9ffd4e4b308",
        "is_featured": False,
    },
    # --- Interná medicína a diagnostika
    {
        "department": "interna-medicina-a-diagnostika",
        "name": "Ultrazvukové vyšetrenie brušnej dutiny (USG)",
        "slug": "ultrazvukove-vysetrenie-brusnej-dutiny-usg",
        "short_description": "Neinvazívne zobrazenie pečene, obličiek, sleziny, močového mechúra a čriev na prístroji s farebným dopplerom.",
        "detailed_description": (
            "Ultrazvuk je bezbolestné vyšetrenie, ktoré nám umožní pozrieť sa na vnútorné orgány v reálnom čase. "
            "Používame prístroj s farebným dopplerom, vďaka ktorému posúdime aj prekrvenie orgánov.\n\n"
            "USG odporúčame pri vracaní, hnačke, zmenách v pití a močení, chudnutí, nafúknutom bruchu, "
            "ako súčasť preventívnej prehliadky seniorov a pri sledovaní gravidity. Na vyšetrenie je potrebné "
            "oholiť malú plochu srsti na bruchu. Väčšina zvierat ho zvládne bez sedácie.\n\n"
            "Výsledok vám lekár vysvetlí hneď po vyšetrení a obrazovú dokumentáciu dostanete e-mailom."
        ),
        "price_from": "55.00",
        "duration_minutes": 30,
        "preparation_notes": (
            "Zvieratko 8 – 12 hodín pred vyšetrením nekŕmte, voda môže byť k dispozícii. "
            "Ak je to možné, pred príchodom ho nevenčite – plný močový mechúr vyšetrenie uľahčí."
        ),
        "photo": "1628009368231-7bb7cfcb0def",
        "is_featured": True,
    },
    {
        "department": "interna-medicina-a-diagnostika",
        "name": "Hematologické a biochemické vyšetrenie krvi",
        "slug": "hematologicke-a-biochemicke-vysetrenie-krvi",
        "short_description": "Krvný obraz a biochemický profil orgánov z vlastného laboratória – výsledky do 15 minút počas vašej návštevy.",
        "detailed_description": (
            "Krvné testy patria k základom diagnostiky. Hematológia nám ukáže počet a stav červených a bielych "
            "krviniek a krvných doštičiek, biochémia zasa funkciu pečene, obličiek, pankreasu a hladinu cukru či minerálov.\n\n"
            "Vďaka vlastnému laboratóriu máme výsledky spravidla do 15 minút, takže liečbu môžeme nastaviť "
            "ešte počas jednej návštevy. Predoperačný krvný profil odporúčame pred každou anestéziou a u seniorov "
            "nad 7 rokov raz ročne."
        ),
        "price_from": "45.00",
        "duration_minutes": 20,
        "preparation_notes": "Ideálne je, ak zvieratko 8 hodín pred odberom nežerie (tuky v krvi môžu skresliť výsledky). Voda je povolená.",
        "photo": "1574158622682-e40e69881006",
        "is_featured": True,
    },
    {
        "department": "interna-medicina-a-diagnostika",
        "name": "Kardiologické vyšetrenie s echokardiografiou",
        "slug": "kardiologicke-vysetrenie-s-echokardiografiou",
        "short_description": "Auskultácia, EKG, meranie krvného tlaku a dopplerovská echokardiografia pri šelestoch, kašli či únave.",
        "detailed_description": (
            "Kardiologické vyšetrenie odporúčame pri zistenom srdcovom šelestovi, kašli, rýchlej únave, "
            "dýchavičnosti, mdlobách a u plemien s predispozíciou k srdcovým ochoreniam (napr. kavalier king "
            "charles španiel, dobrman, mainská mývalia, britská krátkosrstá mačka).\n\n"
            "Vyšetrenie zahŕňa auskultáciu, elektrokardiografiu (EKG), meranie krvného tlaku a echokardiografiu "
            "s farebným dopplerom. Na záver dostanete písomnú správu s odporúčaním liečby a kontrol."
        ),
        "price_from": "85.00",
        "duration_minutes": 45,
        "preparation_notes": "Nie je potrebná špeciálna príprava. Prineste zoznam liekov, ktoré zvieratko užíva, a staršie výsledky vyšetrení.",
        "photo": "1587300003388-59208cc962cb",
        "is_featured": False,
    },
    # --- Chirurgia a ortopédia
    {
        "department": "chirurgia-a-ortopedia",
        "name": "Kastrácia / Sterilizácia v inhalačnej anestézii",
        "slug": "kastracia-sterilizacia-v-inhalacnej-anestezii",
        "short_description": "Rutinný zákrok s predoperačným vyšetrením, inhalačnou anestéziou, monitoringom a tlmením bolesti.",
        "detailed_description": (
            "Kastrácia znižuje riziko nádorov mliečnej žľazy a zápalu maternice u feniek a mačiek, u samcov "
            "ochorení prostaty a nežiaduceho značkovania. Zákrok robíme výhradne v inhalačnej anestézii, "
            "ktorá je bezpečnejšia a umožňuje rýchle a pokojné prebúdzanie.\n\n"
            "Počas operácie zvieratko nepretržite sleduje veterinárny technik – monitorujeme EKG, saturáciu "
            "kyslíkom, krvný tlak a telesnú teplotu. Samozrejmosťou je moderná analgézia pred zákrokom aj po ňom.\n\n"
            "Zvieratko si spravidla odnesiete domov v ten istý deň popoludní spolu s písomnými pokynmi "
            "a pooperačným golierom alebo body."
        ),
        "price_from": "95.00",
        "duration_minutes": 90,
        "preparation_notes": FASTING_NOTE,
        "photo": "1599443015574-be5fe8a05783",
        "is_featured": True,
    },
    {
        "department": "chirurgia-a-ortopedia",
        "name": "Digitálne RTG vyšetrenie",
        "slug": "digitalne-rtg-vysetrenie",
        "short_description": "Röntgenové snímky kostí, kĺbov, hrudníka aj brucha s okamžitým vyhodnotením na obrazovke.",
        "detailed_description": (
            "Digitálny röntgen nám poskytne snímky vo vysokom rozlíšení v priebehu niekoľkých sekúnd a s nižšou "
            "dávkou žiarenia. Využívame ho pri krívaní a úrazoch, podozrení na cudzie teleso, pri vyšetrení "
            "srdca a pľúc či pri oficiálnom hodnotení dysplázie bedrových a lakťových kĺbov.\n\n"
            "Pri niektorých projekciách je kvôli presnosti a pohodliu zvieratka potrebná krátka sedácia."
        ),
        "price_from": "40.00",
        "duration_minutes": 30,
        "preparation_notes": "Ak to stav dovolí, zvieratko 6 hodín pred vyšetrením nekŕmte – v prípade potreby tak môžeme bezpečne podať sedáciu.",
        "photo": "1581888227599-779811939961",
        "is_featured": False,
    },
    {
        "department": "chirurgia-a-ortopedia",
        "name": "Ortopedické vyšetrenie pohybového aparátu",
        "slug": "ortopedicke-vysetrenie-pohyboveho-aparatu",
        "short_description": "Posúdenie chôdze, palpácia kĺbov a testy stability pri krívaní, stuhnutosti alebo bolesti.",
        "detailed_description": (
            "Pri ortopedickom vyšetrení najskôr sledujeme chôdzu a beh vášho zvieratka, potom postupne vyšetríme "
            "všetky kĺby, svaly a chrbticu. Testujeme stabilitu kolenného kĺbu (napr. pri podozrení na ruptúru "
            "predného skríženého väzu) a rozsah pohybu.\n\n"
            "Podľa nálezu navrhneme ďalšiu diagnostiku (RTG), konzervatívnu liečbu, rehabilitáciu alebo "
            "chirurgické riešenie."
        ),
        "price_from": "50.00",
        "duration_minutes": 40,
        "preparation_notes": "Ak krívanie vidno len občas, natočte ho doma na video – veľmi nám to pomôže. Pred vyšetrením nepodávajte lieky proti bolesti, ak ich nepredpísal lekár.",
        "photo": "1530126483408-aa533e55bdb2",
        "is_featured": False,
    },
    # --- Stomatológia
    {
        "department": "stomatologia",
        "name": "Ultrazvukové čistenie zubného kameňa",
        "slug": "ultrazvukove-cistenie-zubneho-kamena",
        "short_description": "Profesionálna dentálna hygiena v krátkej anestézii vrátane leštenia zubov a kontroly ďasien.",
        "detailed_description": (
            "Zubný kameň spôsobuje zápach z úst, zápal ďasien a postupne aj uvoľňovanie zubov. Baktérie z ústnej "
            "dutiny môžu navyše zaťažovať srdce, obličky a pečeň.\n\n"
            "Kameň odstraňujeme ultrazvukom aj pod ďasnom, kde vzniká najviac problémov, a zuby následne leštíme, "
            "aby sa nový povlak usádzal pomalšie. Zákrok sa robí v krátkej inhalačnej anestézii – len tak je "
            "čistenie dôkladné, bezpečné a bezbolestné.\n\n"
            "Po zákroku vám ukážeme, ako sa o zuby starať doma."
        ),
        "price_from": "80.00",
        "duration_minutes": 60,
        "preparation_notes": FASTING_NOTE,
        "photo": "1543466835-00a7907e9de1",
        "is_featured": True,
    },
    {
        "department": "stomatologia",
        "name": "Dentálny RTG a extrakcia zubov",
        "slug": "dentalny-rtg-a-extrakcia-zubov",
        "short_description": "Intraorálne snímky celého chrupu a šetrné odstránenie poškodených či bolestivých zubov.",
        "detailed_description": (
            "Až 60 % zubných problémov sa skrýva pod ďasnom a bez röntgenu ich nevidno. Dentálny RTG nám ukáže "
            "korene zubov, kosť a resorpčné lézie, ktoré sú u mačiek veľmi časté a bolestivé.\n\n"
            "Zuby, ktoré nie je možné zachrániť, odstraňujeme šetrne chirurgickou technikou so zašitím ďasna "
            "a lokálnou anestéziou nervov, aby bolo prebúdzanie čo najpokojnejšie."
        ),
        "price_from": "120.00",
        "duration_minutes": 90,
        "preparation_notes": FASTING_NOTE,
        "photo": "1514888286974-6c03e2ca1dba",
        "is_featured": False,
    },
    # --- Dermatológia a alergológia
    {
        "department": "dermatologia-a-alergologia",
        "name": "Dermatologické vyšetrenie a cytológia kože",
        "slug": "dermatologicke-vysetrenie-a-cytologia-koze",
        "short_description": "Podrobné vyšetrenie kože, srsti a uší vrátane mikroskopie, trichogramu a vyšetrenia na parazity.",
        "detailed_description": (
            "Svrbenie, začervenanie, vypadávanie srsti či opakované zápaly uší patria k najčastejším dôvodom "
            "návštevy veterinára. Ich príčin môže byť veľa – od parazitov cez kvasinky a baktérie až po alergie.\n\n"
            "Vyšetrenie zahŕňa podrobnú anamnézu, prehliadku celej kože, kožný zoškrab, trichogram, "
            "cytológiu z kože a uší a vyšetrenie Woodovou lampou. Väčšinu výsledkov máme ešte počas návštevy."
        ),
        "price_from": "45.00",
        "duration_minutes": 40,
        "preparation_notes": "3 dni pred vyšetrením zvieratko nekúpte a nečistite mu uši. Prineste zoznam krmív, maškŕt a prípravkov, ktoré používate.",
        "photo": "1605568427561-40dd23c2acea",
        "is_featured": False,
    },
    {
        "department": "dermatologia-a-alergologia",
        "name": "Alergologické testovanie a imunoterapia",
        "slug": "alergologicke-testovanie-a-imunoterapia",
        "short_description": "Sérologické testy na environmentálne a potravinové alergény a nastavenie dlhodobej liečby.",
        "detailed_description": (
            "Ak má vaše zvieratko chronické svrbenie a vylúčili sme parazity a infekcie, môže ísť o atopickú "
            "dermatitídu alebo potravinovú alergiu. Pomocou krvného testu zistíme citlivosť na peľ, roztoče, plesne "
            "a ďalšie alergény.\n\n"
            "Na základe výsledkov navrhneme alergénovo-špecifickú imunoterapiu, eliminačnú diétu alebo modernú "
            "liečbu svrbenia, ktorá zvieratku vráti pokojný spánok."
        ),
        "price_from": "150.00",
        "duration_minutes": 30,
        "preparation_notes": "Aspoň 2 týždne pred testom nepodávajte kortikoidy (po dohode s lekárom). Zvieratko nemusí byť nalačno.",
        "photo": "1573865526739-10659fec78a5",
        "is_featured": False,
    },
    # --- Pohotovosť a intenzívna starostlivosť
    {
        "department": "pohotovost-a-intenzivna-starostlivost",
        "name": "Pohotovostné vyšetrenie a stabilizácia",
        "slug": "pohotovostne-vysetrenie-a-stabilizacia",
        "short_description": "Okamžité vyšetrenie pri úraze, otrave, ťažkom dýchaní či náhlom zhoršení stavu – bez objednania.",
        "detailed_description": (
            "Pri akútnych stavoch rozhodujú minúty. Pacienta po príchode okamžite posúdime (triáž), "
            "stabilizujeme – podáme kyslík, zaistíme žilový prístup, tlmíme bolesť – a následne urobíme "
            "potrebnú diagnostiku.\n\n"
            "Ak je to možné, zavolajte nám počas cesty na pohotovostnú linku, aby sme sa na váš príchod "
            "pripravili. Pri otrave prineste obal od látky, ktorú zvieratko zjedlo."
        ),
        "price_from": "60.00",
        "duration_minutes": 45,
        "preparation_notes": (
            "Nepodávajte žiadne lieky ani jedlo bez porady s lekárom. Pri otrave nevyvolávajte zvracanie "
            "na vlastnú päsť. Zraneného psa prenášajte opatrne na deke, mačku v boxe."
        ),
        "photo": "1611003228941-98852ba62227",
        "is_featured": False,
    },
    {
        "department": "pohotovost-a-intenzivna-starostlivost",
        "name": "Hospitalizácia a infúzna terapia",
        "slug": "hospitalizacia-a-infuzna-terapia",
        "short_description": "Starostlivosť o pacientov v stacionári s infúziami, pravidelnými kontrolami a správami pre majiteľa.",
        "detailed_description": (
            "Pacientov, ktorí potrebujú infúzie, intenzívnu liečbu alebo pozorovanie, hospitalizujeme v tichom "
            "stacionári s oddelenými boxmi pre psy a mačky. Vitálne funkcie kontrolujeme v pravidelných "
            "intervaloch a liečbu prispôsobujeme vývoju stavu.\n\n"
            "Ako majiteľ dostanete každý deň telefonickú správu od ošetrujúceho lekára a po dohode sa môžete "
            "prísť so svojím miláčikom pozrieť."
        ),
        "price_from": "40.00",
        "duration_minutes": 480,
        "preparation_notes": "Prineste krmivo, na ktoré je zvieratko zvyknuté, a obľúbenú deku či hračku, ktorá vonia domovom.",
        "photo": "1495360010541-f48722b34f7d",
        "is_featured": False,
    },
]


class Command(BaseCommand):
    help = "Naplní databázu ukážkovými oddeleniami, lekármi a službami (idempotentne)."

    @transaction.atomic
    def handle(self, *args, **options):
        departments: dict[str, Department] = {}
        for order, data in enumerate(DEPARTMENTS, start=1):
            dept, _ = Department.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "short_summary": data["short_summary"],
                    "icon_name": data["icon_name"],
                    "display_order": order,
                },
            )
            departments[dept.slug] = dept

        for order, data in enumerate(SERVICES, start=1):
            VeterinaryService.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "department": departments[data["department"]],
                    "name": data["name"],
                    "short_description": data["short_description"],
                    "detailed_description": data["detailed_description"],
                    "price_from": Decimal(data["price_from"]),
                    "duration_minutes": data["duration_minutes"],
                    "preparation_notes": data["preparation_notes"],
                    "image_url": unsplash(data["photo"]),
                    "is_featured": data["is_featured"],
                    "display_order": order,
                },
            )

        for order, data in enumerate(VETERINARIANS, start=1):
            vet, _ = Veterinarian.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "full_name_with_titles": data["full_name_with_titles"],
                    "role": data["role"],
                    "bio": data["bio"],
                    "education_and_certs": data["education_and_certs"],
                    "photo_url": unsplash(data["photo"], 800),
                    "accepts_online_booking": data["accepts_online_booking"],
                    "display_order": order,
                },
            )
            vet.departments.set([departments[slug] for slug in data["departments"]])

        self.stdout.write(
            self.style.SUCCESS(
                f"Hotovo: {Department.objects.count()} oddelení, "
                f"{VeterinaryService.objects.count()} služieb, "
                f"{Veterinarian.objects.count()} lekárov."
            )
        )
