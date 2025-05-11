document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const themeToggle = document.getElementById('themeToggle');
    const validateBtn = document.getElementById('validateBtn');
    const optimizeQueryBtn = document.getElementById('optimizeQueryBtn');
    const optimizeSchemaBtn = document.getElementById('optimizeSchemaBtn');
    const suggestIndexesBtn = document.getElementById('suggestIndexesBtn');
    const schemaInput = document.getElementById('schema');
    const queriesInput = document.getElementById('queries');
    const resultsDiv = document.getElementById('results');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const errorDiv = document.getElementById('error');
    const resultsSection = document.getElementById('resultsSection');

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.add('dark-mode-transition');
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        
        // Remove transition class after animation completes
        setTimeout(() => {
            document.body.classList.remove('dark-mode-transition');
        }, 500);
    });

    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true' || localStorage.getItem('darkMode') === null) {
        document.body.classList.add('dark-mode');
    }

    // Helper function for API calls
    async function makeRequest(endpoint) {
        const schema = schemaInput.value.trim();
        const queries = queriesInput.value.trim();

        if (!schema || !queries) {
            showError('Please provide both schema and queries.');
            return;
        }

        // Update loading text based on the endpoint
        switch(endpoint) {
            case 'validate':
                loadingText.textContent = 'Validating schema...';
                break;
            case 'optimize-query':
                loadingText.textContent = 'Optimizing queries...';
                break;
            case 'optimize-schema':
                loadingText.textContent = 'Optimizing schema...';
                break;
            case 'suggest-indexes':
                loadingText.textContent = 'Analyzing and suggesting indexes...';
                break;
            default:
                loadingText.textContent = 'Processing your request...';
        }

        loadingOverlay.classList.add('active');
        errorDiv.classList.remove('active');
        resultsDiv.textContent = 'Processing...';

        try {
            const response = await fetch(`/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ schema, queries })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            resultsDiv.textContent = data.result;
            
            // Ensure the results section is visible
            resultsSection.style.display = 'block';
        } catch (error) {
            showError('An error occurred while processing your request.');
            console.error('Error:', error);
        } finally {
            loadingOverlay.classList.remove('active');
        }
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

    // Show error message
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.add('active');
    }

    // Button click handlers
    validateBtn.addEventListener('click', () => makeRequest('validate'));
    optimizeQueryBtn.addEventListener('click', () => makeRequest('optimize-query'));
    optimizeSchemaBtn.addEventListener('click', () => makeRequest('optimize-schema'));
    suggestIndexesBtn.addEventListener('click', () => makeRequest('suggest-indexes'));
});
