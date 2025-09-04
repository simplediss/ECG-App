from django.core.management.base import BaseCommand
from ecg_app.Ai.student_level_estimation import recalculate_student_levels

class Command(BaseCommand):
    help = 'Recalculate student levels using ML model based on past quiz attempts'

    def handle(self, *args, **options):
        self.stdout.write("🔄 Running student level estimation...")
        try:
            recalculate_student_levels()
            self.stdout.write(self.style.SUCCESS("✅ Student levels updated successfully."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error occurred: {str(e)}"))
