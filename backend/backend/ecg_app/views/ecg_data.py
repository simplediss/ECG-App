from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed
from ..serializers import (
    EcgSamplesSerializer, EcgDocLabelsSerializer, EcgSnomedSerializer,
    EcgSamplesDocLabelsSerializer, EcgSamplesSnomedSerializer,
)
from ..permissions import IsTeacherOrAdmin

    
class EcgSamplesViewSet(viewsets.ModelViewSet):
    queryset = EcgSamples.objects.all()
    serializer_class = EcgSamplesSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]


class EcgDocLabelsViewSet(viewsets.ModelViewSet):
    queryset = EcgDocLabels.objects.all()
    serializer_class = EcgDocLabelsSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]


class EcgSnomedViewSet(viewsets.ModelViewSet):
    queryset = EcgSnomed.objects.all()
    serializer_class = EcgSnomedSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]


class EcgSamplesDocLabelsViewSet(viewsets.ModelViewSet):
    queryset = EcgSamplesDocLabels.objects.all()
    serializer_class = EcgSamplesDocLabelsSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]


class EcgSamplesSnomedViewSet(viewsets.ModelViewSet):
    queryset = EcgSamplesSnomed.objects.all()
    serializer_class = EcgSamplesSnomedSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
