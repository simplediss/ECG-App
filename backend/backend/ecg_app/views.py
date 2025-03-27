from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from django.conf import settings
from django.http import FileResponse, Http404
import os
import random

from .models import (
    EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed,
    User, Profile, Quiz, Question, Choice, QuizAttempt, QuestionAttempt
)
from .serializers import (
    EcgSamplesSerializer, EcgDocLabelsSerializer, EcgSnomedSerializer,
    EcgSamplesDocLabelsSerializer, EcgSamplesSnomedSerializer,
    ProfileSerializer, QuizSerializer, QuestionSerializer, ChoiceSerializer,
    QuizAttemptSerializer, QuestionAttemptSerializer, LoginSerializer, RegistrationSerializer
)

ITEMS_PER_PAGE = 50
    
# ---------------------------------------- [Home templates View] ----------------------------------------

def home(request):
    links = [
        {'name': 'Samples', 'url': '/samples/'},
        {'name': 'SNOMED', 'url': '/snomed/'},
        {'name': 'Samples-SNOMED', 'url': '/samples-snomed/'},
        {'name': 'Users', 'url': '/users/'},
        {'name': 'Quizzes', 'url': '/quizzes/'},
        {'name': 'Quiz Attempts', 'url': '/quiz-attempts/'},
    ]
    return render(request, 'home.html', {'links': links})

# ---------------------------------------- [ECG Data API views] ----------------------------------------
    
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

# ---------------------------------------- [User and Quiz API views] ----------------------------------------

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

@method_decorator(ensure_csrf_cookie, name='dispatch')
class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def generate_random(self, request):
        """Generate a random quiz with random questions."""
        try:
            # Get available samples with SNOMED labels
            available_samples = EcgSamples.objects.filter(snomed_labels__isnull=False).distinct()
            if not available_samples.exists():
                return Response({'error': 'No ECG samples available'}, status=status.HTTP_404_NOT_FOUND)

            # Get all SNOMED labels for creating distractors
            all_snomed_labels = list(EcgSnomed.objects.all())
            if len(all_snomed_labels) < 4:  # We need at least 4 labels for choices
                return Response({'error': 'Not enough SNOMED labels available'}, status=status.HTTP_404_NOT_FOUND)

            # Create a temporary quiz with the new title format
            current_time = timezone.now()
            quiz_title = f"{request.user.username}_{current_time.strftime('%Y%m%d_%H%M%S')}"
            quiz = Quiz.objects.create(
                title=quiz_title,
                description="A randomly generated quiz"
            )

            # Select random samples (5 questions)
            samples = list(available_samples)
            random.shuffle(samples)
            selected_samples = samples[:5]

            for sample in selected_samples:
                # Get the correct SNOMED labels for this sample
                correct_labels = list(EcgSnomed.objects.filter(samples__sample_id=sample))
                if not correct_labels:
                    continue

                # Choose one correct label randomly
                correct_label = random.choice(correct_labels)

                # Create the question
                question = Question.objects.create(
                    quiz=quiz,
                    ecg_sample=sample,
                    question_text=f"What is the correct diagnosis for this ECG?"
                )

                # Create the correct choice
                Choice.objects.create(
                    question=question,
                    text=correct_label.label_desc,
                    is_correct=True
                )

                # Create incorrect choices (distractors)
                incorrect_labels = [label for label in all_snomed_labels if label not in correct_labels]
                selected_incorrect = random.sample(incorrect_labels, min(3, len(incorrect_labels)))

                for label in selected_incorrect:
                    Choice.objects.create(
                        question=question,
                        text=label.label_desc,
                        is_correct=False
                    )

            # Serialize the quiz with its questions and choices
            serializer = self.get_serializer(quiz)
            return Response(serializer.data)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer

@method_decorator(ensure_csrf_cookie, name='dispatch')
class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuizAttempt.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Get the quiz
        quiz_id = request.data.get('quiz')
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

        # Create quiz attempt
        quiz_attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            completed_at=timezone.now()
        )

        # Process answers
        answers = request.data.get('answers', [])
        correct_answers = 0
        total_questions = len(answers)

        for answer in answers:
            question_id = answer.get('question')
            choice_id = answer.get('selected_choice')

            try:
                question = Question.objects.get(id=question_id, quiz=quiz)
                choice = Choice.objects.get(id=choice_id, question=question)
                
                is_correct = choice.is_correct
                if is_correct:
                    correct_answers += 1

                QuestionAttempt.objects.create(
                    quiz_attempt=quiz_attempt,
                    question=question,
                    selected_choice=choice,
                    is_correct=is_correct
                )
            except (Question.DoesNotExist, Choice.DoesNotExist):
                continue

        # Calculate score
        score = (correct_answers / total_questions * 100) if total_questions > 0 else 0

        return Response({
            'quiz_attempt_id': quiz_attempt.id,
            'score': score,
            'correct_answers': correct_answers,
            'total_questions': total_questions
        }, status=status.HTTP_201_CREATED)

class QuestionAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuestionAttempt.objects.all()
    serializer_class = QuestionAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuestionAttempt.objects.filter(quiz_attempt__user=self.request.user)

# ---------------------------------------- [ECG Data templates views] ----------------------------------------

def view_ecg_samples(request):
    samples = EcgSamples.objects.all()

    # Pagination logic
    paginator = Paginator(samples, ITEMS_PER_PAGE)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_ecg_samples.html', {'page_obj': page_obj})


def view_ecg_snomed(request):
    snomed_labels = EcgSnomed.objects.all()
    
    # Pagination logic
    paginator = Paginator(snomed_labels, ITEMS_PER_PAGE)  # 100 items per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_ecg_snomed.html', {'page_obj': page_obj})


def view_ecg_samples_snomed(request):
    relationships = EcgSamplesSnomed.objects.select_related('sample_id', 'label_id')

    # Pagination logic
    paginator = Paginator(relationships, ITEMS_PER_PAGE)  # 100 items per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_ecg_samples_snomed.html', {'page_obj': page_obj})


# ---------------------------------------- [User and Quiz template views] ----------------------------------------

def view_users(request):
    users = User.objects.all()
    
    # Pagination logic
    paginator = Paginator(users, ITEMS_PER_PAGE)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_users.html', {'page_obj': page_obj})

def view_quizzes(request):
    quizzes = Quiz.objects.all()
    
    # Pagination logic
    paginator = Paginator(quizzes, ITEMS_PER_PAGE)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_quizzes.html', {'page_obj': page_obj})

def view_quiz_attempts(request):
    quiz_attempts = QuizAttempt.objects.all()
    
    # Pagination logic
    paginator = Paginator(quiz_attempts, ITEMS_PER_PAGE)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_quiz_attempts.html', {'page_obj': page_obj})


# ---------------------------------------- [Authentication API views] ----------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def api_login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        
        if user is not None:
            login(request, user)
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': 'admin' if user.is_superuser else 'user'
                }
            })
        else:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ensure_csrf_cookie
def api_logout(request):
    logout(request)
    return Response({'message': 'Logout successful'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_status(request):
    user = request.user
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': 'admin' if user.is_superuser else 'user'
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def api_csrf(request):
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def api_register(request):
    print("Received registration data:", request.data)  # Debug print
    serializer = RegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response({
                'message': 'Registration successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Registration error:", str(e))  # Debug print
            return Response({
                'message': 'Registration failed',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    print("Validation errors:", serializer.errors)  # Debug print
    return Response({
        'message': 'Invalid data',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CheckAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question_id = request.data.get('question_id')
        choice_id = request.data.get('choice_id')

        try:
            question = Question.objects.get(id=question_id)
            choice = Choice.objects.get(id=choice_id, question=question)
            
            is_correct = choice.is_correct
            correct_choice = Choice.objects.get(question=question, is_correct=True)

            return Response({
                'is_correct': is_correct,
                'correct_choice_id': correct_choice.id,
                'correct_choice_text': correct_choice.text
            })
        except (Question.DoesNotExist, Choice.DoesNotExist):
            return Response({'error': 'Invalid question or choice'}, status=status.HTTP_404_NOT_FOUND)

# ---------------------------------------- [Image Serving] ----------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_ecg_image(request, image_path):
    """
    Securely serve ECG images from the dataset directory.
    """
    # Normalize the path to prevent directory traversal attacks
    normalized_path = os.path.normpath(image_path)
    
    # Construct the full path
    full_path = os.path.join(settings.DATASET_SAMPLES_PATH, normalized_path)
    
    # Security check: ensure the path is within the dataset directory
    if not os.path.abspath(full_path).startswith(os.path.abspath(settings.DATASET_SAMPLES_PATH)):
        raise Http404("Invalid image path")
    
    # Check if file exists
    if not os.path.exists(full_path):
        raise Http404("Image not found")
    
    # Check if it's an image file
    if not any(full_path.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']):
        raise Http404("Invalid file type")
    
    # Serve the file
    return FileResponse(open(full_path, 'rb'), content_type='image/jpeg')
    