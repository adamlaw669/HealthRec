from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from datetime import datetime, timezone, timedelta
from .models import UserCredentials,DailyHealthData
import json, os
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from django.conf import settings


def download_cred(user):
    SCOPES = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.sleep.read',
        'https://www.googleapis.com/auth/fitness.body.read',
    ]
    CREDENTIALS_PATH = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    client_config = json.loads(CREDENTIALS_PATH)
    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    credentials = flow.run_local_server(port=8080, access_type='offline', prompt = 'consent')

    user_credentials, _ = UserCredentials.objects.update_or_create(
        user=user,
        defaults={
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "expires_at": credentials.expiry,
            "scopes": json.dumps(credentials.scopes),
        }
    )
    return credentials


def refresh_access_token(user):
    CREDENTIALS_PATH = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    try:
        # Retrieve user credentials from the database
        user_cred = UserCredentials.objects.get(user=user)
        credentials = Credentials.from_authorized_user_info(CREDENTIALS_PATH)

        # Check if the access token is expired and refresh it
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())  # Automatically refreshes the token

            # Update the stored credentials in the database
            user_cred.access_token = credentials.token
            user_cred.expires_at = credentials.expiry
            user_cred.credentials_json = credentials.to_json()  # Store updated JSON
            user_cred.save()

        return credentials  # Return the refreshed credentials

    except UserCredentials.DoesNotExist:
        print("User credentials not found.")
        return None



def get_step_data(service, user, days=7):
    # Use timezone-aware datetime
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    start_time_millis = int(start_time.timestamp() * 1000)
    end_time_millis = int(end_time.timestamp() * 1000)
    
    response = service.users().dataset().aggregate(
        userId="me",
        body={
            "aggregateBy": [
                {"dataTypeName": "com.google.step_count.delta"}
            ],
            "bucketByTime": {"durationMillis": 86400000},  # 1 day in milliseconds
            "startTimeMillis": start_time_millis,
            "endTimeMillis": end_time_millis
        }
    ).execute()
    
    daily_steps = []
    if 'bucket' in response:
        for bucket in response['bucket']:
            # Convert milliseconds to seconds for fromtimestamp
            bucket_start_time = datetime.fromtimestamp(
                int(bucket['startTimeMillis'])/1000, 
                tz=timezone.utc
            )
            date_str = bucket_start_time.strftime('%Y-%m-%d')
            
            steps = 0
            if bucket['dataset'][0]['point']:
                for point in bucket['dataset'][0]['point']:
                    steps += point['value'][0]['intVal']
            
            # Save data for this specific day
            daily_steps.append({
                'date': date_str,
                'steps': steps
            })
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            """
            try:
                health_data = DailyHealthData.objects.get(user=user, date=date_obj)
                health_data.steps = steps
                health_data.save()
            except DailyHealthData.DoesNotExist:
                DailyHealthData.objects.create(
                    user=user,
                    date=date_obj,
                    steps=steps
                    )
            """
    return daily_steps




def get_heart_rate_data(service,user, days=7):
    # Define time range
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    start_time_millis = int(start_time.timestamp() * 1000)
    end_time_millis = int(end_time.timestamp() * 1000)
    
    # Make the API request
    response = service.users().dataset().aggregate(
        userId="me",
        body={
            "aggregateBy": [
                {"dataTypeName": "com.google.heart_rate.bpm"}
            ],
            "bucketByTime": {"durationMillis": 86400000}, 
            "startTimeMillis": start_time_millis,
            "endTimeMillis": end_time_millis
        }
    ).execute()
    
    # Process and return the results
    heart_rate_data = []
    if 'bucket' in response:
        for bucket in response['bucket']:
            start_time = datetime.fromtimestamp(int(bucket['startTimeMillis'])/1000)
            date_str = start_time.strftime('%Y-%m-%d')
            
            # For heart rate, we'll track min, max, and average
            hr_min, hr_max, hr_sum, hr_count = 999, 0, 0, 0
            
            if bucket['dataset'][0]['point']:
                for point in bucket['dataset'][0]['point']:
                    hr_value = point['value'][0]['fpVal']
                    hr_min = min(hr_min, hr_value)
                    hr_max = max(hr_max, hr_value)
                    hr_sum += hr_value
                    hr_count += 1
            
            if hr_count > 0:
                heart_rate_data.append({
                    'date': date_str,
                    'min': hr_min,
                    'max': hr_max,
                    'avg': hr_sum / hr_count
                })
            """
            try:
                health_data = DailyHealthData.objects.get(user = user, date = date_str)
                health_data.heart_rate = hr_sum / hr_count
                health_data.save()
            except DailyHealthData.DoesNotExist:        
                    DailyHealthData.objects.update_or_create(
                        user = user,
                        date = date_str,
                        heart_rate =  hr_sum / hr_count 
                        )    
            """             
    return heart_rate_data




