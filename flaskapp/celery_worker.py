from celery import Celery
from flaskapp.config import Config

celery_app = Celery(
    'flaskapp',
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND
)

celery_app.autodiscover_tasks(['flaskapp.tasks'])  

