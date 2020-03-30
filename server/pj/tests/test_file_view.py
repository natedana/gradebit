"""Tests for the file related views"""
import io
import logging
from unittest.mock import patch

from django.urls import reverse
from django.conf import settings
from django.test import override_settings
from django.utils.crypto import get_random_string
from django.core.cache import cache
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from server.auth.models import User
from server.pj.models import File, Vendor

logging.disable(logging.CRITICAL)

def create_file(vendor, **kwargs):
    name = get_random_string()
    submitter = kwargs.pop('submitter', 'Test User')

    return File.objects.create(
        name=kwargs.pop('name', f'{name}.txt'),
        location=kwargs.pop('location', 's3://test-bucket'),
        key=kwargs.pop('key', f'{vendor.short_name}/{submitter}/{name}.txt'),
        size=kwargs.pop('size', 10),
        vendor=vendor,
        submitter=submitter,
        priority=5,
        **kwargs
    )

class FileViewTestCase(APITestCase):
    """Test case for the file list view."""

    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='secret')
        self.user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')
        self.url = reverse('file-list')
        self.client.login(username=self.user.username, password='secret')
        self.testVendor1 = Vendor.objects.create(name='DummyVendor1', code='ABC123', short_name='dv1')
        self.testVendor2 = Vendor.objects.create(name='DummyVendor2', code='RESPEC', short_name='dv2')

    def test_empty(self):
        """Test an authorized get with no files in the database."""
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_multiple(self):
        """Test an authorized get with multiple files in the response."""
        create_file(self.testVendor1)
        create_file(self.testVendor2)

        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        response = self.client.get(self.url, {'code': self.testVendor1.code}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        response = self.client.get(self.url, {'code': 'MYCODE'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_unauthorized(self):
        """Test an authorized response to ensure authentication requirements."""
        self.client.logout()
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_with_token(self):
        """Test retrieving files with token authentication."""
        self.client.logout()
        token = Token.objects.get(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_valid_create(self):
        """Test a valid creation of a file."""
        data = {
            'name': 'test_file.txt',
            'location': 'file:///test_url',
            'key': 'test_file.txt',
            'size': 10101,
            'vendor_short_name': self.testVendor1.short_name,
            'submitter': 'System Admin'
        }
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['name'], data['name'])
        self.assertEqual(response.data['priority'], self.testVendor1.priority)
        self.assertIsNotNone(response.data['pk'])

    def test_valid_create_with_priority(self):
        """Test a valid creation of a file."""
        data = {
            'name': 'test_file.txt',
            'location': 'file:///test_url',
            'key': 'test_file.txt',
            'size': 10101,
            'vendor_short_name': self.testVendor1.short_name,
            'submitter': 'System Admin',
            'priority': 4
        }
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['name'], data['name'])
        self.assertEqual(response.data['priority'], 4)
        self.assertIsNotNone(response.data['pk'])

    def test_create_missing_vendor(self):
        """Test an invalid creation of a file because the vendor doesn't exist."""
        data = {
            'name': 'test_file.txt',
            'location': 'file:///test_url',
            'key': 'test_file.txt',
            'size': 10101,
            'vendor_short_name': 'IDontExist',
            'submitter': 'System Admin'
        }
        response = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_method(self):
        """Test to make sure DELETEs are not allowed."""
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

class FileViewListParamTestCase(APITestCase):
    """Test case for the file list view."""

    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='secret')
        self.user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')
        self.url = reverse('file-list')
        self.client.login(username=self.user.username, password='secret')
        self.testVendor1 = Vendor.objects.create(name='DummyVendor1', code='ABC123', short_name='dv1')
        self.testVendor2 = Vendor.objects.create(name='DummyVendor2', code='RESPEC', short_name='dv2')
        self.file1 = create_file(self.testVendor1, name='first', key='first_test_key', submitter="joe")
        self.file2 = create_file(self.testVendor2, name='second', key='second_test_key', submitter='bob')
        self.file3 = create_file(self.testVendor1, name='third', key='third_test_key', submitter='larry')
        self.file4 = create_file(self.testVendor2, name='fourth', key='fourth_test_key', submitter='robocop')

    def test_ordering(self):
        response = self.client.get(self.url, {'ordering': '-name'})
        names = list(map(lambda x: x['name'], response.data))
        self.assertEqual(names, ['third', 'second', 'fourth', 'first'])

    def test_ordering_invalid_param(self):
        # Defaults back to regular ordering (upload date = creation date bc of auto_now_add)
        response = self.client.get(self.url, {'ordering': 'tacos'})
        names = list(map(lambda x: x['name'], response.data))
        self.assertEqual(names, ['fourth', 'third', 'second', 'first'])

    def test_vendor_ordering(self):
        response = self.client.get(self.url, {'ordering': 'vendor'})
        names = list(map(lambda x: x['vendor']['name'], response.data))
        self.assertEqual(names, ['DummyVendor1', 'DummyVendor1', 'DummyVendor2', 'DummyVendor2'])

    def test_filtering(self):
        response = self.client.get(self.url, {'name': 'first'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'first')

    def test_multi_filtering(self):
        response = self.client.get(self.url, {'name': 'r', 'submitter': 'robo'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'fourth')

    def test_filter_invalid(self):
        response = self.client.get(self.url, {'size': 'r'})
        self.assertEqual(len(response.data), 0)

class FileUploadThrottleTestCase(APITestCase):
    """Test case for the file upload action."""

    def setUp(self):
        cache.clear()
        self.url = reverse('file-upload')
        self.user = User.objects.create_user(username='admin', password='secret')
        self.testVendor = Vendor.objects.create(name='SmartyVendor', code='snoopy', short_name='sv')

    def test_upload_throttle(self):
        for i in range(0, 6):
            data = {
                'vendor_code': self.testVendor.code,
                'submitter': 'Test user 0.1',
                'file': io.BytesIO(b'Here is a file')
            }
            with self.settings(UPLOAD_LOCATION=None):
                response = self.client.post(self.url, data, format='multipart')
            if i != 5:
                self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
            else:
                self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        files = File.objects.filter(submitter=data['submitter'])
        self.assertEqual(files.count(), 5)

    def test_upload_throttle_with_creds(self):
        self.client.login(username=self.user.username, password='secret')
        for _ in range(0, 6):
            data = {
                'vendor_code': self.testVendor.code,
                'submitter': 'Test user 0.2',
                'file': io.BytesIO(b'Here is a file')
            }
            with self.settings(UPLOAD_LOCATION=None):
                response = self.client.post(self.url, data, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        files = File.objects.filter(submitter=data['submitter'])
        self.assertEqual(files.count(), 6)
        self.client.logout()

TEST_REST_FRAMEWORK = settings.REST_FRAMEWORK.copy()
TEST_REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {'anon': '30/minute'}

class FileUploadTestCase(APITestCase):
    """Test case for the file upload action."""

    def setUp(self):
        cache.clear()
        self.url = reverse('file-upload')
        self.testVendor = Vendor.objects.create(name='DummyVendor', code='abcdefgh', short_name='dv')

    @override_settings(REST_FRAMEWORK=TEST_REST_FRAMEWORK)
    def test_upload_single(self):
        data = {
            'vendor_code': self.testVendor.code,
            'submitter': 'Test User 1',
            'file': io.BytesIO(b'Here is a file')
        }
        with self.settings(UPLOAD_LOCATION=None):
            response = self.client.post(self.url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        files = File.objects.filter(submitter=data['submitter'])
        self.assertEqual(files.count(), 1)
        self.assertEqual(files[0].status, File.FAILED)
        self.assertTrue(files[0].message)
    
    @override_settings(REST_FRAMEWORK=TEST_REST_FRAMEWORK)
    def test_upload_multiple(self):
        test_file1 = io.BytesIO(b'Here is a file')
        test_file1.name = 'test.txt'
        test_file2 = io.BytesIO(b'Here is another file')
        test_file2.name = 'test2.txt'
        data = {
            'vendor_code': self.testVendor.code,
            'submitter': 'Test User 2',
            'file': [test_file1, test_file2]
        }
        with self.settings(UPLOAD_LOCATION=None):
            response = self.client.post(self.url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED, response.content)
        files = File.objects.filter(submitter=data['submitter'])
        self.assertEqual(files.count(), 2)

    @override_settings(REST_FRAMEWORK=TEST_REST_FRAMEWORK)
    def test_invalid_vendor(self):
        data = {
            'vendor_code': 'badcode',
            'submitter': 'Test User 3',
            'file': [io.BytesIO(b'Here is a file'), io.BytesIO(b'Here is another file')]
        }
        with self.settings(UPLOAD_LOCATION=None):
            response = self.client.post(self.url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.content)
        files = File.objects.filter(submitter=data['submitter'])
        self.assertEqual(files.count(), 0)

    @override_settings(REST_FRAMEWORK=TEST_REST_FRAMEWORK)
    def test_case_insensitive_vendor_code(self):
        data = {
            'vendor_code': self.testVendor.code.upper(),
            'submitter': 'Test User 1',
            'file': io.BytesIO(b'Here is a file')
        }
        with self.settings(UPLOAD_LOCATION=None):
            response = self.client.post(self.url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        files = File.objects.filter(submitter=data['submitter'])
        self.assertEqual(files.count(), 1)
        self.assertEqual(files[0].status, File.FAILED)
        self.assertTrue(files[0].message)

    @override_settings(REST_FRAMEWORK=TEST_REST_FRAMEWORK)
    @patch('server.pj.store.s3_upload')
    def test_s3_upload(self, upload_function):
        test_file = io.BytesIO(b'Here is a file')
        test_file.name = 'test.txt'
        data = {
            'vendor_code': self.testVendor.code,
            'submitter': 'Test User 4',
            'file': test_file
        }
        with self.settings(UPLOAD_LOCATION='s3://test-bucket'):
            response = self.client.post(self.url, data, format='multipart')

        upload_function.assert_called()
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        files = File.objects.filter(submitter=data['submitter'])
        self.assertEqual(files.count(), 1)
        self.assertEqual(files[0].location, 's3://test-bucket')
        self.assertEqual(files[0].key, 'dv/Test User 4/test.txt')
        self.assertEqual(files[0].status, File.UNSCANNED)

    @override_settings(REST_FRAMEWORK=TEST_REST_FRAMEWORK)
    @patch('server.pj.store.s3_upload')
    def test_s3_upload_failed(self, upload_function):
        upload_function.side_effect = Exception('Something went wrong')
        test_file = io.BytesIO(b'Here is a file')
        test_file.name = 'test.txt'
        data = {
            'vendor_code': self.testVendor.code,
            'submitter': 'Test User 1',
            'file': test_file
        }
        with self.settings(UPLOAD_LOCATION='s3://test-bucket'):
            response = self.client.post(self.url, data, format='multipart')

        upload_function.assert_called()
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        files = File.objects.filter(submitter=data['submitter'])
        self.assertEqual(files.count(), 0)

class FileRetryTestCase(APITestCase):
    """Test case for the file retry action."""

    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='secret')
        self.user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')
        self.singleUrl = 'file-retry'
        self.bulkUrl = reverse('file-retry-bulk')
        self.testVendor = Vendor.objects.create(name='DummyVendor', code='123456', short_name='dv4')
        self.client.login(username=self.user.username, password='secret')

    @patch('server.pj.store.s3_move')
    def test_retry_single_not_correct_status(self, move_function):
        f = create_file(self.testVendor, status=File.CLEAN)
        
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        move_function.assert_not_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.CLEAN)

    @patch('server.pj.store.s3_move')
    def test_retry_single_failed(self, move_function):
        f = create_file(self.testVendor, status=File.FAILED)
        
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        move_function.assert_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.UNSCANNED)

    @patch('server.pj.store.s3_move')
    def test_retry_single_transferred(self, move_function):
        f = create_file(self.testVendor, status=File.TRANSFERRED)
        fragments = [1, 2, 3]
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)), fragments, format='json')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        move_function.assert_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        del f.fragments
        self.assertEqual(f.APPROVED, File.APPROVED)
        self.assertEqual(f.fragments, fragments)

    @patch('server.pj.store.s3_move')
    def test_retry_single_failed_with_fragments(self, move_function):
        f = create_file(self.testVendor, status=File.FAILED)
        fragments = [1, 2, 3]
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)), fragments, format='json')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        move_function.assert_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.UNSCANNED)
        self.assertEqual(f.fragments, [])

    @patch('server.pj.store.s3_move')
    def test_retry_single_failed_with_error(self, move_function):
        f = create_file(self.testVendor, status=File.CLEAN)
        
        move_function.side_effect = Exception("Something went wrong")
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        move_function.assert_not_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.CLEAN)

    @patch('server.pj.store.s3_move')
    def test_retry_bulk(self, move_function):
        f1 = create_file(self.testVendor, status=File.FAILED)
        f2 = create_file(self.testVendor, status=File.FAILED)
        
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        move_function.assert_called()
        self.assertEqual(response.data['succeeded'], [f1.pk, f2.pk])
        self.assertEqual(response.data['failed'], [])
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.UNSCANNED)
        self.assertEqual(f2.status, File.UNSCANNED)

    @patch('server.pj.store.s3_move')
    def test_retry_bulk_some_not_failed(self, move_function):
        f1 = create_file(self.testVendor, status=File.CLEAN)
        f2 = create_file(self.testVendor, status=File.FAILED)
        
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        move_function.assert_called()
        self.assertEqual(response.data['failed'], [f1.pk])
        self.assertEqual(response.data['succeeded'], [f2.pk])
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.CLEAN)
        self.assertEqual(f2.status, File.UNSCANNED)

    @patch('server.pj.store.s3_move')
    def test_retry_bulk_all_not_failed(self, move_function):
        f1 = create_file(self.testVendor, status=File.CLEAN)
        f2 = create_file(self.testVendor, status=File.CLEAN)
        
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        move_function.assert_not_called()
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.CLEAN)
        self.assertEqual(f2.status, File.CLEAN)

