from django.db import models
from django.contrib.auth.models import User
from simple_history.models import HistoricalRecords

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

    class Meta:
        unique_together = ('sample_id',)

    def __str__(self):
        return f"Sample {self.sample_id} - Label {self.label_id}"


class EcgSamplesSnomed(models.Model):
    sample_id = models.ForeignKey(EcgSamples, on_delete=models.CASCADE, related_name='snomed_labels')
    label_id = models.ForeignKey(EcgSnomed, on_delete=models.CASCADE, related_name='samples')

    def __str__(self):
        return f"Sample {self.sample_id} - Label {self.label_id}"
    


class EcgSampleValidation(models.Model):
    """Tracks pending validations of ECG samples."""
    sample = models.ForeignKey(EcgSamples, on_delete=models.CASCADE, related_name='validations')
    have_been_validated = models.BooleanField(default=False)
    prev_tag = models.ForeignKey(EcgDocLabels, on_delete=models.CASCADE, related_name='prev_tag', blank=True, null=True)
    new_tag = models.ForeignKey(EcgDocLabels, on_delete=models.CASCADE, related_name='new_tag', blank=True, null=True)

    class Meta:
        unique_together = ('sample',)
        ordering = ['sample']

    def __str__(self):
        return f"Validation for Sample {self.sample.sample_id}"


class ValidationHistory(models.Model):
    """Tracks the history of validations."""
    validation = models.ForeignKey(EcgSampleValidation, on_delete=models.CASCADE, related_name='history')
    validated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='validation_history')
    sample = models.ForeignKey(EcgSamples, on_delete=models.CASCADE, related_name='validation_history')
    prev_tag = models.ForeignKey(EcgDocLabels, on_delete=models.CASCADE, related_name='history_prev_tag')
    new_tag = models.ForeignKey(EcgDocLabels, on_delete=models.CASCADE, related_name='history_new_tag')
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Validation history for Sample {self.sample.sample_id} by {self.validated_by.username}"


# ---------------------------------------- [User Models] ----------------------------------------
# Django's built-in User model provides login/logout functionality and user authentication. 
# Extend it with a Profile model if additional fields are needed.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Additional fields for user profiles
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=10,
        choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')],
        blank=True,
        null=True
    )
    role = models.CharField(
        max_length=10,
        choices=[('student', 'Student'), ('teacher', 'Teacher')],
        default='student'
    )

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
    """Represents a possible answer to a question."""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Choice for {self.question}: {self.text[:30]}..."


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


class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.teacher.username}"


class GroupMembership(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='memberships')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['group', 'student']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.student.username} - {self.group.name} ({self.status})"
