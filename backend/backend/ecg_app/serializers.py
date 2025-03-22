from rest_framework import serializers
from .models import EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed
from .models import Profile, Quiz, Question, Choice, QuizAttempt, QuestionAttempt, UserStatistics

    
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



class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = '__all__'


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = '__all__'


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'


class QuestionAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionAttempt
        fields = '__all__'


class UserStatisticsSerializer(serializers.ModelSerializer):
    accuracy = serializers.ReadOnlyField()  # Include the calculated accuracy

    class Meta:
        model = UserStatistics
        fields = '__all__'


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

