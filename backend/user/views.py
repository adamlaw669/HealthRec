import json
import logging
import os
import openai
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from django.template import loader
from django.utils.timezone import now
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import requests
from rest_framework.authtoken.models import Token as RefreshToken
from django.utils.crypto import get_random_string

from .models import *
from .serializers import *
from .utils import *
logger = logging.getLogger(__name__)

openai.api_key = settings.OPENAI_API_KEY
#genai.configure(api_key="AIzaSyCQh37XW3rvi6A37orv7zAs25gT2xcjIes")

def index(request):
    user = request.user
    # credentials =  UserCredentials.objects.get(user=user)
    # user_cred = get_user_credentials(user)# us
    return HttpResponse(f"hello: {user}, Welcome to HealthRecEngine")

def save_json(request): 
    user = request.user
    credentials = download_cred(user)
    credentials.save()
    return HttpResponse("saved")

def get_openai_response(prompt, user = 'No username'):
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"You are a health and fitness expert translating health metrics and roles to English laymen can understand and interpret their own health metrics. The responses are shown to the user ({user}) on his/her app."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_completion_tokens=500
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return "Unable to generate recommendation due to API error."

@api_view(["POST"])
#@permission_classes([IsAuthenticated])
def get_health_recommendation(request):
    try:
        username = request.data.get("username")
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        last_7_days = now().date() - timedelta(days=7)
        health_data = DailyHealthData.objects.filter(user=user, date__gte=last_7_days).order_by('-date')
        if not health_data.exists(): 
            return Response({
                "recommendations": {
                    "general": {
                        "summary": "No sufficient data available for recommendations.",
                        "insights": ["Connect your health tracking devices to get personalized recommendations."],
                        "tips": ["Start tracking your daily activities to receive personalized insights."]
                    },
                    "correlation": ["Connect your devices to see correlations between different health metrics."],
                    "tips": ["Enable Google Fit sync for real-time health monitoring."]
                }
            })
            
        data_str = "\n".join(
            f"Date: {entry.date}, Steps: {entry.steps}, HR: {entry.heart_rate}, Sleep: {entry.sleep}h, Weight: {entry.weight}kg, Activity: {entry.activity}, Calories: {entry.calories}"
            for entry in health_data
        )
        prompts = {
            "general": f"Based on the following health data:\n{data_str}\nFirst provide a 2-3 sentence summary of the user's health status and main recommendations. Then provide 4 specific actionable insights as bullet points. Format the response with 'Summary:' and 'Insights:' sections.",
            "correlation": f"Based on the following health data:\n{data_str}\nProvide 4 lines of health correlation insights based on your health data patterns.",
            "tips": f"Based on the following health data:\n{data_str}\nProvide 4 lines of Personalized tips based on the health metrics and patterns"
        }
        recommendations = {key: get_openai_response(prompt, username) for key, prompt in prompts.items()}
        
        # Process general recommendations to split into summary and insights
        if isinstance(recommendations.get('general'), str):
            general_text = recommendations['general']
            try:
                # Split into summary and insights sections
                summary_part = general_text.split('Insights:')[0].replace('Summary:', '').strip()
                insights_part = general_text.split('Insights:')[1].strip()
                insights = [line.strip().replace('-', '').strip() for line in insights_part.split('\n') if line.strip()]
                
                recommendations['general'] = {
                    "summary": summary_part,
                    "insights": insights[:4],  # Ensure we only have 4 insights
                    "tips": recommendations.get('tips', '').split('\n')[:4]  # Add tips from the tips prompt
                }
            except Exception as e:
                logger.error(f"Error processing general recommendations: {e}")
                # Fallback if parsing fails
                recommendations['general'] = {
                    "summary": "Here are your personalized health recommendations based on your recent data.",
                    "insights": [line.strip() for line in general_text.split('\n') if line.strip()][:4],
                    "tips": recommendations.get('tips', '').split('\n')[:4]
                }
        
        # Process correlation insights
        if isinstance(recommendations.get('correlation'), str):
            recommendations['correlation'] = [line.strip() for line in recommendations['correlation'].split('\n') if line.strip()][:4]
            
        # Process tips
        if isinstance(recommendations.get('tips'), str):
            recommendations['tips'] = [line.strip() for line in recommendations['tips'].split('\n') if line.strip()][:4]
                
        return Response({"recommendations": recommendations}, status=200)
    except Exception as e:
        logger.error(f"Error in get_health_recommendation: {e}")
        return Response({
            "recommendations": {
                "general": {
                    "summary": "An error occurred while generating recommendations.",
                    "insights": ["Please try again later."],
                    "tips": ["Check your connection and try again."]
                },
                "correlation": ["Unable to generate correlation insights."],
                "tips": ["Unable to generate personalized tips."]
            }
        }, status=500)
        

    

