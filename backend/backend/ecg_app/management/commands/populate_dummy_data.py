import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from ecg_app.models import (
    Profile, Quiz, Question, Choice, QuizAttempt,
    QuestionAttempt, UserStatistics, EcgSamples
)

class Command(BaseCommand):
    help = "Populate the database with dummy values for all models"

    def handle(self, *args, **kwargs):
        # Add users
        for i in range(5):
            user, created = User.objects.get_or_create(
                username=f"user{i+1}",
                email=f"user{i+1}@example.com",
                is_staff=random.choice([True, False]),
            )
            if created:
                user.set_password("password")
                user.save()
                Profile.objects.get_or_create(user=user, bio=f"Bio for user{i+1}")

        # Add quizzes
        for i in range(3):
            quiz = Quiz.objects.create(
                title=f"Quiz {i+1}",
                description=f"Description for Quiz {i+1}",
            )
            for j in range(5):  # Add 5 questions per quiz
                question = Question.objects.create(
                    quiz=quiz,
                    ecg_sample=random.choice(EcgSamples.objects.all()),
                    question_text=f"Question {j+1} in {quiz.title}",
                )
                for k in range(4):  # Add 4 choices per question
                    Choice.objects.create(
                        question=question,
                        text=f"Choice {k+1} for Question {j+1}",
                        is_correct=(k == 0),  # Make the first choice correct
                    )

        # Add quiz attempts
        for user in User.objects.all():
            for quiz in Quiz.objects.all():
                attempt = QuizAttempt.objects.create(user=user, quiz=quiz)
                for question in quiz.questions.all():
                    selected_choice = random.choice(question.choices.all())
                    QuestionAttempt.objects.create(
                        quiz_attempt=attempt,
                        question=question,
                        selected_choice=selected_choice,
                        is_correct=selected_choice.is_correct,
                    )

        # Add user statistics
        for user in User.objects.all():
            UserStatistics.objects.get_or_create(
                user=user,
                total_quizzes_taken=QuizAttempt.objects.filter(user=user).count(),
                total_correct_answers=sum(
                    q.is_correct for q in QuestionAttempt.objects.filter(quiz_attempt__user=user)
                ),
                total_questions_answered=QuestionAttempt.objects.filter(quiz_attempt__user=user).count(),
            )

        self.stdout.write(self.style.SUCCESS("Dummy data populated successfully!"))
