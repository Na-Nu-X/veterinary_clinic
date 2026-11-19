"""Public REST API views."""

import django_filters
from django.db.models import Count, Prefetch
from rest_framework import mixins, viewsets
from rest_framework.throttling import ScopedRateThrottle

from .models import (
    AppointmentBooking,
    Department,
    PrescriptionRequest,
    Veterinarian,
    VeterinaryService,
)
from .serializers import (
    AppointmentBookingSerializer,
    DepartmentSerializer,
    PrescriptionRequestSerializer,
    ServiceDetailSerializer,
    ServiceListSerializer,
    VeterinarianSerializer,
)


class ServiceFilter(django_filters.FilterSet):
    department = django_filters.CharFilter(method="filter_department")
    featured = django_filters.BooleanFilter(field_name="is_featured")
    max_price = django_filters.NumberFilter(field_name="price_from", lookup_expr="lte")

    class Meta:
        model = VeterinaryService
        fields = ["department", "featured", "max_price"]

    def filter_department(self, queryset, name, value):
        """Accept either a department id or slug."""
        if value.isdigit():
            return queryset.filter(department_id=int(value))
        return queryset.filter(department__slug=value)


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DepartmentSerializer
    lookup_field = "slug"
    filter_backends: list = []
    pagination_class = None

    def get_queryset(self):
        # Meta.ordering is ignored for aggregate (GROUP BY) queries, so order explicitly.
        return (
            Department.objects.annotate(services_count=Count("services"))
            .order_by("display_order", "name")
            .prefetch_related(
            Prefetch("services", queryset=VeterinaryService.objects.order_by("display_order", "name"))
            )
        )


class VeterinaryServiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VeterinaryService.objects.select_related("department")
    lookup_field = "slug"
    filterset_class = ServiceFilter
    search_fields = ["name", "short_description", "detailed_description", "department__name"]
    ordering_fields = ["price_from", "duration_minutes", "name", "display_order"]
    ordering = ["department__display_order", "display_order", "name"]
    pagination_class = None

    def get_serializer_class(self):
        return ServiceDetailSerializer if self.action == "retrieve" else ServiceListSerializer


class VeterinarianViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Veterinarian.objects.prefetch_related("departments")
    serializer_class = VeterinarianSerializer
    lookup_field = "slug"
    filterset_fields = ["accepts_online_booking"]
    ordering = ["display_order", "full_name_with_titles"]
    pagination_class = None


class PublicSubmissionThrottleMixin:
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "submissions"


class AppointmentBookingViewSet(
    PublicSubmissionThrottleMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    queryset = AppointmentBooking.objects.all()
    serializer_class = AppointmentBookingSerializer


class PrescriptionRequestViewSet(
    PublicSubmissionThrottleMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    queryset = PrescriptionRequest.objects.all()
    serializer_class = PrescriptionRequestSerializer
