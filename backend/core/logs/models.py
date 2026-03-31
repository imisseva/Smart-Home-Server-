from django.db import models


class LogHome(models.Model):
    METHOD_CHOICES = [
        ('face_recognition', 'Face Recognition'),
        ('passcode', 'Passcode'),
        ('remote_app', 'Remote App'),
    ]

    id_loghome = models.CharField(primary_key=True, max_length=255)
    id_home = models.ForeignKey('homes.Home', models.DO_NOTHING, db_column='id_home', blank=True, null=True)
    id_user = models.ForeignKey('users.Account', models.DO_NOTHING, db_column='id_user', blank=True, null=True)
    log_time = models.DateTimeField(blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    method = models.CharField(max_length=50, choices=METHOD_CHOICES, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'log_home'

