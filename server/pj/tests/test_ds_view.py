"""Tests for the datasource related views"""
import logging

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from server.auth.models import User
from server.pj.models import DataSource

logging.disable(logging.CRITICAL)

def create_datasource(**kwargs):
    data = {
        "name": 'name',
        "data_origin": 'do',
        "data_type": 'dt',
        "date_information": "1993-12-12",
        "date_ingest": "1993-12-12",
        "entities": 'E',
        "frequency": "F",
        "leads": "L",
        "portfolio": "P",
        "priority": 3,
        "request_method": "RM",
        "status": "S",
        "theme": "T",
        "update_periodically": "UP"
    }
    data.update(kwargs)
    return DataSource.objects.create(**data)


class DataSourceViewTestCase(APITestCase):
    """Test case for the datasource list view."""

    def setUp(self):
        user = User.objects.create_user(username='admin')
        user.add_permission_codes('view_datasource', 'add_datasource', 'delete_datasource', 'change_datasource')
        self.url = reverse('datasource-list')
        self.client.force_authenticate(user=user)

    def test_empty_list(self):
        """Test an authorized get with no data sources in the database."""
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_multiple(self):
        """Test an authorized get with multiple data sources in the response."""
        create_datasource()
        create_datasource()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_query_fields(self):
        """Test filtering based on the datasource URL."""
        ds1 = create_datasource(name='abc')
        ds2 = create_datasource(name='xyz', status="OS")

        response = self.client.get(self.url, {'name': ds1.name})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], ds1.name)

        response = self.client.get(self.url, {'status': ds2.status})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], ds2.status)

        response = self.client.get(self.url, {'ordering': '-name'})
        self.assertEqual(response.data[0]['name'], ds2.name)

        response = self.client.get(self.url, {'limit': 1, 'offset': 1})
        # Different response structure if offset and limit used
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], ds2.name)

    def test_unauthorized(self):
        """Test an authorized response to ensure authentication requirements."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create(self):
        data = {
            "name": 'name',
            "data_origin": 'do',
            "data_type": 'dt',
            "date_information": "1993-12-12",
            "date_ingest": "1993-12-12",
            "entities": 'E',
            "frequency": "F",
            "leads": "L",
            "portfolio": "P",
            "priority": 3,
            "request_method": "RM",
            "status": "S",
            "theme": "T",
            "update_periodically": "UP"
        }
        response = self.client.post(self.url, data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], data['name'])

    def test_retrieve(self):
        ds = create_datasource()
        url = reverse('datasource-detail', args=[ds.id])

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update(self):
        ds = create_datasource(name='lame name')
        url = reverse('datasource-detail', args=[ds.id])

        data = {'name': 'better name'}
        response = self.client.patch(url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete(self):
        ds = create_datasource()
        url = reverse('datasource-detail', args=[ds.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class DataSourceSuggestionTestCase(APITestCase):
    """Test case for the validation of datasource codes action."""

    def setUp(self):
        user = User.objects.create_user(username='admin')
        user.add_permission_codes('change_datasource')
        self.url = reverse('datasource-suggestions')
        self.client.force_authenticate(user=user)
        self.datasource = create_datasource(status='status of us')

    def test_suggestions(self):
        data = {'key': 'status', 'value': 'us'}
        response = self.client.post(self.url, data=data, format='json')
        self.assertTrue(response.data)
        self.assertEqual(response.data[0], 'status of us')


class DataSourcePermissionTestCase(APITestCase):
    """Test case for the validation of datasource codes action."""

    def setUp(self):
        user = User.objects.create_user(username='admin')
        self.url = reverse('datasource-suggestions')
        self.client.force_authenticate(user=user)
        self.datasource = create_datasource(status='status of us')

    def test_empty_list(self):
        """Test an authorized get with no data sources in the database."""
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
