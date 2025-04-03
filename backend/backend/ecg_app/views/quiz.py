from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from ..models import (
    Quiz, Question, Choice, QuizAttempt, QuestionAttempt
)
from ..serializers import (
    QuizSerializer, QuestionSerializer, ChoiceSerializer,
    QuizAttemptSerializer, QuestionAttemptSerializer,
)
from ..quiz_generator import PersonalizedQuizGenerator
from ..permissions import IsTeacherOrAdmin, IsOwnerOrTeacherOrAdmin


# ---------------------------------------- [User and Quiz API views] ----------------------------------------


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

            # Get choices_per_question from request data or use default
            choices_per_question = request.data.get('choices_per_question', 6)
            
            generator = PersonalizedQuizGenerator(
                user=target_user,
                num_questions=5,
                personalization_weight=0.7,  # 70% personalization at max
                recency_weight=0.5,  # Moderate decay of old attempts
                choices_per_question=choices_per_question
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

