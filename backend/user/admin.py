from django.contrib import admin
from .models import *


# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ('user', 'access_token', 'refresh_token', 'expires_at', 'scopes',)
        
class DailyHealthDataAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'steps', 'weight', 'sleep', 'heart_rate', 'activity', 'activity_minutes','calories')
    list_filter = ('user', 'date')  # Filter by user and date
    search_fields = ('user__username',)  # Allow searching by username
    ordering = ['user', '-date']
    

admin.site.register(UserCredentials, UserAdmin)
admin.site.register(DailyHealthData,DailyHealthDataAdmin) 