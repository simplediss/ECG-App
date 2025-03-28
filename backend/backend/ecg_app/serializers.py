from rest_framework import serializers
from .models import EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed
from .models import Profile, Quiz, Question, Choice, QuizAttempt, QuestionAttempt
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

    
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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'date_of_birth', 'gender']


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    ecg_sample = EcgSamplesSerializer(read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'choices', 'ecg_sample']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'created_at', 'questions']


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz = QuizSerializer()  # Nested serializer for quiz details
    user = UserSerializer()  # Add user serializer
    score = serializers.SerializerMethodField()
    correct_answers = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'user', 'started_at', 'completed_at', 'score', 'correct_answers', 'total_questions']

    def get_score(self, obj):
        question_attempts = obj.question_attempts.all()
        total = question_attempts.count()
        if total == 0:
            return 0
        correct = question_attempts.filter(is_correct=True).count()
        return (correct / total) * 100

    def get_correct_answers(self, obj):
        return obj.question_attempts.filter(is_correct=True).count()

    def get_total_questions(self, obj):
        return obj.question_attempts.count()


class QuestionAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionAttempt
        fields = '__all__'


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class RegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(
        min_length=3,
        max_length=150,
        error_messages={
            'min_length': 'Username must be at least 3 characters long.',
            'max_length': 'Username cannot exceed 150 characters.',
        }
    )
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        error_messages={
            'required': 'Password is required.',
            'min_length': 'Password must be at least 8 characters long.',
        }
    )
    email = serializers.EmailField(
        error_messages={
            'required': 'Email is required.',
            'invalid': 'Please enter a valid email address.',
        }
    )
    first_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        error_messages={
            'max_length': 'First name cannot exceed 150 characters.',
        }
    )
    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        error_messages={
            'max_length': 'Last name cannot exceed 150 characters.',
        }
    )
    role = serializers.ChoiceField(
        choices=['student', 'teacher'],
        default='student',
        required=False,
        error_messages={
            'invalid_choice': 'Role must be either "student" or "teacher".',
        }
    )
    date_of_birth = serializers.DateField(
        required=False,
        allow_null=True,
        error_messages={
            'invalid': 'Please enter a valid date.',
        }
    )
    gender = serializers.ChoiceField(
        choices=['Male', 'Female', 'Other'],
        required=False,
        allow_blank=True,
        error_messages={
            'invalid_choice': 'Please select a valid gender option.',
        }
    )

    def validate(self, data):
        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({
                'username': 'This username is already taken.'
            })
        
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': 'This email is already registered.'
            })
        
        return data

    def create(self, validated_data):
        try:
            # Create User object
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data['email'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', '')
            )

            # Get role from validated data
            role = validated_data.get('role', 'student')
            
            # Create Profile object
            profile = Profile.objects.create(
                user=user,
                date_of_birth=validated_data.get('date_of_birth'),
                gender=validated_data.get('gender'),
                role=role
            )

            return user
        except Exception as e:
            raise serializers.ValidationError({
                'error': str(e)
            })

