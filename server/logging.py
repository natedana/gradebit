import logging
import time

class UTCFormatter(logging.Formatter):
    converter = time.gmtime

class UserFilter(logging.Filter):
    def filter(self, record):
        try:
            if record.request.user.is_anonymous:
                record.username = 'Anonymous'
            else:
                record.username = record.request.user.username
        except:
            record.username = None
        return True
