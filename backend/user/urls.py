from django.urls import path
from . import views

urlpatterns = [
    path("index", views.index, name = 'index'),
    path("save", views.save_json, name = 'save_json'),
    path('login', views.login_view, name = 'login'),
    path('signup', views.signup_view, name = 'signup'),
    path('basic_signup', views.basic_signup, name = 'basic_signup'),
    path('explain-health', views.explain_health_metrics, name='explain_health'),
<<<<<<< HEAD
    path('metric-help', views.get_metric_help, name='metric_help'),
=======
>>>>>>> interactive-user-ai-sesh
    path('verify', views.verify_token, name = 'verify'),
    path('recommendations', views.get_health_recommendation, name='recommendations'),
    path('health_data', views.health_data_view, name='health_data'),
    path('step_data', views.get_step_data, name='step_data'), 
    path('sleep_data', views.get_sleep_data, name='sleep_data'),
    path('activity_data', views.get_activity_data, name='activity_data'),
    path('weekly_summary', views.get_weekly_summary, name='weekly_summary'),
    path('csrf-cookie', views.get_csrf),
    path('last_data', views.fetch_last_day_health_data, name='last_data'),
    path('facts', views.HealthFacts, name='facts'),
#    path('recommendations', views.health_recommendations, name='recommendations'),
    ]
# add the logout function in the views and update here
# add the get_csrf function in the views and update here