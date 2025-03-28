cd backend

echo "Migrating..."
python manage.py makemigrations
python manage.py migrate

echo "Populating ECG data..."
python manage.py populate_ecg_data --snomed_csv=$DATASET_SNOMED_PATH --samples_dir=$DATASET_SAMPLES_PATH

echo "Creating quizzes..."
python manage.py create_quiz "Quiz 1" --description="Description for Quiz 1" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION
python manage.py create_quiz "Quiz 2" --description="Description for Quiz 2" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION
python manage.py create_quiz "Quiz 3" --description="Description for Quiz 3" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION
python manage.py create_quiz "Quiz 4" --description="Description for Quiz 4" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION
python manage.py create_quiz "Quiz 5" --description="Description for Quiz 5" --num-questions=$QUESTIONS_PER_QUIZ --choices-per-question=$CHOICES_PER_QUESTION

echo "Creating users..."
python manage.py create_user --username admin --email admin@example.com --superuser --password admin123
python manage.py create_user --username teacher --email teacher@example.com --role teacher --password teacher123
python manage.py create_user --username student1 --email student1@example.com --role student --password student123
python manage.py create_user --username student2 --email student2@example.com --role student --password student123

echo "Starting backend server..."
python manage.py runserver 0.0.0.0:8000