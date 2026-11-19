from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Veterinárna klinika – administrácia"
admin.site.site_title = "Administrácia kliniky"
admin.site.index_title = "Správa objednávok, služieb a lekárov"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("clinic.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
