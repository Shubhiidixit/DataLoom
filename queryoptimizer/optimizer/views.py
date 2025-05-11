import json
import mysql.connector
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import openai

# Initialize the AI client
client = openai.OpenAI(api_key=settings.CUSTOM_AI_KEY)

def landing(request):
    return render(request, 'optimizer/landing.html')

def optimizer(request):
    return render(request, 'optimizer/index.html')

def mcp(request):
    return render(request, 'optimizer/mcp.html')

def get_ai_response(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a database expert specializing in SQL optimization and schema design."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        return response.choices[0].message.content
    except Exception as e:
        return str(e)

@csrf_exempt
def validate_schema(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        schema = data.get('schema', '')
        queries = data.get('queries', '')
        
        prompt = f"""Please validate if the following SQL queries are compatible with the given schema and identify any potential issues:

Schema:
{schema}

Queries:
{queries}

Please provide a oneline analysis of any compatibility issues, syntax errors, or potential problems."""

        result = get_ai_response(prompt)
        return JsonResponse({'result': result})

@csrf_exempt
def optimize_query(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        schema = data.get('schema', '')
        queries = data.get('queries', '')
        
        prompt = f"""Please optimize the following SQL queries considering the given schema:

Schema:
{schema}

Queries:
{queries}

Please provide:
1. Optimized versions of the queries
2. Explanation of the optimizations in one line
3. Expected performance improvements"""

        result = get_ai_response(prompt)
        return JsonResponse({'result': result})

@csrf_exempt
def optimize_schema(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        schema = data.get('schema', '')
        queries = data.get('queries', '')
        
        prompt = f"""Please analyze and suggest optimizations for the following database schema based on the given queries in 2 lines:

Schema:
{schema}

Queries:
{queries}

Please provide:
1. Suggested schema improvements
2. Rationale for each suggestion
3. Impact on query performance"""

        result = get_ai_response(prompt)
        return JsonResponse({'result': result})

@csrf_exempt
def suggest_indexes(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        schema = data.get('schema', '')
        queries = data.get('queries', '')
        
        prompt = f"""Please suggest optimal indexes for the following schema based on the given queries iin 1-2 lines:

Schema:
{schema}

Queries:
{queries}

Please provide:
1. Recommended indexes
2. Explanation for each index suggestion
3. Expected performance impact in 1-2 lines
"""

        result = get_ai_response(prompt)
        return JsonResponse({'result': result})

# MySQL API endpoints
@csrf_exempt
def mysql_connect(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        host = data.get('host', '')
        port = data.get('port', 3306)
        username = data.get('username', '')
        password = data.get('password', '')
        
        try:
            connection = mysql.connector.connect(
                host=host,
                port=port,
                user=username,
                password=password
            )
            
            if connection.is_connected():
                connection.close()
                return JsonResponse({'success': True, 'message': 'Connection successful'})
            
            return JsonResponse({'success': False, 'message': 'Failed to connect'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def mysql_databases(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        host = data.get('host', '')
        port = data.get('port', 3306)
        username = data.get('username', '')
        password = data.get('password', '')
        
        try:
            connection = mysql.connector.connect(
                host=host,
                port=port,
                user=username,
                password=password
            )
            
            if connection.is_connected():
                cursor = connection.cursor()
                cursor.execute("SHOW DATABASES")
                databases = [db[0] for db in cursor.fetchall()]
                cursor.close()
                connection.close()
                
                return JsonResponse({'success': True, 'databases': databases})
            
            return JsonResponse({'success': False, 'message': 'Failed to connect'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def mysql_tables(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        host = data.get('host', '')
        port = data.get('port', 3306)
        username = data.get('username', '')
        password = data.get('password', '')
        database = data.get('database', '')
        
        try:
            connection = mysql.connector.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database=database
            )
            
            if connection.is_connected():
                cursor = connection.cursor()
                cursor.execute("SHOW TABLES")
                tables = [table[0] for table in cursor.fetchall()]
                cursor.close()
                connection.close()
                
                return JsonResponse({'success': True, 'tables': tables})
            
            return JsonResponse({'success': False, 'message': 'Failed to connect'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def mysql_table_info(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        host = data.get('host', '')
        port = data.get('port', 3306)
        username = data.get('username', '')
        password = data.get('password', '')
        database = data.get('database', '')
        table = data.get('table', '')
        
        try:
            connection = mysql.connector.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database=database
            )
            
            if connection.is_connected():
                cursor = connection.cursor(dictionary=True)
                cursor.execute(f"DESCRIBE {table}")
                columns = cursor.fetchall()
                cursor.close()
                connection.close()
                
                return JsonResponse({'success': True, 'columns': columns})
            
            return JsonResponse({'success': False, 'message': 'Failed to connect'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def mysql_natural_query(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        host = data.get('host', '')
        port = data.get('port', 3306)
        username = data.get('username', '')
        password = data.get('password', '')
        database = data.get('database', '')
        table = data.get('table', '')
        query = data.get('query', '')
        structure = data.get('structure', [])
        
        # Convert structure to a more readable format for the AI
        columns_info = []
        for column in structure:
            columns_info.append(f"{column['Field']} ({column['Type']}){' PRIMARY KEY' if column['Key'] == 'PRI' else ''}")
        
        columns_str = "\n".join(columns_info)
        
        # Generate SQL using OpenAI
        prompt = f"""You are a database expert. Convert the following natural language query to SQL.

Database: {database}
Table: {table}
Table Structure:
{columns_str}

User Query: "{query}"

Generate only the SQL query without explanations. The query should be valid MySQL syntax.
"""
        
        try:
            # Get SQL from OpenAI
            sql = get_ai_response(prompt)
            
            # Clean up the SQL (remove quotes, etc.)
            sql = sql.strip()
            if sql.startswith('```sql'):
                sql = sql[7:]
            if sql.endswith('```'):
                sql = sql[:-3]
            sql = sql.strip()
            
            # Execute the SQL
            connection = mysql.connector.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database=database
            )
            
            if connection.is_connected():
                cursor = connection.cursor(dictionary=True)
                cursor.execute(sql)
                
                if sql.strip().upper().startswith("SELECT"):
                    rows = cursor.fetchall()
                    columns = [column[0] for column in cursor.description]
                    cursor.close()
                    connection.close()
                    
                    return JsonResponse({
                        'success': True,
                        'sql': sql,
                        'results': {
                            'columns': columns,
                            'rows': rows
                        }
                    })
                else:
                    affected_rows = cursor.rowcount
                    connection.commit()
                    cursor.close()
                    connection.close()
                    
                    return JsonResponse({
                        'success': True,
                        'sql': sql,
                        'results': {
                            'message': f"{affected_rows} rows affected"
                        }
                    })
            
            return JsonResponse({'success': False, 'message': 'Failed to connect'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