def get_sleep_data(service,user, days=7):
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    start_time_millis = int(start_time.timestamp() * 1000)
    end_time_millis = int(end_time.timestamp() * 1000)
    
    # Make the API request
    response = service.users().dataset().aggregate(
        userId="me",
        body={
            "aggregateBy": [
                {"dataTypeName": "com.google.sleep.segment"}
            ],
            "bucketByTime": {"durationMillis": 86400000},  # Daily buckets
            "startTimeMillis": start_time_millis,
            "endTimeMillis": end_time_millis
        }
    ).execute()
    sleep_data = []
    if 'bucket' in response:
        for bucket in response['bucket']:
            start_time = datetime.fromtimestamp(int(bucket['startTimeMillis'])/1000)
            date_str = start_time.strftime('%Y-%m-%d')          
            total_sleep_millis = 0
            deep_sleep_millis = 0
            light_sleep_millis = 0
            rem_sleep_millis = 0       
            if bucket['dataset'][0]['point']:
                for point in bucket['dataset'][0]['point']:
                    start_millis = int(point['startTimeNanos']) // 1000000
                    end_millis = int(point['endTimeNanos']) // 1000000
                    duration_millis = end_millis - start_millis
                    sleep_type = point['value'][0]['intVal']                    
                    if sleep_type in [2, 4, 5, 6]:
                        total_sleep_millis += duration_millis              
                        if sleep_type == 4:
                            light_sleep_millis += duration_millis
                        elif sleep_type == 5:
                            deep_sleep_millis += duration_millis
                        elif sleep_type == 6:
                            rem_sleep_millis += duration_millis
            
            # Only add days with sleep data
            if total_sleep_millis > 0:
                sleep_data.append({
                    'date': date_str,
                    'total_hours': total_sleep_millis / (1000 * 60 * 60),
                    'deep_hours': deep_sleep_millis / (1000 * 60 * 60),
                    'light_hours': light_sleep_millis / (1000 * 60 * 60),
                    'rem_hours': rem_sleep_millis / (1000 * 60 * 60)
                })
            """            
            try: 
                health_data =  DailyHealthData.objects.get(user = user, date = date_str)
                health_data.sleep = total_sleep_millis / (1000 * 60 * 60) 
                health_data.save()   
            except DailyHealthData.DoesNotExist:
                DailyHealthData.objects.update_or_create(
                    user = user,
                    date = date_str,
                    sleep = total_sleep_millis / (1000 * 60 * 60)    
                ) 
            """    
    return sleep_data





