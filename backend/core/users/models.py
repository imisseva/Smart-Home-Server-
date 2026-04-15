from django.db import models
from django.contrib.postgres.fields import ArrayField


class Account(models.Model):
    id = models.CharField(primary_key=True, max_length=255)
    username = models.CharField(max_length=150)
    password = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.CharField(unique=True, max_length=255, blank=True, null=True)
    fullname = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'account'
    
    def __str__(self):
        return self.username


class FaceUser(models.Model):
    id_face = models.CharField(primary_key=True, max_length=255)
    id_user = models.ForeignKey('users.Account', models.DO_NOTHING, db_column='id_user', blank=True, null=True)
    
    vector_image = ArrayField(models.FloatField(), blank=True, null=True) 
    avatar_url = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'face_user'

