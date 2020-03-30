# Generated by Django 2.2.1 on 2019-07-29 12:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pj', '0022_auto_20190724_1009'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='status',
            field=models.CharField(choices=[('unscanned', 'unscanned'), ('clean', 'clean'), ('quarantined', 'quarantined'), ('approved', 'approved'), ('transferred', 'transferred'), ('failed', 'failed'), ('rejected', 'rejected')], default='unscanned', max_length=11),
        ),
    ]