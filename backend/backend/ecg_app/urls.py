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
    path('', views.home, name='home'),
    path('samples/', views.view_ecg_samples, name='list_samples'),
    path('snomed/', views.view_ecg_snomed, name='view_ecg_snomed'),
    path('samples-snomed/', views.view_ecg_samples_snomed, name='view_ecg_samples_snomed'),
    path('users/', views.view_users, name='users'),
    path('quizzes/', views.view_quizzes, name='quizzes'),
    path('quiz-attempts/', views.view_quiz_attempts, name='quiz-attempts'),
]
