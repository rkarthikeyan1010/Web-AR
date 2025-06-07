let scene, camera, renderer;
let placementUI;
let isPlaced = false;

// Initialize the AR experience
window.XR8 ? init() : window.addEventListener('xrloaded', init);

function init() {
    // Create scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('camerafeed'),
        antialias: true, 
        alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Add light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Get UI elements
    placementUI = document.getElementById('placement-ui');

    // Set up 8th Wall
    XR8.addCameraPipelineModules([
        // Add camera pipeline modules
        XR8.GlTextureRenderer.pipelineModule(),
        XR8.Threejs.pipelineModule(),
        XR8.XrController.pipelineModule(),
        XR8.PipelineModule({
            name: 'surface-detection',
            onUpdate: () => {
                if (!isPlaced) {
                    const {camera} = XR8.Threejs.xrScene();
                    if (camera) {
                        const hitTestResults = XR8.XrController.hitTest(0, 0);
                        if (hitTestResults.length > 0) {
                            placementUI.classList.remove('hidden');
                            updateStatus('Surface detected! Tap to place content.');
                        } else {
                            placementUI.classList.add('hidden');
                            updateStatus('Move device to find a surface...');
                        }
                    }
                }
            }
        })
    ]);

    // Handle tap to place
    XR8.addCameraPipelineModules([
        XR8.PipelineModule({
            name: 'tap-to-place',
            onUpdate: () => {
                if (!isPlaced && XR8.XrController.isTapped()) {
                    const hitTestResults = XR8.XrController.hitTest(0, 0);
                    if (hitTestResults.length > 0) {
                        placeImage(hitTestResults[0].transform);
                    }
                }
            }
        })
    ]);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function placeImage(matrix) {
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
    plane.matrix.fromArray(matrix);
    plane.matrix.decompose(plane.position, plane.quaternion, plane.scale);

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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateStatus(message) {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.innerHTML = `<p>${message}</p>`;
    }
} 