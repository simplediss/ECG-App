from django.core.management.base import BaseCommand
from ecg_app.models import EcgSamples, EcgSampleValidation, EcgSamplesDocLabels

class Command(BaseCommand):
    help = 'Initialize validation table with all sample IDs'

    def handle(self, *args, **options):
        # Get all samples
        samples = EcgSamples.objects.all()
        created_count = 0
        updated_count = 0

        for sample in samples:
            # Get the current label if it exists
            current_label = None
            try:
                current_label = sample.doc_labels.first().label_id
            except (AttributeError, EcgSamplesDocLabels.DoesNotExist):
                pass

            # Create or update validation entry
            validation, created = EcgSampleValidation.objects.update_or_create(
                sample=sample,
                defaults={
                    'have_been_validated': False,
                    'prev_tag': current_label,
                    'new_tag': None
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully initialized validations: {created_count} created, {updated_count} updated'
            )
        ) 