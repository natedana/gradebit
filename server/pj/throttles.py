from rest_framework.throttling import AnonRateThrottle


def get_throttle_classes(*throttle_actions):
    """
    get_throttle_classes 

    :throttle_actions: list[string] - view actions that will be throttled

    :return: tuple of permissions
    """

    class Throttle(AnonRateThrottle):

        def allow_request(self, request, view):
            # Never throttle logged in user
            if request.user and request.user.is_authenticated:
                return True
            if throttle_actions and view.action in throttle_actions:
                return super().allow_request(request, view)
            return True

    return (Throttle,)