@api_view(["POST"])
def HealthFacts(request):
    try:
        username = request.data.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        last_7_days = now().date() - timedelta(days=7)
        health_data = DailyHealthData.objects.filter(user=user, date__gte=last_7_days).order_by('-date')
        if not health_data.exists(): 
            return Response({
                "facts": ["No sufficient data available for recommendations."]
            })
            
        data_str = "\n".join(
            f"Date: {entry.date}, Steps: {entry.steps}, HR: {entry.heart_rate}, Sleep: {entry.sleep}h, Weight: {entry.weight}kg, Activity: {entry.activity}, Calories: {entry.calories}"
            for entry in health_data
        )
        prompts = {
            "facts": f"Based on the following health data:\n{data_str}\nProvide 7 lines of personalized health facts about the user's health(could be cool, simple and informative).",
        }
                
        facts = get_openai_response(prompts["facts"])
        # Split facts into array and clean up
        facts_array = [line.strip() for line in facts.split('\n') if line.strip()]
        return Response({"facts": facts_array})
        
    except Exception as e:
        logger.error(f"Error in HealthFacts: {e}")
        return Response({
            "facts": ["An error occurred while generating health facts."]
        }, status=500)


@api_view(["POST"])
def explain_health_metrics(request):
    try:
        user_input = request.data.get('message', '')  # Get the user's natural language input
        
        # Common terms mapping to help identify metrics
        common_terms = {
            'sys': 'blood_pressure_systolic',
            'systolic': 'blood_pressure_systolic',
            'dia': 'blood_pressure_diastolic',
            'diastolic': 'blood_pressure_diastolic',
            'bp': 'blood_pressure',   
            'hr': 'heart_rate',
            'pulse': 'heart_rate',
            'sugar': 'blood_sugar',
            'glucose': 'blood_sugar',
            'temp': 'body_temperature',
            'temperature': 'body_temperature',
            'oxygen': 'oxygen_saturation',
            'o2': 'oxygen_saturation',
            'spo2': 'oxygen_saturation',
            'breathing': 'respiratory_rate',
            'breath': 'respiratory_rate'
        }

        # Extract numbers and their context from user input
        prompt = f"""As a friendly health advisor, I need help with the following:

        User's input: "{user_input}"
        Please provide:
        1. Explain what each measurement or siunit means in simple terms (Very important)
        2. Whether this/these number(s) is/are within normal range(s) (Very important)
        3. What this/these number(s) suggest about their health
        4. Simple lifestyle recommendations if needed
        5. Clear advice on whether they should consult a healthcare provider
        
        Make the response conversational and easy to understand, as if you're explaining to a friend.
        If any terms are medical or technical, please explain them in parentheses.

        """

        response = get_openai_response(prompt)
        
        # Add a note about medical advice
        disclaimer = ("\n\nPlease note: This is for informational purposes only and not a substitute for "
                     "professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.")

        return Response({
            "explanation": response + disclaimer,
            "understood_metrics": common_terms  
        })

    except Exception as e:
        logger.error(f"Error in explain_health_metrics: {e}")
        return Response({
            "error": "I couldn't process your question. Please try rephrasing it.",
            "details": str(e)
        }, status=500)

    
@api_view(["POST"])
def signup_view(request):
    from google_auth_oauthlib.flow import Flow
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    import os

    code = request.data.get('code')
    if not code:
        return Response({"error": "Missing auth code"}, status=400)

    try:
        # Get credentials file path from user app directory
        credentials_path = os.path.join(settings.BASE_DIR, 'user', 'credentials.json')
        
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=[
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/fitness.activity.read',
                'https://www.googleapis.com/auth/fitness.heart_rate.read',
                'https://www.googleapis.com/auth/fitness.sleep.read',
                'https://www.googleapis.com/auth/fitness.body.read'
            ],
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Get user info
        idinfo = id_token.verify_oauth2_token(credentials.id_token, google_requests.Request())
        email = idinfo['email']
        name = idinfo.get('name', '')
        name_parts = name.split() #to split user's name into first and last name
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user, _ = User.objects.get_or_create(username=email, defaults={"first_name": first_name,"last_name": last_name, "email": email})
        login(request, user)

        fetch_and_save_health_data(user, credentials)

        return Response({
            "message": "Login success",
            "user": {"username": user.username, "name": user.first_name}
        })

    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(["POST"])
