from django.core.management.base import BaseCommand
from ecg_app.models import EcgDocLabels
import os

class Command(BaseCommand):
    help = 'Populates EcgDocLabels from doc_labels.txt file'

    def handle(self, *args, **options):
        # Get the absolute path to doc_labels.txt
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        file_path = '/dataset/doc/doc_labels.txt'

        try:
            with open(file_path, 'r') as file:
                labels = [line.strip() for line in file if line.strip()]

            # Create labels in the database
            for label in labels:
                EcgDocLabels.objects.get_or_create(label_desc=label)
                self.stdout.write(self.style.SUCCESS(f'Successfully added label: {label}'))

            self.stdout.write(self.style.SUCCESS(f'Successfully populated {len(labels)} labels'))

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
