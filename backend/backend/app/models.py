from django.db import models


class Item(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return self.name


class EcgSamples(models.Model):
    sample_id = models.AutoField(primary_key=True)
    sample_path = models.CharField(max_length=255)

    def __str__(self):
        return f"Sample {self.sample_id}"


class EcgDocLabels(models.Model):
    label_id = models.AutoField(primary_key=True)
    label_desc = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.label_desc


class EcgSnomed(models.Model):
    label_id = models.AutoField(primary_key=True)
    label_code = models.IntegerField(unique=True)
    label_desc = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.label_desc


class EcgSamplesDocLabels(models.Model):
    sample_id = models.ForeignKey(EcgSamples, on_delete=models.CASCADE, related_name='doc_labels')
    label_id = models.ForeignKey(EcgDocLabels, on_delete=models.CASCADE, related_name='samples')

    def __str__(self):
        return f"Sample {self.sample_id} - Label {self.label_id}"


class EcgSamplesSnomed(models.Model):
    sample_id = models.ForeignKey(EcgSamples, on_delete=models.CASCADE, related_name='snomed_labels')
    label_id = models.ForeignKey(EcgSnomed, on_delete=models.CASCADE, related_name='samples')

    def __str__(self):
        return f"Sample {self.sample_id} - Label {self.label_id}"
