cd backend

echo "Migrating..."
python manage.py makemigrations
python manage.py migrate

echo "Populating ECG data..."
python manage.py populate_ecg_data --snomed_csv=$DATASET_SNOMED_PATH --samples_dir=$DATASET_SAMPLES_PATH

echo "Creating users..."
python manage.py create_user --username admin --email admin@example.com --superuser --password admin123 --first_name admin --last_name admin
python manage.py create_user --username teacher --email teacher@example.com --role teacher --password teacher123 --first_name teacher --last_name teacher
python manage.py create_user --username student1 --email student1@example.com --role student --password student123 --first_name student1 --last_name student1
python manage.py create_user --username student2 --email student2@example.com --role student --password student123 --first_name student2 --last_name student2

echo "Starting backend server..."
python manage.py runserver 0.0.0.0:8000