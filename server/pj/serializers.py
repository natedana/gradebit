from rest_framework import serializers

from server.pj.models import File, Vendor, Stakeholder, DataSource, Note, Todo
from server.auth.serializers import UserSerializer

class StakeholderSerializer(serializers.ModelSerializer):
    pk = serializers.IntegerField(required=False) # Needed so pk can be passed from the client

    class Meta:
        model = Stakeholder
        fields = (
            'pk',
            'name',
            'phone',
            'email'
        )

class VendorSerializer(serializers.ModelSerializer):
    file_count = serializers.IntegerField(read_only=True)
    pocs = StakeholderSerializer(required=False, many=True)

    class Meta:
        model = Vendor
        fields = (
            'pk',
            'name',
            'short_name',
            'code',
            'date_added',
            'file_count',
            'auto_approve',
            'approval_regex',
            'pocs',
            'priority'
        )

    def create(self, validated_data):
        pocs = validated_data.pop('pocs', [])
        pocs = [
            Stakeholder.objects.get(pk=p['pk']) if 'pk' in p and p['pk'] else Stakeholder.objects.create(**p)
            for p in pocs
        ]
        vendor = Vendor.objects.create(**validated_data)
        vendor.pocs.set(pocs)
        return vendor

    def update(self, instance, validated_data):
        pocs = validated_data.pop('pocs', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            instance.save()
        pocs = [
            Stakeholder.objects.get(pk=p['pk']) if 'pk' in p and p['pk'] else Stakeholder.objects.create(**p)
            for p in pocs
        ] 
        instance.pocs.set(pocs)
        return instance

class VendorValidateSerializer(serializers.Serializer):
    code = serializers.CharField()

class FileUploadSerializer(serializers.Serializer):
    file = serializers.ListField(child=serializers.FileField())
    vendor_code = serializers.SlugRelatedField(slug_field='code__iexact', queryset=Vendor.objects.all(), source='vendor')
    submitter = serializers.CharField(max_length=64)


class FileSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    vendor_short_name = serializers.SlugRelatedField(slug_field='short_name', queryset=Vendor.objects.all(), source='vendor', write_only=True)
    url = serializers.CharField(read_only=True)

    class Meta:
        model = File
        fields = (
            'pk',
            'name',
            'location',
            'key',
            'url',
            'size',
            'vendor',
            'vendor_short_name',
            'submitter',
            'date_uploaded',
            'date_approved',
            'status',
            'message',
            'fragments',
            'priority'
        )
        extra_kwargs = {'priority':{'required': False}} # Allows POSTing a file without a priority to default from the priority of the vendor


class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = (
            'pk',
            'name',
            'data_type',
            'data_origin',
            'date_information',
            'date_ingest',
            'entities',
            'frequency',
            'leads',
            'portfolio',
            'priority',
            'request_method',
            'theme',
            'status',
            'update_periodically'
        )

class NoteSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    data_source = serializers.PrimaryKeyRelatedField(queryset=DataSource.objects.all())

    class Meta:
        model = Note
        fields = (
            'pk',
            'note',
            'data_source',
            'created_by',
            'created_at'
        )

class TodoSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Todo
        fields = (
            'pk',
            'lead',
            'text',
            'complete',
            'created_by',
            'created_at'
        )
