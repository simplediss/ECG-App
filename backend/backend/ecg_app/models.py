from django.db import models
from django.contrib.auth.models import User


# ---------------------------------------- [ECG Data Models] ----------------------------------------


class EcgSamples(models.Model):
    sample_id = models.AutoField(primary_key=True)
    sample_path = models.CharField(max_length=255)
    gender = models.CharField(
        max_length=10,
        choices=[('Male', 'Male'), ('Female', 'Female')],
        blank=True,
        null=True
    )
    age = models.PositiveIntegerField(blank=True, null=True)


    def __str__(self):
        return f"Sample {self.sample_id}"


class EcgDocLabels(models.Model):
    label_id = models.AutoField(primary_key=True)
    label_desc = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.label_desc


class EcgSnomed(models.Model):
    label_id = models.AutoField(primary_key=True)
    label_code = models.IntegerField(unique=True)
    label_desc = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.label_desc


class EcgSamplesDocLabels(models.Model):
    sample_id = models.ForeignKey(EcgSamples, on_delete=models.CASCADE, related_name='doc_labels')
    label_id = models.ForeignKey(EcgDocLabels, on_delete=models.CASCADE, related_name='samples')

    def __str__(self):
        return f"Sample {self.sample_id} - Label {self.label_id}"


class EcgSamplesSnomed(models.Model):
    sample_id = models.ForeignKey(EcgSamples, on_delete=models.CASCADE, related_name='snomed_labels')
    label_id = models.ForeignKey(EcgSnomed, on_delete=models.CASCADE, related_name='samples')

    def __str__(self):
        return f"Sample {self.sample_id} - Label {self.label_id}"
    

# ---------------------------------------- [User Models] ----------------------------------------
# Django's built-in User model provides login/logout functionality and user authentication. 
# Extend it with a Profile model if additional fields are needed.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Additional fields for user profiles
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return self.user.username


# ---------------------------------------- [Quiz Models] ----------------------------------------
"""
Quizzes:
    * A Quiz consists of multiple Questions.
    * Each Question has several Choices, one or more of which are correct.


Quiz Attempts:
    * When a user starts a quiz, a QuizAttempt record is created.
    * For each question in the quiz, a QuestionAttempt is created to track the user's selected 
      choice and whether it was correct.

History and Retakes:
    * Users can view their QuizAttempt records to review their answers and retake the quiz.
"""

class Quiz(models.Model):
    """Represents a collection of questions grouped into a quiz."""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    

class Question(models.Model):
    """Represents a multi-choice question in a quiz."""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    ecg_sample = models.ForeignKey(EcgSamples, on_delete=models.CASCADE)  # ECG sample to classify
    question_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Question {self.id} in {self.quiz.title}"
    

class Choice(models.Model):
    """Represents the possible answers for a question."""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)  # True if this choice is the correct answer

    def __str__(self):
        return f"Choice for Question {self.question.id}: {self.text}"


class QuizAttempt(models.Model):
    """Tracks a user's attempt at a quiz."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Attempt on {self.quiz.title}"
    

class QuestionAttempt(models.Model):
    """Tracks a user's answer to a specific question in a quiz attempt."""
    quiz_attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='question_attempts')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.SET_NULL, blank=True, null=True)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Attempt for Question {self.question.id} in {self.quiz_attempt}"


class UserStatistics(models.Model):
    """Aggregates user statistics for progress tracking."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='statistics')
    total_quizzes_taken = models.PositiveIntegerField(default=0)
    total_correct_answers = models.PositiveIntegerField(default=0)
    total_questions_answered = models.PositiveIntegerField(default=0)

    @property
    def accuracy(self):
        if self.total_questions_answered > 0:
            return round((self.total_correct_answers / self.total_questions_answered) * 100, 2)
        return 0

    def __str__(self):
        return f"Statistics for {self.user.username}"
