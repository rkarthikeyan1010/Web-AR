let camera, scene, renderer;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let placementUI;
let isPlaced = false;

// Initialize WebXR Polyfill
const polyfill = new WebXRPolyfill();

// Check device compatibility
function checkDeviceCompatibility() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    let deviceInfo = '';
    let isCompatible = false;

    if (isIOS) {
        if (isSafari) {
            deviceInfo = 'iOS Safari detected. For best experience, please use Chrome on Android or try the WebXR Viewer app on iOS.';
        } else {
            deviceInfo = 'iOS device detected. Please use Safari browser for testing.';
        }
    } else if (isAndroid) {
        if (isChrome) {
            deviceInfo = 'Android Chrome detected. AR should work on this device.';
            isCompatible = true;
        } else {
            deviceInfo = 'Android device detected. Please use Chrome browser for best experience.';
        }
    } else {
        deviceInfo = 'Desktop device detected. Please use a mobile device for AR experience.';
    }

    updateDeviceInfo(deviceInfo);
    return isCompatible;
}

function updateDeviceInfo(message) {
    const deviceInfoElement = document.getElementById('device-info');
    if (deviceInfoElement) {
        deviceInfoElement.innerHTML = `<p>${message}</p>`;
    }
}

function init() {
    if (!checkDeviceCompatibility()) {
        updateStatus('Your device may not be fully compatible with WebXR. Some features may be limited.');
    }

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
    renderer.xr.enabled = true;
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

    // Add AR Button with error handling
    try {
        const arButton = ARButton.createButton(renderer, { 
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.getElementById('placement-ui') }
        });
        document.body.appendChild(arButton);
    } catch (error) {
        updateStatus('AR not supported on this device. Please try a different browser or device.');
        console.error('AR Button creation failed:', error);
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start the AR session
    renderer.setAnimationLoop(render);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    hitTestSource = source;
                });
            });

            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
                placementUI.classList.add('hidden');
            });

            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);

                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
                placementUI.classList.remove('hidden');
                updateStatus('Surface detected! Tap to place content.');
            } else {
                reticle.visible = false;
                placementUI.classList.add('hidden');
                if (!isPlaced) {
                    updateStatus('Move device to find a surface...');
                }
            }
        }
    }
    renderer.render(scene, camera);
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