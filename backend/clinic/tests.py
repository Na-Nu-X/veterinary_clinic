from datetime import timedelta

from django.core.management import call_command
from django.core.cache import cache
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
