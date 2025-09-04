from django.core.management.base import BaseCommand
from ecg_app.Ai.difficulty_clustering import recalculate_difficulty

class Command(BaseCommand):
    help = 'Recalculate difficulty level for each ECG sample using KMeans clustering'

    def handle(self, *args, **kwargs):
        recalculate_difficulty()
