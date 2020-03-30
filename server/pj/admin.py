from django.contrib import admin

from server.pj.models import File, Vendor, Stakeholder, Todo, DataSource, Note

class FileAdmin(admin.ModelAdmin):
    list_display = ('name', 'vendor', 'submitter', 'status')

# Register your models here.
admin.site.register(File, FileAdmin)
admin.site.register(Vendor)
admin.site.register(Stakeholder)
admin.site.register(Todo)
admin.site.register(DataSource)
admin.site.register(Note)
