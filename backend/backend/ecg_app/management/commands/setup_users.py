from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates admin and guest users'

    def handle(self, *args, **kwargs):
        # Create admin user
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('Admin user created successfully'))

        # Create guest user
        if not User.objects.filter(username='guest').exists():
            User.objects.create_user('guest', 'guest@example.com', 'guest123')
            self.stdout.write(self.style.SUCCESS('Guest user created successfully')) 