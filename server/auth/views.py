import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Group

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from axes.decorators import axes_dispatch

from server.auth.serializers import UserSerializer, GroupSerializer

logger = logging.getLogger(__name__)

@api_view(['POST'])
@axes_dispatch
def login_user(request):
    username = request.data['username']
    password = request.data['password']
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        logger.info('Logged in', extra={'request': request})
        return Response(UserSerializer(user).data)

    return Response(status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_user(request):
    logger.info('Logged out', extra={'request': request})
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes((IsAuthenticated,))
def me(request):
    return Response(UserSerializer(request.user).data)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
