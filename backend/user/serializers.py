from django.urls import path, include
from django.contrib.auth.models import User
from rest_framework import routers, serializers, viewsets
from django.contrib.auth.models import User
from .models import DailyHealthData

class DailydataSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyHealthData
        fields = '__all__'
        
        
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username','password']
        