def basic_signup(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({"error": "Username and password are required"}, status=400)
            
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)
            
        user = User.objects.create_user(username=username, password=password)
        today = now().date()
        
        # Create initial health data
        for i in range(7):
            date = today - timedelta(days=i)
            DailyHealthData.objects.update_or_create(
                user=user,
                date=date,
                defaults={
                    'steps': 3000 + (i * 500),  # increasing steps
                    'heart_rate': 65 + (i % 3),  # slight HR variation
                    'sleep': 6 + (i % 2),  # 6-7 hours
                    'weight': 58 - (i * 0.2),  # slight weight drop
                    'activity': {
                        'walking': 40 + i * 2,
                        'running': 15 + (i % 3) * 5,
                        'cycling': 20 + (i % 2) * 10
                    },
                    'activity_minutes': (40+i*2)+(15+(i%3)*5)+(20+(i%2)*10),
                    'calories': 250 + i * 20
                }
            )
            
        if user is not None:
            login(request, user)
            return Response({
                "message": "Signup successful",
                "user": {
                    "username": user.username,
                    "email": user.email
                }
            }, status=200)
            
        return Response({"error": "Signup failed"}, status=400)
    except Exception as e:
        logger.error(f"Error in basic_signup: {e}")
        return Response({"error": str(e)}, status=500)
    
