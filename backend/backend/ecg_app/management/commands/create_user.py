from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from ecg_app.models import Profile
from django.utils import timezone
import getpass

class Command(BaseCommand):
    help = 'Creates a new user with specified role (student/teacher)'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Username for the new user')
        parser.add_argument('--email', type=str, help='Email for the new user')
        parser.add_argument('--first_name', type=str, help='First name for the new user')
        parser.add_argument('--last_name', type=str, help='Last name for the new user')
        parser.add_argument('--role', type=str, choices=['student', 'teacher'], help='Role for the new user (student/teacher)')
        parser.add_argument('--superuser', action='store_true', help='Create a superuser (admin)')
        parser.add_argument('--password', type=str, help='Password for the new user (if not provided, will prompt)')

    def handle(self, *args, **options):
        username = options.get('username')
        email = options.get('email')
        first_name = options.get('first_name')
        last_name = options.get('last_name')
        role = options.get('role')
        is_superuser = options.get('superuser')
        password = options.get('password')

        # If no username provided, prompt for it
        if not username:
            username = input('Enter username: ')

        # If no email provided, prompt for it
        if not email:
            email = input('Enter email: ')

        # If no first name provided, prompt for it
        if not first_name:
            first_name = input('Enter first name: ')

        # If no last name provided, prompt for it
        if not last_name:
            last_name = input('Enter last name: ')

        # If no role provided and not superuser, prompt for it
        if not role and not is_superuser:
            role = input('Enter role (student/teacher): ').lower()
            while role not in ['student', 'teacher']:
                role = input('Invalid role. Enter role (student/teacher): ').lower()

        # Get password
        if not password:
            password = getpass.getpass('Enter password: ')
            password_confirm = getpass.getpass('Confirm password: ')
            if password != password_confirm:
                self.stdout.write(self.style.ERROR('Passwords do not match!'))
                return

        try:
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_superuser=is_superuser,
                is_staff=is_superuser
            )

            # Create profile
            if not is_superuser:
                Profile.objects.create(
                    user=user,
                    role=role
                )

            role_text = 'superuser' if is_superuser else role
            self.stdout.write(self.style.SUCCESS(f'Successfully created {role_text} user "{username}"'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating user: {str(e)}')) 