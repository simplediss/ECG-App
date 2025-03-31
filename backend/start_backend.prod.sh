cd backend

echo "Migrating..."
python manage.py makemigrations
python manage.py migrate

echo "Populating ECG data..."
python manage.py populate_ecg_data --snomed_csv=$DATASET_SNOMED_PATH --samples_dir=$DATASET_SAMPLES_PATH

echo "Populating doc labels..."
python manage.py populate_doc_labels --labels_file=$DATASET_DOC_LABELS_PATH --samples_csv=$DATASET_DOC_SAMPLES_PATH

echo "Creating users..."
python manage.py create_user --superuser --username $ADMIN_USERNAME --password $ADMIN_PASSWORD --email admin@example.com --first_name admin --last_name admin

echo "Starting backend server with Gunicorn..."
gunicorn -c ../gunicorn_config.py ecg_backend.wsgi:application