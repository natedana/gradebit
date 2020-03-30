"""Tests for the file related views"""
from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from server.auth.models import User
from server.pj.models import File, Vendor


class FileStatusTestCase(APITestCase):
    """Test case for the file list view."""

    def setUp(self):
        user = User.objects.create_user(username='admin', password='secret')
        user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')
        self.url = 'file-status'
        self.client.login(username=user.username, password='secret')
        self.testVendor = Vendor.objects.create(name='DummyVendor', code='ABC123')

    @patch('server.pj.views.email')
    def test_status_email_success(self, email_function):
        """Test a file's status update email success"""
        email_function.return_value = True
        f = File.objects.create(
            name='first_file', key='first_test_url', size=200, vendor=self.testVendor, submitter='Uploader', priority=5
        )
        response = self.client.post(reverse(self.url, args=(f.pk,)), {'status': File.APPROVED}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_file = File.objects.get(pk=f.pk)
        self.assertEqual(updated_file.status, File.APPROVED)
        self.assertEqual(updated_file.message, '')

    @patch('server.pj.views.email')
    def test_with_notes(self, email_function):
        """Test updating a file's status and message"""
        email_function.return_value = True
        f = File.objects.create(
            name='first_file', key='first_test_url', size=200, vendor=self.testVendor, submitter='Uploader', priority=5
        )
        response = self.client.post(
            reverse(self.url, args=(f.pk,)),
            {'status': File.CLEAN, 'message': 'Testing Note'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_file = File.objects.get(pk=f.pk)
        self.assertEqual(updated_file.status, File.CLEAN)
        self.assertEqual(updated_file.message, 'Testing Note')

    @patch('server.pj.views.email')
    def test_status_email_fail(self, email_function):
        """Test a file's status update email failure"""
        email_function.return_value = False
        f = File.objects.create(
            name='first_file', key='first_test_url', size=200, vendor=self.testVendor, submitter='Uploader', priority=5
        )
        response = self.client.post(reverse(self.url, args=(f.pk,)), {'status': 'approved'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_status_serializer_fail(self):
        """Test a file's status update email failure"""
        f = File.objects.create(
            name='first_file', key='first_test_url', size=200, vendor=self.testVendor, submitter='Uploader', priority=5
        )
        response = self.client.post(reverse(self.url, args=(f.pk,)), {'status': 'Not real status'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthorized_attempt(self):
        """Test unauthorized attempts return an error status code."""
        self.client.logout()
        response = self.client.post(reverse(self.url, args=(1,)), {'id': 1, 'status': 'approved'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
