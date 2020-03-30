from django.urls import path, include

from rest_framework.routers import DefaultRouter
from server.pj import views

router = DefaultRouter()
router.register(r'files', views.FileViewSet)
router.register(r'vendors', views.VendorViewSet)
router.register(r'stakeholders', views.StakeholderViewSet)
router.register(r'datasources', views.DataSourceViewSet)
router.register(r'notes', views.NoteViewSet)
router.register(r'todos', views.TodoViewSet)

urlpatterns = [
    path('', include(router.urls))
]
