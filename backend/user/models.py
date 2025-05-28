from django.db import models
from django.contrib.auth.models import User
from django.utils.html import mark_safe 
import random

class UserCredentials(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    access_token = models.CharField(null=True, blank=True, max_length=300) 
    refresh_token = models.CharField(null=True, blank=True, max_length=300)  
    expires_at = models.DateTimeField(null=True, blank=True)  
    scopes = models.JSONField(null=True, blank=True, default=dict)  
    def __str__(self):
        return f"Tokens for {self.user.username}"

    
class DailyHealthData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  
    date = models.DateField()  # Automatically sets the date
    steps = models.IntegerField(default=0) 
    weight = models.FloatField(null=True, blank=True, default=0.0) 
    sleep = models.FloatField(null=True, blank=True, default=0.0)  
    heart_rate = models.CharField(null=True, blank=True, max_length=300)  
    activity = models.JSONField(null=True, blank=True, default=dict)
    activity_minutes = models.IntegerField( blank=True, default=0)  
    calories = models.IntegerField(null=True, blank=True, default=0)

    class Meta:
        unique_together = ('user', 'date')  # Prevents duplicate entries per user per day
        ordering = ['-date']  # Orders records by latest date first


    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.steps} steps  - {self.weight}weight" 
    