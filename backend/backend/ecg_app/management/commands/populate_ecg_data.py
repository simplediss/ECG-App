import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from tqdm import tqdm

from ecg_app.models import EcgSamples, EcgSnomed, EcgSamplesSnomed
from ecg_app.data_utils.sample import load_header, get_samples_paths


class Command(BaseCommand):
    help = "Populate EcgSamples, EcgSnomed, and EcgSamplesSnomed tables"

    def add_arguments(self, parser):
        parser.add_argument('--snomed_csv', type=str, help="Path to the SNOMED CSV file")
        parser.add_argument('--samples_dir', type=str, help="Path to the directory containing sample paths")

    def handle(self, *args, **kwargs):
        snomed_csv = kwargs['snomed_csv']
        samples_dir = kwargs['samples_dir']

        if not snomed_csv or not samples_dir:
            self.stderr.write("[!] Both --snomed_csv and --samples_dir are required.")
            return

        self.populate_snomed(snomed_csv)
        self.populate_samples_and_relationships(samples_dir)

    def populate_snomed(self, snomed_csv_path):
        """Populate the EcgSnomed table from the provided CSV file."""
        with open(snomed_csv_path, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                label_code = int(row['code'])
                label_desc = row['desc']
                EcgSnomed.objects.get_or_create(label_code=label_code, label_desc=label_desc)

        self.stdout.write(self.style.SUCCESS(f"[+] Populated EcgSnomed table with data from {snomed_csv_path}"))

    def populate_samples_and_relationships(self, samples_dir_path):
        """Populate the EcgSamples and EcgSamplesSnomed tables."""
        
        paths = get_samples_paths(Path(samples_dir_path))
        for sample_path in tqdm(paths, desc='Populating Samples', unit='Sample', ncols=120, leave=False):
            header = load_header(sample_path)

            # Create or get the EcgSamples entry
            ecg_sample, _ = EcgSamples.objects.get_or_create(sample_path=str(sample_path), gender=header.gender, age=header.age)

            # Get SNOMED codes for this sample path
            for code in header.codes:
                try:
                    snomed_label = EcgSnomed.objects.get(label_code=code)
                except EcgSnomed.DoesNotExist:
                    continue

                # Create the relationship in EcgSamplesSnomed
                EcgSamplesSnomed.objects.get_or_create(sample_id=ecg_sample, label_id=snomed_label)

        self.stdout.write(self.style.SUCCESS(f"[+] Populated EcgSamples and EcgSamplesSnomed tables from directory: {samples_dir_path}"))
