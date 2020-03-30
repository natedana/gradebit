"""Tests for the token endpoint"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from server.auth.models import User


class UserTestCase(APITestCase):

    def test_get_token(self):
        """Test to ensure a token is created for each user."""
        user = User.objects.create_user(username='admin')
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['token'])
   
    def test_unauthorized_me(self):
        """Test to make sure no unauthenticated requests are made to the endpoint."""
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login(self):
        """Test to make sure login endpoint works"""
        User.objects.create_user(username='test', password='test')

        with self.settings(AXES_ENABLED=True):
            response = self.client.post(reverse('login'), data={'username': 'test', 'password': 'bad'})
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

            response = self.client.post(reverse('login'), data={'username': 'test', 'password': 'test'})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['username'], 'test')

    def test_logout(self):
        """Test to make sure logout endpoint works"""
        user = User.objects.create_user(username='test')
        self.client.force_authenticate(user=user)

        response = self.client.post(reverse('logout'))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
