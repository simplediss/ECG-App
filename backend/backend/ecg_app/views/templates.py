
from django.core.paginator import Paginator
from django.contrib.auth.models import User
from django.shortcuts import render

from ..models import (
    EcgSamples, EcgSnomed, EcgSamplesSnomed, User, Quiz, QuizAttempt
)


ITEMS_PER_PAGE = 50
    
# ---------------------------------------- [Home templates View] ----------------------------------------

def home(request):
    links = [
        {'name': 'Samples', 'url': '/samples/'},
        {'name': 'SNOMED', 'url': '/snomed/'},
        {'name': 'Samples-SNOMED', 'url': '/samples-snomed/'},
        {'name': 'Users', 'url': '/users/'},
        {'name': 'Quizzes', 'url': '/quizzes/'},
        {'name': 'Quiz Attempts', 'url': '/quiz-attempts/'},
    ]
    return render(request, 'home.html', {'links': links})


# ---------------------------------------- [ECG Data templates views] ----------------------------------------

def view_ecg_samples(request):
    samples = EcgSamples.objects.all()

    # Pagination logic
    paginator = Paginator(samples, ITEMS_PER_PAGE)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_ecg_samples.html', {'page_obj': page_obj})


def view_ecg_snomed(request):
    snomed_labels = EcgSnomed.objects.all()
    
    # Pagination logic
    paginator = Paginator(snomed_labels, ITEMS_PER_PAGE)  # 100 items per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_ecg_snomed.html', {'page_obj': page_obj})


def view_ecg_samples_snomed(request):
    relationships = EcgSamplesSnomed.objects.select_related('sample_id', 'label_id')

    # Pagination logic
    paginator = Paginator(relationships, ITEMS_PER_PAGE)  # 100 items per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_ecg_samples_snomed.html', {'page_obj': page_obj})


# ---------------------------------------- [User and Quiz template views] ----------------------------------------


def view_users(request):
    users = User.objects.all()
    
    # Pagination logic
    paginator = Paginator(users, ITEMS_PER_PAGE)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_users.html', {'page_obj': page_obj})


def view_quizzes(request):
    quizzes = Quiz.objects.all()
    
    # Pagination logic
    paginator = Paginator(quizzes, ITEMS_PER_PAGE)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_quizzes.html', {'page_obj': page_obj})


def view_quiz_attempts(request):
    quiz_attempts = QuizAttempt.objects.all()
    
    # Pagination logic
    paginator = Paginator(quiz_attempts, ITEMS_PER_PAGE)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'view_quiz_attempts.html', {'page_obj': page_obj})
