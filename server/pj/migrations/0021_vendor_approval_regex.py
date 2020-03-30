# Generated by Django 2.2.1 on 2019-07-03 16:33

from django.db import migrations, models
import server.pj.models


class Migration(migrations.Migration):

    dependencies = [
        ('pj', '0020_vendor_auto_approve'),
    ]

    operations = [
        migrations.AddField(
            model_name='vendor',
            name='approval_regex',
            field=models.CharField(max_length=128, null=True, validators=[server.pj.models.validate_regex], verbose_name='Regex approval value'),
        ),
    ]
