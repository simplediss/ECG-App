from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from rest_framework import viewsets, status, permissions
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
from django.http import FileResponse, Http404, HttpResponseRedirect
import os
import random
from django.db.models import Q
from django.contrib.auth.models import User

from .models import (
    EcgSamples, EcgDocLabels, EcgSnomed, EcgSamplesDocLabels, EcgSamplesSnomed,
    User, Profile, Quiz, Question, Choice, QuizAttempt, QuestionAttempt, Group, GroupMembership
)
from .serializers import (
    EcgSamplesSerializer, EcgDocLabelsSerializer, EcgSnomedSerializer,
    EcgSamplesDocLabelsSerializer, EcgSamplesSnomedSerializer,
    ProfileSerializer, QuizSerializer, QuestionSerializer, ChoiceSerializer,
    QuizAttemptSerializer, QuestionAttemptSerializer, LoginSerializer, RegistrationSerializer,
    GroupSerializer, GroupDetailSerializer, GroupMembershipSerializer, GroupMembershipRequestSerializer
)
from .quiz_generator import PersonalizedQuizGenerator
from .permissions import IsTeacher, IsStudent, IsTeacherOrAdmin, IsOwnerOrTeacherOrAdmin, IsGroupMember, CanManageGroupMembers

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

# ---------------------------------------- [User and Quiz API views] ----------------------------------------

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        print(f"ProfileViewSet: User {user.username} requesting profiles")
        print(f"Is staff: {user.is_staff}")
        print(f"Has profile: {hasattr(user, 'profile')}")
        if hasattr(user, 'profile'):
            print(f"User role: {user.profile.role}")

        if user.is_staff:
            queryset = Profile.objects.all()
        elif hasattr(user, 'profile') and user.profile.role == 'teacher':
            queryset = Profile.objects.filter(role='student')
        else:
            queryset = Profile.objects.none()
        
        print(f"Returning {queryset.count()} profiles")
        return queryset.select_related('user')  # Add select_related to optimize query

@method_decorator(ensure_csrf_cookie, name='dispatch')
class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def generate_random(self, request):
        """Generate a personalized quiz based on user's performance history."""
        try:
            # Check if user is a student
            if hasattr(request.user, 'profile') and request.user.profile.role == 'student':
                # Students can only generate quizzes for themselves
                target_user = request.user
            elif request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'teacher'):
                # Teachers and admins can generate quizzes for any user
                target_user = request.user
            else:
                return Response(
                    {'error': 'Only students, teachers, and administrators can generate quizzes'},
                    status=status.HTTP_403_FORBIDDEN
                )

            generator = PersonalizedQuizGenerator(
                user=target_user,
                num_questions=5,
                personalization_weight=0.7,  # 70% personalization at max
                recency_weight=0.5  # Moderate decay of old attempts
            )
            quiz = generator.generate()
            
            # Serialize the quiz with its questions and choices
            serializer = self.get_serializer(quiz)
            return Response(serializer.data)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