def get_activity_data(service,user, days=7):
    # Define time range
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    start_time_millis = int(start_time.timestamp() * 1000)
    end_time_millis = int(end_time.timestamp() * 1000)
    
    # Make the API request
    response = service.users().dataset().aggregate(
        userId="me",
        body={
            "aggregateBy": [
                {"dataTypeName": "com.google.activity.segment"}
            ],
            "bucketByTime": {"durationMillis": 86400000},  # Daily buckets
            "startTimeMillis": start_time_millis,
            "endTimeMillis": end_time_millis
        }
    ).execute()
    
    # Create a mapping of activity types
    activity_types = {
        0: "inactive",
        1: "biking",
        2: "on_foot",
        3: "still",
        7: "walking",
        8: "running",
        9: "in_vehicle",
        10: "on_bicycle",
        # Add more as needed
    }
    
    # Process and return the results
    activity_data = []
    if 'bucket' in response:
        for bucket in response['bucket']:
            start_time = datetime.fromtimestamp(int(bucket['startTimeMillis'])/1000)
            date_str = start_time.strftime('%Y-%m-%d')
            
            # Track time spent in different activities
            activities = {}
            
            if bucket['dataset'][0]['point']:
                for point in bucket['dataset'][0]['point']:
                    activity_type = point['value'][0]['intVal']
                    activity_name = activity_types.get(activity_type, f"activity_{activity_type}")
                    
                    start_millis = int(point['startTimeNanos']) // 1000000
                    end_millis = int(point['endTimeNanos']) // 1000000
                    duration_mins = (end_millis - start_millis) / (1000 * 60)
                    
                    if activity_name in activities:
                        activities[activity_name] += duration_mins
                    else:
                        activities[activity_name] = duration_mins
            
            # Only add days with activity data
            if activities:
                # Total up "active" activity types (adjust this list as needed)
                active_types = ["walking", "running", "on_foot", "biking", "on_bicycle"]
                active_minutes = sum(duration for activity, duration in activities.items() if activity in active_types)

                activity_data.append({
                    'date': date_str,
                    'activities': activities,  # full breakdown
                    'activity_minutes': round(active_minutes)  # single number for chart
                })   
            """    
            try: 
                health_data =  DailyHealthData.objects.get(user = user, date = date_str)
                health_data.activity = {'activities': activities}
                health_data.save()   
            except DailyHealthData.DoesNotExist:                
                    DailyHealthData.objects.update_or_create(
                        user = user,
                        date = date_str,
                        activity = {
                            'activities': activities
                        }
                    )
             """       
    return activity_data



def get_weight_data(service,user, days=7):  # Longer timeframe for weight
    # Define time range
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    start_time_millis = int(start_time.timestamp() * 1000)
    end_time_millis = int(end_time.timestamp() * 1000)
    
    # Make the API request
    response = service.users().dataset().aggregate(
        userId="me",
        body={
            "aggregateBy": [
                {"dataTypeName": "com.google.weight"}
            ],
            "bucketByTime": {"durationMillis": 86400000},  # Daily buckets
            "startTimeMillis": start_time_millis,
            "endTimeMillis": end_time_millis
        }
    ).execute()
    
    # Process and return the results
    weight_data = []
    if 'bucket' in response:
        for bucket in response['bucket']:
            start_time = datetime.fromtimestamp(int(bucket['startTimeMillis'])/1000)
            date_str = start_time.strftime('%Y-%m-%d')
            
            if bucket['dataset'][0]['point']:
                # Just take the last weight reading of the day
                latest_point = bucket['dataset'][0]['point'][-1]
                weight_kg = latest_point['value'][0]['fpVal']
                
                weight_data.append({
                    'date': date_str,
                    'weight_kg': weight_kg
                })
            """
            try: 
                health_data =  DailyHealthData.objects.get(user = user, date = date_str)
                health_data.weight = weight_kg
                health_data.save()  
            except DailyHealthData.DoesNotExist:            
                    DailyHealthData.objects.update_or_create(
                        user = user,
                        date = date_str,
                        weight = weight_kg
                    )
            """        
    return weight_data

def get_calories_data(service, user, days=7):
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    start_time_millis = int(start_time.timestamp() * 1000)
    end_time_millis = int(end_time.timestamp() * 1000)

    response = service.users().dataset().aggregate(
        userId="me",
        body={
            "aggregateBy": [
                {"dataTypeName": "com.google.calories.expended"}
            ],
            "bucketByTime": {"durationMillis": 86400000},
            "startTimeMillis": start_time_millis,
            "endTimeMillis": end_time_millis
        }
    ).execute()

    calories_data = []
    if 'bucket' in response:
        for bucket in response['bucket']:
            start_time = datetime.fromtimestamp(int(bucket['startTimeMillis']) / 1000)
            date_str = start_time.strftime('%Y-%m-%d')

            total_calories = 0
            if bucket['dataset'][0]['point']:
                for point in bucket['dataset'][0]['point']:
                    total_calories += point['value'][0]['fpVal']

            if total_calories > 0:
                calories_data.append({
                    'date': date_str,
                    'calories': round(total_calories, 2)
                })

            # Optional DB update (if storing in DailyHealthData)
            """
            try:
                health_data = DailyHealthData.objects.get(user=user, date=date_str)
                health_data.calories = total_calories
                health_data.save()
            except DailyHealthData.DoesNotExist:
                DailyHealthData.objects.update_or_create(
                    user=user,
                    date=date_str,
                    calories=total_calories
                )
            """

    return calories_data


