import os

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.auth import *
from .views.ecg_data import *
from .views.group import *
from .views.image import *
from .views.profile import *
from .views.quiz import *
from .views.templates import *


DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'


router = DefaultRouter()
router.register(r'ecg-samples', EcgSamplesViewSet, basename='ecg-samples')
router.register(r'ecg-doc-labels', EcgDocLabelsViewSet, basename='ecg-doc-labels')
router.register(r'ecg-snomed', EcgSnomedViewSet, basename='ecg-snomed')
router.register(r'ecg-samples-doc-labels', EcgSamplesDocLabelsViewSet, basename='ecg-samples-doc-labels')
router.register(r'ecg-samples-snomed', EcgSamplesSnomedViewSet, basename='ecg-samples-snomed')
router.register(r'profiles', ProfileViewSet, basename='profiles')
router.register(r'quizzes', QuizViewSet, basename='quizzes')
router.register(r'questions', QuestionViewSet, basename='questions')
router.register(r'choices', ChoiceViewSet, basename='choices')
router.register(r'quiz-attempts', QuizAttemptViewSet, basename='quiz-attempts')
router.register(r'question-attempts', QuestionAttemptViewSet, basename='question-attempts')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'group-memberships', GroupMembershipViewSet, basename='group-membership')
router.register(r'group-requests', GroupMembershipRequestViewSet, basename='group-request')


urlpatterns = [
    path('api/', include(router.urls)),
    # Authentication API endpoints
    path('api/auth/csrf/', api_csrf, name='api_csrf'),
    path('api/auth/login/', api_login, name='api_login'),
    path('api/auth/logout/', api_logout, name='api_logout'),
    path('api/auth/user-status/', api_user_status, name='api_user_status'),
    path('api/register/', api_register, name='api_register'),
    # User Management API endpoints
    path('api/user-profile/<int:profile_id>/', update_user_profile, name='update_user_profile'),
    # GeneralAPI endpoints
    path('api/check-answer/', CheckAnswerView.as_view(), name='check-answer'),
    # Image serving endpoint - handle both with and without .png extension
    path('api/images/<path:image_path>.png', serve_ecg_image, name='serve_ecg_image'),
    path('api/images/<path:image_path>', serve_ecg_image, name='serve_ecg_image_no_ext'),
]

if DEBUG:
    # Template views - This will be displayed on the backend url
    urlpatterns += [
        path('', home, name='home'),
        path('samples/', view_ecg_samples, name='list_samples'),
        path('snomed/', view_ecg_snomed, name='view_ecg_snomed'),
        path('samples-snomed/', view_ecg_samples_snomed, name='view_ecg_samples_snomed'),
        path('users/', view_users, name='users'),
        path('quizzes/', view_quizzes, name='quizzes'),
        path('quiz-attempts/', view_quiz_attempts, name='quiz-attempts'),
    ]