@method_decorator(ensure_csrf_cookie, name='dispatch')
class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'teacher'):
            return QuizAttempt.objects.all()
        return QuizAttempt.objects.filter(user=user)

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
    permission_classes = [IsAuthenticated, IsOwnerOrTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'teacher'):
            return QuestionAttempt.objects.all()
        return QuestionAttempt.objects.filter(quiz_attempt__user=user)

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
        login_identifier = serializer.validated_data['login_identifier']
        password = serializer.validated_data['password']
        
        # Check if login_identifier is an email
        if '@' in login_identifier:
            try:
                # Try to get user by email
                user_obj = User.objects.get(email=login_identifier)
                # Authenticate with the username
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            # Authenticate with username
            user = authenticate(username=login_identifier, password=password)
        
        if user is not None:
            login(request, user)
            profile = getattr(user, 'profile', None)
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'profile': {
                        'role': profile.role if profile else 'student'
                    } if profile else None
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
    profile = getattr(user, 'profile', None)
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'profile': {
                'role': profile.role if profile else 'student'
            } if profile else None
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

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsTeacherOrAdmin])
def update_user_profile(request, profile_id):
    """
    Custom endpoint to update both User and Profile models in a single request.
    Only admin users can update other users.
    """
    try:
        # Check if the profile exists
        profile = Profile.objects.select_related('user').get(id=profile_id)
        
        # Only admin users can update other users
        if not request.user.is_staff and request.user.id != profile.user.id:
            return Response(
                {'error': 'You do not have permission to update this user.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get data from request
        data = request.data
        user_data = data.get('user', {})
        profile_data = {
            'date_of_birth': data.get('date_of_birth'),
            'gender': data.get('gender'),
        }
        
        # If role is provided and user is admin, update role
        if request.user.is_staff and 'role' in data:
            profile_data['role'] = data['role']
        
        # Update User model fields
        user = profile.user
        if 'email' in user_data:
            user.email = user_data['email']
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
            
        # Update password if provided
        if 'password' in user_data and user_data['password']:
            user.set_password(user_data['password'])
            
        # Save user
        user.save()
        
        # Update Profile model fields
        for key, value in profile_data.items():
            if value is not None:  # Only update if provided
                setattr(profile, key, value)
        
        # Save profile
        profile.save()
        
        # Return updated profile with user data
        return Response({
            'id': profile.id,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'role': profile.get_role_display(),
            'date_of_birth': profile.date_of_birth,
            'gender': profile.gender,
        })
        
    except Profile.DoesNotExist:
        return Response(
            {'error': 'Profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

# ---------------------------------------- [Image Serving] ----------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_ecg_image(request, image_path):
    """
    Serve ECG images - directly in development, redirect to Nginx in production.
    """
    # Normalize the path to prevent directory traversal attacks
    normalized_path = os.path.normpath(image_path)
    
    # Remove any leading slashes to make the path relative
    normalized_path = normalized_path.lstrip('/')
    
    # Add .png extension if not present
    if not normalized_path.lower().endswith('.png'):
        normalized_path += '.png'
    
    # Construct the full path for validation
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
    
    if settings.DEBUG:
        # In development, serve the file directly through Django
        return FileResponse(open(full_path, 'rb'), content_type='image/png')
    else:
        # In production, redirect to Nginx
        return HttpResponseRedirect(f'/ecg-images/{normalized_path}')

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GroupDetailSerializer
        return GroupSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Group.objects.all()
        elif hasattr(user, 'profile') and user.profile.role == 'student':
            # Students can see all groups
            return Group.objects.all()
        else:
            # Teachers see their own groups and groups they're members of
            return Group.objects.filter(
                Q(teacher=user) |  # Groups owned by the user
                Q(memberships__student=user, memberships__status='approved')  # Groups where user is a member
            ).distinct()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['join_request']:
            # Allow any authenticated user to request to join
            return [permissions.IsAuthenticated()]
        elif self.action in ['approve_request', 'reject_request', 'remove_user']:
            # Only group teachers can manage members
            return [permissions.IsAuthenticated(), CanManageGroupMembers()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def join_request(self, request, pk=None):
        group = self.get_object()
        user = request.user

        # Check if user already has a pending request or is already a member
        existing_membership = GroupMembership.objects.filter(
            group=group,
            student=user
        ).first()

        if existing_membership:
            if existing_membership.status == 'approved':
                return Response(
                    {'error': 'You are already a member of this group'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_membership.status == 'pending':
                return Response(
                    {'error': 'You already have a pending request for this group'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Create a new membership request
        GroupMembership.objects.create(
            group=group,
            student=user,
            status='pending'
        )

        return Response({'message': 'Join request sent successfully'})

    @action(detail=True, methods=['post'])
    def approve_request(self, request, pk=None):
        group = self.get_object()
        request_id = request.data.get('request_id')

        if not request_id:
            return Response(
                {'error': 'request_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert request_id to integer if it's a string
        try:
            request_id = int(request_id)
        except (TypeError, ValueError) as e:
            return Response(
                {'error': f'Invalid request_id format: {e}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the current user is the group teacher
        if request.user != group.teacher and not request.user.is_staff:
            return Response(
                {'error': 'Only the group teacher can approve requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # First try to find the membership without any filters to see if it exists at all
            try:
                membership = GroupMembership.objects.get(id=request_id)
            except GroupMembership.DoesNotExist:
                return Response(
                    {'error': 'Membership request not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Now check if it matches our criteria
            if membership.group.id != group.id:
                return Response(
                    {'error': 'Membership request does not belong to this group'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if membership.status != 'pending':
                print(f"[DEBUG] Invalid membership status: {membership.status}")
                return Response(
                    {'error': f'Membership request is not pending (current status: {membership.status})'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            membership.status = 'approved'
            membership.save()
            print(f"[DEBUG] Successfully approved membership")
            return Response({'message': 'Request approved successfully'})

        except Exception as e:
            print(f"[DEBUG] Error approving request: {str(e)}")
            return Response(
                {'error': f'Error approving request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reject_request(self, request, pk=None):
        group = self.get_object()
        request_id = request.data.get('request_id')

        if not request_id:
            return Response(
                {'error': 'request_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the current user is the group teacher
        if request.user != group.teacher and not request.user.is_staff:
            return Response(
                {'error': 'Only the group teacher can reject requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            membership = GroupMembership.objects.get(
                id=request_id,
                group=group,
                status='pending'
            )
            membership.delete()
            return Response({'message': 'Request rejected successfully'})
        except GroupMembership.DoesNotExist:
            return Response(
                {'error': 'Membership request not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_user(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the current user is the group teacher
        if request.user != group.teacher and not request.user.is_staff:
            return Response(
                {'error': 'Only the group teacher can remove users'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            membership = GroupMembership.objects.get(
                group=group,
                student_id=user_id,
                status='approved'
            )
            membership.delete()
            return Response({'message': 'User removed successfully'})
        except GroupMembership.DoesNotExist:
            return Response(
                {'error': 'Group membership not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def my_groups(self, request):
        user = request.user
        if user.is_staff:
            groups = Group.objects.all()
        else:
            groups = Group.objects.filter(
                Q(teacher=user) |  # Groups owned by the user
                Q(memberships__student=user, memberships__status='approved')  # Groups where user is a member
            ).distinct()
        
        serializer = self.get_serializer(groups, many=True)
        return Response(serializer.data)

class GroupMembershipViewSet(viewsets.ModelViewSet):
    queryset = GroupMembership.objects.all()
    serializer_class = GroupMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return GroupMembership.objects.all()
        return GroupMembership.objects.filter(
            Q(group__teacher=user) |  # Memberships in groups owned by the user
            Q(student=user)  # User's own memberships
        ).distinct()

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageGroupMembers()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

class GroupMembershipRequestViewSet(viewsets.ModelViewSet):
    queryset = GroupMembership.objects.filter(status='pending')
    serializer_class = GroupMembershipRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return GroupMembership.objects.filter(status='pending')
        return GroupMembership.objects.filter(
            Q(group__teacher=user) |  # Pending requests for groups owned by the user
            Q(student=user)  # User's own pending requests
        ).filter(status='pending').distinct()

    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), CanManageGroupMembers()]
        return [permissions.IsAuthenticated()]
    