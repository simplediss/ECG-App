"""This command is used to print all quizzes with their questions and choices."""
from django.core.management.base import BaseCommand
from django.utils.termcolors import colorize
from ecg_app.models import Quiz, Question, Choice

class Command(BaseCommand):
    help = 'Prints all quizzes with their questions and choices'

    def add_arguments(self, parser):
        parser.add_argument(
            '--plain',
            action='store_true',
            help='Disable colored output and use plain text',
        )

    def handle(self, *args, **options):
        use_color = not options['plain']
        quizzes = Quiz.objects.all().order_by('id')
        
        if not quizzes.exists():
            self.stdout.write(self.style.WARNING('No quizzes found in the database.'))
            return

        for quiz in quizzes:
            # Print quiz header
            quiz_header = f"\nQuiz #{quiz.id}: {quiz.title}"
            if use_color:
                self.stdout.write(self.style.SUCCESS('=' * len(quiz_header)))
                self.stdout.write(self.style.SUCCESS(quiz_header))
                self.stdout.write(self.style.SUCCESS('=' * len(quiz_header)))
            else:
                self.stdout.write('=' * len(quiz_header))
                self.stdout.write(quiz_header)
                self.stdout.write('=' * len(quiz_header))

            # Print quiz description if it exists
            if quiz.description:
                self.stdout.write(f"Description: {quiz.description}")
            self.stdout.write(f"Created: {quiz.created_at}")

            # Get questions for this quiz
            questions = Question.objects.filter(quiz=quiz).order_by('id')
            
            if not questions.exists():
                self.stdout.write(self.style.WARNING('\nNo questions in this quiz.'))
                continue

            # Print each question and its choices
            for question in questions:
                # Print question
                question_text = f"\nQuestion #{question.id}: {question.question_text}"
                if use_color:
                    self.stdout.write(self.style.NOTICE(question_text))
                else:
                    self.stdout.write(question_text)

                # Get choices for this question
                choices = Choice.objects.filter(question=question).order_by('id')
                
                if not choices.exists():
                    self.stdout.write(self.style.WARNING('  No choices for this question.'))
                    continue

                # Print each choice
                for choice in choices:
                    choice_text = f"  {'[✓]' if choice.is_correct else '[ ]'} {choice.text}"
                    if use_color:
                        if choice.is_correct:
                            self.stdout.write(self.style.SUCCESS(choice_text))
                        else:
                            self.stdout.write(choice_text)
                    else:
                        self.stdout.write(choice_text)

            self.stdout.write('\n' + '-' * 80)  # Separator between quizzes 