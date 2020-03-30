import logging

from django.conf import settings
from django.db.models.functions import Concat
from django.db.models import Count, F, Value, CharField
from django.http.response import FileResponse
from rest_framework import status, viewsets, mixins, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from filters.mixins import FiltersMixin

from server.pj.email_service import email
from server.pj.models import File, Vendor, Stakeholder, DataSource, Note, Todo
from server.pj.serializers import (FileSerializer, FileUploadSerializer,
                                   VendorSerializer, VendorValidateSerializer, StakeholderSerializer,
                                   DataSourceSerializer, NoteSerializer, TodoSerializer)
from server.pj.store import upload, retrieve, create_folders
from server.pj.permissions import get_permission_classes
from server.pj.ordering import MappedOrderFilter
from server.pj.throttles import get_throttle_classes

logger = logging.getLogger(__name__)

def parse_list(val):
    return val.split(',')

def validate_int(num):
    try:
        return int(num)
    except ValueError:
        return 0
        
status_whitelist = [
    File.CLEAN,
    File.APPROVED,
    File.TRANSFERRED
]

status_email_notification = [
    File.QUARANTINED,
    File.FAILED
]

class FileViewSet(
        FiltersMixin,
        mixins.ListModelMixin,
        mixins.CreateModelMixin,
        mixins.RetrieveModelMixin,
        viewsets.GenericViewSet
):
    """View set to interact with the file model."""
    permission_classes = get_permission_classes('pj', 'file', anon_actions=('upload',))
    serializer_class = FileSerializer
    queryset = File.objects.all().annotate(url=Concat(F('location'), Value('/'), F('status'), Value('/'), F('key'), output_field=CharField()))
    pagination_class = LimitOffsetPagination
    throttle_classes = get_throttle_classes('upload')
    filter_backends = (MappedOrderFilter,)
    filter_mappings = {
        'code': 'vendor__code',
        'name': 'name__icontains',
        'location': 'location__icontains',
        'status': 'status__in',
        'size': 'size',
        'url': 'url__icontains',
        'vendor': 'vendor__name__icontains',
        'submitter': 'submitter__icontains',
        'date_uploaded_after': 'date_uploaded__gte',
        'date_uploaded_before': 'date_uploaded__lte',
        'date_approved_after': 'date_approved__gte',
        'date_approved_before': 'date_approved__lte',
        'key': 'key'
    }
    filter_value_transformations = {
        'status': parse_list,
        'size': validate_int
    }
    ordering_fields = ('name', 'location', 'size', 'vendor', 'submitter', 'date_uploaded', 'date_approved', 'status', 'url')
    ordering_mappings = {
        'vendor': 'vendor__name'
    }
    ordering = ('-date_uploaded',)

    @action(
        detail=False,
        methods=['POST'],
        parser_classes=(MultiPartParser,),
        serializer_class=FileUploadSerializer)
    def upload(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor = serializer.validated_data['vendor']
        submitter = serializer.validated_data['submitter']
        successful_urls = []
        names_changed = []
        for uploaded_file in serializer.validated_data['file']:
            # The s3 key needs to follow certain rules: https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
            f = File.objects.create_file(uploaded_file, vendor, submitter)
            if f.name != uploaded_file.name:
                names_changed.append([uploaded_file.name, f.name])

            if f.location:
                try:
                    url = f.get_url()
                    upload(url, uploaded_file)
                    successful_urls.append(url)
                except Exception as e:
                    logger.error(f'Upload to {f.location} failed: {e}', extra={'request': request})
                    f.delete()
                    return Response('File upload failed', status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                logger.error('No upload location defined, skipping upload', extra={'request': request})
                f.message = 'No upload location defined, skipping upload'
                f.status = File.FAILED
                f.save()

        try:
            url_list = "\n".join(successful_urls)
            body = f'Files uploaded successfully by {vendor.name} - {submitter}\n\n{url_list}'
            logger.info(body, extra={'request': request})
            poc_emails = [e for e in vendor.pocs.all().values_list('email', flat=True) if e]
            if not email(f'{len(successful_urls)} file(s) uploaded to puddle-jumper', body, poc_emails):
                logger.error('No emails were sent for file upload', extra={'request': request})
        except Exception as e:
            logger.error(f'Failed to send file upload email: {e}', extra={'request': request})

        return Response(names_changed, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['GET'])
    def data(self, request, pk=None):
        f = self.get_object()
        if not f.status in status_whitelist:
            return Response('File has not been successfully virus scanned', status=status.HTTP_400_BAD_REQUEST)

        stream = retrieve(f.get_url())

        download = 'download' in request.query_params

        return FileResponse(stream, filename=f.name, as_attachment=download)

    @action(detail=True, methods=['POST'])
    def status(self, request, pk=None):
        """
        This route is used by jumper cables to update the django file instance as it is processed
        """
        f = self.get_object()
        file_status = request.data['status']
        if f.status == File.REJECTED:
            # If the file already has rejected status, move file appropriately
            f, s = f.reject(request, file_status)
            if not s:
                return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            f = FileSerializer(f)
            return Response(f.data)

        message = request.data.get('message', None)
        data = {'status': file_status}
        if message is not None:
            data['message'] = message

        serializer = FileSerializer(f, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        message = f'File {f.key} status change to {file_status}'
        logger.info(message, extra={'request': request})

        if file_status in status_email_notification:
            try:
                if not email(f'File {f.key} updated', message):
                    logger.error('No emails were sent for status update', extra={'request': request})
            except Exception as e:
                # Think we just want to log an email failed and not return 500 status
                logger.error(f'Failed to send status update email: {e}', extra={'request': request})

        if file_status == File.CLEAN and f.vendor.approves(f):
            _, succeeded = f.approve(request)
            if not succeeded:
                return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response(serializer.data)

    
    @action(detail=False, methods=['POST'])
    def retry_bulk(self, request):
        files = self.get_queryset().filter(pk__in=request.data, status__in=[File.FAILED, File.TRANSFERRED])
        if files.count() == 0:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        results = [f.reset(request) for f in files]
        succeeded = [f.pk for f, s in results if s]
        return Response({
            'succeeded': succeeded,
            'failed': [pk for pk in request.data if pk not in succeeded]
        }, status=status.HTTP_200_OK if succeeded else status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['POST'])
    def retry(self, request, pk=None):
        f = self.get_object()
        fragments = request.data
        if f.status not in [File.FAILED, File.TRANSFERRED]:
            return Response('File must have failed or transferred status to attempt a retry', status=status.HTTP_400_BAD_REQUEST)
        if f.status == File.TRANSFERRED:
            f.fragments = fragments
            f.save()

        f, succeeded = f.reset(request)
        if not succeeded:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['POST'])
    def approve_bulk(self, request):
        files = self.get_queryset().filter(pk__in=request.data, status=File.CLEAN)
        if files.count() == 0:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        results = [f.approve(request) for f in files]
        succeeded = [f.pk for f, s in results if s]
        return Response({
            'succeeded': succeeded,
            'failed': [pk for pk in request.data if pk not in succeeded]
        }, status=status.HTTP_200_OK if succeeded else status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['POST'])
    def approve(self, request, pk=None):
        f = self.get_object()
        if not f.status == File.CLEAN:
            return Response('File must have a Clean status to approve', status=status.HTTP_400_BAD_REQUEST)

        f, succeeded = f.approve(request)
        if not succeeded:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['POST'])
    def reject_bulk(self, request):
        files = self.get_queryset().filter(pk__in=request.data['pks'], status__in=[File.CLEAN, File.UNSCANNED])
        if files.count() == 0:
            return Response('File must have a clean or unscanned status to reject', status=status.HTTP_400_BAD_REQUEST)

        results = [f.reject(request) for f in files]
        succeeded = [f.pk for f, s in results if s]
        return Response({
            'succeeded': succeeded,
            'failed': [pk for pk in request.data['pks'] if pk not in succeeded]
        }, status=status.HTTP_200_OK if succeeded else status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['POST'])
    def reject(self, request, pk=None):
        f = self.get_object()
        if f.status not in [File.CLEAN, File.UNSCANNED]:
            return Response('File must have a clean or unscanned status to reject', status=status.HTTP_400_BAD_REQUEST)

        f, succeeded = f.reject(request)
        if not succeeded:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['POST'])
    def delete_bulk(self, request):
        files = self.get_queryset().filter(pk__in=request.data)
        if files.count() == 0:
            return Response(status=status.HTTP_200_OK)
            
        results = [f.delete_file(request) for f in files]
        succeeded = [pk for pk, s in results if s]
        return Response({
            'succeeded': succeeded,
            'failed': [pk for pk in request.data if pk not in succeeded]
        }, status=status.HTTP_200_OK if succeeded else status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, instance, pk=None):
        _, succeeded = self.get_object().delete_file(self.request)
        return Response(status=status.HTTP_204_NO_CONTENT if succeeded else status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        extra = {}
        if not serializer.validated_data.get('priority'):
            vendor = serializer.validated_data['vendor']
            extra['priority'] = vendor.priority
        serializer.save(**extra)

class StakeholderViewSet(FiltersMixin, viewsets.ModelViewSet):
    queryset = Stakeholder.objects.all()
    serializer_class = StakeholderSerializer
    permission_classes = get_permission_classes('pj', 'stakeholder')
    pagination_class = LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    filter_mappings = {
        'name': 'name__icontains',
        'phone': 'phone',
        'email': 'email_icontains'
    }
    ordering_fields = ('name', 'phone', 'email')
    ordering = ('name',)

class VendorViewSet(FiltersMixin, viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = get_permission_classes('pj', 'vendor', anon_actions=('validate',))
    throttle_classes = get_throttle_classes('validate')
    pagination_class = LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    filter_mappings = {
        'name': 'name__icontains',
        'code': 'code__icontains',
        'date_added_after': 'date_added__gte',
        'date_added_before': 'date_added__lte',
        'file_count': 'file_count',
        'pocs': 'pocs__name__icontains',
        'auto_approve': 'auto_approve'
    }
    filter_value_transformations = {
        'auto_approve': lambda x: x.lower() in ('true', 'yes')
    }
    ordering_fields = ('name', 'code', 'date_added', 'file_count', 'auto_approve')
    ordering = ('name',)

    def get_queryset(self):
        # Need to annotate queryset for ordering/filtering
        return self.queryset.annotate(file_count=Count('file'))

    def perform_create(self, serializer):
        if settings.UPLOAD_LOCATION:
            create_folders(settings.UPLOAD_LOCATION, serializer.validated_data['short_name'], File.STATUS_CHOICES)
        serializer.save()

    @action(
        detail=False,
        methods=['POST'],
        serializer_class=VendorValidateSerializer)
    def validate(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(Vendor.objects.filter(code__iexact=serializer.validated_data['code']).exists())

class DataSourceViewSet(FiltersMixin, viewsets.ModelViewSet):
    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer
    permission_classes = get_permission_classes('pj', 'datasource')
    pagination_class = LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    filter_mappings = {
        'name': 'name__icontains',
        'status': 'status',
        'priority': 'priority',
        'theme': 'theme__icontains',
        'info': 'info__icontains',
        'date_ingest': 'date_ingest__icontains',
    }
    ordering_fields = ('name', 'status', 'priority', 'theme', 'info', 'date_ingest')
    ordering = ('name',)

    @action(detail=False, methods=['POST'])
    def delete_bulk(self, request):
        self.get_queryset().filter(pk__in=request.data).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['POST'])
    def suggestions(self, request):
        if not request.data.get('key') or not request.data.get('value'):
            Response("Need to submit a key and value", status=status.HTTP_400_BAD_REQUEST)
        key = request.data['key']
        value = request.data['value']
        values = self.get_queryset() \
            .filter(**{f'{key}__icontains': value}) \
            .exclude(**{key:""}) \
            .distinct(key) \
            .values_list(key, flat=True) \
            [:10]
        return Response(values)

class NoteViewSet(FiltersMixin, viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = get_permission_classes('pj', 'note')
    pagination_class = LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    filter_mappings = {
        'note': 'note__icontains',
        'source': 'data_source__pk'
    }
    ordering_fields = ('note',)
    ordering = ('note',)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TodoViewSet(FiltersMixin, viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    permission_classes = get_permission_classes('pj', 'todo')
    pagination_class = LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    filter_mappings = {
        'text': 'text__icontains',
    }
    ordering_fields = ('text',)
    ordering = ('text',)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
