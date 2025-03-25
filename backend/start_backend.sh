cd backend
python manage.py makemigrations
python manage.py migrate

# Populate ECG data
python manage.py populate_ecg_data --snomed_csv=$DATASET_SNOMED_PATH --samples_dir=$DATASET_SAMPLES_PATH

# Create quizzes
python manage.py create_quiz "Quiz 1" --description="Description for Quiz 1" --num-questions=5 --choices-per-question=4
python manage.py create_quiz "Quiz 2" --description="Description for Quiz 2" --num-questions=5 --choices-per-question=4

# Populate dummy data
python manage.py populate_dummy_data  # Create dummy users and quizess data

# Run server
python manage.py runserver 0.0.0.0:8000