from django.db import models
from django.contrib.auth.models import User


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
    date = models.DateField()
    steps = models.IntegerField(default=0)
    weight = models.FloatField(null=True, blank=True, default=0.0)
    sleep = models.FloatField(null=True, blank=True, default=0.0)
    heart_rate = models.FloatField(null=True, blank=True, default=0.0)
    activity = models.JSONField(null=True, blank=True, default=dict)
    activity_minutes = models.IntegerField(blank=True, default=0)
    calories = models.IntegerField(null=True, blank=True, default=0)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.steps} steps - {self.weight}kg"


class HealthMetricDefinition(models.Model):
    METRIC_TYPES = [
        ('blood_pressure', 'Blood Pressure'),
        ('heart_rate', 'Heart Rate'),
        ('blood_sugar', 'Blood Sugar'),
        ('cholesterol', 'Cholesterol'),
        ('body_temperature', 'Body Temperature'),
        ('oxygen_saturation', 'Oxygen Saturation'),
        ('respiratory_rate', 'Respiratory Rate'),
    ]

    UNITS = [
        ('mmHg', 'mmHg'),
        ('bpm', 'beats per minute'),
        ('mg/dL', 'mg/dL'),
        ('°C', 'Celsius'),
        ('%', 'Percentage'),
        ('breaths/min', 'breaths per minute'),
    ]

    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    display_name = models.CharField(max_length=100)
    unit = models.CharField(max_length=20, choices=UNITS)
    min_value = models.FloatField()
    max_value = models.FloatField()
    description = models.TextField()
    normal_range = models.CharField(max_length=100)

    class Meta:
        ordering = ['display_name']

    def __str__(self):
        return f"{self.display_name} ({self.unit})"

    @staticmethod
    def get_metric_ranges():
        return {
            'blood_pressure_systolic': {'min': 70, 'max': 200, 'unit': 'mmHg'},
            'blood_pressure_diastolic': {'min': 40, 'max': 130, 'unit': 'mmHg'},
            'heart_rate': {'min': 40, 'max': 200, 'unit': 'bpm'},
            'blood_sugar_fasting': {'min': 50, 'max': 400, 'unit': 'mg/dL'},
            'blood_sugar_post': {'min': 50, 'max': 500, 'unit': 'mg/dL'},
            'cholesterol_total': {'min': 100, 'max': 400, 'unit': 'mg/dL'},
            'body_temperature': {'min': 35, 'max': 42, 'unit': '°C'},
            'oxygen_saturation': {'min': 50, 'max': 100, 'unit': '%'},
            'respiratory_rate': {'min': 8, 'max': 40, 'unit': 'breaths/min'},
        }


class UserHealthMetric(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    metric_type = models.ForeignKey(HealthMetricDefinition, on_delete=models.CASCADE)
    value = models.JSONField()
    measured_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-measured_at']

    def __str__(self):
        return f"{self.user.username} - {self.metric_type.display_name} - {self.measured_at}"


class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    notifications_enabled = models.BooleanField(default=True)
    theme = models.CharField(max_length=20, default='light', choices=[('light', 'Light'), ('dark', 'Dark')])
    units = models.CharField(max_length=20, default='metric', choices=[('metric', 'Metric'), ('imperial', 'Imperial')])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'User Settings'

    def __str__(self):
        return f"Settings for {self.user.username}"


class AccountDeletion(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    scheduled_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"Deletion scheduled for {self.user.username} on {self.scheduled_date}"
