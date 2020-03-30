"""Tests for the vendor related views"""
import logging
import os
import shutil

from django.urls import reverse
from django.utils.crypto import get_random_string
from rest_framework import status
from rest_framework.test import APITestCase

from server.auth.models import User
from server.pj.models import Vendor, File

logging.disable(logging.CRITICAL)


def create_vendor():
    name = get_random_string()
    return Vendor.objects.create(name=name)


class VendorViewTestCase(APITestCase):
    """Test case for the vendor list view."""

    def setUp(self):
        user = User.objects.create_user(username='admin')
        user.add_permission_codes('add_vendor', 'change_vendor', 'delete_vendor', 'view_vendor')
        self.url = reverse('vendor-list')
        self.client.force_authenticate(user=user)

    def test_empty_list(self):
        """Test an authorized get with no vendors in the database."""
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_multiple(self):
        """Test an authorized get with multiple vendors in the response."""
        Vendor.objects.create(name='name1', short_name='name1')
        Vendor.objects.create(name='name2', short_name='name2')
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_query_fields(self):
        """Test filtering based on the vendor URL."""
        v1 = Vendor.objects.create(name='abc', short_name='abc')
        v2 = Vendor.objects.create(name='xyz', short_name='xyz')

        response = self.client.get(self.url, {'name': v1.name})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], v1.name)

        response = self.client.get(self.url, {'code': v2.code})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], v2.name)

        response = self.client.get(self.url, {'ordering': '-name'})
        self.assertEqual(response.data[0]['name'], v2.name)

        response = self.client.get(self.url, {'limit': 1, 'offset': 1})
        # Different response structure if offset and limit used
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], v2.name)

    def test_unauthorized(self):
        """Test an authorized response to ensure authentication requirements."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create(self):
        data = {'name': 'VendorTest', 'short_name': 'vt'}
        with self.settings(UPLOAD_LOCATION='file:///tmp/puddle'):
            response = self.client.post(self.url, data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], data['name'])
        for s, _ in File.STATUS_CHOICES:
            self.assertTrue(os.path.isdir(f'/tmp/puddle/{s}/vt'))

        shutil.rmtree('/tmp/puddle')

    def test_create_duplicate(self):
        data = {'name': 'VendorTest', 'short_name': 'vt'}
        response1 = self.client.post(self.url, data=data, format='json')
        response2 = self.client.post(self.url, data=data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve(self):
        v = Vendor.objects.create(name='name', short_name='1')
        url = reverse('vendor-detail', args=[v.id])

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update(self):
        v = Vendor.objects.create(name='name', short_name='2')
        url = reverse('vendor-detail', args=[v.id])

        data = {'name': 'better name'}
        response = self.client.patch(url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete(self):
        v = Vendor.objects.create(name='name', short_name='3')
        url = reverse('vendor-detail', args=[v.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class VendorValidateTestCase(APITestCase):
    """Test case for the validation of vendor codes action."""

    def setUp(self):
        user = User.objects.create_user(username='admin')
        user.add_permission_codes('add_file', 'change_file', 'delete_file', 'view_file')
        self.url = reverse('vendor-validate')
        self.client.force_authenticate(user=user)
        self.testVendor = Vendor.objects.create(
            name='DummyVendor', code='abcdefgh')

    def test_valid_vendor(self):
        data = {'code': self.testVendor.code}
        response = self.client.post(self.url, data, format='json')
        self.assertTrue(response.data)
        self.assertIsInstance(response.data, bool)

    def test_vendor_code_case_insensitive(self):
        data = {'code': self.testVendor.code.upper()}
        response = self.client.post(self.url, data, format='json')
        self.assertTrue(response.data)
        self.assertIsInstance(response.data, bool)

    def test_invalid_vendor(self):
        data = {'code': 'notacode'}
        response = self.client.post(self.url, data, format='json')
        self.assertFalse(response.data)
        self.assertIsInstance(response.data, bool)
