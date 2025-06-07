let debugMode = true;
let placedImages = [];
let markerVisible = false;

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
    const placementMarker = document.querySelector('#placement-marker');

    // Handle marker found
    marker.addEventListener('markerFound', () => {
        debugLog('Marker found');
        markerVisible = true;
        placementMarker.setAttribute('visible', true);
        updateStatus('Marker found! Tap to place an image');
    });

    // Handle marker lost
    marker.addEventListener('markerLost', () => {
        debugLog('Marker lost');
        markerVisible = false;
        placementMarker.setAttribute('visible', false);
        updateStatus('Point camera at the marker');
    });

    // Update placement marker position based on camera movement
    scene.addEventListener('camera-tick', () => {
        if (markerVisible) {
            const camera = document.querySelector('[camera]');
            const cameraPosition = camera.getAttribute('position');
            const cameraRotation = camera.getAttribute('rotation');
            
            // Position the placement marker in front of the camera
            placementMarker.setAttribute('position', {
                x: cameraPosition.x,
                y: cameraPosition.y,
                z: cameraPosition.z - 1
            });
            
            // Match camera rotation
            placementMarker.setAttribute('rotation', {
                x: cameraRotation.x,
                y: cameraRotation.y,
                z: cameraRotation.z
            });
        }
    });

    // Handle tap to place image
    scene.addEventListener('click', (event) => {
        if (markerVisible) {
            const camera = document.querySelector('[camera]');
            const cameraPosition = camera.getAttribute('position');
            const cameraRotation = camera.getAttribute('rotation');
            
            // Calculate position in front of camera
            const distance = 1; // 1 meter in front
            const position = {
                x: cameraPosition.x,
                y: cameraPosition.y,
                z: cameraPosition.z - distance
            };
            
            placeImage(position, cameraRotation);
        }
    });
}

function placeImage(position, rotation) {
    debugLog('Placing image...');
    
    // Create a new image entity
    const image = document.createElement('a-image');
    image.setAttribute('src', 'https://picsum.photos/200/200');
    image.setAttribute('width', '1');
    image.setAttribute('height', '1');
    image.setAttribute('position', position);
    image.setAttribute('rotation', rotation);
    image.setAttribute('animation', 'property: scale; from: 0 0 0; to: 1 1 1; dur: 500; easing: easeOutElastic');
    
    // Add the image to the scene
    const scene = document.querySelector('a-scene');
    scene.appendChild(image);
    
    // Store reference to placed image
    placedImages.push(image);
    
    debugLog('Image placed successfully');
    updateStatus('Image placed! Tap to place another');
}

// Handle window resize
window.addEventListener('resize', () => {
    const scene = document.querySelector('a-scene');
    if (scene) {
        scene.resize();
    }
}); 