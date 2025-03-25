"""This command is used to create a new quiz with ECG samples and SNOMED labels."""
from django.core.management.base import BaseCommand
from django.db import transaction
from ecg_app.models import Quiz, Question, Choice, EcgSamples, EcgSnomed, EcgSamplesSnomed
import random


class Command(BaseCommand):
    help = "Create a new quiz with ECG samples and SNOMED labels"

    def add_arguments(self, parser):
        parser.add_argument('title', type=str, help='Title of the quiz')
        parser.add_argument('--description', type=str, help='Description of the quiz', default='')
        parser.add_argument('--num-questions', type=int, help='Number of questions to create', default=5)
        parser.add_argument('--choices-per-question', type=int, help='Number of choices per question', default=4)

    def handle(self, *args, **options):
        title = options['title']
        description = options['description']
        num_questions = options['num_questions']
        choices_per_question = options['choices_per_question']

        # Check if we have enough samples
        available_samples = EcgSamples.objects.filter(snomed_labels__isnull=False).distinct()
        if not available_samples.exists():
            self.stderr.write(self.style.ERROR('No ECG samples with SNOMED labels found in the database.'))
            return

        sample_count = available_samples.count()
        if sample_count < num_questions:
            self.stderr.write(self.style.WARNING(
                f'Only {sample_count} samples available. Creating quiz with {sample_count} questions instead of {num_questions}.'
            ))
            num_questions = sample_count

        # Get all SNOMED labels for creating distractors
        all_snomed_labels = list(EcgSnomed.objects.all())
        if len(all_snomed_labels) < choices_per_question:
            self.stderr.write(self.style.ERROR(
                f'Not enough SNOMED labels available. Need at least {choices_per_question} labels.'
            ))
            return

        try:
            with transaction.atomic():
                # Create the quiz
                quiz = Quiz.objects.create(title=title, description=description)
                self.stdout.write(f'Created quiz: {quiz.title}')

                # Create questions
                samples = list(available_samples)
                random.shuffle(samples)
                selected_samples = samples[:num_questions]

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
                    selected_incorrect = random.sample(incorrect_labels, min(choices_per_question - 1, len(incorrect_labels)))

                    for label in selected_incorrect:
                        Choice.objects.create(
                            question=question,
                            text=label.label_desc,
                            is_correct=False
                        )

                question_count = quiz.questions.count()
                self.stdout.write(self.style.SUCCESS(
                    f'Successfully created quiz "{title}" with {question_count} questions.'
                ))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error creating quiz: {str(e)}'))