@api_view(["POST"])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)  
            return JsonResponse({
                "message": "Login successful",
                "user": {
                    "username": user.username,
                    "email": user.email,
                }
            }, status=200)
        else:
            return JsonResponse({"error": "Invalid credentials"}, status=401)
    except Exception as e:
        print(e)
    return JsonResponse({'error': 'Invalid request method'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    return JsonResponse({"message": "Token is valid!"})


from django.views.decorators.csrf import ensure_csrf_cookie
@ensure_csrf_cookie
@api_view(['GET'])
def csrf_cookie(request):
    """Get CSRF cookie for frontend requests"""
    csrf_token = get_token(request)
    response = Response({'detail': 'CSRF cookie set', 'csrfToken': csrf_token})
    response['X-CSRFToken'] = csrf_token
    return response
    

    
@api_view(["GET"])
def health_data_view(request):
    try:
        # Get username from query params
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # Get last 7 days of data
        last_7_days = now().date() - timedelta(days=7)
        data = DailyHealthData.objects.filter(user=user, date__gte=last_7_days).order_by('date')

        if not data.exists():
            # Return empty data structure if no data exists
            return Response([
                {
                    "date": (now().date() - timedelta(days=i)).isoformat(),
                    "steps": 0,
                    "heart_rate": 0,
                    "sleep": 0,
                    "weight": 0,
                    "activity_minutes": 0,
                    "calories": 0
                } for i in range(7)
            ])
        serializer = DailydataSerializer(data, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in health_data_view: {e}")
        return Response({"error": "An error occurred while fetching health data"}, status=500)


@api_view(["GET"])
def get_activity_data(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        last_7_days = today - timedelta(days=6)
        activity_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a")) 
            day_data = activity_data.filter(date=day).first()
            values.append(day_data.activity_minutes if day_data else 0) 
            
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching activity data: {e}")
        return Response({"error": "An error occurred while fetching activity data."}, status=500)

@api_view(["GET"])
def get_step_data(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        last_7_days = today - timedelta(days=6)
        step_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a")) 
            day_data = step_data.filter(date=day).first()
            values.append(day_data.steps if day_data else 0) 
            
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching steps data: {e}")
        return Response({"error": "An error occurred while fetching steps data."}, status=500)

@api_view(["GET"])
def get_heart_data(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        last_7_days = today - timedelta(days=6)
        heart_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a")) 
            day_data = heart_data.filter(date=day).first()
            values.append(day_data.heart_rate if day_data else 0) 
            
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching heart rate data: {e}")
        return Response({"error": "An error occurred while fetching heart rate data."}, status=500)

@api_view(["GET"])
def get_weight_data(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        last_7_days = today - timedelta(days=6)
        weight_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a")) 
            day_data = weight_data.filter(date=day).first()
            values.append(day_data.weight if day_data else 0) 
            
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching weight data: {e}")
        return Response({"error": "An error occurred while fetching weight data."}, status=500)

@api_view(["GET"])
def get_calories_data(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        last_7_days = today - timedelta(days=6)
        calories_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a")) 
            day_data = calories_data.filter(date=day).first()
            values.append(day_data.calories if day_data else 0) 
            
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching calories data: {e}")
        return Response({"error": "An error occurred while fetching calories data."}, status=500)


@api_view(["GET"])
def get_sleep_data(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        last_7_days = today - timedelta(days=6)
        sleep_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a")) 
            day_data = sleep_data.filter(date=day).first()
            values.append(day_data.sleep if day_data else 0) 
            
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching sleep data: {e}")
        return Response({"error": "An error occurred while fetching sleep data."}, status=500)



@api_view(["GET"])
def get_steps_data(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        last_7_days = today - timedelta(days=6)
        step_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a")) 
            day_data = step_data.filter(date=day).first()
            values.append(day_data.steps if day_data else 0) 
            
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching steps data: {e}")
        return Response({"error": "An error occurred while fetching steps data."}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_last_day_health_data(request):
    try:
        user = request.user  
        recent_data = DailyHealthData.objects.filter(user=user).order_by('-date').first()
        if not recent_data:
            return Response({"error": "No health data found for the user."}, status=404)
        data = {
            "date": recent_data.date,
            "steps": recent_data.steps,
            "heart_rate": recent_data.heart_rate,
            "sleep_hours": recent_data.sleep,
            "activity_minutes": recent_data.activity,
            "weight": recent_data.weight,
            "calories": recent_data.calories,
        }
        return Response(data, status=200)
    except Exception as e:
        logger.error(f"Error fetching last day health data: {e}")
        return Response({"error": "An error occurred while fetching health data."}, status=500)
    
@api_view(["POST"])
def get_weekly_summary(request):
    try:
        username = request.data.get("username")
        if not username:
            return Response({"error": "Username is required"}, status=400)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        last_7_days = now().date() - timedelta(days=7)
        data = DailyHealthData.objects.filter(user=user, date__gte=last_7_days)
        if not data.exists():
                return Response({
                    "summary": ["No activity data available", "No sleep data available", "No heart rate data available"],
                    "trends": {
                    "steps": 0,
                    "sleep": 0,
                    "heart_rate": 0,
                    "weight": 0,
                    "calories": 0,
                    "active_minutes": 0
                    },
                    "status": "no_data"
                })
        # Calculate trends with proper type conversion
        total_steps = sum(int(d.steps) if isinstance(d.steps, str) else d.steps for d in data)
        avg_sleep = (
            sum(float(d.sleep) if isinstance(d.sleep, str) else d.sleep for d in data) / data.count()
            if data.count() > 0 else 0
        )
        avg_heart_rate = (
            sum(int(d.heart_rate) if isinstance(d.heart_rate, str) else d.heart_rate for d in data) / data.count()
            if data.count() > 0 else 0
        )
        total_active_minutes = sum(int(d.activity_minutes) if isinstance(d.activity_minutes, str) else d.activity_minutes for d in data)
        total_calories = sum(int(d.calories) if isinstance(d.calories, str) else d.calories for d in data)
        latest_weight = (
            float(data.last().weight) if isinstance(data.last().weight, str) else data.last().weight
            if data.exists() else 0
        )

        # Generate summaries using OpenAI
        activity_summary = get_openai_response(f'Give me a brief one-line summary of my activity levels this week. I have a total of {total_active_minutes} active minutes and {total_steps} steps.')
        sleep_summary = get_openai_response(f'Give me a brief one-line summary of my sleep patterns this week. I averaged {round(avg_sleep, 1)} hours of sleep per night.')
        heart_summary = get_openai_response(f'Give me a brief one-line summary of my heart health this week. My average heart rate was {round(avg_heart_rate, 1)} bpm.')
        summary = {
            "summary": [
                activity_summary.strip(),
                sleep_summary.strip(),
                heart_summary.strip()
            ],
            "trends": {
                "steps": total_steps,
                "sleep": round(avg_sleep, 1),
                "heart_rate": round(avg_heart_rate, 1),
                "weight": round(latest_weight, 1),
                "calories": round(total_calories, 1),
                "active_minutes": total_active_minutes
            },
            "status": "success"
        }

        return Response(summary)

    except Exception as e:
        logger.error(f"Error in get_weekly_summary: {e}")
        return Response({
            "error": "An error occurred while generating weekly summary",
            "details": str(e)
        }, status=500)

    

@csrf_exempt  # Disable CSRF for simplicity (enable in production)
def send_health_report(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Extract data from frontend
            user_data = data.get('health_data', {})
            recipient_email = "your-admin-email@example.com"  # Or use data['email']
            
            # Format email content
            subject = f"Health Report from User"
            message = f"""
            New health data submission:
            
            BMI: {user_data.get('bmi')}
            Status: {user_data.get('status')}
            Trends: {user_data.get('trends')}
            
            Raw data: {user_data}
            """
            
            # Send email
            send_mail(
                subject,
                message,
                None,  # Uses DEFAULT_FROM_EMAIL
                [recipient_email],
                fail_silently=False,
            )
            
            return JsonResponse({'status': 'success'})
        
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})

@api_view(["POST"])
def add_metric_view(request):
    try:
        username = request.data.get('username')
        metric = request.data.get('metric')
        value = request.data.get('value')
        
        if not all([username, metric, value]):
            return Response({"error": "Missing required fields"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        health_data, created = DailyHealthData.objects.get_or_create(
            user=user,
            date=today,
            defaults={
                'steps': 0,
                'heart_rate': 0,
                'sleep': 0,
                'weight': 0,
                'activity_minutes': 0,
                'calories': 0
            }
        )
        
        # Update the specific metric
        if metric == 'steps':
            health_data.steps = value
        elif metric == 'heartRate':
            health_data.heart_rate = value
        elif metric == 'sleep':
            health_data.sleep = value
        elif metric == 'weight':
            health_data.weight = value
        elif metric == 'calories':
            health_data.calories = value
        elif metric == 'activeMinutes':
            health_data.activity_minutes = value
            
        health_data.save()
        return Response({"message": "Metric added successfully"}, status=200)
    except Exception as e:
        logger.error(f"Error in add_metric_view: {e}")
        return Response({"message": "Metric added successfully"}, status=200)

@api_view(["GET"])
def get_metrics_view(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        health_data = DailyHealthData.objects.filter(user=user, date=today).first()
        
        if not health_data:
            return Response({
                "steps": 0,
                "heart_rate": 0,
                "sleep": 0,
                "weight": 0,
                "activity_minutes": 0,
                "calories": 0
            })
            
        return Response({
            "steps": health_data.steps,
            "heart_rate": health_data.heart_rate,
            "sleep": health_data.sleep,
            "weight": health_data.weight,
            "activity_minutes": health_data.activity_minutes,
            "calories": health_data.calories
        })
    except Exception as e:
        logger.error(f"Error in get_metrics_view: {e}")
        return Response({"error": "An error occurred while fetching metrics"}, status=500)

@api_view(["GET"])
def metrics_chart_view(request, metric_type):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        today = now().date()
        last_7_days = today - timedelta(days=6)
        data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        
        labels = []
        values = []
        
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a"))
            day_data = data.filter(date=day).first()
            
            if day_data:
                if metric_type == 'steps':
                    values.append(day_data.steps)
                elif metric_type == 'heart_rate':
                    values.append(day_data.heart_rate)
                elif metric_type == 'sleep':
                    values.append(day_data.sleep)
                elif metric_type == 'weight':
                    values.append(day_data.weight)
                elif metric_type == 'calories':
                    values.append(day_data.calories)
                elif metric_type == 'activity':
                    values.append(day_data.activity_minutes)
            else:
                values.append(0)
                
        return Response({"labels": labels, "values": values})
    except Exception as e:
        logger.error(f"Error in metrics_chart_view: {e}")
        return Response({"error": "An error occurred while fetching chart data"}, status=500)

@api_view(["POST"])
def get_doctor_report(request):
    try:
        email = request.data.get('email')
        metrics = request.data.get('metrics', [])
        custom_notes = request.data.get('custom_notes', '')
        
        if not email:
            return Response({"error": "Email is required"}, status=400)
            
        # Generate report using OpenAI
        prompt = f"Generate a detailed health report for a doctor based on the following metrics: {metrics}. Additional notes: {custom_notes}"
        report = get_openai_response(prompt, "system")
        
        # Send email with report
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
        return Response({"message": "Report sent successfully"}, status=200)

@api_view(["GET"])
def download_health_data(request):
    try:
        username = request.query_params.get('username')
        format = request.query_params.get('format', 'json')
        
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        data = DailyHealthData.objects.filter(user=user).order_by('-date')
        serializer = DailydataSerializer(data, many=True)
        
        if format == 'csv':
            import csv
            from django.http import HttpResponse
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="health_data.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['Date', 'Steps', 'Heart Rate', 'Sleep', 'Weight', 'Activity Minutes', 'Calories'])
            
            for item in serializer.data:
                writer.writerow([
                    item['date'],
                    item['steps'],
                    item['heart_rate'],
                    item['sleep'],
                    item['weight'],
                    item['activity_minutes'],
                    item['calories']
                ])
                
            return response
        else:
            return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in download_health_data: {e}")
        return Response({"error": "An error occurred while downloading data"}, status=500)

@api_view(["GET"])
def check_openai_status(request):
    try:
        # Test OpenAI API
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt="Test",
            max_tokens=5
        )
        return Response({"status": "online"})
    except Exception as e:
        logger.error(f"Error checking OpenAI status: {e}")
        return Response({"status": "offline"})

@api_view(["POST"])
def support_contact(request):
    try:
        name = request.data.get('name')
        email = request.data.get('email')
        message = request.data.get('message')
        
        if not all([name, email, message]):
            return Response({"error": "All fields are required"}, status=400)
            
        # Send email
        send_mail(
            f'Support Request from {name}',
            message,
            email,
            [settings.SUPPORT_EMAIL],
            fail_silently=False,
        )
        
        return Response({"message": "Message sent successfully"})
    except Exception as e:
        logger.error(f"Error in support_contact: {e}")
        return Response({"error": "An error occurred while sending message"}, status=500)

@api_view(["GET"])
def get_faqs(request):
    try:
        # Return predefined FAQs
        faqs = [
            {
                "question": "How do I track my health metrics?",
                "answer": "You can add your health metrics using the '+' button on the metrics page."
            },
            {
                "question": "How often should I update my metrics?",
                "answer": "We recommend updating your metrics daily for the most accurate insights."
            },
            {
                "question": "How are AI recommendations generated?",
                "answer": "Our AI analyzes your health data patterns to provide personalized recommendations."
            }
        ]
        return Response(faqs)
    except Exception as e:
        logger.error(f"Error in get_faqs: {e}")
        return Response({"error": "An error occurred while fetching FAQs"}, status=500)

@api_view(["GET"])
def profile_view(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        return Response({
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_joined": user.date_joined
        })
    except Exception as e:
        logger.error(f"Error in profile_view: {e}")
        return Response({"error": "An error occurred while fetching profile"}, status=500)

@api_view(["PUT"])
def update_profile(request):
    try:
        username = request.data.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        # Update user fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
            
        user.save()
        return Response({"message": "Profile updated successfully"})
    except Exception as e:
        logger.error(f"Error in update_profile: {e}")
        return Response({"error": "An error occurred while updating profile"}, status=500)

@api_view(["PUT"])
def update_settings(request):
    try:
        username = request.data.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        # Get or create user settings
        settings, created = UserSettings.objects.get_or_create(user=user)
        
        # Update settings
        if 'notifications_enabled' in request.data:
            settings.notifications_enabled = request.data['notifications_enabled']
        if 'theme' in request.data:
            settings.theme = request.data['theme']
        if 'units' in request.data:
            settings.units = request.data['units']
            
        settings.save()
        return Response({"message": "Settings updated successfully"})
    except Exception as e:
        logger.error(f"Error in update_settings: {e}")
        return Response({"error": "An error occurred while updating settings"}, status=500)

@api_view(["GET"])
def user_settings(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        settings, created = UserSettings.objects.get_or_create(user=user)
        return Response({
            "notifications_enabled": settings.notifications_enabled,
            "theme": settings.theme,
            "units": settings.units
        })
    except Exception as e:
        logger.error(f"Error in user_settings: {e}")
        return Response({"error": "An error occurred while fetching settings"}, status=500)

@api_view(["POST"])
def account_deletion(request):
    try:
        username = request.data.get('username')
        days = request.data.get('days', 30)
        
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        # Schedule account deletion
        deletion_date = now() + timedelta(days=days)
        AccountDeletion.objects.update_or_create(
            user=user,
            defaults={'scheduled_date': deletion_date}
        )
        
        return Response({"message": f"Account scheduled for deletion in {days} days"})
    except Exception as e:
        logger.error(f"Error in account_deletion: {e}")
        return Response({"error": "An error occurred while scheduling deletion"}, status=500)

@api_view(["POST"])
def cancel_deletion(request):
    try:
        username = request.data.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        # Cancel scheduled deletion
        AccountDeletion.objects.filter(user=user).delete()
        return Response({"message": "Account deletion cancelled"})
    except Exception as e:
        logger.error(f"Error in cancel_deletion: {e}")
        return Response({"error": "An error occurred while cancelling deletion"}, status=500)

@api_view(["GET"])
def google_login(request):
    try:
        # Get credentials file path from user app directory
        credentials_path = os.path.join(settings.BASE_DIR, 'user', 'credentials.json')
        
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=[
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/fitness.activity.read',
                'https://www.googleapis.com/auth/fitness.heart_rate.read',
                'https://www.googleapis.com/auth/fitness.sleep.read',
                'https://www.googleapis.com/auth/fitness.body.read'
            ],
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        return Response({"authUrl": auth_url})
    except Exception as e:
        logger.error(f"Error in google_login: {e}")
        return Response({"error": "An error occurred while initiating Google login"}, status=500)

@api_view(['POST'])
def google_callback(request):
    try:
        code = request.data.get('code')
        if not code:
            return Response({'error': 'No authorization code provided'}, status=400)

        # Exchange code for tokens
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'grant_type': 'authorization_code'
        }
        
        token_response = requests.post(token_url, data=token_data)
        if not token_response.ok:
            return Response({'error': 'Failed to exchange code for token'}, status=400)
            
        token_json = token_response.json()
        access_token = token_json.get('access_token')
        
        # Get user info from Google
        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if not userinfo_response.ok:
            return Response({'error': 'Failed to get user info from Google'}, status=400)
            
        userinfo = userinfo_response.json()
        email = userinfo.get('email')
        
        if not email:
            return Response({'error': 'No email provided by Google'}, status=400)
            
        # Get or create user
        try:
            user = User.objects.get(username=email)
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=get_random_string(32)  # Random password for security
            )
            user.first_name = userinfo.get('given_name', '')
            user.last_name = userinfo.get('family_name', '')
            user.save()
            
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        return Response({
            'token': access_token,
            'refresh': refresh_token,
            'user': {
                'username': user.username,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username.split('@')[0],
                'email': user.email
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(["GET"])
def google_status(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        credentials = UserCredentials.objects.filter(user=user).first()
        if not credentials:
            return Response({"connected": False})
            
        # Check if token is valid
        try:
            id_token.verify_oauth2_token(
                credentials.token,
                google_requests.Request()
            )
            return Response({"connected": True})
        except:
            return Response({"connected": False})
    except Exception as e:
        logger.error(f"Error in google_status: {e}")
        return Response({"error": "An error occurred while checking Google status"}, status=500)

@api_view(["GET"])
def connect_google_fit(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
        # Get credentials file path from user app directory
        credentials_path = os.path.join(settings.BASE_DIR, 'user', 'credentials.json')
            
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=[
                'https://www.googleapis.com/auth/fitness.activity.read',
                'https://www.googleapis.com/auth/fitness.heart_rate.read',
                'https://www.googleapis.com/auth/fitness.sleep.read',
                'https://www.googleapis.com/auth/fitness.body.read'
            ],
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        return Response({"authUrl": auth_url})
    except Exception as e:
        logger.error(f"Error in connect_google_fit: {e}")
        return Response({"error": "An error occurred while connecting Google Fit"}, status=500)

@api_view(["GET"])
def google_fit_status(request):
    try:
        username = request.query_params.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=400)
            
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        credentials = UserCredentials.objects.filter(user=user).first()
        if not credentials:
            return Response({"connected": False})
            
        # Check if Google Fit scopes are present
        required_scopes = [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.heart_rate.read',
            'https://www.googleapis.com/auth/fitness.sleep.read',
            'https://www.googleapis.com/auth/fitness.body.read'
        ]
        
        has_all_scopes = all(scope in credentials.scopes for scope in required_scopes)
        return Response({"connected": has_all_scopes})
    except Exception as e:
        logger.error(f"Error in google_fit_status: {e}")
        return Response({"error": "An error occurred while checking Google Fit status"}, status=500)