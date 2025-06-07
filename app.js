let debugMode = true;
let placedImages = [];

// Debug logging function
function debugLog(message) {
    if (debugMode) {
        console.log(message);
        updateStatus(message);
    }
}

// Update status message
function updateStatus(message) {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.innerHTML = `<p>${message}</p>`;
    }
}

// Initialize when the scene is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    
    scene.addEventListener('loaded', () => {
        debugLog('AR scene loaded');
        setupAR();
    });

    scene.addEventListener('camera-init', () => {
        debugLog('Camera initialized');
    });

    scene.addEventListener('camera-error', (error) => {
        debugLog('Camera error: ' + error.detail.message);
    });
});

function setupAR() {
    const scene = document.querySelector('a-scene');
    const marker = document.querySelector('#marker');
    const reticle = document.querySelector('#reticle');

    // Handle marker found
    marker.addEventListener('markerFound', () => {
        debugLog('Marker found');
        reticle.setAttribute('visible', true);
    });

    // Handle marker lost
    marker.addEventListener('markerLost', () => {
        debugLog('Marker lost');
        reticle.setAttribute('visible', false);
    });

    // Handle tap to place image
    scene.addEventListener('click', (event) => {
        if (marker.object3D.visible) {
            placeImage(event.detail.intersection.point);
        }
    });
}

function placeImage(position) {
    debugLog('Placing image...');
    
    // Create a new image entity
    const image = document.createElement('a-image');
    image.setAttribute('src', 'https://picsum.photos/200/200');
    image.setAttribute('width', '1');
    image.setAttribute('height', '1');
    image.setAttribute('position', position);
    image.setAttribute('rotation', '-90 0 0');
    image.setAttribute('animation', 'property: scale; from: 0 0 0; to: 1 1 1; dur: 500; easing: easeOutElastic');
    
    // Add the image to the marker
    const marker = document.querySelector('#marker');
    marker.appendChild(image);
    
    // Store reference to placed image
    placedImages.push(image);
    
    debugLog('Image placed successfully');
}

// Handle window resize
window.addEventListener('resize', () => {
    const scene = document.querySelector('a-scene');
    if (scene) {
        scene.resize();
    }
}); 