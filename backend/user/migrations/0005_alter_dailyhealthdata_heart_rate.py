from django.db import migrations, models


def convert_heart_rate_to_float(apps, schema_editor):
    """Convert existing string heart_rate values to floats before altering the column."""
    DailyHealthData = apps.get_model('user', 'DailyHealthData')
    for record in DailyHealthData.objects.all():
        try:
            if record.heart_rate:
                record.heart_rate = float(str(record.heart_rate).strip())
            else:
                record.heart_rate = 0.0
        except (ValueError, TypeError):
            record.heart_rate = 0.0
        record.save(update_fields=['heart_rate'])


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0004_usersettings_accountdeletion'),
    ]

    operations = [
        migrations.RunPython(convert_heart_rate_to_float, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='dailyhealthdata',
            name='heart_rate',
            field=models.FloatField(blank=True, null=True, default=0.0),
        ),
    ]
