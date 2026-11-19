from datetime import timedelta
from unittest import mock

from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import AppointmentBooking, PrescriptionRequest, Veterinarian, VeterinaryService


def next_weekday(days_ahead: int = 3):
    day = timezone.localdate() + timedelta(days=days_ahead)
    while day.weekday() == 6:
        day += timedelta(days=1)
    return day


class ClinicApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_data", verbosity=0)

    def setUp(self):
        cache.clear()

    def test_seed_is_idempotent(self):
        call_command("seed_data", verbosity=0)
        self.assertEqual(VeterinaryService.objects.count(), 15)
        self.assertEqual(Veterinarian.objects.count(), 4)

    def test_departments_include_service_counts(self):
        res = self.client.get("/api/departments/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 6)
        self.assertTrue(all(d["services_count"] == len(d["services"]) for d in res.data))
        orders = [d["display_order"] for d in res.data]
        self.assertEqual(orders, sorted(orders))

    def test_service_filters(self):
        self.assertEqual(len(self.client.get("/api/services/").data), 15)
        featured = self.client.get("/api/services/", {"featured": "true"}).data
        self.assertTrue(featured and all(s["is_featured"] for s in featured))
        by_dept = self.client.get("/api/services/", {"department": "stomatologia"}).data
        self.assertEqual(len(by_dept), 2)
        search = self.client.get("/api/services/", {"search": "ultrazvuk"}).data
        self.assertTrue(any("usg" in s["slug"] for s in search))
        ordered = self.client.get("/api/services/", {"ordering": "price_from"}).data
        prices = [float(s["price_from"]) for s in ordered]
        self.assertEqual(prices, sorted(prices))

    def test_service_detail(self):
        res = self.client.get("/api/services/kastracia-sterilizacia-v-inhalacnej-anestezii/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("detailed_description", res.data)
        self.assertIn("12-hodinová hladovka", res.data["preparation_notes"])

    def test_create_appointment(self):
        vet = Veterinarian.objects.first()
        payload = {
            "pet_species": "pes",
            "pet_name": "Bady",
            "pet_age": "4 roky",
            "service": "ultrazvukove-cistenie-zubneho-kamena",
            "preferred_vet": vet.pk,
            "visit_reason": "stomatologia",
            "preferred_date": next_weekday().isoformat(),
            "preferred_time_slot": "rano",
            "owner_name": "Jana Nováková",
            "phone": "+421 900 123 456",
            "email": "jana@example.sk",
            "gdpr_consent": True,
        }
        res = self.client.post("/api/appointments/", payload, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        booking = AppointmentBooking.objects.get()
        self.assertEqual(booking.department.slug, "stomatologia")
        self.assertEqual(booking.status, "nova")

    def test_appointment_validation_messages_are_slovak(self):
        res = self.client.post(
            "/api/appointments/",
            {
                "pet_species": "pes",
                "pet_name": "B",
                "visit_reason": "kontrola",
                "preferred_date": (timezone.localdate() - timedelta(days=1)).isoformat(),
                "preferred_time_slot": "rano",
                "owner_name": "Jana Nováková",
                "phone": "abc",
                "email": "bad",
                "gdpr_consent": False,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        for field in ("pet_name", "preferred_date", "phone", "email", "gdpr_consent"):
            self.assertIn(field, res.data)
        self.assertIn("minulosti", str(res.data["preferred_date"]))

    def test_create_prescription_request(self):
        res = self.client.post(
            "/api/prescriptions/",
            {
                "pet_name": "Micka",
                "pet_species": "macka",
                "request_type": "dieta",
                "item_details": "Renal diéta pre mačky, 2 kg",
                "owner_name": "Peter Horváth",
                "phone": "0905 111 222",
                "email": "peter@example.sk",
                "gdpr_consent": True,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertFalse(PrescriptionRequest.objects.get().is_resolved)

    def test_submissions_are_write_only(self):
        self.assertEqual(self.client.get("/api/appointments/").status_code, 405)
        self.assertEqual(self.client.get("/api/prescriptions/").status_code, 405)


class BookingEmailTests(APITestCase):
    """Booking notification e-mails (Django's test runner uses the locmem backend)."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_data", verbosity=0)

    def setUp(self):
        cache.clear()
        self.payload = {
            "pet_species": "macka",
            "pet_name": "Micka",
            "service": "ultrazvukove-cistenie-zubneho-kamena",
            "visit_reason": "stomatologia",
            "preferred_date": next_weekday().isoformat(),
            "preferred_time_slot": "obed",
            "owner_name": "Jana Nováková",
            "phone": "+421 900 123 456",
            "email": "jana@example.sk",
            "notes": "Nerada cestuje.",
            "gdpr_consent": True,
        }

    def post_booking(self):
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post("/api/appointments/", self.payload, format="json")

    @override_settings(CLINIC_NOTIFICATION_EMAILS=["recepcia@example.sk", "lekar@example.sk"])
    def test_new_booking_sends_client_confirmation_and_clinic_notification(self):
        res = self.post_booking()
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(len(mail.outbox), 2)
        client_mail, clinic_mail = mail.outbox
        booking_id = res.data["id"]

        # Client confirmation – Slovak, HTML alternative, replies go to the clinic.
        self.assertEqual(client_mail.to, ["jana@example.sk"])
        self.assertIn(f"č. {booking_id}", client_mail.subject)
        self.assertIn("Micka", client_mail.body)
        self.assertIn("Ultrazvukové čistenie zubného kameňa", client_mail.body)
        self.assertIn("12-hodinová hladovka", client_mail.body)  # preparation notes
        self.assertIn("Obed (11:00 – 14:00)", client_mail.body)
        self.assertEqual(len(client_mail.alternatives), 1)
        self.assertEqual(client_mail.alternatives[0][1], "text/html")
        self.assertEqual(client_mail.reply_to, [settings.CLINIC_REPLY_TO_EMAIL])

        # Clinic notification – all staff inboxes, admin link, reply goes to owner.
        self.assertEqual(clinic_mail.to, ["recepcia@example.sk", "lekar@example.sk"])
        self.assertIn("Micka", clinic_mail.subject)
        self.assertIn("+421 900 123 456", clinic_mail.body)
        self.assertIn("Nerada cestuje.", clinic_mail.body)
        self.assertIn(f"/admin/clinic/appointmentbooking/{booking_id}/change/", clinic_mail.body)
        self.assertEqual(clinic_mail.reply_to, ["jana@example.sk"])

    def test_date_is_formatted_in_slovak(self):
        from datetime import date

        from .notifications import format_date_sk

        self.assertEqual(format_date_sk(date(2026, 11, 20)), "piatok 20. novembra 2026")
        self.assertEqual(format_date_sk(date(2027, 3, 1)), "pondelok 1. marca 2027")
        self.post_booking()
        booking = AppointmentBooking.objects.get()
        self.assertIn(format_date_sk(booking.preferred_date), mail.outbox[0].body)

    @override_settings(CLINIC_NOTIFICATION_EMAILS=[])
    def test_no_clinic_notification_when_no_staff_inbox_configured(self):
        self.post_booking()
        self.assertEqual([m.to for m in mail.outbox], [["jana@example.sk"]])

    def test_mail_failure_does_not_break_booking(self):
        with mock.patch("django.core.mail.EmailMessage.send", side_effect=OSError("SMTP down")):
            with self.assertLogs("clinic.notifications", level="ERROR") as logs:
                res = self.post_booking()
        self.assertEqual(res.status_code, 201)
        self.assertEqual(AppointmentBooking.objects.count(), 1)
        self.assertEqual(len(logs.records), 2)  # both messages logged, none raised

    def test_invalid_booking_sends_nothing(self):
        self.payload["gdpr_consent"] = False
        res = self.post_booking()
        self.assertEqual(res.status_code, 400)
        self.assertEqual(mail.outbox, [])
