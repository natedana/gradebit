import os.path

from django.db import models
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist


class FileManager(models.Manager):

    def get_file_by_name(self, name):
        try:
            return self.get(name=name)
        except ObjectDoesNotExist:
            return None

    def _build_name(self, name, count):
        name, extension = os.path.splitext(name)
        return '{}_{}{}'.format(name, count, extension)

    def _get_next_filename(self, name):
        existing_file = self.get_file_by_name(name)
        if not existing_file:
            return name

        if not existing_file.counter:
            existing_file.start_counter()
        while self.get_file_by_name(self._build_name(name, existing_file.counter.count)):
            existing_file.counter.increment()
        return self._build_name(name, existing_file.counter.count)

    def create_file(self, uploaded_file, vendor, submitter, status=None):
        """
        create_file 

        :uploaded_file: UploadedFile - must be instance of django.core.files.uploadedfile.UploadedFile
        :vendor: Vendor - instance of Vendor model  
        :submitter: str - name of submitter
        :status: str - from status enum

        :return: File - instance of file created
        """
        filename = self._get_next_filename(uploaded_file.name)
        key = os.path.join(vendor.short_name, submitter, filename)

        extra = {}
        if status:
            extra['status'] = status

        f = self.create(
            name=filename,
            size=uploaded_file.size,
            location=settings.UPLOAD_LOCATION or '',
            key=key,
            vendor=vendor,
            priority=vendor.priority,
            submitter=submitter,
            **extra
        )

        return f
