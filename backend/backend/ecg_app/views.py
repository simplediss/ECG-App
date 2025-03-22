from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import (
    EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed,
    User, Profile, Quiz, Question, Choice, QuizAttempt, QuestionAttempt, UserStatistics
)
from .serializers import (
    EcgSamplesSerializer, EcgDocLabelsSerializer, EcgSnomedSerializer,
    EcgSamplesDocLabelsSerializer, EcgSamplesSnomedSerializer,
    ProfileSerializer, QuizSerializer, QuestionSerializer, ChoiceSerializer,
    QuizAttemptSerializer, QuestionAttemptSerializer, UserStatisticsSerializer,
    LoginSerializer
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

class UserStatisticsViewSet(viewsets.ReadOnlyModelViewSet):  # Read-only ViewSet
    queryset = UserStatistics.objects.all()
    serializer_class = UserStatisticsSerializer

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer

class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer

class QuestionAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuestionAttempt.objects.all()
    serializer_class = QuestionAttemptSerializer

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

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('user_status')
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required
def user_status_view(request):
    return render(request, 'user_status.html', {'user': request.user})

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
                    'email': user.email
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
            'email': user.email
        }
    })
    