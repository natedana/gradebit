import os.path
import urllib.parse
import string
import tempfile

from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.management.base import BaseCommand
from django.core.files.uploadedfile import UploadedFile

from server.pj.models import Vendor, File

class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('status', type=str)
        parser.add_argument('count', type=int)

    def _get_random_number(self):
        return get_random_string(length=4, allowed_chars=string.digits)

    def _get_vendor(self):
        try:
            return Vendor.objects.get(name='Acme', short_name='acme', code=111111)
        except:
            try:
                v = Vendor(name='Acme', short_name='acme', code=111111)
                v.save()
                return v
            except:
                print('Unable to create vendor.')

    def _create_file(self, status, index):
        v = self._get_vendor()
        submitter = 'Bob'
        filename = '{}_{}-{}.txt'.format(status, index, self._get_random_number())
        key = os.path.join(v.short_name, submitter, filename)
        upload_location = settings.UPLOAD_LOCATION
        f = None
        
        if not upload_location:
            temp = tempfile.NamedTemporaryFile()
            temp = UploadedFile(temp, filename, size=10)
            f = File.objects.create_file(temp, v, submitter)
        else:
            upload_path = urllib.parse.urlparse(os.path.join(upload_location, status, key)).path
            os.makedirs(os.path.dirname(upload_path), exist_ok=True)
            with open(upload_path, 'w') as new_file:
                new_file.write('this is a test file')
                new_uploaded_file = UploadedFile(new_file, filename, size=10)
                f = File.objects.create_file(new_uploaded_file, v, submitter, status=status)

        return f

    def handle(self, *args, **options):
        statuses = [s for s, _ in File.STATUS_CHOICES]
        status = options.get('status', '')
        if status.lower() not in statuses:
            raise Exception('Must provide status from list')
        count = options.get('count', 1)

        files = [self._create_file(status, index) for index in range(0, count)]
        print("Seeded {} file(s) of {} status.".format(count, status))
        file_keys = list(map(lambda f: f.key, files))
        if len(file_keys) > 5:
            file_string = '\n\t- ' + '\n\t- '.join(file_keys[:5]) + '\n\t(+{} more)...'.format(len(file_keys) - 5)
        else:
            file_string = '\n\t'.join(file_keys)
        print(file_string)
