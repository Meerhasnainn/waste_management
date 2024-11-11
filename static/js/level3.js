// Updated level3.js

document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    await loadLGAs();
    setupEventListeners();
}

async function loadLGAs() {
    try {
        const response = await fetch('/api/lgas');
        const lgas = await response.json();
        
        const baseLGASelect = document.getElementById('base-lga');
        baseLGASelect.innerHTML = lgas.map(lga => 
            `<option value="${lga.id}">${lga.name}</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading LGAs:', error);
        showError('Failed to load LGAs');
    }
}

function setupEventListeners() {
    const findSimilarBtn = document.getElementById('find-similar-btn');
    findSimilarBtn.addEventListener('click', findSimilarLGAs);
    
    // Add input validation for cutoff value
    const cutoffInput = document.getElementById('cutoff');
    cutoffInput.addEventListener('change', () => {
        let value = parseInt(cutoffInput.value);
        if (value < 1) cutoffInput.value = 1;
        if (value > 50) cutoffInput.value = 50;
    });
}

async function findSimilarLGAs() {
    const baseLGASelect = document.getElementById('base-lga');
    const wasteTypeSelect = document.getElementById('waste-type');
    const periodSelect = document.getElementById('period');
    const cutoffInput = document.getElementById('cutoff');
    const resultsContainer = document.getElementById('results-container');

    // Show loading state
    resultsContainer.innerHTML = '<div class="loading">Finding similar LGAs...</div>';

    try {
        const params = new URLSearchParams({
            lga_id: baseLGASelect.value,
            waste_type: wasteTypeSelect.value,
            year_start: periodSelect.value,
            cutoff: cutoffInput.value
        });

        console.log('Sending request with params:', params.toString());  // Debug log

        const response = await fetch(`/api/similar-lgas?${params}`);
        const data = await response.json();

        console.log('Received response:', data);  // Debug log

        if (data.error) {
            showError(data.message || data.error);
            resultsContainer.innerHTML = `
                <div class="error-card">
                    <h3>No Results Found</h3>
                    <p>${data.message || 'Try adjusting your search criteria'}</p>
                </div>
            `;
            return;
        }

        displayResults(data, baseLGASelect.options[baseLGASelect.selectedIndex].text);
    } catch (error) {
        console.error('Error finding similar LGAs:', error);
        showError('Failed to find similar LGAs');
        resultsContainer.innerHTML = `
            <div class="error-card">
                <h3>Error</h3>
                <p>Failed to find similar LGAs. Please try again.</p>
            </div>
        `;
    }
}

function displayResults(results, baseLGAName) {
    const resultsContainer = document.getElementById('results-container');
    
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="error-card">
                <h3>No Results Found</h3>
                <p>No similar LGAs found for the selected criteria.</p>
            </div>
        `;
        return;
    }

    // Create header card
    let html = `
        <div class="similarity-card header-card">
            <h3>Similar LGAs to ${baseLGAName}</h3>
            <p>Based on ${document.getElementById('waste-type').value} waste management patterns 
               in ${document.getElementById('period').value}</p>
        </div>
    `;

    // Create cards for each similar LGA
    results.forEach(result => {
        const similarityScore = (100 - result.difference).toFixed(1);
        const recycleRate = result.recycle_rate.toFixed(1);
        
        html += `
            <div class="similarity-card">
                <div class="similarity-header">
                    <h4>${result.lga_name}</h4>
                    <div class="similarity-score">${similarityScore}% Similar</div>
                </div>
                <div class="similarity-details">
                    <div class="stat-row">
                        <span>Population:</span>
                        <span>${result.population.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span>Houses Surveyed:</span>
                        <span>${result.houses_surveyed.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span>Recycling Rate:</span>
                        <span>${recycleRate}%</span>
                    </div>
                    <div class="recycling-bar">
                        <div class="bar-fill" style="width: ${recycleRate}%"></div>
                    </div>
                </div>
            </div>
        `;
    });

    resultsContainer.innerHTML = html;

    // Add animation to cards
    const cards = document.querySelectorAll('.similarity-card');
    cards.forEach((card, index) => {
        card.style.animation = `fadeIn 0.3s ease forwards ${index * 0.1}s`;
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const controls = document.querySelector('.similarity-controls');
    controls.insertBefore(errorDiv, controls.firstChild);
    
    setTimeout(() => errorDiv.remove(), 3000);
}

// Add these styles to your CSS or update the existing ones
const style = document.createElement('style');
style.textContent = `
    .similarity-card {
        opacity: 0;
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
    }

    .header-card {
        grid-column: 1 / -1;
        background: #2c8a4b;
        color: white;
    }

    .similarity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .similarity-score {
        font-size: 1.25rem;
        font-weight: bold;
        color: #2c8a4b;
    }

    .similarity-details {
        margin-top: 1rem;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }

    .recycling-bar {
        width: 100%;
        height: 8px;
        background-color: #eee;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 1rem;
    }

    .bar-fill {
        height: 100%;
        background-color: #2c8a4b;
        transition: width 0.5s ease;
    }

    .error-card {
        background: #fee2e2;
        border: 1px solid #ef4444;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);