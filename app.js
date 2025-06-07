let camera, scene, renderer;
let reticle;
let placementUI;
let isPlaced = false;

// Initialize AR Code
const arCode = new ARCode({
    apiKey: '1r3L0EBt8ZQp', // Replace with your ar-code.com API key
    container: 'ar-container',
    onInit: () => {
        updateStatus('AR initialized successfully');
    },
    onError: (error) => {
        updateStatus('Error initializing AR: ' + error.message);
        console.error('AR initialization error:', error);
    }
});

function init() {
    const container = document.getElementById('ar-container');
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
    );

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Add light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Get UI elements
    placementUI = document.getElementById('placement-ui');

    // Create reticle
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x4CC3D9 })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Set up AR Code event listeners
    arCode.on('surfaceFound', (surface) => {
        reticle.visible = true;
        reticle.position.copy(surface.position);
        reticle.quaternion.copy(surface.quaternion);
        placementUI.classList.remove('hidden');
        updateStatus('Surface detected! Tap to place content.');
    });

    arCode.on('surfaceLost', () => {
        reticle.visible = false;
        placementUI.classList.add('hidden');
        if (!isPlaced) {
            updateStatus('Move device to find a surface...');
        }
    });

    arCode.on('tap', (position) => {
        if (!isPlaced && reticle.visible) {
            placeImage(position);
        }
    });

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start the AR session
    arCode.start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function placeImage(position) {
    // Hide placement UI
    placementUI.classList.add('hidden');
    isPlaced = true;

    // Create image plane
    const geometry = new THREE.PlaneGeometry(0.3, 0.3);
    const texture = new THREE.TextureLoader().load('https://picsum.photos/200/200');
    const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        side: THREE.DoubleSide,
        transparent: true
    });
    
    const plane = new THREE.Mesh(geometry, material);
    plane.position.copy(position);
    plane.quaternion.copy(reticle.quaternion);

    // Add animation
    plane.scale.set(0, 0, 0);
    scene.add(plane);

    // Animate the placement
    const startTime = Date.now();
    const duration = 500; // 500ms animation

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out elastic animation
        const scale = 1 + Math.sin(progress * Math.PI * 2) * Math.exp(-progress * 3);
        plane.scale.set(scale, scale, scale);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
    updateStatus('Content placed successfully!');
}

function updateStatus(message) {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.innerHTML = `<p>${message}</p>`;
        // Add appropriate styling class
        if (message.includes('error') || message.includes('not supported')) {
            statusElement.classList.add('error');
        } else if (message.includes('success')) {
            statusElement.classList.add('success');
        }
    }
}

// Initialize when the page loads
window.addEventListener('load', init); 