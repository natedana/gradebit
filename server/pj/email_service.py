from django.conf import settings
from django.core.mail import send_mail

def email(subject, message, recipient_list=(), include_admins=True):
    """
    email 

    :subject: str - subject of the email  
    :message: str - email content  
    :recipient_list: str list - list of emails to notify  

    :return: bool - successful email sending
    """
    recipient_list = list(recipient_list)
    if include_admins:
        recipient_list.extend(settings.EMAIL_ADMIN_LIST)
    recipient_list = list({r.lower() for r in recipient_list}) # Dedupe common recipients
    return bool(send_mail(subject, message, settings.EMAIL_SENDER, recipient_list))
