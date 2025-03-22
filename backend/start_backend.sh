cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py populate_ecg_data --snomed_csv=$DATASET_SNOMED_PATH --samples_dir=$DATASET_SAMPLES_PATH
python manage.py populate_dummy_data  # Create dummy users and quizess data
python manage.py setup_users  # Create dummy admin and guest users
python manage.py runserver 0.0.0.0:8000