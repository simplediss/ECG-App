cd backend

echo "Migrating..."
python manage.py makemigrations
python manage.py migrate

echo "Populating ECG data..."
python manage.py populate_ecg_data --snomed_csv=$DATASET_SNOMED_PATH --samples_dir=$DATASET_SAMPLES_PATH

echo "Creating users..."
python manage.py create_user --username --superuser $ADMIN_USERNAME --password $ADMIN_PASSWORD --email admin@example.com --first_name admin --last_name admin

echo "Starting backend server..."
python manage.py runserver 0.0.0.0:8000