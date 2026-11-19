from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("departments", views.DepartmentViewSet, basename="department")
router.register("services", views.VeterinaryServiceViewSet, basename="service")
router.register("veterinarians", views.VeterinarianViewSet, basename="veterinarian")
router.register("appointments", views.AppointmentBookingViewSet, basename="appointment")
router.register("prescriptions", views.PrescriptionRequestViewSet, basename="prescription")

urlpatterns = router.urls
