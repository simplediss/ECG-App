import os

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.auth import api_csrf, api_login, api_logout, api_user_status, api_register, api_password_reset_request, api_password_reset_confirm
from .views.group import GroupViewSet, GroupMembershipViewSet, GroupMembershipRequestViewSet
from .views.image import serve_ecg_image
from .views.profile import ProfileByUsernameView, ProfileViewSet, update_user_profile
from .views.quiz import CheckAnswerView, QuizAttemptViewSet, QuizViewSet
from .views.templates import home, view_ecg_samples, view_ecg_samples_snomed, view_ecg_snomed, view_users, view_quizzes, view_quiz_attempts
from .views.statistics import UserStatisticsView
from .views.validation import EcgSampleValidationViewSet


DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'


router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profiles')
router.register(r'quizzes', QuizViewSet, basename='quizzes')
router.register(r'quiz-attempts', QuizAttemptViewSet, basename='quiz-attempts')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'group-memberships', GroupMembershipViewSet, basename='group-membership')
router.register(r'group-requests', GroupMembershipRequestViewSet, basename='group-request')
router.register(r'validations', EcgSampleValidationViewSet, basename='validation')


urlpatterns = [
    path('api/', include(router.urls)),
    # Authentication API endpoints
    path('api/auth/csrf/', api_csrf, name='api_csrf'),
    path('api/auth/login/', api_login, name='api_login'),
    path('api/auth/logout/', api_logout, name='api_logout'),
    path('api/auth/user-status/', api_user_status, name='api_user_status'),
    path('api/auth/register/', api_register, name='api_register'),
    path('api/auth/password-reset/', api_password_reset_request, name='api_password_reset_request'),
    path('api/auth/password-reset/confirm/', api_password_reset_confirm, name='api_password_reset_confirm'),
    # User Management API endpoints
    path('api/user-profile/<int:profile_id>/', update_user_profile, name='update_user_profile'),
    path('api/profiles/by-username/<str:username>/', ProfileByUsernameView.as_view(), name='profile-by-username'),
    # Statistics API endpoint
    path('api/statistics/user/<int:user_id>/', UserStatisticsView.as_view(), name='user-statistics'),
    # General API endpoints
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
