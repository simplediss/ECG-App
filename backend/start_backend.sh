cd backend
python manage.py makemigrations
python manage.py migrate

# Populate ECG data
python manage.py populate_ecg_data --snomed_csv=$DATASET_SNOMED_PATH --samples_dir=$DATASET_SAMPLES_PATH

# Create quizzes
python manage.py create_quiz "Quiz 1" --description="Description for Quiz 1" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION
python manage.py create_quiz "Quiz 2" --description="Description for Quiz 2" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION
python manage.py create_quiz "Quiz 3" --description="Description for Quiz 3" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION
python manage.py create_quiz "Quiz 4" --description="Description for Quiz 4" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION
python manage.py create_quiz "Quiz 5" --description="Description for Quiz 5" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION

# Populate dummy data
python manage.py populate_dummy_data  # Create dummy users and quizess data

# Run server
python manage.py runserver 0.0.0.0:8000