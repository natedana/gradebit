from enum import Enum, unique
import os
import urllib.parse

import boto3

s3 = boto3.resource('s3')

@unique
class Scheme(Enum):
    S3 = 's3'
    FILE = 'file'


def extract_s3(parsed):
    return parsed.netloc, parsed.path.lstrip('/')


def extract_file(parsed):
    return parsed.path


def create_folders(location, vendor_name, choices):
    parsed = urllib.parse.urlparse(location)
    for status, _ in choices:
        if parsed.scheme == Scheme.S3.value:
            bucket, key = extract_s3(parsed)
            obj = s3.Object(bucket, os.path.join(key, status, vendor_name, ''))
            obj.put()
        elif parsed.scheme == Scheme.FILE.value:
            os.makedirs(os.path.join(parsed.path, status, vendor_name, ''), exist_ok=True)
        else:
            raise Exception(f'Unknown scheme for create folders: {parsed.scheme}')


def upload(url, file_obj):
    parsed = urllib.parse.urlparse(url)

    if parsed.scheme == Scheme.S3.value:
        bucket, key = extract_s3(parsed)
        s3_upload(bucket, key, file_obj)
    elif parsed.scheme == Scheme.FILE.value:
        file_name = extract_file(parsed)
        os.makedirs(os.path.dirname(file_name), exist_ok=True)
        with open(file_name, 'wb') as new_file:
            new_file.write(file_obj.read())
    else:
        raise Exception(f'Unknown scheme for file upload: {parsed.scheme}')


def s3_upload(bucket, key, file_obj):
    obj = s3.Object(bucket, key)
    obj.upload_fileobj(file_obj)


def move(old_url, new_url):
    old_parsed = urllib.parse.urlparse(old_url)
    new_parsed = urllib.parse.urlparse(new_url)

    if old_parsed.scheme == Scheme.S3.value and new_parsed.scheme == Scheme.S3.value:
        old_bucket, old_key = extract_s3(old_parsed)
        new_bucket, new_key = extract_s3(new_parsed)
        s3_move(old_bucket, old_key, new_bucket, new_key)
    elif old_parsed.scheme == Scheme.FILE.value and new_parsed.scheme == Scheme.FILE.value:
        new_filename = extract_file(new_parsed)
        os.makedirs(os.path.dirname(new_filename), exist_ok=True)
        os.rename(extract_file(old_parsed), new_filename)
    else:
        raise Exception(
            f'Unknown scheme for file move: {(old_parsed.scheme, new_parsed.scheme)}')


def s3_move(old_bucket, old_key, new_bucket, new_key):
    s3.Object(new_bucket, new_key).copy({'Bucket': old_bucket, 'Key': old_key})
    s3.Object(old_bucket, old_key).delete()


def delete(url):
    parsed = urllib.parse.urlparse(url)

    if parsed.scheme == Scheme.S3.value:
        bucket, key = extract_s3(parsed)
        s3_delete(bucket, key)
    elif parsed.scheme == Scheme.FILE.value:
        filepath = extract_file(parsed)
        if os.path.exists(filepath):
            os.remove(filepath)
        else:
            raise Exception(f'Could not find local file to delete: {filepath}')
    else:
        raise Exception(f'Unknown scheme for file delete: {parsed.scheme}')


def s3_delete(bucket, key):
    obj = s3.Object(bucket, key)
    obj.delete()

def retrieve(url):
    parsed = urllib.parse.urlparse(url)

    if parsed.scheme == Scheme.S3.value:
        bucket, key = extract_s3(parsed)
        obj = s3.Object(bucket, key)
        data = obj.get()
        return data['Body']

    if parsed.scheme == Scheme.FILE.value:
        filepath = extract_file(parsed)
        if os.path.exists(filepath):
            return open(filepath, 'rb')
        raise Exception(f'Could not find local file to retrieve: {filepath}')

    raise Exception(f'Unknown scheme for file retrieve: {parsed.scheme}')
