import logging
import os
import openai
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.utils.timezone import now
from django.views.decorators.csrf import ensure_csrf_cookie
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
import requests
from django.utils.crypto import get_random_string

from .models import DailyHealthData, UserCredentials, UserSettings, AccountDeletion
from .serializers import DailydataSerializer
from .utils import fetch_and_save_health_data

logger = logging.getLogger(__name__)

openai.api_key = settings.OPENAI_API_KEY


def index(request):
    return HttpResponse("Welcome to HealthRecEngine")


def _get_openai_response(prompt, user='system'):
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a health and fitness expert translating health metrics "
                        f"to plain English for the user ({user}) on their health app."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_completion_tokens=500,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return "Unable to generate recommendation due to API error."


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_cookie(request):
    csrf_token = get_token(request)
    response = Response({'detail': 'CSRF cookie set', 'csrfToken': csrf_token})
    response['X-CSRFToken'] = csrf_token
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def basic_signup(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"error": "Username and password are required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        user = User.objects.create_user(username=username, email=username, password=password)

        # Seed initial health data so the dashboard isn't empty
        today = now().date()
        for i in range(7):
            date = today - timedelta(days=i)
            DailyHealthData.objects.update_or_create(
                user=user,
                date=date,
                defaults={
                    'steps': 3000 + (i * 500),
                    'heart_rate': 65 + (i % 3),
                    'sleep': 6 + (i % 2),
                    'weight': 58 - (i * 0.2),
                    'activity': {'walking': 40 + i * 2, 'running': 15 + (i % 3) * 5},
                    'activity_minutes': (40 + i * 2) + (15 + (i % 3) * 5),
                    'calories': 250 + i * 20,
                },
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "message": "Signup successful",
            "token": token.key,
            "user": {
                "username": user.username,
                "name": user.username.split('@')[0],
                "email": user.email,
            },
        }, status=200)

    except Exception as e:
        logger.error(f"Error in basic_signup: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "message": "Login successful",
                "token": token.key,
                "user": {
                    "username": user.username,
                    "name": user.first_name or user.username.split('@')[0],
                    "email": user.email,
                },
            }, status=200)
        return Response({"error": "Invalid credentials"}, status=401)
    except Exception as e:
        logger.error(f"Error in login_view: {e}")
        return Response({"error": "Login failed"}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({"message": "Logged out successfully"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    return Response({"message": "Token is valid!"})


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def google_login(request):
    try:
        credentials_path = os.path.join(settings.BASE_DIR, 'user', 'credentials.json')
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=[
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/fitness.activity.read',
                'https://www.googleapis.com/auth/fitness.heart_rate.read',
                'https://www.googleapis.com/auth/fitness.sleep.read',
                'https://www.googleapis.com/auth/fitness.body.read',
            ],
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
        )
        auth_url, _ = flow.authorization_url(access_type='offline', include_granted_scopes='true')
        return Response({"authUrl": auth_url})
    except Exception as e:
        logger.error(f"Error in google_login: {e}")
        return Response({"error": "Failed to initiate Google login"}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_callback(request):
    try:
        code = request.data.get('code')
        if not code:
            return Response({'error': 'No authorization code provided'}, status=400)

        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
                'redirect_uri': 'postmessage',
                'grant_type': 'authorization_code',
            },
        )
        if not token_response.ok:
            logger.error(f"Token exchange failed: {token_response.status_code} - {token_response.text}")
            return Response({'error': 'Failed to exchange code for token', 'details': token_response.text}, status=400)

        access_token = token_response.json().get('access_token')

        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'},
        )
        if not userinfo_response.ok:
            return Response({'error': 'Failed to get user info from Google'}, status=400)

        userinfo = userinfo_response.json()
        email = userinfo.get('email')
        if not email:
            return Response({'error': 'No email provided by Google'}, status=400)

        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': userinfo.get('given_name', ''),
                'last_name': userinfo.get('family_name', ''),
                'password': get_random_string(32),
            },
        )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'username': user.username,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username.split('@')[0],
                'email': user.email,
            },
        })

    except Exception as e:
        logger.error(f"Error in google_callback: {e}", exc_info=True)
        return Response({'error': str(e)}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_view(request):
    """OAuth signup — exchanges Google auth code and fetches Google Fit data."""
    code = request.data.get('code')
    if not code:
        return Response({"error": "Missing auth code"}, status=400)
    try:
        credentials_path = os.path.join(settings.BASE_DIR, 'user', 'credentials.json')
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=[
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/fitness.activity.read',
                'https://www.googleapis.com/auth/fitness.heart_rate.read',
                'https://www.googleapis.com/auth/fitness.sleep.read',
                'https://www.googleapis.com/auth/fitness.body.read',
            ],
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
        )
        flow.fetch_token(code=code)
        credentials = flow.credentials
        idinfo = id_token.verify_oauth2_token(credentials.id_token, google_requests.Request())
        email = idinfo['email']
        name_parts = idinfo.get('name', '').split()
        user, _ = User.objects.get_or_create(
            username=email,
            defaults={
                'first_name': name_parts[0] if name_parts else '',
                'last_name': name_parts[1] if len(name_parts) > 1 else '',
                'email': email,
            },
        )
        fetch_and_save_health_data(user, credentials)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "message": "Login success",
            "token": token.key,
            "user": {"username": user.username, "name": user.first_name, "email": user.email},
        })
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def google_status(request):
    try:
        credentials = UserCredentials.objects.filter(user=request.user).first()
        if not credentials:
            return Response({"connected": False})
        try:
            id_token.verify_oauth2_token(credentials.access_token, google_requests.Request())
            return Response({"connected": True})
        except Exception:
            return Response({"connected": False})
    except Exception as e:
        logger.error(f"Error in google_status: {e}")
        return Response({"error": "Failed to check Google status"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def connect_google_fit(request):
    try:
        credentials_path = os.path.join(settings.BASE_DIR, 'user', 'credentials.json')
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=[
                'https://www.googleapis.com/auth/fitness.activity.read',
                'https://www.googleapis.com/auth/fitness.heart_rate.read',
                'https://www.googleapis.com/auth/fitness.sleep.read',
                'https://www.googleapis.com/auth/fitness.body.read',
            ],
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
        )
        auth_url, _ = flow.authorization_url(access_type='offline', include_granted_scopes='true')
        return Response({"authUrl": auth_url})
    except Exception as e:
        logger.error(f"Error in connect_google_fit: {e}")
        return Response({"error": "Failed to connect Google Fit"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def google_fit_status(request):
    try:
        credentials = UserCredentials.objects.filter(user=request.user).first()
        if not credentials:
            return Response({"connected": False})
        required_scopes = [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.heart_rate.read',
            'https://www.googleapis.com/auth/fitness.sleep.read',
            'https://www.googleapis.com/auth/fitness.body.read',
        ]
        has_all_scopes = all(scope in (credentials.scopes or {}) for scope in required_scopes)
        return Response({"connected": has_all_scopes})
    except Exception as e:
        logger.error(f"Error in google_fit_status: {e}")
        return Response({"error": "Failed to check Google Fit status"}, status=500)


# ---------------------------------------------------------------------------
# Profile & Settings
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    return Response({
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "date_joined": user.date_joined,
    })


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']
    if 'email' in request.data:
        user.email = request.data['email']
    user.save()
    return Response({"message": "Profile updated successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_settings(request):
    settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
    return Response({
        "notifications_enabled": settings_obj.notifications_enabled,
        "theme": settings_obj.theme,
        "units": settings_obj.units,
    })


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_settings(request):
    settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
    if 'notifications_enabled' in request.data:
        settings_obj.notifications_enabled = request.data['notifications_enabled']
    if 'theme' in request.data:
        settings_obj.theme = request.data['theme']
    if 'units' in request.data:
        settings_obj.units = request.data['units']
    settings_obj.save()
    return Response({"message": "Settings updated successfully"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def account_deletion(request):
    days = request.data.get('days', 30)
    deletion_date = now() + timedelta(days=int(days))
    AccountDeletion.objects.update_or_create(
        user=request.user,
        defaults={'scheduled_date': deletion_date},
    )
    return Response({"message": f"Account scheduled for deletion in {days} days"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_deletion(request):
    AccountDeletion.objects.filter(user=request.user).delete()
    return Response({"message": "Account deletion cancelled"})


# ---------------------------------------------------------------------------
# Health Data
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def health_data_view(request):
    try:
        last_7_days = now().date() - timedelta(days=7)
        data = DailyHealthData.objects.filter(user=request.user, date__gte=last_7_days).order_by('date')
        if not data.exists():
            return Response([
                {
                    "date": (now().date() - timedelta(days=i)).isoformat(),
                    "steps": 0, "heart_rate": 0, "sleep": 0,
                    "weight": 0, "activity_minutes": 0, "calories": 0,
                }
                for i in range(7)
            ])
        return Response(DailydataSerializer(data, many=True).data)
    except Exception as e:
        logger.error(f"Error in health_data_view: {e}")
        return Response({"error": "Failed to fetch health data"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_last_day_health_data(request):
    try:
        recent = DailyHealthData.objects.filter(user=request.user).order_by('-date').first()
        if not recent:
            return Response({"error": "No health data found"}, status=404)
        return Response({
            "date": recent.date,
            "steps": recent.steps,
            "heart_rate": recent.heart_rate,
            "sleep_hours": recent.sleep,
            "activity_minutes": recent.activity_minutes,
            "weight": recent.weight,
            "calories": recent.calories,
        })
    except Exception as e:
        logger.error(f"Error in fetch_last_day_health_data: {e}")
        return Response({"error": "Failed to fetch health data"}, status=500)


def _chart_response(request, field):
    """Return 7-day labels+values for a single field on DailyHealthData."""
    today = now().date()
    last_7_days = today - timedelta(days=6)
    qs = DailyHealthData.objects.filter(
        user=request.user, date__range=[last_7_days, today]
    ).order_by('date')

    labels, values = [], []
    for i in range(7):
        day = last_7_days + timedelta(days=i)
        labels.append(day.strftime("%a"))
        record = qs.filter(date=day).first()
        values.append(getattr(record, field, 0) or 0 if record else 0)
    return Response({"labels": labels, "values": values})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_activity_data(request):
    try:
        return _chart_response(request, 'activity_minutes')
    except Exception as e:
        logger.error(f"Error fetching activity data: {e}")
        return Response({"error": "Failed to fetch activity data"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_step_data(request):
    try:
        return _chart_response(request, 'steps')
    except Exception as e:
        logger.error(f"Error fetching step data: {e}")
        return Response({"error": "Failed to fetch step data"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_heart_data(request):
    try:
        return _chart_response(request, 'heart_rate')
    except Exception as e:
        logger.error(f"Error fetching heart rate data: {e}")
        return Response({"error": "Failed to fetch heart rate data"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_weight_data(request):
    try:
        return _chart_response(request, 'weight')
    except Exception as e:
        logger.error(f"Error fetching weight data: {e}")
        return Response({"error": "Failed to fetch weight data"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_calories_data(request):
    try:
        return _chart_response(request, 'calories')
    except Exception as e:
        logger.error(f"Error fetching calories data: {e}")
        return Response({"error": "Failed to fetch calories data"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_sleep_data(request):
    try:
        return _chart_response(request, 'sleep')
    except Exception as e:
        logger.error(f"Error fetching sleep data: {e}")
        return Response({"error": "Failed to fetch sleep data"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_metrics_view(request):
    try:
        health_data = DailyHealthData.objects.filter(user=request.user, date=now().date()).first()
        if not health_data:
            return Response({"steps": 0, "heart_rate": 0, "sleep": 0, "weight": 0, "activity_minutes": 0, "calories": 0})
        return Response({
            "steps": health_data.steps,
            "heart_rate": health_data.heart_rate,
            "sleep": health_data.sleep,
            "weight": health_data.weight,
            "activity_minutes": health_data.activity_minutes,
            "calories": health_data.calories,
        })
    except Exception as e:
        logger.error(f"Error in get_metrics_view: {e}")
        return Response({"error": "Failed to fetch metrics"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def metrics_chart_view(request, metric_type):
    field_map = {
        'steps': 'steps',
        'heart_rate': 'heart_rate',
        'sleep': 'sleep',
        'weight': 'weight',
        'calories': 'calories',
        'activity': 'activity_minutes',
    }
    field = field_map.get(metric_type)
    if not field:
        return Response({"error": f"Unknown metric type: {metric_type}"}, status=400)
    try:
        return _chart_response(request, field)
    except Exception as e:
        logger.error(f"Error in metrics_chart_view: {e}")
        return Response({"error": "Failed to fetch chart data"}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_metric_view(request):
    try:
        metric = request.data.get('metric')
        value = request.data.get('value')

        if not metric or value is None:
            return Response({"error": "Missing required fields: metric and value"}, status=400)

        health_data, _ = DailyHealthData.objects.get_or_create(
            user=request.user,
            date=now().date(),
            defaults={'steps': 0, 'heart_rate': 0, 'sleep': 0, 'weight': 0, 'activity_minutes': 0, 'calories': 0},
        )

        field_map = {
            'steps': 'steps',
            'heartRate': 'heart_rate',
            'sleep': 'sleep',
            'weight': 'weight',
            'calories': 'calories',
            'activeMinutes': 'activity_minutes',
        }
        field = field_map.get(metric)
        if not field:
            return Response({"error": f"Unknown metric: {metric}"}, status=400)

        setattr(health_data, field, value)
        health_data.save()
        return Response({"message": "Metric added successfully"})
    except Exception as e:
        logger.error(f"Error in add_metric_view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_health_data(request):
    try:
        fmt = request.query_params.get('format', 'json')
        data = DailyHealthData.objects.filter(user=request.user).order_by('-date')
        serializer = DailydataSerializer(data, many=True)

        if fmt == 'csv':
            import csv
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="health_data.csv"'
            writer = csv.writer(response)
            writer.writerow(['Date', 'Steps', 'Heart Rate', 'Sleep', 'Weight', 'Activity Minutes', 'Calories'])
            for item in serializer.data:
                writer.writerow([
                    item['date'], item['steps'], item['heart_rate'],
                    item['sleep'], item['weight'], item['activity_minutes'], item['calories'],
                ])
            return response

        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in download_health_data: {e}")
        return Response({"error": "Failed to download data"}, status=500)


# ---------------------------------------------------------------------------
# AI / Recommendations
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_health_recommendation(request):
    try:
        user = request.user
        last_7_days = now().date() - timedelta(days=7)
        health_data = DailyHealthData.objects.filter(user=user, date__gte=last_7_days).order_by('-date')

        if not health_data.exists():
            return Response({
                "recommendations": {
                    "general": {
                        "summary": "No data yet. Add your health metrics to get personalised recommendations.",
                        "insights": ["Start tracking daily steps.", "Log your sleep each morning.",
                                     "Record your heart rate regularly.", "Add weight data weekly."],
                        "tips": ["Enable Google Fit sync for automatic tracking."],
                    },
                    "correlation": ["Connect your devices to see correlations."],
                    "tips": ["Enable Google Fit sync for real-time monitoring."],
                }
            })

        data_str = "\n".join(
            f"Date: {e.date}, Steps: {e.steps}, HR: {e.heart_rate}, Sleep: {e.sleep}h, "
            f"Weight: {e.weight}kg, Activity: {e.activity_minutes}min, Calories: {e.calories}"
            for e in health_data
        )

        prompts = {
            "general": (
                f"Based on:\n{data_str}\n"
                "Provide a 2-3 sentence summary then 4 bullet insights. "
                "Format with 'Summary:' and 'Insights:' sections."
            ),
            "correlation": f"Based on:\n{data_str}\nProvide 4 health correlation insights.",
            "tips": f"Based on:\n{data_str}\nProvide 4 personalised health tips.",
        }
        recommendations = {key: _get_openai_response(prompt, user.username) for key, prompt in prompts.items()}

        general_text = recommendations.get('general', '')
        if isinstance(general_text, str):
            try:
                summary_part = general_text.split('Insights:')[0].replace('Summary:', '').strip()
                insights_raw = general_text.split('Insights:')[1].strip()
                insights = [l.strip().lstrip('-•0123456789. ') for l in insights_raw.split('\n') if l.strip()]
                recommendations['general'] = {
                    "summary": summary_part,
                    "insights": insights[:4],
                    "tips": [l.strip() for l in recommendations.get('tips', '').split('\n') if l.strip()][:4],
                }
            except Exception:
                recommendations['general'] = {
                    "summary": general_text,
                    "insights": [],
                    "tips": [],
                }

        if isinstance(recommendations.get('correlation'), str):
            recommendations['correlation'] = [
                l.strip() for l in recommendations['correlation'].split('\n') if l.strip()
            ][:4]

        if isinstance(recommendations.get('tips'), str):
            recommendations['tips'] = [
                l.strip() for l in recommendations['tips'].split('\n') if l.strip()
            ][:4]

        return Response({"recommendations": recommendations})

    except Exception as e:
        logger.error(f"Error in get_health_recommendation: {e}")
        return Response({
            "recommendations": {
                "general": {
                    "summary": "An error occurred while generating recommendations.",
                    "insights": ["Please try again later."],
                    "tips": [],
                },
                "correlation": [],
                "tips": [],
            }
        }, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def HealthFacts(request):
    try:
        user = request.user
        last_7_days = now().date() - timedelta(days=7)
        health_data = DailyHealthData.objects.filter(user=user, date__gte=last_7_days).order_by('-date')

        if not health_data.exists():
            return Response({"facts": ["No data yet — start tracking to see personalised health facts."]})

        data_str = "\n".join(
            f"Date: {e.date}, Steps: {e.steps}, HR: {e.heart_rate}, Sleep: {e.sleep}h"
            for e in health_data
        )
        raw = _get_openai_response(
            f"Based on:\n{data_str}\nProvide 7 interesting personalised health facts about this user.",
            user.username,
        )
        facts = [l.strip() for l in raw.split('\n') if l.strip()]
        return Response({"facts": facts})

    except Exception as e:
        logger.error(f"Error in HealthFacts: {e}")
        return Response({"facts": ["Unable to generate health facts right now."]}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def explain_health_metrics(request):
    try:
        user_input = request.data.get('message', '')
        prompt = (
            f'As a friendly health advisor, the user says: "{user_input}"\n'
            "Please:\n"
            "1. Explain what each measurement means in simple terms\n"
            "2. State whether the values are within normal range\n"
            "3. Describe what the values suggest about health\n"
            "4. Give simple lifestyle recommendations if needed\n"
            "5. Advise whether to consult a healthcare provider\n"
            "Make your response conversational and easy to understand."
        )
        response = _get_openai_response(prompt)
        disclaimer = (
            "\n\nNote: This is for informational purposes only and is not a substitute for "
            "professional medical advice. Always consult a healthcare provider for diagnosis and treatment."
        )
        return Response({"explanation": response + disclaimer})

    except Exception as e:
        logger.error(f"Error in explain_health_metrics: {e}")
        return Response({"error": "Could not process your question. Please try rephrasing."}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_weekly_summary(request):
    try:
        user = request.user
        last_7_days = now().date() - timedelta(days=7)
        data = DailyHealthData.objects.filter(user=user, date__gte=last_7_days)

        if not data.exists():
            return Response({
                "summary": ["No activity data available", "No sleep data available", "No heart rate data available"],
                "trends": {"steps": 0, "sleep": 0, "heart_rate": 0, "weight": 0, "calories": 0, "active_minutes": 0},
                "status": "no_data",
            })

        count = data.count()
        total_steps = sum(d.steps or 0 for d in data)
        avg_sleep = sum(d.sleep or 0 for d in data) / count
        avg_hr = sum(d.heart_rate or 0 for d in data) / count
        total_active = sum(d.activity_minutes or 0 for d in data)
        total_calories = sum(d.calories or 0 for d in data)
        latest_weight = data.last().weight or 0

        return Response({
            "summary": [
                _get_openai_response(
                    f"One-line summary: I had {total_active} active minutes and {total_steps} steps this week."
                ).strip(),
                _get_openai_response(
                    f"One-line summary: I averaged {round(avg_sleep, 1)} hours of sleep per night this week."
                ).strip(),
                _get_openai_response(
                    f"One-line summary: My average heart rate was {round(avg_hr, 1)} bpm this week."
                ).strip(),
            ],
            "trends": {
                "steps": total_steps,
                "sleep": round(avg_sleep, 1),
                "heart_rate": round(avg_hr, 1),
                "weight": round(latest_weight, 1),
                "calories": round(total_calories, 1),
                "active_minutes": total_active,
            },
            "status": "success",
        })

    except Exception as e:
        logger.error(f"Error in get_weekly_summary: {e}")
        return Response({"error": "Failed to generate weekly summary", "details": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_doctor_report(request):
    try:
        email = request.data.get('email')
        metrics = request.data.get('metrics', [])
        custom_notes = request.data.get('custom_notes', '')

        if not email:
            return Response({"error": "Email is required"}, status=400)

        prompt = (
            f"Generate a detailed health report for a doctor based on these metrics: {metrics}. "
            f"Additional notes: {custom_notes}"
        )
        report = _get_openai_response(prompt)

        send_mail(
            'Your Health Report',
            report,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return Response({"message": "Report sent successfully"})

    except Exception as e:
        logger.error(f"Error in get_doctor_report: {e}")
        return Response({"error": f"Failed to send report: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_openai_status(request):
    try:
        openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "ping"}],
            max_completion_tokens=5,
        )
        return Response({"status": "online"})
    except Exception as e:
        logger.error(f"OpenAI status check failed: {e}")
        return Response({"status": "offline"})


# ---------------------------------------------------------------------------
# Support & FAQ
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def support_contact(request):
    try:
        name = request.data.get('name')
        email = request.data.get('email')
        message = request.data.get('message')

        if not all([name, email, message]):
            return Response({"error": "All fields are required"}, status=400)

        send_mail(
            f'Support Request from {name}',
            f"From: {email}\n\n{message}",
            settings.DEFAULT_FROM_EMAIL,
            [settings.SUPPORT_EMAIL],
            fail_silently=False,
        )
        return Response({"message": "Message sent successfully"})

    except Exception as e:
        logger.error(f"Error in support_contact: {e}")
        return Response({"error": "Failed to send message"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_faqs(request):
    faqs = [
        {
            "question": "How do I track my health metrics?",
            "answer": "Use the '+' button on the metrics page to add your health data.",
        },
        {
            "question": "How often should I update my metrics?",
            "answer": "We recommend updating daily for the most accurate insights.",
        },
        {
            "question": "How are AI recommendations generated?",
            "answer": "Our AI analyses your health data patterns to provide personalised recommendations.",
        },
    ]
    return Response(faqs)
