# Generated by Django 2.2.1 on 2019-05-07 13:38

from django.db import migrations, models
import server.pj.models


class Migration(migrations.Migration):

    dependencies = [
        ('pj', '0012_file_approver'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vendor',
            name='code',
            field=models.CharField(default=server.pj.models.create_vendor_code, max_length=8, unique=True, verbose_name='Code that vendors can use to upload files'),
        ),
    ]
