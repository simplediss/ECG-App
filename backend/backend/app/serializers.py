from rest_framework import serializers
from .models import Item
from .models import EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

    
class EcgSamplesSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgSamples
        fields = '__all__'


class EcgDocLabelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgDocLabels
        fields = '__all__'


class EcgSnomedSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgSnomed
        fields = '__all__'


class EcgSamplesDocLabelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgSamplesDocLabels
        fields = '__all__'


class EcgSamplesSnomedSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcgSamplesSnomed
        fields = '__all__'
