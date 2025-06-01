from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('basic_signup', views.basic_signup, name='basic_signup'),
    path('verify_token', views.verify_token, name='verify_token'),
    path('csrf-cookie', views.get_csrf_token, name='csrf-cookie'),
    
    # Profile and settings endpoints
    path('profile', views.profile_view, name='profile'),
    path('update_profile', views.update_profile, name='update_profile'),
    path('update_settings', views.update_settings, name='update_settings'),
    path('user_settings', views.user_settings, name='user_settings'),
    path('account_deletion', views.account_deletion, name='account_deletion'),
    path('cancel_deletion', views.cancel_deletion, name='cancel_deletion'),
    
    # Health data endpoints
    path('health_data', views.health_data_view, name='health_data'),
    path('get_health_recommendation', views.get_health_recommendation, name='get_health_recommendation'),
    path('HealthFacts', views.HealthFacts, name='health_facts'),
    path('weekly_summary', views.get_weekly_summary, name='weekly_summary'),
    path('get_metrics', views.get_metrics_view, name='get_metrics'),
    path('metrics_chart/<str:metric_type>', views.metrics_chart_view, name='metrics_chart'),
    
    # Individual metric endpoints
    path('step_data', views.get_step_data, name='step_data'),
    path('heart_data', views.get_heart_data, name='heart_data'),
    path('sleep_data', views.get_sleep_data, name='sleep_data'),
    path('weight_data', views.get_weight_data, name='weight_data'),
    path('calories_data', views.get_calories_data, name='calories_data'),
    path('activity_data', views.get_activity_data, name='activity_data'),
    
    # Additional features
    path('get_doctor_report', views.get_doctor_report, name='get_doctor_report'),
    path('download_health_data', views.download_health_data, name='download_health_data'),
    path('check_openai_status', views.check_openai_status, name='check_openai_status'),
    path('add_metric', views.add_metric_view, name='add_metric'),
    
    # Google integration
    path('google_login', views.google_login, name='google_login'),
    path('google_callback', views.google_callback, name='google_callback'),
    path('google_status', views.google_status, name='google_status'),
    path('connect_google_fit', views.connect_google_fit, name='connect_google_fit'),
    path('google_fit_status', views.google_fit_status, name='google_fit_status'),
    
    # Support and FAQ
    path('support_contact', views.support_contact, name='support_contact'),
    path('get_faqs', views.get_faqs, name='get_faqs'),
]