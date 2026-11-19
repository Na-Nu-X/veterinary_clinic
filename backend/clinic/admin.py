"""Django admin configuration tailored for receptionists and veterinarians."""

from django.contrib import admin, messages
from django.utils.html import format_html

from .models import (
    AppointmentBooking,
    Department,
    PrescriptionRequest,
    Veterinarian,
    VeterinaryService,
)


class VeterinaryServiceInline(admin.TabularInline):
    model = VeterinaryService
    fields = ("name", "price_from", "duration_minutes", "is_featured", "display_order")
    extra = 0
    show_change_link = True


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "icon_name", "display_order", "services_total")
    list_editable = ("display_order",)
    search_fields = ("name", "short_summary")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [VeterinaryServiceInline]

    @admin.display(description="Počet služieb")
    def services_total(self, obj: Department) -> int:
        return obj.services.count()


@admin.register(VeterinaryService)
class VeterinaryServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "department", "price_label", "duration_minutes", "is_featured", "display_order")
    list_display_links = ("name",)
    list_editable = ("is_featured", "display_order")
    list_filter = ("department", "is_featured")
    search_fields = ("name", "short_description", "detailed_description")
    list_select_related = ("department",)
    prepopulated_fields = {"slug": ("name",)}
    fieldsets = (
        (None, {"fields": ("department", "name", "slug", "is_featured", "display_order")}),
        ("Cena a trvanie", {"fields": ("price_from", "duration_minutes")}),
        ("Popis pre majiteľov", {"fields": ("short_description", "detailed_description", "preparation_notes")}),
        ("Médiá", {"fields": ("image_url",)}),
    )

    @admin.display(description="Cena od", ordering="price_from")
    def price_label(self, obj: VeterinaryService) -> str:
        return f"{obj.price_from:.2f} €".replace(".", ",")


@admin.register(Veterinarian)
class VeterinarianAdmin(admin.ModelAdmin):
    list_display = ("photo_thumb", "full_name_with_titles", "role", "accepts_online_booking", "display_order")
    list_display_links = ("photo_thumb", "full_name_with_titles")
    list_editable = ("accepts_online_booking", "display_order")
    list_filter = ("accepts_online_booking", "departments")
    search_fields = ("full_name_with_titles", "role", "bio")
    filter_horizontal = ("departments",)
    prepopulated_fields = {"slug": ("full_name_with_titles",)}

    @admin.display(description="Foto")
    def photo_thumb(self, obj: Veterinarian):
        if not obj.photo_url:
            return "—"
        return format_html(
            '<img src="{}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:50%">',
            obj.photo_url,
        )


@admin.register(AppointmentBooking)
class AppointmentBookingAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "pet_name",
        "pet_species",
        "owner_name",
        "phone",
        "preferred_date",
        "preferred_time_slot",
        "visit_reason",
        "preferred_vet",
        "status",
    )
    list_display_links = ("created_at", "pet_name")
    list_editable = ("status",)
    list_filter = ("status", "visit_reason", "pet_species", "preferred_time_slot", "preferred_vet", "preferred_date")
    search_fields = ("pet_name", "owner_name", "phone", "email", "notes")
    date_hierarchy = "preferred_date"
    list_select_related = ("service", "department", "preferred_vet")
    autocomplete_fields = ("service", "preferred_vet", "department")
    readonly_fields = ("created_at", "gdpr_consent")
    actions = ("mark_confirmed", "mark_completed", "mark_cancelled")
    fieldsets = (
        ("Stav objednávky", {"fields": ("status", "created_at")}),
        ("Zvieratko", {"fields": ("pet_species", "pet_name", "pet_age")}),
        ("Návšteva", {"fields": ("visit_reason", "department", "service", "preferred_vet", "preferred_date", "preferred_time_slot", "notes")}),
        ("Majiteľ", {"fields": ("owner_name", "phone", "email", "gdpr_consent")}),
    )

    def _set_status(self, request, queryset, status, label):
        updated = queryset.update(status=status)
        self.message_user(request, f"{updated} objednávok označených ako „{label}“.", messages.SUCCESS)

    @admin.action(description="Označiť ako potvrdené")
    def mark_confirmed(self, request, queryset):
        self._set_status(request, queryset, AppointmentBooking.Status.CONFIRMED, "Potvrdená")

    @admin.action(description="Označiť ako dokončené")
    def mark_completed(self, request, queryset):
        self._set_status(request, queryset, AppointmentBooking.Status.COMPLETED, "Dokončená")

    @admin.action(description="Označiť ako zrušené")
    def mark_cancelled(self, request, queryset):
        self._set_status(request, queryset, AppointmentBooking.Status.CANCELLED, "Zrušená")


@admin.register(PrescriptionRequest)
class PrescriptionRequestAdmin(admin.ModelAdmin):
    list_display = ("created_at", "request_type", "pet_name", "pet_species", "owner_name", "phone", "is_resolved")
    list_display_links = ("created_at", "request_type")
    list_editable = ("is_resolved",)
    list_filter = ("is_resolved", "request_type", "pet_species")
    search_fields = ("pet_name", "owner_name", "phone", "email", "item_details")
    readonly_fields = ("created_at", "gdpr_consent")
    actions = ("mark_resolved",)

    @admin.action(description="Označiť ako vybavené")
    def mark_resolved(self, request, queryset):
        updated = queryset.update(is_resolved=True)
        self.message_user(request, f"{updated} žiadostí označených ako vybavené.", messages.SUCCESS)
