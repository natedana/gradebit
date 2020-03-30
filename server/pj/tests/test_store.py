import io
import os
from urllib.parse import urlparse

from django.test import TestCase

from server.pj import store

class TestStore(TestCase):

    def test_extract_s3(self):
        self.assertEqual(store.extract_s3(urlparse('s3://bucket/key')), ('bucket', 'key'))
        self.assertEqual(store.extract_s3(urlparse('s3://bucket/path/to/key')), ('bucket', 'path/to/key'))

    def test_file(self):
        test_file = io.BytesIO(b'Here is a file')
        store.upload('file:///tmp/test.txt', test_file)
        self.assertIsNotNone(os.stat('/tmp/test.txt'))

        store.move('file:///tmp/test.txt', 'file:///tmp/folder/test.txt')
        self.assertIsNotNone(os.stat('/tmp/folder/test.txt'))
        with self.assertRaises(Exception):
            os.stat('/tmp/test.txt')

        self.assertEqual(store.retrieve('file:///tmp/folder/test.txt').read(), b'Here is a file')

        store.delete('file:///tmp/folder/test.txt')
        with self.assertRaises(Exception):
            os.stat('/tmp/folder/test.txt')

        with self.assertRaises(Exception):
            store.retrieve('file:///tmp/folder/test.txt')

        with self.assertRaises(Exception):
            store.delete('file:///tmp/folder/test.txt')
        

    def test_bad_scheme(self):
        with self.assertRaises(Exception):
            store.upload('http://place/to/upload', None)

        with self.assertRaises(Exception):
            store.move('http://place/to/upload', 'http://new/place')

        with self.assertRaises(Exception):
            store.delete('http://place/to/upload')

        with self.assertRaises(Exception):
            store.retrieve('http://place/to/upload')
