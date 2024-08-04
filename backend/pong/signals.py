# signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Player, Game, Tournament


@receiver(post_save, sender=User)
def create_or_update_player(sender, instance, created, **kwargs):
    if created:
        Player.objects.create(user=instance)
    else:
        instance.player.save()


@receiver(post_save, sender=Game)
def set_winner(sender, instance, **kwargs):
    # Check if the instance is part of a tournament
    try:
        tournament = Tournament.objects.get(game1=instance)
        tournament.winner1 = instance.winner
        if instance.player1 == instance.winner:
            instance.player2.trnmt = False
            instance.player2.save()
        elif instance.player2 == instance.winner:
            instance.player1.trnmt = False
            instance.player1.save()
        tournament.final_game.player1 = instance.winner
        tournament.final_game.save()
        tournament.save()
    except Tournament.DoesNotExist:
        pass

    try:
        tournament = Tournament.objects.get(game2=instance)
        tournament.winner2 = instance.winner
        if instance.player1 == instance.winner:
            instance.player2.trnmt = False
            instance.player2.save()
        elif instance.player2 == instance.winner:
            instance.player1.trnmt = False
            instance.player1.save()
        tournament.final_game.player2 = instance.winner
        tournament.final_game.save()
        tournament.save()
    except Tournament.DoesNotExist:
        pass

    try:
        tournament = Tournament.objects.get(final_game=instance)
        tournament.winner = instance.winner
        if instance.status == 'finished':
            try:
                pl1 = instance.player1
                pl2 = instance.player2
                pl1.trnmt = False
                pl2.trnmt = False
                pl1.save()
                pl2.save()
            except:
                pass
        tournament.finished_at = instance.finished_at
        tournament.status = instance.status
        tournament.save()
    except Tournament.DoesNotExist:
        pass
