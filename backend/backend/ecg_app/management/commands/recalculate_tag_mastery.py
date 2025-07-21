from django.core.management.base import BaseCommand
from ecg_app.Ai.tag_mastery_estimation import recalculate_tag_mastery  

class Command(BaseCommand):
    help = 'Recalculate student mastery per ECG tag using regression model'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("🔄 Starting tag-based mastery recalculation..."))
        recalculate_tag_mastery()
        self.stdout.write(self.style.SUCCESS("✅ Done. Mastery values updated."))
