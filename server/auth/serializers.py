from django.contrib.auth.models import Group
from rest_framework import serializers
from server.auth.models import User


class UserSerializer(serializers.ModelSerializer):

    token = serializers.ReadOnlyField(source='auth_token.key')
    permissions = serializers.SerializerMethodField()

    def get_permissions(self, obj):
        return obj.get_user_permissions()

    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'token', 'is_staff', 'permissions')

class GroupSerializer(serializers.ModelSerializer):

    class Meta:
        model = Group
        fields = '__all__'
