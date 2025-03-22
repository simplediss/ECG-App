from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter()
router.register(r'ecg-samples', views.EcgSamplesViewSet, basename='ecg-samples')
router.register(r'ecg-doc-labels', views.EcgDocLabelsViewSet, basename='ecg-doc-labels')
router.register(r'ecg-snomed', views.EcgSnomedViewSet, basename='ecg-snomed')
router.register(r'ecg-samples-doc-labels', views.EcgSamplesDocLabelsViewSet, basename='ecg-samples-doc-labels')
router.register(r'ecg-samples-snomed', views.EcgSamplesSnomedViewSet, basename='ecg-samples-snomed')
router.register(r'profiles', views.ProfileViewSet, basename='profiles')
router.register(r'statistics', views.UserStatisticsViewSet, basename='statistics')
router.register(r'quizzes', views.QuizViewSet, basename='quizzes')
router.register(r'questions', views.QuestionViewSet, basename='questions')
router.register(r'choices', views.ChoiceViewSet, basename='choices')
router.register(r'quiz-attempts', views.QuizAttemptViewSet, basename='quiz-attempts')
router.register(r'question-attempts', views.QuestionAttemptViewSet, basename='question-attempts')


urlpatterns = [
    path('api/', include(router.urls)),
    # Authentication API endpoints
    path('api/auth/csrf/', views.api_csrf, name='api_csrf'),
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/user-status/', views.api_user_status, name='api_user_status'),
    path('api/register/', views.api_register, name='api_register'),
    # Template views
    path('', views.home, name='home'),
    path('samples/', views.view_ecg_samples, name='list_samples'),
    path('snomed/', views.view_ecg_snomed, name='view_ecg_snomed'),
    path('samples-snomed/', views.view_ecg_samples_snomed, name='view_ecg_samples_snomed'),
    path('users/', views.view_users, name='users'),
    path('quizzes/', views.view_quizzes, name='quizzes'),
    path('quiz-attempts/', views.view_quiz_attempts, name='quiz-attempts'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('user-status/', views.user_status_view, name='user_status'),
]
