from django.core.management.base import BaseCommand
from ecg_app.models import QuizAttempt, QuestionAttempt

class Command(BaseCommand):
    help = "Delete all quiz attempts and their related data (question attempts)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force deletion without confirmation',
        )

    def handle(self, *args, **options):
        attempt_count = QuizAttempt.objects.count()
        
        if attempt_count == 0:
            self.stdout.write(self.style.WARNING('No quiz attempts found in the database.'))
            return

        if not options['force']:
            confirm = input(f'\nThis will delete all {attempt_count} quiz attempts and their related data (question attempts).\nAre you sure? [y/N]: ')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING('Operation cancelled.'))
                return

        # Delete all quiz attempts (question attempts will be deleted due to CASCADE)
        QuizAttempt.objects.all().delete()
                
        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {attempt_count} quiz attempts and all related data.')) 