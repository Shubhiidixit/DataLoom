document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const themeToggle = document.getElementById('themeToggle');
    const connectBtn = document.getElementById('connectBtn');
    const selectDatabaseBtn = document.getElementById('selectDatabaseBtn');
    const refreshTablesBtn = document.getElementById('refreshTablesBtn');
    const executeNlpBtn = document.getElementById('executeNlpBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const mysqlHost = document.getElementById('mysqlHost');
    const mysqlPort = document.getElementById('mysqlPort');
    const mysqlUsername = document.getElementById('mysqlUsername');
    const mysqlPassword = document.getElementById('mysqlPassword');
    const databaseSelect = document.getElementById('databaseSelect');
    const tablesList = document.getElementById('tablesList');
    const tableStructure = document.getElementById('tableStructure');
    const nlpInput = document.getElementById('nlpInput');
    const generatedSql = document.getElementById('generatedSql');
    const resultsTable = document.getElementById('resultsTable');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const toast = document.getElementById('toast');
    
    // Sections
    const connectionSection = document.getElementById('connectionSection');
    const databaseSection = document.getElementById('databaseSection');
    const workspaceSection = document.getElementById('workspaceSection');
    const resultsSection = document.getElementById('resultsSection');
    
    // State
    let currentConnection = {};
    let currentDatabase = '';
    let currentTable = '';
    let tableStructures = {};
    
    // Theme Toggle
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
    
    // Example chips
    document.querySelectorAll('.example-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            nlpInput.value = chip.getAttribute('data-query');
        });
    });
    
    // Connect to MySQL
    connectBtn.addEventListener('click', async () => {
        const host = mysqlHost.value.trim();
        const port = mysqlPort.value.trim();
        const username = mysqlUsername.value.trim();
        const password = mysqlPassword.value.trim();
        
        if (!host || !port || !username) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        showLoading('Connecting to MySQL server...');
        
        try {
            const response = await fetch('/api/mysql/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ host, port, username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentConnection = { host, port, username, password };
                showToast('Connected successfully', 'success');
                
                // Get databases
                await fetchDatabases();
                
                // Show database selection
                connectionSection.style.display = 'none';
                databaseSection.style.display = 'block';
            } else {
                showToast(`Connection failed: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while connecting', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Fetch databases
    async function fetchDatabases() {
        showLoading('Fetching databases...');
        
        try {
            const response = await fetch('/api/mysql/databases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(currentConnection)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Populate database dropdown
                databaseSelect.innerHTML = '<option value="">Select a database</option>';
                
                data.databases.forEach(db => {
                    const option = document.createElement('option');
                    option.value = db;
                    option.textContent = db;
                    databaseSelect.appendChild(option);
                });
            } else {
                showToast(`Failed to fetch databases: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while fetching databases', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Select database
    selectDatabaseBtn.addEventListener('click', async () => {
        const database = databaseSelect.value;
        
        if (!database) {
            showToast('Please select a database', 'error');
            return;
        }
        
        currentDatabase = database;
        
        // Show workspace
        databaseSection.style.display = 'none';
        workspaceSection.style.display = 'block';
        
        // Fetch tables
        await fetchTables();
    });
    
    // Fetch tables
    async function fetchTables() {
        showLoading('Fetching tables...');
        
        try {
            const response = await fetch('/api/mysql/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    ...currentConnection,
                    database: currentDatabase
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Populate tables list
                tablesList.innerHTML = '';
                
                if (data.tables.length === 0) {
                    tablesList.innerHTML = '<p class="placeholder-text">No tables found</p>';
                    return;
                }
                
                data.tables.forEach(table => {
                    const tableItem = document.createElement('div');
                    tableItem.className = 'table-item';
                    tableItem.innerHTML = `<i class="fas fa-table"></i> ${table}`;
                    tableItem.addEventListener('click', () => selectTable(table));
                    tablesList.appendChild(tableItem);
                });
            } else {
                showToast(`Failed to fetch tables: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while fetching tables', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Refresh tables
    refreshTablesBtn.addEventListener('click', fetchTables);
    
    // Select table
    async function selectTable(table) {
        // Update UI
        document.querySelectorAll('.table-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.table-item').forEach(item => {
            if (item.textContent.trim() === table) {
                item.classList.add('active');
            }
        });
        
        currentTable = table;
        
        // Fetch table structure if not already fetched
        if (!tableStructures[table]) {
            await fetchTableStructure(table);
        } else {
            displayTableStructure(table);
        }
    }
    
    // Fetch table structure
    async function fetchTableStructure(table) {
        showLoading('Fetching table structure...');
        
        try {
            const response = await fetch('/api/mysql/table-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    ...currentConnection,
                    database: currentDatabase,
                    table: table
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                tableStructures[table] = data.columns;
                displayTableStructure(table);
            } else {
                showToast(`Failed to fetch table structure: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while fetching table structure', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Display table structure
    function displayTableStructure(table) {
        const columns = tableStructures[table];
        
        if (!columns || columns.length === 0) {
            tableStructure.innerHTML = '<p class="placeholder-text">No columns found</p>';
            return;
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Nullable</th>
                        <th>Key</th>
                        <th>Default</th>
                        <th>Extra</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        columns.forEach(column => {
            html += `
                <tr>
                    <td>${column.Field}</td>
                    <td>${column.Type}</td>
                    <td>${column.Null}</td>
                    <td>${column.Key || '-'}</td>
                    <td>${column.Default !== null ? column.Default : 'NULL'}</td>
                    <td>${column.Extra || '-'}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        tableStructure.innerHTML = html;
    }
    
    // Execute NLP query
    executeNlpBtn.addEventListener('click', async () => {
        const query = nlpInput.value.trim();
        
        if (!query) {
            showToast('Please enter a query', 'error');
            return;
        }
        
        if (!currentTable) {
            showToast('Please select a table first', 'error');
            return;
        }
        
        showLoading('Processing your query...');
        
        try {
            const response = await fetch('/api/mysql/natural-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    ...currentConnection,
                    database: currentDatabase,
                    table: currentTable,
                    query: query,
                    structure: tableStructures[currentTable]
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Display SQL
                generatedSql.textContent = data.sql;
                
                // Display results
                displayResults(data.results);
                
                // Show results section
                resultsSection.style.display = 'block';
            } else {
                showToast(`Query failed: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while processing your query', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Display results
    function displayResults(results) {
        if (!results || !results.columns || !results.rows) {
            resultsTable.innerHTML = '<p class="placeholder-text">No results found</p>';
            return;
        }
        
        const columns = results.columns;
        const rows = results.rows;
        
        let html = `
            <table>
                <thead>
                    <tr>
        `;
        
        columns.forEach(column => {
            html += `<th>${column}</th>`;
        });
        
        html += `
                    </tr>
                </thead>
                <tbody>
        `;
        
        if (rows.length === 0) {
            html += `
                <tr>
                    <td colspan="${columns.length}" class="placeholder-text">No data found</td>
                </tr>
            `;
        } else {
            rows.forEach(row => {
                html += '<tr>';
                columns.forEach(column => {
                    const value = row[column];
                    html += `<td>${value !== null ? value : 'NULL'}</td>`;
                });
                html += '</tr>';
            });
        }
        
        html += `
                </tbody>
            </table>
        `;
        
        resultsTable.innerHTML = html;
    }
    
    // Export as CSV
    exportCsvBtn.addEventListener('click', () => {
        if (!resultsTable.querySelector('table')) {
            showToast('No results to export', 'error');
            return;
        }
        
        const table = resultsTable.querySelector('table');
        const rows = Array.from(table.querySelectorAll('tr'));
        
        let csv = [];
        
        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            const rowData = cells.map(cell => {
                let text = cell.textContent.trim();
                // Escape quotes and wrap in quotes if contains comma
                if (text.includes(',') || text.includes('"')) {
                    text = `"${text.replace(/"/g, '""')}"`;
                }
                return text;
            });
            csv.push(rowData.join(','));
        });
        
        downloadFile(csv.join('\n'), 'results.csv', 'text/csv');
    });
    
    // Export as JSON
    exportJsonBtn.addEventListener('click', () => {
        if (!resultsTable.querySelector('table')) {
            showToast('No results to export', 'error');
            return;
        }
        
        const table = resultsTable.querySelector('table');
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        const dataRows = Array.from(table.querySelectorAll('tbody tr'));
        
        const jsonData = dataRows.map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            const rowObj = {};
            
            headers.forEach((header, index) => {
                const cellText = cells[index].textContent.trim();
                rowObj[header] = cellText === 'NULL' ? null : cellText;
            });
            
            return rowObj;
        });
        
        downloadFile(JSON.stringify(jsonData, null, 2), 'results.json', 'application/json');
    });
    
    // Download file
    function downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Show loading overlay
    function showLoading(message) {
        loadingText.textContent = message || 'Loading...';
        loadingOverlay.classList.add('active');
    }
    
    // Hide loading overlay
    function hideLoading() {
        loadingOverlay.classList.remove('active');
    }
    
    // Show toast notification
    function showToast(message, type) {
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type);
        toast.classList.add('active');
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
    
    // Get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
