# Generated by Django 2.2 on 2019-04-12 15:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pj', '0005_auto_20190411_1521'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='url',
            field=models.CharField(max_length=2083, null=True, verbose_name='URL to where the file is stored'),
        ),
    ]