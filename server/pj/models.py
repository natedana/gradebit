import re
import string
import os.path
import logging

from django.db import models
from django.utils.crypto import get_random_string
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.contrib.postgres.fields import ArrayField

from server.auth.models import User
from server.pj.managers import FileManager

from server.pj.store import move, delete

def create_vendor_code():
    # Stripping out characters that be confused with each other or another
    allowable_str = re.sub('[l]', '', string.ascii_lowercase)
    return get_random_string(length=8, allowed_chars=f'{allowable_str}{string.digits}')

def validate_regex(value):
    try:
        re.compile(value)
        return True
    except re.error:
        return False

logger = logging.getLogger(__name__)

code_pattern = re.compile(r"^[a-z0-9]+$")
s3_pattern = re.compile(r"^[A-Za-z0-9\-\s!_.*'()]*$")

priority_validators = [MinValueValidator(1, "Priority cannot be below 1"), MaxValueValidator(10, "Priority cannot exceed 10")]

class Stakeholder(models.Model):
    """Represent a person connected to a vendor or data source."""

    name = models.CharField(max_length=128)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=15, validators=[RegexValidator(r'^[0-9]+$')], blank=True, default='')
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Vendor(models.Model):
    """Represent a vendor/organization that is allowed to upload files to the puddle."""

    name = models.CharField(max_length=128, unique=True)
    short_name = models.CharField(max_length=128, unique=True, validators=[RegexValidator(s3_pattern)])
    code = models.CharField(
        'Code that vendors can use to upload files',
        unique=True,
        max_length=8,
        default=create_vendor_code,
        validators=[RegexValidator(code_pattern)]
    )
    date_added = models.DateTimeField(auto_now_add=True)
    auto_approve = models.BooleanField('Approval of vendor files automatically or not', default=False)
    pocs = models.ManyToManyField(Stakeholder, blank=True)
    priority = models.IntegerField("Default priority for files belonging to this vendor", validators=priority_validators, default=5)
    approval_regex = models.CharField("Regex approval value", max_length=128, null=True, blank=True, validators=[validate_regex])

    def approves(self, file_obj):
        if self.auto_approve:
            return True
        if self.approval_regex:
            regex = re.compile(self.approval_regex)
            return bool(regex.match(file_obj.name))
        return False
    
    def __str__(self):
        return f'{self.name} ({self.code})'


class FilenameCounter(models.Model):
    """Track how many instances of each name we have seen to correctly increment versions."""
    count = models.IntegerField("Number of files with this name encountered", default=0)

    def increment(self):
        self.count = self.count + 1
        self.save()


