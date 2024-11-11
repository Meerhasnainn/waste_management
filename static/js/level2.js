// Updated level2.js

document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    await loadLGAs();
    updateWasteSubtypes();
    setupEventListeners();
}

async function loadLGAs() {
    try {
        const response = await fetch('/api/lgas');
        const lgas = await response.json();
        
        const lgaSelect = document.getElementById('lga-select');
        lgaSelect.innerHTML = lgas.map(lga => 
            `<option value="${lga.id}">${lga.name}</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading LGAs:', error);
        showError('Failed to load LGAs');
    }
}

function updateWasteSubtypes() {
    const wasteTypeSelect = document.getElementById('waste-type');
    const wasteSubtypesSelect = document.getElementById('waste-subtypes');
    
    const wasteSubtypes = {
        recyclable: [
            { id: 1, name: 'Kerbside Recycling' },
            { id: 2, name: 'CDS Recycling' },
            { id: 3, name: 'Drop off Recycling' },
            { id: 4, name: 'Cleanup Recycling' }
        ],
        organics: [
            { id: 5, name: 'Kerbside Organics Bin' },
            { id: 6, name: 'Kerbside FOGO Organics' },
            { id: 7, name: 'Drop off Organics' },
            { id: 8, name: 'Cleanup Organics' },
            { id: 9, name: 'Other Council Garden Organics' }
        ],
        waste: [
            { id: 10, name: 'Kerbside Waste Bin' },
            { id: 11, name: 'Drop Off' },
            { id: 12, name: 'Clean Up' }
        ]
    };

    const selectedType = wasteTypeSelect.value;
    const subtypes = wasteSubtypes[selectedType];
    
    wasteSubtypesSelect.innerHTML = subtypes.map(subtype => 
        `<option value="${subtype.id}">${subtype.name}</option>`
    ).join('');
}

function setupEventListeners() {
    const wasteTypeSelect = document.getElementById('waste-type');
    const compareBtn = document.getElementById('compare-btn');
    
    wasteTypeSelect.addEventListener('change', updateWasteSubtypes);
    compareBtn.addEventListener('click', compareSelected);
    
    // Add sort listeners to table headers
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            sortResults(column);
        });
    });
}

async function compareSelected() {
    const lgaSelect = document.getElementById('lga-select');
    const wasteTypeSelect = document.getElementById('waste-type');
    const wasteSubtypesSelect = document.getElementById('waste-subtypes');
    
    const selectedLGAs = Array.from(lgaSelect.selectedOptions).map(option => option.value);
    const selectedSubtypes = Array.from(wasteSubtypesSelect.selectedOptions).map(option => option.value);
    
    if (selectedLGAs.length === 0) {
        showError('Please select at least one LGA');
        return;
    }
    
    if (selectedSubtypes.length === 0) {
        showError('Please select at least one waste subtype');
        return;
    }

    try {
        const params = new URLSearchParams();
        selectedLGAs.forEach(lga => params.append('lga_ids[]', lga));
        selectedSubtypes.forEach(subtype => params.append('subtypes[]', subtype));
        params.append('waste_type', wasteTypeSelect.value);

        console.log('Sending request with params:', params.toString());  // Debug log

        const response = await fetch(`/api/lga-comparison?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const results = await response.json();
        console.log('Received results:', results);  // Debug log
        
        if (results.error) {
            throw new Error(results.error);
        }

        displayResults(results);
    } catch (error) {
        console.error('Error comparing LGAs:', error);
        showError('Failed to compare LGAs: ' + error.message);
    }
}

function displayResults(results) {
    const resultsBody = document.getElementById('results-body');
    
    if (!results || results.length === 0) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No results found</td>
            </tr>`;
        return;
    }

    resultsBody.innerHTML = results.map(result => `
        <tr>
            <td>${result.lga_name}</td>
            <td>${result.population?.toLocaleString() ?? 'N/A'}</td>
            <td>${result.houses_surveyed?.toLocaleString() ?? 'N/A'}</td>
            <td>${result.total_collected?.toLocaleString(undefined, {minimumFractionDigits: 2}) ?? 'N/A'}</td>
            <td>${result.total_recycled?.toLocaleString(undefined, {minimumFractionDigits: 2}) ?? 'N/A'}</td>
            <td>${result.recycling_percentage?.toFixed(1) ?? 'N/A'}%</td>
            <td>${result.avg_per_household?.toFixed(2) ?? 'N/A'}</td>
        </tr>
    `).join('');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const controls = document.querySelector('.comparison-controls');
    controls.insertBefore(errorDiv, controls.firstChild);
    
    setTimeout(() => errorDiv.remove(), 3000);
}

let currentSort = {
    column: null,
    direction: 'asc'
};

function sortResults(column) {
    const tbody = document.getElementById('results-body');
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    rows.sort((a, b) => {
        let aVal = a.children[getColumnIndex(column)].textContent;
        let bVal = b.children[getColumnIndex(column)].textContent;
        
        // Remove commas and % signs, convert to numbers if needed
        if (column !== 'lga') {
            aVal = parseFloat(aVal.replace(/[,%]/g, ''));
            bVal = parseFloat(bVal.replace(/[,%]/g, ''));
        }
        
        if (currentSort.direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    updateSortIndicators(column);
}