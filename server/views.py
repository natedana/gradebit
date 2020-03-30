import logging

from django.views.generic import TemplateView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger(__name__)

# The index view is handled by Django and not by DRF, so no authentication
class IndexView(TemplateView):
    template_name = 'index.html'

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        if request.user.is_authenticated:
            logger.info('Logged in', extra={'request': request})
        return super().get(request)

@api_view(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
def not_found(request):
    return Response({'error': 'Unknown path'}, status=status.HTTP_404_NOT_FOUND)
