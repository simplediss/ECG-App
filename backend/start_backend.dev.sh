#cd backend
cd backend
cd backend

echo "Migrating..."
python manage.py makemigrations
python manage.py migrate

echo "Populating ECG data..."
python manage.py populate_ecg_data --snomed_csv=$DATASET_SNOMED_PATH --samples_dir=$DATASET_SAMPLES_PATH

echo "Populating doc labels..."
python manage.py populate_doc_labels --labels_file=$DATASET_DOC_LABELS_PATH --samples_csv=$DATASET_DOC_SAMPLES_PATH

echo "Creating users..."
python manage.py create_user --username admin --email admin@example.com --superuser --password admin123 --first_name adminFN --last_name adminLN
python manage.py create_user --username teacher --email teacher@example.com --role teacher --password teacher123 --first_name teacherFN --last_name teacherLN
python manage.py create_user --username student1 --email student1@example.com --role student --password student123 --first_name student1FN --last_name student1LN
python manage.py create_user --username student2 --email student2@example.com --role student --password student123 --first_name student2FN --last_name student2LN

echo "Starting backend server..."
python manage.py runserver 0.0.0.0:8000