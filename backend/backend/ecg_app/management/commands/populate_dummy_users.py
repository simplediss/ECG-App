import os
import random

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from ecg_app.models import (
    Profile, Quiz, Question, Choice, QuizAttempt,
    QuestionAttempt, UserStatistics, EcgSamples
)

DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

class Command(BaseCommand):
    help = "Populate the database with dummy users"

    def handle(self, *args, **kwargs):

        if not DEBUG:
            self.stdout.write(self.style.WARNING("DEBUG is False, skipping dummy data population"))
            return

        # Create admin user
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('Admin user created successfully'))

        # Add users
        for i in range(2):
            username = f"user{i+1}"
            user, created = User.objects.get_or_create(
                username=f"user{i+1}",
                email=f"user{i+1}@example.com",
                first_name=f"User {i+1}",
                last_name=f"Last Name {i+1}",
                is_staff=random.choice([True, False]),
            )
            if created:
                user.set_password("password")
                user.save()
                Profile.objects.get_or_create(user=user)

        self.stdout.write(self.style.SUCCESS("Dummy data populated successfully!"))
