# ECG App

A modern web application for ECG (Electrocardiogram) learning. This application provides a user-friendly interface for taking ECG classification quizzes.

## Features

- Support teacher and student profiles to manage groups
- Personalized ECG quizzes, that provides questionsbased on the studetn's knowladge
- Secure user authentication
- Modern, responsive web interface
- Docker-based deployment for easy setup

## Technology Stack

### Backend

- Django: Python web framework for building robust APIs
- Django REST Framework: Toolkit for building Web APIs
- PostgreSQL: Reliable and powerful open-source database

### Frontend

- React: Modern JavaScript library for building user interfaces
- Material-UI: React component library implementing Google's Material Design
- Axios: Promise-based HTTP client for API requests

### Infrastructure

- Docker: Containerization platform for consistent development and deployment
- Docker Compose: Tool for defining and running multi-container applications
- Nginx: High-performance web server and reverse proxy
- Gunicorn: Python WSGI HTTP Server for production deployment

## Project Structure

```
ECG-App/
├── backend/         # Python backend service
├── frontend/        # React frontend application
├── scripts/         # Utility scripts
├── dataset/         # ECG dataset storage
└── ssl/            # SSL certificates (for production)
```

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### Development Environment

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ECG-App
   ```
2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```
3. Start the development environment:

   ```bash
   sh scripts/dev/start_app.sh
   ```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Production Deployment

1. Set up SSL certificates in the `ssl/` directory
2. Configure environment variables in `.env`
3. Provide the server `IP` and domain parameters in `backend/backend/ecg_backend/settings.py`
4. Build and start the production containers:
   ```bash
   sh scrips/prod/start_app.sh
   ```
