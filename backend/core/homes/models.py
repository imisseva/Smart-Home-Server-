from django.db import models


class Home(models.Model):
    id = models.CharField(primary_key=True, max_length=255)
    namehome = models.CharField(max_length=255)

    class Meta:
        managed = True
        db_table = 'home'

    def __str__(self):
        return self.namehome


class HomeUser(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'Member'),
    ]

    id = models.CharField(primary_key=True, max_length=255)
    id_home = models.ForeignKey('homes.Home', models.DO_NOTHING, db_column='id_home', blank=True, null=True)
    id_user = models.ForeignKey('users.Account', models.DO_NOTHING, db_column='id_user', blank=True, null=True)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    class Meta:
        managed = True
        db_table = 'home_user'


class Request(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id_request = models.CharField(primary_key=True, max_length=255)
    id_user = models.ForeignKey('users.Account', models.DO_NOTHING, db_column='id_user', blank=True, null=True)
    id_home = models.ForeignKey('homes.Home', models.DO_NOTHING, db_column='id_home', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    class Meta:
        managed = True
        db_table = 'request'