class FileApproveTestCase(APITestCase):
    """Test case for the file approve action."""

    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='secret')
        self.user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')
        self.singleUrl = 'file-approve'
        self.bulkUrl = reverse('file-approve-bulk')
        self.testVendor = Vendor.objects.create(name='DummyVendor', code='123456', short_name='dv5')
        self.client.login(username=self.user.username, password='secret')

    @patch('server.pj.store.s3_move')
    def test_approve_single_without_permission(self, move_function):
        f = create_file(self.testVendor, status=File.CLEAN)
        self.user.user_permissions.clear()
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        move_function.assert_not_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.CLEAN)
        self.user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')

    @patch('server.pj.store.s3_move')
    def test_approve_single_with_permission(self, move_function):

        f = create_file(self.testVendor, status=File.CLEAN)
        
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        move_function.assert_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.APPROVED)

    @patch('server.pj.store.s3_move')
    def test_approve_single_not_clean(self, move_function):
        f = create_file(self.testVendor, status=File.UNSCANNED)
        
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        move_function.assert_not_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.UNSCANNED)

    @patch('server.pj.store.s3_move')
    def test_approve_single_failed(self, move_function):
        f = create_file(self.testVendor, status=File.CLEAN)
        
        move_function.side_effect = Exception("Something went wrong")
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)))

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        move_function.assert_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.CLEAN)

    @patch('server.pj.store.s3_move')
    def test_approve_bulk(self, move_function):
        f1 = create_file(self.testVendor, status=File.CLEAN)
        f2 = create_file(self.testVendor, status=File.CLEAN)
        
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        move_function.assert_called()
        self.assertEqual(response.data['succeeded'], [f1.pk, f2.pk])
        self.assertEqual(response.data['failed'], [])
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.APPROVED)
        self.assertEqual(f2.status, File.APPROVED)

    @patch('server.pj.store.s3_move')
    def test_approve_bulk_some_not_clean(self, move_function):
        f1 = create_file(self.testVendor, status=File.CLEAN)
        f2 = create_file(self.testVendor, status=File.UNSCANNED)
        
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        move_function.assert_called()
        self.assertEqual(response.data['succeeded'], [f1.pk])
        self.assertEqual(response.data['failed'], [f2.pk])
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.APPROVED)
        self.assertEqual(f2.status, File.UNSCANNED)

    @patch('server.pj.store.s3_move')
    def test_approve_bulk_all_not_clean(self, move_function):
        f1 = create_file(self.testVendor, status=File.UNSCANNED)
        f2 = create_file(self.testVendor, status=File.UNSCANNED)
        
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        move_function.assert_not_called()
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.UNSCANNED)
        self.assertEqual(f2.status, File.UNSCANNED)

    @patch('server.pj.store.s3_move')
    def test_approve_bulk_all_fail(self, move_function):
        f1 = create_file(self.testVendor, status=File.CLEAN)
        f2 = create_file(self.testVendor, status=File.CLEAN)
        
        move_function.side_effect = Exception('Something went wrong')
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        move_function.assert_called()
        self.assertEqual(response.data['succeeded'], [])
        self.assertEqual(response.data['failed'], [f1.pk, f2.pk])
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.CLEAN)
        self.assertEqual(f2.status, File.CLEAN)