def fetch_and_save_health_data(user, credentials):
    fitness_service = build('fitness', 'v1', credentials=credentials)

    step_data = get_step_data(fitness_service, user, days=7)
    heart_data = get_heart_rate_data(fitness_service, user, days=7)
    sleep_data = get_sleep_data(fitness_service, user, days=7)
    activity_data = get_activity_data(fitness_service, user, days=7)
    weight_data = get_weight_data(fitness_service, user, days=7)
    calories_data = get_calories_data(fitness_service, user)

    all_dates = set()
    for data_list in [step_data, heart_data, sleep_data, activity_data, weight_data]:
        for item in data_list:
            all_dates.add(item['date'])

    for date_str in all_dates:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()

        steps = next((item['steps'] for item in step_data if item['date'] == date_str), 0)
        heart_rate = next((item['avg'] for item in heart_data if item['date'] == date_str), 0)
        sleep = next((item['total_hours'] for item in sleep_data if item['date'] == date_str), 0)
        activity = next((item['activities'] for item in activity_data if item['date'] == date_str), {})
        activity_minutes = next(
    (item['activity_minutes'] for item in activity_data if item['date'] == date_str), 
    0
)
        weight = next((item['weight_kg'] for item in weight_data if item['date'] == date_str), 0)
        calories = next((item['calories'] for item in calories_data if item['date'] == date_str), 0)

        DailyHealthData.objects.update_or_create(
            user=user,
            date=date_obj,
            defaults={
                "steps": steps,
                "heart_rate": heart_rate,
                "sleep": sleep,
                "activity": activity,
                "activity_minutes": activity_minutes,
                "weight": weight,
                
                "calories": calories
            }
        )

def fetch_fitbit_data(user, credentials):
    """Fetches health data from Fitbit API"""
    fitbit_service = build_fitbit_client(credentials)
    
    step_data = get_fitbit_steps(fitbit_service, user, days=7)
    heart_data = get_fitbit_heart_rate(fitbit_service, user, days=7)
    sleep_data = get_fitbit_sleep(fitbit_service, user, days=7)
    activity_data = get_fitbit_activity(fitbit_service, user, days=7)
    weight_data = get_fitbit_weight(fitbit_service, user, days=7)
    calories_data = get_fitbit_calories(fitbit_service, user, days=7)

    # Use the same data structure as Google Fit for consistency
    for date_str, data in step_data.items():
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        DailyHealthData.objects.update_or_create(
            user=user,
            date=date_obj,
            defaults={
                "steps": data.get('steps', 0),
                "heart_rate": heart_data.get(date_str, {}).get('average', 0),
                "sleep": sleep_data.get(date_str, {}).get('duration', 0),
                "activity": activity_data.get(date_str, {}),
                "weight": weight_data.get(date_str, {}).get('weight', 0),
                "calories": calories_data.get(date_str, {}).get('calories', 0)
            }
        )

def build_fitbit_client(credentials):
    """Initialize Fitbit client with user credentials"""
    # Implementation would depend on the Fitbit SDK/library you choose
    pass

def get_fitbit_steps(service, user, days=7):
    """Fetch step data from Fitbit"""
    # Implementation using Fitbit API
    pass

def get_fitbit_heart_rate(service, user, days=7):
    """Fetch heart rate data from Fitbit"""
    # Implementation using Fitbit API
    pass

# Add other Fitbit data fetching functions similarly...
