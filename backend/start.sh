#!/bin/bash

# Exit on error
set -e

echo "Waiting for database..."
# Wait for database to be ready (if using external database)
sleep 5

echo "Applying migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting gunicorn..."
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 8 --timeout 0