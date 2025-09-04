from django.db.models import Avg, Count, Q
from ecg_app.models import QuestionAttempt, EcgSamplesDocLabels, StudentTagMastery
from sklearn.ensemble import RandomForestRegressor
import pandas as pd


def recalculate_tag_mastery():
    """
    Calculates and updates tag-specific mastery levels for each student.
    Uses a regression model to estimate mastery as a percentage (0-100).
    """
    print("📊 Gathering question attempt data for tag-based mastery...")

    # Step 1: Gather relevant data
    attempts = (
        QuestionAttempt.objects
        .filter(question__ecg_sample__doc_labels__isnull=False)
        .values('quiz_attempt__user', 'question__ecg_sample__doc_labels')
        .annotate(
            avg_correct=Avg('is_correct'),
            avg_time=Avg('response_time'),
            total=Count('id')
        )
        .filter(total__gte=3)
    )

    if not attempts:
        print("⚠️ Not enough data to train the model.")
        return

    # Step 2: Build dataset
    rows = []
    for row in attempts:
        rows.append({
            'user_id': row['quiz_attempt__user'],
            'tag_id': row['question__ecg_sample__doc_labels'],
            'avg_correct': float(row['avg_correct']),
            'avg_time': float(row['avg_time']),
            'total_attempts': row['total']
        })

    df = pd.DataFrame(rows)

    # Normalize input values
    df['avg_time'] = df['avg_time'].fillna(df['avg_time'].mean())
    df['avg_correct'] = df['avg_correct'].fillna(0)

    # Step 3: Train a regression model to simulate mastery percentage
    df['mastery_percent'] = df['avg_correct'] * 100  # Simple assumption

    features = df[['avg_correct', 'avg_time', 'total_attempts']]
    target = df['mastery_percent']

    model = RandomForestRegressor(random_state=42)
    model.fit(features, target)
    df['predicted_mastery'] = model.predict(features)

    print("🤖 Model trained and predictions generated.")

    # Step 4: Save mastery values to DB
    updated = 0
    for _, row in df.iterrows():
        mastery_value = min(100.0, max(0.0, float(row['predicted_mastery'])))  # Ensure in 0-100 range

        StudentTagMastery.objects.update_or_create(
            user_id=row['user_id'],
            tag_id=row['tag_id'],
            defaults={'mastery_score': mastery_value}
        )
        updated += 1

    print(f"✅ Updated mastery scores for {updated} student-tag pairs.")
