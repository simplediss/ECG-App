"""This command lists all users with their details"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from ecg_app.models import Profile

class Command(BaseCommand):
    help = 'Lists all users with their details'

    def handle(self, *args, **kwargs):
        users = User.objects.all()
        
        if not users.exists():
            self.stdout.write(self.style.WARNING('No users found in the database.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Found {users.count()} users:\n'))
        
        for user in users:
            try:
                profile = user.profile
                stats = user.statistics
                
                self.stdout.write(self.style.SUCCESS(f'User: {user.username}'))
                self.stdout.write(f'  ID: {user.id}')
                self.stdout.write(f'  Email: {user.email}')
                self.stdout.write(f'  Password hash: {user.password}')
                self.stdout.write(f'  First Name: {user.first_name or "Not set"}')
                self.stdout.write(f'  Last Name: {user.last_name or "Not set"}')
                self.stdout.write(f'  Date of Birth: {profile.date_of_birth or "Not set"}')
                self.stdout.write(f'  Gender: {profile.gender or "Not set"}')
                self.stdout.write(f'  Is Staff: {user.is_staff}')
                self.stdout.write(f'  Is Active: {user.is_active}')
                self.stdout.write(f'  Date Joined: {user.date_joined}')
                self.stdout.write(f'  Last Login: {user.last_login or "Never"}')
                self.stdout.write(f'  Statistics:')
                self.stdout.write(f'    Total Quizzes Taken: {stats.total_quizzes_taken}')
                self.stdout.write(f'    Total Correct Answers: {stats.total_correct_answers}')
                self.stdout.write(f'    Total Questions Answered: {stats.total_questions_answered}')
                self.stdout.write(f'    Accuracy: {stats.accuracy}%')
                self.stdout.write('-' * 50 + '\n')
                
            except Profile.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User {user.username} has no profile.'))