class FileDisapproveTestCase(APITestCase):
    """Test case for the file disapprove/reject action."""

    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='secret')
        self.user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')
        self.singleUrl = 'file-reject'
        self.bulkUrl = reverse('file-reject-bulk')
        self.testVendor = Vendor.objects.create(name='DummyVendor', code='123456', short_name='dv5')
        self.client.login(username=self.user.username, password='secret')

    @patch('server.pj.store.s3_move')
    def reject_single_without_permission(self, move_function):
        f = create_file(self.testVendor, status=File.CLEAN)
        self.user.user_permissions.clear()
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)), {'message': ''})

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        move_function.assert_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.CLEAN)
        self.user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')

    @patch('server.pj.store.s3_move')
    def test_reject_single_with_permission(self, move_function):

        f = create_file(self.testVendor, status=File.CLEAN)
        
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)), {'message': ''})

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        move_function.assert_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.REJECTED)

    @patch('server.pj.store.s3_move')
    def test_reject_single_wrong_status(self, move_function):
        f = create_file(self.testVendor, status=File.APPROVED)
        
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)), {'message': ''})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        move_function.assert_not_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.APPROVED)

    @patch('server.pj.store.s3_move')
    def test_reject_single_failed(self, move_function):
        f = create_file(self.testVendor, status=File.CLEAN)
        
        move_function.side_effect = Exception("Something went wrong")
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)), {'message': ''})

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        move_function.assert_called()
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.CLEAN)

    @patch('server.pj.store.s3_move')
    def test_reject_message_single_failed(self, move_function):
        f = create_file(self.testVendor, status=File.CLEAN)
        
        move_function.side_effect = Exception("Something went wrong")
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)), {'message': 'MESSAGE'})

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        move_function.assert_called()
        del f.message # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.message, "")

    @patch('server.pj.store.s3_move')
    def test_reject_single(self, move_function):
        f = create_file(self.testVendor, status=File.CLEAN)
        
        response = self.client.post(reverse(self.singleUrl, args=(f.pk,)), {'message': 'MESSAGE'})

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        move_function.assert_called()
        del f.message # Deleting causes the value to be reloaded from the DB
        del f.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f.status, File.REJECTED)
        self.assertEqual(f.message, "MESSAGE")

    @patch('server.pj.store.s3_move')
    def test_reject_bulk(self, move_function):
        f1 = create_file(self.testVendor, status=File.CLEAN)
        f2 = create_file(self.testVendor, status=File.UNSCANNED)
        
        response = self.client.post(self.bulkUrl, {'pks': [f1.pk, f2.pk], 'message': ''}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        move_function.assert_called()
        self.assertEqual(response.data['succeeded'], [f1.pk, f2.pk])
        self.assertEqual(response.data['failed'], [])
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.REJECTED)
        self.assertEqual(f2.status, File.REJECTED)

    @patch('server.pj.store.s3_move')
    def test_reject_bulk_some_not_correct_status(self, move_function):
        f1 = create_file(self.testVendor, status=File.CLEAN)
        f2 = create_file(self.testVendor, status=File.APPROVED)
        
        response = self.client.post(self.bulkUrl, {'pks': [f1.pk, f2.pk], 'message': ''}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        move_function.assert_called()

        self.assertEqual(response.data['succeeded'], [f1.pk])
        self.assertEqual(response.data['failed'], [f2.pk])
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.REJECTED)
        self.assertEqual(f2.status, File.APPROVED)

    @patch('server.pj.store.s3_move')
    def test_reject_bulk_all_not_correct_status(self, move_function):
        f1 = create_file(self.testVendor, status=File.APPROVED)
        f2 = create_file(self.testVendor, status=File.APPROVED)
        
        response = self.client.post(self.bulkUrl, {'pks': [f1.pk, f2.pk], 'message': ''}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        move_function.assert_not_called()
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.APPROVED)
        self.assertEqual(f2.status, File.APPROVED)

    @patch('server.pj.store.s3_move')
    def test_reject_bulk_all_fail(self, move_function):
        f1 = create_file(self.testVendor, status=File.CLEAN)
        f2 = create_file(self.testVendor, status=File.CLEAN)
        
        move_function.side_effect = Exception('Something went wrong')
        response = self.client.post(self.bulkUrl, {'pks': [f1.pk, f2.pk], 'message': ''}, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        move_function.assert_called()
        self.assertEqual(response.data['succeeded'], [])
        self.assertEqual(response.data['failed'], [f1.pk, f2.pk])
        del f1.status # Deleting causes the value to be reloaded from the DB
        del f2.status # Deleting causes the value to be reloaded from the DB
        self.assertEqual(f1.status, File.CLEAN)
        self.assertEqual(f2.status, File.CLEAN)


class FileDeleteTestCase(APITestCase):
    """Test case for the file delete action."""

    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='secret')
        self.user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')
        self.bulkUrl = reverse('file-delete-bulk')
        self.testVendor = Vendor.objects.create(name='DummyVendor', code='123456', short_name='dv6')
        self.client.login(username=self.user.username, password='secret')

    @patch('server.pj.store.s3_delete')
    def test_delete_bulk(self, delete_function):
        f1 = create_file(self.testVendor)
        f2 = create_file(self.testVendor)
        
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        delete_function.assert_called()
        self.assertEqual(response.data['succeeded'], [f1.pk, f2.pk])
        self.assertEqual(response.data['failed'], [])

    @patch('server.pj.store.s3_delete')
    def test_delete_bulk_all_fail(self, delete_function):
        f1 = create_file(self.testVendor)
        f2 = create_file(self.testVendor)
        
        delete_function.side_effect = Exception('Something went wrong')
        response = self.client.post(self.bulkUrl, [f1.pk, f2.pk], format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        delete_function.assert_called()
        self.assertEqual(response.data['succeeded'], [])
        self.assertEqual(response.data['failed'], [f1.pk, f2.pk])
