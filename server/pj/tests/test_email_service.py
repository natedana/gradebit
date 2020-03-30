from unittest.mock import patch

from django.test import TestCase

from server.pj.email_service import email


class FileStatusTestCase(TestCase):
    """Test case for the file list view."""

    def setUp(self):
        self.subject = "Test"
        self.message = "Test"
        self.recipients = ["test@example.com"]

    
    @patch('server.pj.email_service.send_mail')
    def test_email(self, send_email_function):
        """Test case for the email service."""
        self.assertEqual(email(self.subject, self.message, self.recipients), True)
