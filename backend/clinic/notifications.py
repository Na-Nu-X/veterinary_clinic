"""E-mail notifications for new online bookings.

Two messages are sent for every new booking:

* a confirmation of receipt to the pet owner (plain text + HTML), and
* a notification to the clinic's staff inboxes with a link to the admin.

Delivery failures are logged and never propagate – a booking must not be
lost or rejected just because the mail server is unavailable.
"""

import logging
from datetime import date

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import translation

from .models import AppointmentBooking

logger = logging.getLogger(__name__)

# Django's Slovak locale only ships nominative month names ("november"), but a
# date needs the genitive ("20. novembra"), so the format is built explicitly.
SK_WEEKDAYS = ("pondelok", "utorok", "streda", "štvrtok", "piatok", "sobota", "nedeľa")
SK_MONTHS_GENITIVE = (
    "januára", "februára", "marca", "apríla", "mája", "júna",
    "júla", "augusta", "septembra", "októbra", "novembra", "decembra",
)


def format_date_sk(value: date) -> str:
    """e.g. ``piatok 20. novembra 2026``."""
    return f"{SK_WEEKDAYS[value.weekday()]} {value.day}. {SK_MONTHS_GENITIVE[value.month - 1]} {value.year}"


def _clinic_context() -> dict:
    return {
        "clinic_name": settings.CLINIC_NAME,
        "clinic_phone": settings.CLINIC_PHONE,
        "clinic_emergency_phone": settings.CLINIC_EMERGENCY_PHONE,
        "clinic_address": settings.CLINIC_ADDRESS,
        "clinic_email": settings.CLINIC_REPLY_TO_EMAIL,
    }


def _booking_context(booking: AppointmentBooking) -> dict:
    admin_path = reverse("admin:clinic_appointmentbooking_change", args=[booking.pk])
    return {
        **_clinic_context(),
        "booking": booking,
        "preferred_date_label": format_date_sk(booking.preferred_date),
        "species_label": booking.get_pet_species_display(),
        "reason_label": booking.get_visit_reason_display(),
        "time_slot_label": booking.get_preferred_time_slot_display(),
        "vet_label": str(booking.preferred_vet) if booking.preferred_vet else "Bez preferencie",
        "service": booking.service,
        "admin_url": f"{settings.BACKEND_BASE_URL}{admin_path}",
    }


def build_client_confirmation(booking: AppointmentBooking) -> EmailMultiAlternatives:
    context = _booking_context(booking)
    message = EmailMultiAlternatives(
        subject=f"Prijali sme vašu objednávku č. {booking.pk} – {settings.CLINIC_NAME}",
        body=render_to_string("clinic/emails/booking_client.txt", context),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[booking.email],
        reply_to=[settings.CLINIC_REPLY_TO_EMAIL],
    )
    message.attach_alternative(render_to_string("clinic/emails/booking_client.html", context), "text/html")
    return message


def build_clinic_notification(booking: AppointmentBooking) -> EmailMultiAlternatives | None:
    recipients = settings.CLINIC_NOTIFICATION_EMAILS
    if not recipients:
        return None
    context = _booking_context(booking)
    return EmailMultiAlternatives(
        subject=(
            f"Nová online objednávka č. {booking.pk}: {booking.pet_name} "
            f"({context['species_label']}) – {booking.preferred_date:%d.%m.%Y}"
        ),
        body=render_to_string("clinic/emails/booking_clinic.txt", context),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=list(recipients),
        # Staff can reply straight to the pet owner.
        reply_to=[booking.email],
    )


def send_booking_emails(booking_id: int) -> None:
    """Send the client confirmation and the staff notification for a booking."""
    booking = (
        AppointmentBooking.objects.select_related("service", "department", "preferred_vet")
        .filter(pk=booking_id)
        .first()
    )
    if booking is None:
        logger.warning("Booking %s not found, e-mails not sent.", booking_id)
        return

    # Ensure Slovak date / choice labels regardless of the calling context.
    with translation.override(settings.LANGUAGE_CODE):
        messages = [
            ("client confirmation", lambda: build_client_confirmation(booking)),
            ("clinic notification", lambda: build_clinic_notification(booking)),
        ]
        for label, build in messages:
            try:
                message = build()
                if message is not None:
                    message.send(fail_silently=False)
            except Exception:  # noqa: BLE001 – never let e-mail break a booking
                logger.exception("Failed to send %s for booking %s.", label, booking_id)
