import json
from django.http import HttpResponse
from django.template import loader
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework import viewsets

from .models import Item
from .models import EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed
from .serializers import (
    EcgSamplesSerializer,
    EcgDocLabelsSerializer,
    EcgSnomedSerializer,
    EcgSamplesDocLabelsSerializer,
    EcgSamplesSnomedSerializer,
)


def hello(request):
    template = loader.get_template('myfirst.html')
    return HttpResponse(template.render())


@csrf_exempt
def get_item1(request):
    try:
        item = Item.objects.create(name='Item 1', description='This is item 1.')
        item_data = {
            'name': item.name,
            'description': item.description,
        }
        return JsonResponse(item_data, safe=False)
    except Item.DoesNotExist:
        return JsonResponse({'error': 'Item with ID 1 not found.'}, status=404)
    

class EcgSamplesViewSet(viewsets.ModelViewSet):
    queryset = EcgSamples.objects.all()
    serializer_class = EcgSamplesSerializer


class EcgDocLabelsViewSet(viewsets.ModelViewSet):
    queryset = EcgDocLabels.objects.all()
    serializer_class = EcgDocLabelsSerializer


class EcgSnomedViewSet(viewsets.ModelViewSet):
    queryset = EcgSnomed.objects.all()
    serializer_class = EcgSnomedSerializer


class EcgSamplesDocLabelsViewSet(viewsets.ModelViewSet):
    queryset = EcgSamplesDocLabels.objects.all()
    serializer_class = EcgSamplesDocLabelsSerializer


class EcgSamplesSnomedViewSet(viewsets.ModelViewSet):
    queryset = EcgSamplesSnomed.objects.all()
    serializer_class = EcgSamplesSnomedSerializer
