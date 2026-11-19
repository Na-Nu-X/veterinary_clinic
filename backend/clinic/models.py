"""Domain models for the veterinary clinic."""

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


def unique_slug(instance: models.Model, value: str, max_length: int = 120) -> str:
    """Build a slug from `value` that is unique for the instance's model."""
    base = slugify(value)[:max_length].strip("-") or "polozka"
    slug = base
    counter = 2
    model = type(instance)
    while model.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
        suffix = f"-{counter}"
        slug = f"{base[: max_length - len(suffix)]}{suffix}"
        counter += 1
    return slug


class PetSpecies(models.TextChoices):
    DOG = "pes", "Pes"
    CAT = "macka", "Mačka"
    SMALL_MAMMAL = "drobny_cicavec", "Drobný cicavec"
    OTHER = "ine", "Iné zviera"


class Department(models.Model):
    name = models.CharField("Názov oddelenia", max_length=120, unique=True)
    slug = models.SlugField("URL identifikátor", max_length=140, unique=True, blank=True)
    short_summary = models.TextField("Krátky popis", max_length=400)
    icon_name = models.CharField(
        "Názov ikony",
        max_length=40,
        default="stethoscope",
        help_text="Identifikátor ikony vo frontende (napr. syringe, stethoscope, scalpel, tooth, skin, siren).",
    )
    display_order = models.PositiveSmallIntegerField("Poradie zobrazenia", default=0)

    class Meta:
        verbose_name = "Oddelenie"
        verbose_name_plural = "Oddelenia"
        ordering = ["display_order", "name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(self, self.name, 140)
        super().save(*args, **kwargs)


class VeterinaryService(models.Model):
    department = models.ForeignKey(
        Department,
        verbose_name="Oddelenie",
        on_delete=models.PROTECT,
        related_name="services",
    )
    name = models.CharField("Názov služby", max_length=180)
    slug = models.SlugField("URL identifikátor", max_length=200, unique=True, blank=True)
    short_description = models.CharField("Krátky popis", max_length=300)
    detailed_description = models.TextField("Podrobný popis")
    price_from = models.DecimalField(
        "Cena od (€)",
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    duration_minutes = models.PositiveSmallIntegerField(
        "Trvanie (minúty)", default=30, validators=[MinValueValidator(5)]
    )
    preparation_notes = models.TextField("Príprava pred návštevou", blank=True)
    image_url = models.URLField("URL fotografie", max_length=500, blank=True)
    is_featured = models.BooleanField("Zvýraznená služba", default=False)
    display_order = models.PositiveSmallIntegerField("Poradie zobrazenia", default=0)

    class Meta:
        verbose_name = "Veterinárna služba"
        verbose_name_plural = "Veterinárne služby a cenník"
        ordering = ["department__display_order", "display_order", "name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(self, self.name, 200)
        super().save(*args, **kwargs)


class Veterinarian(models.Model):
    full_name_with_titles = models.CharField("Meno a tituly", max_length=150)
    slug = models.SlugField("URL identifikátor", max_length=160, unique=True, blank=True)
    role = models.CharField("Pozícia / špecializácia", max_length=200)
    bio = models.TextField("Medailón")
    education_and_certs = models.TextField(
        "Vzdelanie a certifikáty",
        blank=True,
        help_text="Každú položku napíšte na samostatný riadok.",
    )
    photo_url = models.URLField("URL fotografie", max_length=500, blank=True)
    departments = models.ManyToManyField(
        Department, verbose_name="Oddelenia", related_name="veterinarians", blank=True
    )
    accepts_online_booking = models.BooleanField("Prijíma online objednávky", default=True)
    display_order = models.PositiveSmallIntegerField("Poradie zobrazenia", default=0)

    class Meta:
        verbose_name = "Veterinárny lekár"
        verbose_name_plural = "Veterinárni lekári"
        ordering = ["display_order", "full_name_with_titles"]

    def __str__(self) -> str:
        return self.full_name_with_titles

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(self, self.full_name_with_titles, 160)
        super().save(*args, **kwargs)


class AppointmentBooking(models.Model):
    class VisitReason(models.TextChoices):
        PREVENTION = "prevencia", "Preventívna prehliadka a očkovanie"
        ACUTE = "akutny_stav", "Zdravotný problém / Vyšetrenie"
        FOLLOW_UP = "kontrola", "Kontrolné vyšetrenie"
        SURGERY = "chirurgia", "Konzultácia pred zákrokom"
        DENTAL = "stomatologia", "Dentálna hygiena"

    class TimeSlot(models.TextChoices):
        MORNING = "rano", "Ráno (08:00 – 11:00)"
        MIDDAY = "obed", "Obed (11:00 – 14:00)"
        AFTERNOON = "popoludnie", "Popoludní (14:00 – 18:00)"

    class Status(models.TextChoices):
        NEW = "nova", "Nová"
        CONFIRMED = "potvrdena", "Potvrdená"
        COMPLETED = "dokoncena", "Dokončená"
        CANCELLED = "zrusena", "Zrušená"

    pet_species = models.CharField("Druh zvieraťa", max_length=20, choices=PetSpecies.choices)
    pet_name = models.CharField("Meno zvieratka", max_length=80)
    pet_age = models.CharField("Vek zvieratka", max_length=40, blank=True)
    department = models.ForeignKey(
        Department,
        verbose_name="Oddelenie",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )
    service = models.ForeignKey(
        VeterinaryService,
        verbose_name="Služba",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )
    preferred_vet = models.ForeignKey(
        Veterinarian,
        verbose_name="Preferovaný lekár",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )
    visit_reason = models.CharField("Dôvod návštevy", max_length=20, choices=VisitReason.choices)
    preferred_date = models.DateField("Preferovaný dátum")
    preferred_time_slot = models.CharField(
        "Preferovaný čas", max_length=20, choices=TimeSlot.choices
    )
    owner_name = models.CharField("Meno majiteľa", max_length=120)
    phone = models.CharField("Telefón", max_length=30)
    email = models.EmailField("E-mail")
    notes = models.TextField("Poznámka", blank=True)
    gdpr_consent = models.BooleanField("Súhlas so spracovaním osobných údajov", default=False)
    status = models.CharField(
        "Stav", max_length=20, choices=Status.choices, default=Status.NEW, db_index=True
    )
    created_at = models.DateTimeField("Prijaté", auto_now_add=True)

    class Meta:
        verbose_name = "Online objednávka"
        verbose_name_plural = "Online objednávky na vyšetrenie"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.pet_name} ({self.get_pet_species_display()}) – {self.preferred_date:%d.%m.%Y}"


class PrescriptionRequest(models.Model):
    class RequestType(models.TextChoices):
        MEDICATION = "lieky", "Opakovaný recept na lieky"
        ANTIPARASITIC = "antiparazitika", "Antiparazitiká"
        DIET = "dieta", "Veterinárna diéta / Krmivo"

    pet_name = models.CharField("Meno zvieratka", max_length=80)
    pet_species = models.CharField("Druh zvieraťa", max_length=20, choices=PetSpecies.choices)
    request_type = models.CharField("Typ žiadosti", max_length=20, choices=RequestType.choices)
    item_details = models.TextField("Požadovaný liek / krmivo")
    owner_name = models.CharField("Meno majiteľa", max_length=120)
    phone = models.CharField("Telefón", max_length=30)
    email = models.EmailField("E-mail")
    gdpr_consent = models.BooleanField("Súhlas so spracovaním osobných údajov", default=False)
    is_resolved = models.BooleanField("Vybavené", default=False, db_index=True)
    created_at = models.DateTimeField("Prijaté", auto_now_add=True)

    class Meta:
        verbose_name = "Žiadosť o recept / krmivo"
        verbose_name_plural = "Žiadosti o recepty a krmivá"
        ordering = ["is_resolved", "-created_at"]

    def __str__(self) -> str:
        return f"{self.get_request_type_display()} – {self.pet_name} ({self.owner_name})"