class File(models.Model):
    """An uploaded and registered file in the puddle system."""
    UNSCANNED = 'unscanned'
    CLEAN = 'clean'
    QUARANTINED = 'quarantined'
    APPROVED = 'approved'
    TRANSFERRED = 'transferred'
    FAILED = 'failed'
    REJECTED = 'rejected'
    STATUS_CHOICES = (
        (UNSCANNED, UNSCANNED),
        (CLEAN, CLEAN),
        (QUARANTINED, QUARANTINED),
        (APPROVED, APPROVED),
        (TRANSFERRED, TRANSFERRED),
        (FAILED, FAILED),
        (REJECTED, REJECTED)
    )

    objects = FileManager()

    name = models.CharField('Name of the file that was uploaded', max_length=128)
    # The URL for a file should be {location}/{status}/{key}
    location = models.CharField('Base URL the file is stored at', max_length=1024, blank=True, default='')
    key = models.CharField(
        'Path within the base location the file is stored',
        max_length=1024,
        null=True,
        blank=True,
        unique=True
    )
    size = models.BigIntegerField('The size of the file in bytes')
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    submitter = models.CharField(
        'Name of the person/thing that submitted the file',
        max_length=64,
        validators=[RegexValidator(s3_pattern)]
    )
    date_uploaded = models.DateTimeField(auto_now_add=True)
    approver = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True)
    date_approved = models.DateTimeField(null=True, blank=True)
    status = models.CharField(choices=STATUS_CHOICES, default=UNSCANNED, max_length=11)
    message = models.CharField(
        'Additional notes about the file. This can include reasons it wasn\'t approved or why it failed processing', 
        blank=True,
        default='',
        max_length=2000
    )
    counter = models.OneToOneField(FilenameCounter, blank=True, null=True, on_delete=models.CASCADE)
    fragments = ArrayField(models.IntegerField('Fragment identifier'), blank=True, default=list)
    priority = models.IntegerField("Priority of file for processing order", validators=priority_validators)

    def change_status(self, origin_status, target_status, request=None):
        try:
            origin_path, target_path = (os.path.join(self.location, status, self.key) for status in (origin_status, target_status))
            move(origin_path, target_path)
            self.status = target_status
            self.save()
            logger.info(f'Set file {self.key} to {target_status}', extra={'request': request})
            return True
        except Exception as e:
            logger.error(f'Failed to change file {self.key} to {target_status}: {e}', extra={'request': request})
            return False

    def reset(self, request):
        target_status = None
        if self.status == File.FAILED:
            target_status = File.UNSCANNED
        elif self.status == File.TRANSFERRED:
            target_status = File.APPROVED
        else: 
            raise Exception('Invalid status for file reset')
        return self, self.change_status(self.status, target_status)

    def delete_file(self, request, *args, **kwargs):
        try:
            pk = self.pk
            delete(self.get_url())
            logger.info(f'Deleted file {self.key}')
            super().delete(*args, **kwargs)
            return pk, True
        except Exception as e:
            logger.error(f'Failed to delete file {self.key}: {e}', extra={'request': request})
            return pk, False

    def approve(self, request):
        s = self.change_status(File.CLEAN, File.APPROVED, request)
        if s:
            self.approver = request.user
            self.save()
        return self, s

    def reject(self, request, file_status=None):
        s = self.change_status(file_status or self.status, File.REJECTED, request)
        if s and request.data.get('message'):
            self.message = request.data['message']
            self.save()
        return self, s

    def __str__(self):
        return self.key

    def get_url(self):
        return os.path.join(self.location, self.status, self.key)

    def start_counter(self):
        self.counter = FilenameCounter.objects.create(count=2)
        self.save()

class DataSource(models.Model):
    """Provider of data for puddle jumper"""

    name = models.CharField("Data source name", max_length=128)
    data_origin = models.CharField("Source/origin of the data", max_length=256)
    data_type = models.CharField("Type of the data", max_length=256)
    date_information = models.DateField("Date of Information", null=True)
    date_ingest = models.DateField("Date of Ingest", null=True)
    entities = models.CharField("Entities of the data source", max_length=1028, blank=True, default="")
    frequency = models.CharField("Frequency of data", max_length=256, blank=True, default="")
    leads = models.CharField("Leads", max_length=256, blank=True, default="")
    portfolio = models.CharField("Portfolio for the data source", max_length=1028, blank=True, default="")
    priority = models.IntegerField("Priority of the data source", null=True, default=0)
    request_method = models.CharField("Request method", max_length=256, blank=True, default="")
    status = models.CharField("Status of the data source", max_length=128)  # Limit choices?
    theme = models.CharField("Theme", max_length=128, blank=True, default="")
    update_periodically = models.CharField("Update Periodically", max_length=128, blank=True, default="")  # boolean?

    def __str__(self):
        return self.name

class Note(models.Model):
    """Note to store ideas"""
    
    note = models.TextField("Note Content", blank=True, default='')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Name of creater")
    created_at = models.DateTimeField("Date note created", auto_now_add=True)
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE)

    def __str__(self):
        return self.note[:256] # pylint: disable=unsubscriptable-object

class Todo(models.Model):
    """Things to do"""

    lead = models.CharField("Title of todo", max_length=128, blank=True, default='')
    text = models.TextField("Note Content", blank=True, default='')
    complete = models.BooleanField("Status of the todo", default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Name of creater")
    created_at = models.DateTimeField("Date note created", auto_now_add=True)

    def __str__(self):
        return self.lead
