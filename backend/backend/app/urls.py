from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views
from .views import (
    EcgSamplesViewSet,
    EcgDocLabelsViewSet,
    EcgSnomedViewSet,
    EcgSamplesDocLabelsViewSet,
    EcgSamplesSnomedViewSet,
)

router = DefaultRouter()
router.register(r'ecg-samples', EcgSamplesViewSet, basename='ecg-samples')
router.register(r'ecg-doc-labels', EcgDocLabelsViewSet, basename='ecg-doc-labels')
router.register(r'ecg-snomed', EcgSnomedViewSet, basename='ecg-snomed')
router.register(r'ecg-samples-doc-labels', EcgSamplesDocLabelsViewSet, basename='ecg-samples-doc-labels')
router.register(r'ecg-samples-snomed', EcgSamplesSnomedViewSet, basename='ecg-samples-snomed')


urlpatterns = [
    path('hello/', views.hello, name='hello'),
    path('item1/', views.get_item1, name='item1'),
    path('api/', include(router.urls)),
]
