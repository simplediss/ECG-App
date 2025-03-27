from django.utils import timezone
from django.db.models import Count, Avg
from .models import Quiz, Question, Choice, EcgSamples, EcgSnomed, QuizAttempt, QuestionAttempt
import random
from datetime import timedelta
import math


class QuizGenerator:
    """Base class for quiz generation strategies."""
    
    def __init__(self, user):
        self.user = user
        self.available_samples = EcgSamples.objects.filter(snomed_labels__isnull=False).distinct()
        self.all_snomed_labels = list(EcgSnomed.objects.all())

    def validate_requirements(self):
        """Validate if there are enough samples and labels to generate a quiz."""
        if not self.available_samples.exists():
            raise ValueError('No ECG samples available')
        
        if len(self.all_snomed_labels) < 4:
            raise ValueError('Not enough SNOMED labels available')
        
        return True

    def create_quiz(self, title, description):
        """Create a new quiz with the given title and description."""
        return Quiz.objects.create(
            title=title,
            description=description
        )

    def create_question(self, quiz, sample, question_text):
        """Create a question for the given quiz and sample."""
        return Question.objects.create(
            quiz=quiz,
            ecg_sample=sample,
            question_text=question_text
        )

    def create_choices(self, question, correct_label, incorrect_labels):
        """Create choices for a question, including one correct and multiple incorrect choices."""
        # Create the correct choice
        Choice.objects.create(
            question=question,
            text=correct_label.label_desc,
            is_correct=True
        )

        # Create incorrect choices (distractors)
        for label in incorrect_labels:
            Choice.objects.create(
                question=question,
                text=label.label_desc,
                is_correct=False
            )


class RandomQuizGenerator(QuizGenerator):
    """Generates a quiz with random questions and choices."""
    
    def __init__(self, user, num_questions=5):
        super().__init__(user)
        self.num_questions = num_questions

    def generate(self):
        """Generate a random quiz."""
        self.validate_requirements()

        # Create quiz with timestamp-based title
        current_time = timezone.now()
        quiz_title = f"{self.user.username}_{current_time.strftime('%Y%m%d_%H%M%S')}"
        quiz = self.create_quiz(
            title=quiz_title,
            description=f"A randomly generated quiz for {self.user.username}"
        )

        # Select random samples
        samples = list(self.available_samples)
        random.shuffle(samples)
        selected_samples = samples[:self.num_questions]

        # Create questions and choices
        for sample in selected_samples:
            # Get the correct SNOMED labels for this sample
            correct_labels = list(EcgSnomed.objects.filter(samples__sample_id=sample))
            if not correct_labels:
                continue

            # Choose one correct label randomly
            correct_label = random.choice(correct_labels)

            # Create the question
            question = self.create_question(
                quiz=quiz,
                sample=sample,
                question_text="What is the correct diagnosis for this ECG?"
            )

            # Create incorrect choices (distractors)
            incorrect_labels = [label for label in self.all_snomed_labels if label not in correct_labels]
            selected_incorrect = random.sample(incorrect_labels, min(3, len(incorrect_labels)))

            # Create all choices
            self.create_choices(question, correct_label, selected_incorrect)

        return quiz


