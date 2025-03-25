"""This command clears all users from the database"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from ecg_app.models import Profile, QuizAttempt, UserStatistics

class Command(BaseCommand):
    help = "Clear all users from the database"

    def handle(self, *args, **kwargs):
        # Delete related data first
        Profile.objects.all().delete()
        QuizAttempt.objects.all().delete()
        UserStatistics.objects.all().delete()
        
        # Delete all users
        user_count = User.objects.count()
        User.objects.all().delete()
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully deleted {user_count} users and their related data!")
        ) 