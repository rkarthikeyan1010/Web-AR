let camera, scene, renderer;
let reticle;
let placementUI;
let isPlaced = false;
let hitTestSource = null;
let hitTestSourceRequested = false;

// Debug function
function debug(message) {
    console.log('[AR Debug]', message);
    updateStatus(message);
}

async function init() {
    try {
        // First check if WebXR is supported
        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }

        // Request camera permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } 
        });
        
        // Stop the stream after getting permission
        stream.getTracks().forEach(track => track.stop());

        // Create scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        // Create renderer
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        document.getElementById('ar-container').appendChild(renderer.domElement);

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

        // Add AR button with specific features
        const arButton = THREE.ARButton.createButton(renderer, {
            onUnsupported: () => {
                updateStatus('AR is not supported on your device');
            },
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.getElementById('placement-ui') }
        });
        document.body.appendChild(arButton);

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);

        // Set up AR session
        renderer.xr.addEventListener('sessionstart', onSessionStart);
        renderer.xr.addEventListener('sessionend', onSessionEnd);

        // Start animation loop
        renderer.setAnimationLoop(render);

        updateStatus('AR initialized successfully');
    } catch (error) {
        console.error('Error initializing AR:', error);
        updateStatus('Error: ' + error.message);
    }
}

function onSessionStart() {
    updateStatus('AR session started - Point at a surface');
    placementUI.style.display = 'block';
}

function onSessionEnd() {
    updateStatus('AR session ended');
    placementUI.style.display = 'none';
    reticle.visible = false;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
    if (renderer.xr.isPresenting) {
        updateHitTest();
    }
}

function updateHitTest() {
    if (!hitTestSourceRequested) {
        const session = renderer.xr.getSession();
        if (session) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    hitTestSource = source;
                });
            });
            hitTestSourceRequested = true;
        }
    }

    if (hitTestSource) {
        const frame = renderer.xr.getFrame();
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(renderer.xr.getReferenceSpace());

            if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            }
        } else {
            reticle.visible = false;
        }
    }
}

function placeImage(position) {
    if (isPlaced) return;

    // Hide placement UI
    placementUI.style.display = 'none';
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
    plane.position.copy(reticle.position);
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
    console.log('Status:', message);
}

// Add tap handler
renderer.domElement.addEventListener('click', () => {
    if (reticle.visible && !isPlaced) {
        placeImage(reticle.position);
    }
});

// Initialize when the page loads
window.addEventListener('load', init); 