from rest_framework.filters import OrderingFilter

class MappedOrderFilter(OrderingFilter):
    """
    MappedOrderFilter

    Permits the customization of url params to queryset filter value

    Define ordering_mappings on the viewset mapping the params to there queryset value.

    Example: {
        'vendor': 'vendor__name'
    }
    """
    ordering_mappings = {}

    def _map_ordering(self, mapping, ordering):
        new_ordering = []
        for order_val in ordering:
            reverse = False
            if order_val[0] == "-":
                reverse = True
                order_val = order_val[1:]
            if order_val in mapping:
                order_val = mapping[order_val]
            new_ordering.append(f"-{order_val}" if reverse else order_val)
        return new_ordering

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        ordering_mappings = getattr(view, 'ordering_mappings')
        if ordering and ordering_mappings:
            ordering = self._map_ordering(ordering_mappings, ordering)

        if ordering:
            return queryset.order_by(*ordering)

        return queryset
