// DOM Elements
const statsElements = {
    'lgas-2018': document.getElementById('lgas-2018'),
    'houses-2018': document.getElementById('houses-2018'),
    'lgas-2019': document.getElementById('lgas-2019'),
    'houses-2019': document.getElementById('houses-2019')
};

// Initialize the landing page
async function initialize() {
    await loadStatistics();
    setupNavigationHighlight();
}

// Load statistics for the landing page
async function loadStatistics() {
    try {
        const response = await fetch('/api/landing-stats');
        const stats = await response.json();
        
        // Update 2018-2019 stats
        if (stats['2018-2019']) {
            statsElements['lgas-2018'].textContent = stats['2018-2019'].total_lgas.toLocaleString();
            statsElements['houses-2018'].textContent = stats['2018-2019'].total_houses.toLocaleString();
        }
        
        // Update 2019-2020 stats
        if (stats['2019-2020']) {
            statsElements['lgas-2019'].textContent = stats['2019-2020'].total_lgas.toLocaleString();
            statsElements['houses-2019'].textContent = stats['2019-2020'].total_houses.toLocaleString();
        }

        // Add animation to numbers
        Object.values(statsElements).forEach(element => {
            animateNumber(element);
        });

    } catch (error) {
        console.error('Error loading statistics:', error);
        showError('Failed to load statistics');
    }
}

// Animate number counting up
function animateNumber(element) {
    const final = parseInt(element.textContent.replace(/,/g, ''));
    const duration = 1000; // 1 second animation
    const steps = 20; // Number of steps in animation
    const step = final / steps;
    let current = 0;
    let count = 0;

    const timer = setInterval(() => {
        count++;
        current += step;
        if (count >= steps) {
            current = final;
            clearInterval(timer);
        }
        element.textContent = Math.round(current).toLocaleString();
    }, duration / steps);
}

// Highlight current page in navigation
function setupNavigationHighlight() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(errorDiv, mainContent.firstChild);
    
    setTimeout(() => errorDiv.remove(), 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initialize);