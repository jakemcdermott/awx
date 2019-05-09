from django.conf.urls import url
from django.views.generic.base import TemplateView

class IndexView(TemplateView):

    template_name = 'index.html'


app_name = '_ui'

urlpatterns = [
    url(r'^next/$', IndexView.as_view(), name='next')
]

