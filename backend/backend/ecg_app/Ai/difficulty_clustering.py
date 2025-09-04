from django.db.models import Count, Avg, Q
from ecg_app.models import EcgSamples, QuestionAttempt
from sklearn.cluster import KMeans
import pandas as pd


def recalculate_difficulty(n_clusters=5, min_attempts=5):
    """
    Recalculates difficulty level for each ECG sample using KMeans clustering.
    Difficulty is based on:
    - Error rate (1 - accuracy)
    - Average response time
    Only samples with at least `min_attempts` attempts are included.
    """

    print("📊 Extracting features for ECG samples...")

    # Aggregate performance data per ECG sample via QuestionAttempt
    samples = (
        QuestionAttempt.objects.values('question__ecg_sample')
        .annotate(
            total=Count('id'),
            correct=Count('id', filter=Q(is_correct=True)),
            avg_time=Avg('response_time')
        )
        .filter(total__gte=min_attempts)
    )

    if not samples:
        print("⚠️ Not enough data to run KMeans.")
        return

    data = []
    ids = []

    for s in samples:
        accuracy = s['correct'] / s['total']
        time = s['avg_time'] or 0
        sample_id = s['question__ecg_sample']
        ids.append(sample_id)
        data.append([1 - accuracy, time])  # Features: [error_rate, avg_time]

    features = pd.DataFrame(data, columns=['error_rate', 'avg_time'])

    print(f"🔍 Clustering {len(ids)} samples using KMeans...")

    # Apply KMeans clustering
    model = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = model.fit_predict(features)
    
    # Rank clusters by difficulty (error_rate + avg_time)
    features['cluster'] = clusters
    features['sample_id'] = ids
    cluster_difficulty = (
        features.groupby('cluster')[['error_rate', 'avg_time']]
        .mean()
        .assign(difficulty_score=lambda df: df['error_rate'] + df['avg_time'])
        .sort_values('difficulty_score')
    )

    cluster_to_difficulty_level = {
        cluster_id: rank for rank, cluster_id in enumerate(cluster_difficulty.index)
    }
    # Save difficulty level to the database
    updated = 0
    for i, sample_id in enumerate(ids):
        try:
            sample = EcgSamples.objects.get(sample_id=sample_id)  # use sample_id (custom PK)
            sample.difficulty_level = cluster_to_difficulty_level[clusters[i]]
            sample.save()
            updated += 1
        except EcgSamples.DoesNotExist:
            continue

    print(f"✅ Difficulty levels updated for {updated} samples.")
