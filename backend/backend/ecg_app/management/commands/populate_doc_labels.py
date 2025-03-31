import os
import csv

from django.core.management.base import BaseCommand
from ecg_app.models import EcgDocLabels, EcgSamples, EcgSamplesDocLabels


class Command(BaseCommand):
    help = 'Populates EcgDocLabels and EcgSamplesDocLabels from provided files'

    def add_arguments(self, parser):
        parser.add_argument('--labels_file', type=str, help="Path to the doc_labels.txt file")
        parser.add_argument('--samples_csv', type=str, help="Path to the sample_name_to_doc_label_balanced_400.csv file")

    def handle(self, *args, **kwargs):
        labels_file = kwargs['labels_file']
        samples_csv = kwargs['samples_csv']

        if not labels_file or not samples_csv:
            self.stderr.write("[!] Both --labels_file and --samples_csv are required.")
            return

        self.populate_doc_labels(labels_file)
        self.populate_sample_relationships(samples_csv)

    def populate_doc_labels(self, labels_file_path):
        """Populate the EcgDocLabels table from the provided text file."""
        try:
            with open(labels_file_path, 'r') as file:
                labels = [line.strip() for line in file if line.strip()]

            for label in labels:
                EcgDocLabels.objects.get_or_create(label_desc=label)

            self.stdout.write(self.style.SUCCESS(f"[+] Populated EcgDocLabels table with data from {labels_file_path}"))

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"[!] File not found: {labels_file_path}"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"[!] Error: {str(e)}"))

    def populate_sample_relationships(self, samples_csv_path):
        """Populate the EcgSamplesDocLabels table from the provided CSV file."""
        try:
            # Create a dictionary of sample names to EcgSamples objects
            samples_dict = {
                sample.sample_path.split('/')[-1]: sample 
                for sample in EcgSamples.objects.all()
            }

            # Create a dictionary of label descriptions to EcgDocLabels objects
            labels_dict = {
                label.label_desc: label 
                for label in EcgDocLabels.objects.all()
            }

            with open(samples_csv_path, 'r') as file:
                csv_reader = csv.reader(file)
                next(csv_reader)  # Skip header row if exists
                
                success_count = 0
                error_count = 0
                missing_samples = set()
                missing_labels = set()

                for row in csv_reader:
                    if len(row) != 2:
                        error_count += 1
                        continue

                    sample_name = row[0].strip()
                    doc_label = row[1].strip()[1:-1]
                    
                    # Get the corresponding sample and label objects
                    sample = samples_dict.get(sample_name)
                    label = labels_dict.get(doc_label)
                    
                    if sample and label:
                        try:
                            EcgSamplesDocLabels.objects.get_or_create(
                                sample_id=sample,
                                label_id=label
                            )
                            success_count += 1
                        except Exception as e:
                            self.stderr.write(self.style.ERROR(f'[!] Error creating relationship for {sample_name}: {str(e)}'))
                            error_count += 1
                    else:
                        error_count += 1
                        if not sample:
                            missing_samples.add(sample_name)
                        if not label:
                            missing_labels.add(doc_label)

                # Report missing samples
                display_missing_samples = False  # set to True for debugging
                if missing_samples:
                    if display_missing_samples:
                        self.stderr.write(self.style.WARNING(f"[!] Missing samples ({len(missing_samples)}):"))
                        for sample in sorted(missing_samples)[:10]:  # Show first 10
                            self.stderr.write(f"    - {sample}")
                        if len(missing_samples) > 10:
                            self.stderr.write(f"    ... and {len(missing_samples) - 10} more")
                    else:
                        self.stderr.write(self.style.WARNING(f"[!] Missing {len(missing_samples)} samples"))


                # Report missing labels
                display_missing_labels = False  # set to True for debugging
                if missing_labels:
                    if display_missing_labels:
                        self.stderr.write(self.style.WARNING(f"[!] Missing labels ({len(missing_labels)}):"))
                        for label in sorted(missing_labels)[:10]:  # Show first 10
                            self.stderr.write(f"    - {label}")
                        if len(missing_labels) > 10:
                            self.stderr.write(f"    ... and {len(missing_labels) - 10} more")
                    else:
                        self.stderr.write(self.style.WARNING(f"[!] Missing {len(missing_labels)} labels"))

            self.stdout.write(self.style.SUCCESS(
                f"[+] Successfully populated {success_count} relationships. "
                f"Failed to create {error_count} relationships."
            ))

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"[!] File not found: {samples_csv_path}"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"[!] Error: {str(e)}"))
