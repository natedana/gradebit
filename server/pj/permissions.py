from rest_framework import permissions

action_map = {
    'list': 'view',
    'retrieve': 'view',
    'update': 'change',
    'partial_update': 'change',
    'create': 'add',
    'destroy': 'delete'
}

def get_permission_classes(app, model, user_actions=None, anon_actions=None):

    class Permission(permissions.BasePermission):

        def has_permission(self, request, view):
            if anon_actions and view.action in anon_actions:
                return True
            if not request.user or not request.user.is_authenticated:
                return False
            if user_actions and view.action in user_actions:
                return True
            permission = "{}.{}_{}".format(app, action_map.get(view.action, 'change'), model)
            return request.user.has_perm(permission)

    return (Permission,)
