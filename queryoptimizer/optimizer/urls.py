from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing, name='landing'),
    path('optimizer/', views.optimizer, name='optimizer'),
    path('mcp/', views.mcp, name='mcp'),
    
    # Original API endpoints
    path('api/validate', views.validate_schema, name='validate_schema'),
    path('api/optimize-query', views.optimize_query, name='optimize_query'),
    path('api/optimize-schema', views.optimize_schema, name='optimize_schema'),
    path('api/suggest-indexes', views.suggest_indexes, name='suggest_indexes'),
    
    # MySQL API endpoints
    path('api/mysql/connect', views.mysql_connect, name='mysql_connect'),
    path('api/mysql/databases', views.mysql_databases, name='mysql_databases'),
    path('api/mysql/tables', views.mysql_tables, name='mysql_tables'),
    path('api/mysql/table-info', views.mysql_table_info, name='mysql_table_info'),
    path('api/mysql/natural-query', views.mysql_natural_query, name='mysql_natural_query'),
]
