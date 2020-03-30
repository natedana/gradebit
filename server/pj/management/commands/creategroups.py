from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission

class Command(BaseCommand):
    prefix_set = ['add', 'change', 'delete', 'view']

    new_groups = [
        ("Vendor Control", ("vendor", "stakeholder")),
        ("File Control", ("file",)),
        ("Data Tracker", ("datasource", "todo", "note")),
        ("User Control", ("user",))
    ]

    def _create_groups(self):
        for group_name, models in self.new_groups:
            group, _ = Group.objects.get_or_create(name=group_name)
            permission_list = []
            for model in models:
                for prefix in self.prefix_set:
                    permission = Permission.objects.get(codename="{}_{}".format(prefix, model))
                    permission_list.append(permission)
            group.permissions.set(permission_list)
            group.save()


    def handle(self, *args, **options):
        self._create_groups()
        print("Created Groups:\n{}".format(list(group_name for group_name, _ in self.new_groups)))