class PersonalizedQuizGenerator(QuizGenerator):
    """Generates a personalized quiz based on user's performance history."""
    
    def __init__(self, user, num_questions=5, personalization_weight=0.7, recency_weight=0.5):
        super().__init__(user)
        self.num_questions = num_questions
        self.personalization_weight = personalization_weight  # How much to weight personalization vs randomness
        self.recency_weight = recency_weight  # How much to weight recent attempts vs older ones

    def get_user_performance_by_label(self):
        """Calculate user's performance for each SNOMED label."""
        # Get all question attempts for the user
        attempts = QuestionAttempt.objects.filter(
            quiz_attempt__user=self.user,
            quiz_attempt__completed_at__isnull=False
        ).select_related('question__ecg_sample')

        # Calculate time-based weights for recent attempts
        now = timezone.now()
        max_age = timedelta(days=30)  # Maximum age to consider for weighting

        label_performance = {}
        for attempt in attempts:
            # Get the correct label for this question
            correct_label = attempt.question.ecg_sample.snomed_labels.first()
            if not correct_label:
                continue

            # Calculate time-based weight (exponential decay)
            age = now - attempt.quiz_attempt.completed_at
            if age > max_age:
                time_weight = 0.1  # Minimum weight for old attempts
            else:
                time_weight = math.exp(-self.recency_weight * age.days / max_age.days)

            # Update performance for this label
            if correct_label not in label_performance:
                label_performance[correct_label] = {
                    'correct': 0,
                    'total': 0,
                    'weighted_correct': 0,
                    'weighted_total': 0
                }

            performance = label_performance[correct_label]
            performance['total'] += 1
            performance['weighted_total'] += time_weight
            if attempt.is_correct:
                performance['correct'] += 1
                performance['weighted_correct'] += time_weight

        # Calculate final performance scores
        for label, data in label_performance.items():
            if data['total'] > 0:
                data['score'] = data['correct'] / data['total']
                data['weighted_score'] = data['weighted_correct'] / data['weighted_total']
            else:
                data['score'] = 0.5  # Default score for labels with no attempts
                data['weighted_score'] = 0.5

        return label_performance

    def get_personalization_factor(self):
        """Calculate how much to personalize based on user's history."""
        # Get total number of completed quizzes
        total_quizzes = QuizAttempt.objects.filter(
            user=self.user,
            completed_at__isnull=False
        ).count()

        # Gradually increase personalization as user takes more quizzes
        # Start with 0.3 personalization and increase to personalization_weight
        min_personalization = 0.3
        max_quizzes = 10  # Number of quizzes to reach max personalization
        personalization = min_personalization + (self.personalization_weight - min_personalization) * min(1, total_quizzes / max_quizzes)

        return personalization

    def select_samples(self, label_performance):
        """Select samples based on user's performance and personalization factor."""
        personalization = self.get_personalization_factor()
        samples = list(self.available_samples)
        random.shuffle(samples)

        # Calculate weights for each sample
        sample_weights = []
        for sample in samples:
            # Get the correct label for this sample
            correct_label = sample.snomed_labels.first()
            if not correct_label:
                continue

            # Get performance for this label
            performance = label_performance.get(correct_label, {'weighted_score': 0.5})
            
            # Calculate weight (lower performance = higher weight)
            weight = 1 - performance['weighted_score']
            
            # Mix with random weight based on personalization factor
            random_weight = random.random()
            final_weight = personalization * weight + (1 - personalization) * random_weight
            
            sample_weights.append((sample, final_weight))

        # Sort by weight and select top samples
        sample_weights.sort(key=lambda x: x[1], reverse=True)
        selected_samples = [sample for sample, _ in sample_weights[:self.num_questions]]
        return selected_samples

    def generate(self):
        """Generate a personalized quiz based on user's performance history."""
        self.validate_requirements()

        # Create quiz with timestamp-based title
        current_time = timezone.now()
        quiz_title = f"{self.user.username}_{current_time.strftime('%Y%m%d_%H%M%S')}"
        quiz = self.create_quiz(
            title=quiz_title,
            description=f"A personalized quiz for {self.user.username}"
        )

        # Get user's performance history
        label_performance = self.get_user_performance_by_label()

        # Select samples based on performance
        selected_samples = self.select_samples(label_performance)

        # Create questions and choices
        for sample in selected_samples:
            # Get the correct SNOMED labels for this sample
            correct_labels = list(EcgSnomed.objects.filter(samples__sample_id=sample))
            if not correct_labels:
                continue

            # Choose one correct label randomly
            correct_label = random.choice(correct_labels)

            # Create the question
            question = self.create_question(
                quiz=quiz,
                sample=sample,
                question_text="What is the correct diagnosis for this ECG?"
            )

            # Create incorrect choices (distractors)
            incorrect_labels = [label for label in self.all_snomed_labels if label not in correct_labels]
            selected_incorrect = random.sample(incorrect_labels, min(3, len(incorrect_labels)))

            # Create all choices
            self.create_choices(question, correct_label, selected_incorrect)

        return quiz 