from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import numpy as np
from django.contrib.auth.models import User
from ecg_app.models import QuizAttempt, QuestionAttempt, Profile, EcgDocLabels, StudentTagMastery

def recalculate_student_levels():
    print("🧠 Running student level estimation...")

    # Step 1: Collect training data
    X_train, y_train = [], []
    user_features = {}
    
    for user in User.objects.all():
        attempts = QuestionAttempt.objects.filter(quiz_attempt__user=user)
        if not attempts.exists():
            continue

        avg_response_time = attempts.aggregate(avg_time=models.Avg('response_time'))['avg_time'] or 0
        correct_ratio = attempts.aggregate(correct_avg=models.Avg(models.Case(
            models.When(is_correct=True, then=1),
            default=0,
            output_field=models.FloatField()
        )))['correct_avg'] or 0

        total_attempts = attempts.count()

        # For training: check if this user already has a labeled level
        profile = getattr(user, 'profile', None)
        if profile and profile.student_level is not None:
            X_train.append([avg_response_time, correct_ratio, total_attempts])
            y_train.append(profile.student_level)
        
        user_features[user.id] = [avg_response_time, correct_ratio, total_attempts]

    if not X_train:
        print("⚠️ No training data available.")
        return

    # Step 2: Train model
    model = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    model.fit(X_train, y_train)

    # Step 3: Predict levels for all users
    for user_id, features in user_features.items():
        predicted_level = model.predict([features])[0]
        profile = Profile.objects.get(user__id=user_id)
        profile.student_level = predicted_level
        profile.save()

    print("✅ Student levels updated successfully.")
