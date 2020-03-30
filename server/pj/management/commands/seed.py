import os.path
import urllib.parse
import tempfile

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.files.uploadedfile import UploadedFile

from server.pj.models import Vendor, File, Stakeholder, DataSource, Todo, Note
from server.auth.models import User


class Command(BaseCommand):
    vendor = None

    def _create_user(self):
        try:
            return User.objects.get(username='test')
        except:
            try:
                u = User(username='test', email='test@test.com', first_name="nate is the best coder",
                         is_superuser=True, is_staff=True, is_active=True)
                u.set_password('test')
                u.save()
                return u
            except:
                print('Unable to create test user.')

    def _create_stakeholder(self):
        s, _ = Stakeholder.objects.get_or_create(name='John Doe', phone='5558675309', email='john.doe@test.com')
        return s

    def _create_vendors(self, stakeholder):
        v, _ = Vendor.objects.get_or_create(name='Acme', short_name='acme', code=111111, priority=5)
        v.pocs.add(stakeholder)
        v.save()
        return v

    def _create_files(self, vendor):
        submitter = 'Bob'
        filename = 'file.txt'
        key = os.path.join(vendor.short_name, submitter, filename)
        upload_location = settings.UPLOAD_LOCATION
        f = None

        if not upload_location:
            temp = tempfile.NamedTemporaryFile()
            temp = UploadedFile(temp, filename, size=10)
            f = File.objects.create_file(temp, vendor, submitter)
        else:
            upload_path = urllib.parse.urlparse(os.path.join(settings.UPLOAD_LOCATION, File.UNSCANNED, key)).path
            os.makedirs(os.path.dirname(upload_path), exist_ok=True)
            with open(upload_path, 'w') as new_file:
                new_file.write('this is a test file')
                new_uploaded_file = UploadedFile(new_file, filename, size=10)
                f = File.objects.create_file(new_uploaded_file, vendor, submitter)

        return f

    def _create_data_sources(self):
        ds, _ = DataSource.objects.get_or_create(
            name="Data source #1",
            date_information='1994-12-12',
            date_ingest='1994-12-12',
            entities='e1, e2, e3',
            frequency='30 Hz',
            leads='leads',
            portfolio='portfolio',
            priority=0,
            request_method='request_method',
            status='status',
            theme='theme',
            update_periodically='update_periodically'
        )
        return ds

    def _create_todo(self, user):
        td, _ = Todo.objects.get_or_create(
            lead="This is the lead",
            text="This is the content of the note",
            complete=False,
            created_by=user
        )
        return td

    def _create_note(self, user, data_source):
        td, _ = Note.objects.get_or_create(
            note="Note note NOTE note...",
            data_source=data_source,
            created_by=user
        )
        return td

    def handle(self, *args, **options):
        u = self._create_user()
        s = self._create_stakeholder()
        v = self._create_vendors(s)
        f = self._create_files(v)
        ds = self._create_data_sources()
        td = self._create_todo(u)
        n = self._create_note(u, ds)

        items = [
            ("User", u.username),
            ("Stakeholder", s.name),
            ("Vendor", v.name),
            ("File", f.name),
            ("Data Source", ds.name),
            ("Todo", td.lead),
            ("Note", n.note)
        ]
        items = list(map(lambda tup: f"\n\t{tup[0]}: {tup[1]}", items))
        print("Seeded:" + "".join(items))
