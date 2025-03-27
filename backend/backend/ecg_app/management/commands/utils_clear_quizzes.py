from django.core.management.base import BaseCommand
from ecg_app.models import Quiz

class Command(BaseCommand):
    help = "Delete all quizzes and their related data (questions, choices, attempts, etc.)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force deletion without confirmation',
        )

    def handle(self, *args, **options):
        quiz_count = Quiz.objects.count()
        
        if quiz_count == 0:
            self.stdout.write(self.style.WARNING('No quizzes found in the database.'))
            return

        if not options['force']:
            confirm = input(f'\nThis will delete all {quiz_count} quizzes and their related data (questions, choices, attempts, etc.).\nAre you sure? [y/N]: ')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING('Operation cancelled.'))
                return

        # Delete all quizzes (related data will be deleted due to CASCADE)
        Quiz.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {quiz_count} quizzes and all related data.')) 