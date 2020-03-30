from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.contrib.auth.models import AbstractUser, Permission
from rest_framework.authtoken.models import Token


class User(AbstractUser):

    def get_user_permissions(self):
        if self.is_superuser:
            return Permission.objects.values_list('codename', flat=True)
        return self.groups.values_list("permissions__codename", flat=True)

    def add_permission_codes(self, *permission_codes):
        permissions = [Permission.objects.get(codename=code) for code in permission_codes]
        self.user_permissions.set(permissions)
        self.save()


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def set_auth_token(sender, instance=None, created=False, **kwargs):
    """A method will create tokens for newly created users."""
    if created and instance:
        Token.objects.create(user=instance)
