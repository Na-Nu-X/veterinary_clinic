"""DRF serializers for the public clinic API."""

import re
from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import (
    AppointmentBooking,
    Department,
    PrescriptionRequest,
    Veterinarian,
    VeterinaryService,
)

PHONE_RE = re.compile(r"^\+?[0-9 ()/-]{9,20}$")
MAX_BOOKING_DAYS_AHEAD = 180


def validate_phone_number(value: str) -> str:
    cleaned = value.strip()
    digits = re.sub(r"\D", "", cleaned)
    if not PHONE_RE.match(cleaned) or not 9 <= len(digits) <= 15:
        raise serializers.ValidationError(
            "Zadajte platné telefónne číslo, napríklad +421 900 123 456."
        )
    return cleaned


def validate_consent(value: bool) -> bool:
    if not value:
        raise serializers.ValidationError(
            "Na spracovanie žiadosti potrebujeme váš súhlas so spracovaním osobných údajov."
        )
    return value


class DepartmentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "slug", "icon_name"]


class ServiceListSerializer(serializers.ModelSerializer):
    department = DepartmentMiniSerializer(read_only=True)

    class Meta:
        model = VeterinaryService
        fields = [
            "id",
            "name",
            "slug",
            "department",
            "short_description",
            "price_from",
            "duration_minutes",
            "preparation_notes",
            "image_url",
            "is_featured",
        ]


class ServiceDetailSerializer(ServiceListSerializer):
    class Meta(ServiceListSerializer.Meta):
        fields = ServiceListSerializer.Meta.fields + ["detailed_description"]


class ServiceInDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VeterinaryService
        fields = ["id", "name", "slug", "price_from", "duration_minutes", "is_featured"]


class DepartmentSerializer(serializers.ModelSerializer):
    services_count = serializers.IntegerField(read_only=True)
    services = ServiceInDepartmentSerializer(many=True, read_only=True)

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "slug",
            "short_summary",
            "icon_name",
            "display_order",
            "services_count",
            "services",
        ]


class VeterinarianSerializer(serializers.ModelSerializer):
    departments = DepartmentMiniSerializer(many=True, read_only=True)
    education_list = serializers.SerializerMethodField()

    class Meta:
        model = Veterinarian
        fields = [
            "id",
            "full_name_with_titles",
            "slug",
            "role",
            "bio",
            "education_and_certs",
            "education_list",
            "photo_url",
            "departments",
            "accepts_online_booking",
            "display_order",
        ]

    def get_education_list(self, obj: Veterinarian) -> list[str]:
        return [line.strip() for line in obj.education_and_certs.splitlines() if line.strip()]


class AppointmentBookingSerializer(serializers.ModelSerializer):
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True
    )
    service = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=VeterinaryService.objects.all(),
        required=False,
        allow_null=True,
    )
    preferred_vet = serializers.PrimaryKeyRelatedField(
        queryset=Veterinarian.objects.filter(accepts_online_booking=True),
        required=False,
        allow_null=True,
    )
    gdpr_consent = serializers.BooleanField(write_only=True)

    class Meta:
        model = AppointmentBooking
        fields = [
            "id",
            "pet_species",
            "pet_name",
            "pet_age",
            "department",
            "service",
            "preferred_vet",
            "visit_reason",
            "preferred_date",
            "preferred_time_slot",
            "owner_name",
            "phone",
            "email",
            "notes",
            "gdpr_consent",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]
        extra_kwargs = {
            "pet_name": {"error_messages": {"blank": "Napíšte, prosím, meno zvieratka."}},
            "owner_name": {"error_messages": {"blank": "Napíšte, prosím, vaše meno a priezvisko."}},
            "email": {"error_messages": {"invalid": "Zadajte platnú e-mailovú adresu."}},
        }

    def validate_phone(self, value: str) -> str:
        return validate_phone_number(value)

    def validate_gdpr_consent(self, value: bool) -> bool:
        return validate_consent(value)

    def validate_pet_name(self, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Meno zvieratka musí mať aspoň 2 znaky.")
        return value

    def validate_owner_name(self, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Napíšte, prosím, celé meno a priezvisko.")
        return value

    def validate_preferred_date(self, value):
        today = timezone.localdate()
        if value < today:
            raise serializers.ValidationError("Termín nemôže byť v minulosti.")
        if value > today + timedelta(days=MAX_BOOKING_DAYS_AHEAD):
            raise serializers.ValidationError(
                "Online sa dá objednať najviac 6 mesiacov vopred. Pre neskorší termín nám zavolajte."
            )
        if value.weekday() == 6:
            raise serializers.ValidationError(
                "V nedeľu ordinujeme len v režime pohotovosti. Vyberte, prosím, iný deň."
            )
        return value

    def validate(self, attrs):
        service = attrs.get("service")
        department = attrs.get("department")
        if service and department and service.department_id != department.id:
            raise serializers.ValidationError(
                {"service": "Vybraná služba nepatrí do zvoleného oddelenia."}
            )
        if service and not department:
            attrs["department"] = service.department
        return attrs


class PrescriptionRequestSerializer(serializers.ModelSerializer):
    gdpr_consent = serializers.BooleanField(write_only=True)

    class Meta:
        model = PrescriptionRequest
        fields = [
            "id",
            "pet_name",
            "pet_species",
            "request_type",
            "item_details",
            "owner_name",
            "phone",
            "email",
            "gdpr_consent",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "item_details": {
                "error_messages": {"blank": "Uveďte názov lieku alebo krmiva a požadované množstvo."}
            },
            "email": {"error_messages": {"invalid": "Zadajte platnú e-mailovú adresu."}},
        }

    def validate_phone(self, value: str) -> str:
        return validate_phone_number(value)

    def validate_gdpr_consent(self, value: bool) -> bool:
        return validate_consent(value)

    def validate_item_details(self, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError(
                "Uveďte názov lieku alebo krmiva a požadované množstvo."
            )
        return value
