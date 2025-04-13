from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from ..models import QuizAttempt, QuestionAttempt, Question, EcgSamplesDocLabels, EcgDocLabels

class UserStatisticsView(APIView):
    @staticmethod
    def _get_start_date(days_limit):
        if days_limit is None:
            return None
            
        try:
            days_limit = int(days_limit)
            return timezone.now() - timedelta(days=days_limit)
        except ValueError:
            raise ValueError(f"days_limit must be a valid integer, got: {days_limit}")

    @staticmethod
    def _get_quiz_limit(quiz_limit):
        if quiz_limit is None:
            return None
            
        try:
            quiz_limit = int(quiz_limit)
            if quiz_limit <= 0:
                raise ValueError(f"quiz_limit must be a positive integer, got: {quiz_limit}")
            return quiz_limit
        except ValueError:
            raise ValueError(f"quiz_limit must be a valid positive integer, got: {quiz_limit}")

    @staticmethod
    def _get_quiz_attempts(user, start_date, quiz_limit):
        quiz_attempts = QuizAttempt.objects.filter(user=user)
        if start_date:
            quiz_attempts = quiz_attempts.filter(started_at__gte=start_date)
        if quiz_limit:
            quiz_attempts = quiz_attempts.order_by('-started_at')[:quiz_limit]
        return quiz_attempts

    @staticmethod
    def _get_question_attempts(user, start_date, quiz_limit):
        question_attempts = QuestionAttempt.objects.filter(quiz_attempt__user=user)
        if start_date:
            question_attempts = question_attempts.filter(quiz_attempt__started_at__gte=start_date)
        if quiz_limit:
            # Get the most recent quiz attempts and filter question attempts accordingly
            recent_quiz_attempts = QuizAttempt.objects.filter(user=user).order_by('-started_at')[:quiz_limit]
            question_attempts = question_attempts.filter(quiz_attempt__in=recent_quiz_attempts)
        return question_attempts

    @staticmethod
    def _total_exams(quiz_attempts):
        return quiz_attempts.count()

    @staticmethod
    def _total_questions(question_attempts):
        return question_attempts.count()

    @staticmethod
    def _correct_answers(question_attempts):
        return question_attempts.filter(is_correct=True).count()

    @staticmethod
    def _accuracy(correct_answers, total_questions):
        return round((correct_answers / total_questions * 100) if total_questions > 0 else 0, 2)

    @staticmethod
    def _doc_class_statistics(question_attempts):
        doc_class_stats = []
        doc_labels = EcgDocLabels.objects.all()
        
        for label in doc_labels:
            questions_with_label = Question.objects.filter(
                ecg_sample__doc_labels__label_id=label
            )
            
            attempts = question_attempts.filter(
                question__in=questions_with_label
            )
            
            total_attempts = attempts.count()
            correct_attempts = attempts.filter(is_correct=True).count()
            
            accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
                
            doc_class_stats.append({
                'label': label.label_desc,
                'total_attempts': total_attempts,
                'correct_attempts': correct_attempts,
                'accuracy': round(accuracy, 2)
            })
            
        return doc_class_stats

    def get(self, request, user_id):
        # Get the user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get the days limit and quiz limit from query parameters
        try:
            days_limit = request.query_params.get('days_limit')
            quiz_limit = request.query_params.get('quiz_limit')
            start_date = self._get_start_date(days_limit)
            quiz_limit = self._get_quiz_limit(quiz_limit)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Get the quiz attempts and question attempts
        quiz_attempts = self._get_quiz_attempts(user, start_date, quiz_limit)
        question_attempts = self._get_question_attempts(user, start_date, quiz_limit)

        # Calculate statistics using dedicated methods
        total_exams = self._total_exams(quiz_attempts)
        total_questions = self._total_questions(question_attempts)
        correct_answers = self._correct_answers(question_attempts)
        overall_accuracy = self._accuracy(correct_answers, total_questions)
        doc_class_stats = self._doc_class_statistics(question_attempts)

        return Response({
            'total_exams': total_exams,
            'total_questions': total_questions,
            'correct_answers': correct_answers,
            'overall_accuracy': overall_accuracy,
            'doc_class_statistics': doc_class_stats,
            'days_limit': days_limit,
            'quiz_limit': quiz_limit
        })
