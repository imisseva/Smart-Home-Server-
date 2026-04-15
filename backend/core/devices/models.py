from django.db import models


class Device(models.Model):
    TYPE_CHOICES = [
        ('light', 'Light'),
        ('fan', 'Fan'),
        ('door', 'Door'),
        ('ac', 'AC'),
    ]

    id = models.CharField(primary_key=True, max_length=255)
    id_home = models.ForeignKey('homes.Home', models.DO_NOTHING, db_column='id_home', blank=True, null=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES) 
    status = models.BooleanField(blank=True, null=True)
    intensity = models.IntegerField(blank=True, null=True)
    passcode = models.CharField(max_length=50, blank=True, null=True)
    mqtt_topic = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'device'

    def __str__(self):
        return f"{self.name} ({self.type})"


class Tahc(models.Model):
    id_tahc = models.CharField(primary_key=True, max_length=255)
    id_home = models.ForeignKey('homes.Home', models.DO_NOTHING, db_column='id_home', blank=True, null=True)
    temp = models.FloatField(blank=True, null=True)
    hum = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'tahc'

