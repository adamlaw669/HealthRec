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
import google.generativeai as genai
from googleapiclient.discovery import build
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


from .models import *
from .serializers import *
from .utils import *
logger = logging.getLogger(__name__)

openai.api_key = settings.OPENAI_API_KEY
genai.configure(api_key="AIzaSyCQh37XW3rvi6A37orv7zAs25gT2xcjIes")

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
                        "insights": ["Connect your health tracking devices to get personalized recommendations."]
                    },
                    "steps": "No data available.",
                    "sleep": "No data available.",
                    "heart_rate": "No data available.",
                    "weight": "No data available.",
                    "activity": "No data available.",
                    "calories": "No data available."
                }
            })
            
        data_str = "\n".join(
            f"Date: {entry.date}, Steps: {entry.steps}, HR: {entry.heart_rate}, Sleep: {entry.sleep}h, Weight: {entry.weight}kg, Activity: {entry.activity}, Calories: {entry.calories}"
            for entry in health_data
        )
        prompts = {
            "general": f"Based on the following health data:\n{data_str}\nFirst provide a 2-3 sentence summary of the user's health status and main recommendations. Then provide 4 specific actionable insights as bullet points. Format the response with 'Summary:' and 'Insights:' sections.",
            "correlation": f"Based on the following health data:\n{data_str}\nProvide 4 lines of health correlation insights based on your health data patterns.",
            "tips": f"Based on the following health data:\n{data_str}\nProvide 4 lines of Personalized tips based on the health metrics and patterns",
            "steps": f"Based on the following step data:\n{data_str}\nProvide a brief recommendation on how the user can improve their physical activity.",
            "sleep": f"Based on the following sleep data:\n{data_str}\nProvide a recommendation on how the user can improve their sleep quality.",
            "heart_rate": f"Based on the following heart rate data:\n{data_str}\nProvide a recommendation on maintaining a healthy heart rate.",
            "weight": f"Based on the following weight data:\n{data_str}\nProvide a brief recommendation on maintaining a healthy weight.",
            "activity": f"Based on the following activity data:\n{data_str}\nProvide a brief recommendation on how the user can improve their activity levels.",
            "calories": f"Based on the following calories data:\n{data_str}\nProvide a brief recommendation on how the user can manage their calorie intake."
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
                    "insights": insights[:4]  # Ensure we only have 4 insights
                }
            except Exception as e:
                logger.error(f"Error processing general recommendations: {e}")
                # Fallback if parsing fails
                recommendations['general'] = {
                    "summary": "Here are your personalized health recommendations based on your recent data.",
                    "insights": [line.strip() for line in general_text.split('\n') if line.strip()][:4]
                }
                
        return Response({"recommendations": recommendations}, status=200)
    except Exception as e:
        logger.error(f"Error in get_health_recommendation: {e}")
        return Response({
            "recommendations": {
                "general": {
                    "summary": "An error occurred while generating recommendations.",
                    "insights": ["Please try again later."]
                },
                "status": "error"
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
        model = genai.GenerativeModel("gemini-1.5-flash")
        def get_gemini_response(prompt):
            try:
                response = model.generate_content(prompt)
                return response.text.strip() if response.text else "No response generated."
            except Exception as api_error:
                logger.error(f"Gemini API error: {api_error}")
                return "Unable to generate recommendation due to API error."
                
        facts = get_gemini_response(prompts["facts"])
        # Split facts into array and clean up
        facts_array = [line.strip() for line in facts.split('\n') if line.strip()]
        return Response({"facts": facts_array})
        
    except Exception as e:
        logger.error(f"Error in HealthFacts: {e}")
        return Response({
            "facts": ["An error occurred while generating health facts."]
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
        flow = Flow.from_client_secrets_file(
            'credentials.json',
            scopes=[
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/fitness.activity.read',
                'https://www.googleapis.com/auth/fitness.heart_rate.read',
                'https://www.googleapis.com/auth/fitness.sleep.read',
                'https://www.googleapis.com/auth/fitness.body.read'
            ],
            redirect_uri='http://localhost:3000/dashboard'  # this must match Google Console!
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
    if request.method == "POST":
        csrf_token = get_token(request)
        username = request.data.get('username')
        password = request.data.get('password')
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'})
        user = User.objects.create_user(username=username, password=password)
        today = now().date()
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
                    'calories': 250 + i * 20
                }
            )
        if user is not None:
            login(request, user)
            return JsonResponse({"message": 'Signup succesful', 'csrfToken': csrf_token},status = 200)
        return JsonResponse({"error": 'Signup failed'}, status = 400)
    return JsonResponse({'error':'Invaid request method'}, status = 400)
    
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
def get_csrf(request):
    return JsonResponse({'detail': 'CSRF cookie set'})
    

    
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
        serializer = DailydataSerializer(data, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in health_data_view: {e}")
        return Response({"error": "An error occurred while fetching health data"}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_activity_data(request):
    try:
        user = request.user
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
@permission_classes([IsAuthenticated])
def get_heart_data(request):
    try:
        user = request.user
        today = now().date()
        last_7_days = today - timedelta(days=6)
        sleep_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a"))  # "Mon", "Tue", etc.
            day_data = sleep_data.filter(date=day).first()
            values.append(day_data.heart_rate if day_data else 0)  # default to 0 if no data
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching heart rate data: {e}")
        return Response({"error": "An error occurred while fetching heart rate data."}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_weight_data(request):
    try:
        user = request.user
        today = now().date()
        last_7_days = today - timedelta(days=6)
        sleep_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a"))  # "Mon", "Tue", etc.
            day_data = sleep_data.filter(date=day).first()
            values.append(day_data.weight if day_data else 0)  # default to 0 if no data
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching weight data: {e}")
        return Response({"error": "An error occurred while fetching weight data."}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_calories_data(request):
    try:
        user = request.user
        today = now().date()
        last_7_days = today - timedelta(days=6)
        sleep_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a"))  # "Mon", "Tue", etc.
            day_data = sleep_data.filter(date=day).first()
            values.append(day_data.calories if day_data else 0)  # default to 0 if no data
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching calories data: {e}")
        return Response({"error": "An error occurred while fetching calories data."}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_sleep_data(request):
    try:
        user = request.user
        today = now().date()
        last_7_days = today - timedelta(days=6)
        sleep_data = DailyHealthData.objects.filter(user=user, date__range=[last_7_days, today]).order_by('date')
        labels = []
        values = []
        for i in range(7):
            day = last_7_days + timedelta(days=i)
            labels.append(day.strftime("%a"))  # "Mon", "Tue", etc.
            day_data = sleep_data.filter(date=day).first()
            values.append(day_data.sleep if day_data else 0)  # default to 0 if no data
        return Response({"labels": labels, "values": values}, status=200)
    except Exception as e:
        logger.error(f"Error fetching sleep data: {e}")
        return Response({"error": "An error occurred while fetching sleep data."}, status=500)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_steps_data(request):
    try:
        user = request.user 
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
    username = request.data["username"]
    print(username)
    user = User.objects.get(username="Adam")
    last_7_days = now().date() - timedelta(days=7)
    data = DailyHealthData.objects.filter(user=user, date__gte=last_7_days)

    if not data.exists():
        return JsonResponse({
            "steps": 0,
            "sleep": 0,
            "heart_rate": 0,
            "weight": 0,
            "activity": 0,
            "calories": 0
        })
    summary = {
        "summary":"A summary of your health data",
        "steps": sum(d.steps for d in data),
        "sleep": round(sum(d.sleep for d in data), 1),
        "heart_rate": round(sum(d.heart_rate for d in data) / data.count(), 1),
        "weight": round(data.last().weight, 1),  # or average it if you prefer
        "activity": sum(d.activity_minutes for d in data),
        "calories": sum(d.calories for d in data)
    }
    return JsonResponse(summary)    
    

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