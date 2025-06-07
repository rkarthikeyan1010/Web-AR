let scene, camera, renderer;
let reticle;
let debugMode = true;

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

// Initialize the AR experience
window.XR8 ? init() : window.addEventListener('xrloaded', init);

function init() {
    debugLog('Initializing AR experience...');
    
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

    // Create reticle
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Add AR button
    const startButton = document.getElementById('start-ar');
    if (startButton) {
        startButton.addEventListener('click', startAR);
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Set up 8th Wall
    XR8.addCameraPipelineModules([
        // Add camera pipeline modules
        XR8.GlTextureRenderer.pipelineModule(),
        XR8.Threejs.pipelineModule(),
        XR8.XrController.pipelineModule(),
        XR8.PipelineModule({
            name: 'surface-detection',
            onUpdate: () => {
                const {camera} = XR8.Threejs.xrScene();
                if (camera) {
                    const hitTestResults = XR8.XrController.hitTest(0, 0);
                    if (hitTestResults.length > 0) {
                        const hit = hitTestResults[0];
                        reticle.visible = true;
                        reticle.matrix.fromArray(hit.transform);
                    } else {
                        reticle.visible = false;
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
                if (XR8.XrController.isTapped()) {
                    const hitTestResults = XR8.XrController.hitTest(0, 0);
                    if (hitTestResults.length > 0) {
                        placeImage(hitTestResults[0].transform);
                    }
                }
            }
        })
    ]);
}

function startAR() {
    debugLog('Starting AR...');
    XR8.start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function placeImage(matrix) {
    debugLog('Placing image...');
    
    // Create a plane geometry for the image
    const geometry = new THREE.PlaneGeometry(1, 1);
    const texture = new THREE.TextureLoader().load(
        'https://picsum.photos/200/200',
        () => debugLog('Image loaded successfully'),
        undefined,
        (error) => debugLog('Error loading image: ' + error)
    );
    
    const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        side: THREE.DoubleSide,
        transparent: true
    });
    
    const plane = new THREE.Mesh(geometry, material);

    // Set the position and rotation from the hit test result
    plane.matrix.fromArray(matrix);
    plane.matrix.decompose(plane.position, plane.quaternion, plane.scale);

    // Add the plane to the scene
    scene.add(plane);
    debugLog('Image placed successfully');
} 