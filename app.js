let scene, camera, renderer;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
let isAndroid = /Android/.test(navigator.userAgent);
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

init();
animate();

function init() {
    debugLog('Initializing Web AR application...');
    
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
    document.getElementById('ar-view').appendChild(renderer.domElement);

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

    // Check device compatibility
    checkDeviceCompatibility();

    // Add AR button
    const startButton = document.getElementById('start-ar');
    if (startButton) {
        startButton.addEventListener('click', startAR);
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function startAR() {
    debugLog('Starting AR session...');
    
    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-ar')
            .then((supported) => {
                if (supported) {
                    debugLog('AR is supported on this device');
                    const button = ARButton.createButton(renderer, {
                        onUnsupported: () => {
                            showMessage('WebXR not supported on this device. Please use a compatible browser.');
                        }
                    });
                    const arButtonContainer = document.getElementById('ar-button');
                    if (arButtonContainer) {
                        arButtonContainer.innerHTML = '';
                        arButtonContainer.appendChild(button);
                    }
                } else {
                    handleUnsupportedDevice();
                }
            })
            .catch((error) => {
                debugLog('Error checking AR support: ' + error);
                handleUnsupportedDevice();
            });
    } else {
        debugLog('WebXR not available');
        handleUnsupportedDevice();
    }
}

function handleUnsupportedDevice() {
    if (isIOS) {
        showMessage('Please use WebXR Viewer app on iOS devices. Download from the App Store.');
    } else if (isAndroid) {
        showMessage('Please use Chrome browser on Android devices.');
    } else {
        showMessage('WebXR is not supported on your device');
    }
}

function checkDeviceCompatibility() {
    const deviceInfo = document.getElementById('device-info');
    if (!deviceInfo) return;

    if (isIOS) {
        deviceInfo.innerHTML = '<p style="color: #ff6b6b;">iOS detected: Please use WebXR Viewer app from the App Store</p>';
    } else if (isAndroid) {
        deviceInfo.innerHTML = '<p style="color: #4CAF50;">Android detected: Chrome browser recommended</p>';
    } else {
        deviceInfo.innerHTML = '<p style="color: #ff6b6b;">Desktop detected: Please use a mobile device</p>';
    }
}

function showMessage(message) {
    debugLog(message);
    const deviceInfo = document.getElementById('device-info');
    if (deviceInfo) {
        deviceInfo.innerHTML = `<p style="color: #ff6b6b;">${message}</p>`;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer')
                .then((referenceSpace) => {
                    return session.requestHitTestSource({ space: referenceSpace });
                })
                .then((source) => {
                    hitTestSource = source;
                    debugLog('Hit test source created');
                })
                .catch((error) => {
                    debugLog('Error creating hit test source: ' + error);
                });

            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
                debugLog('AR session ended');
            });

            hitTestSourceRequested = true;
        }

        if (hitTestSourceRequested === true && hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);

                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);

                // Handle tap to place image
                if (session.inputSources[0] && session.inputSources[0].gamepad) {
                    const gamepad = session.inputSources[0].gamepad;
                    if (gamepad.buttons[0].pressed) {
                        placeImage(pose.transform.matrix);
                    }
                }
            } else {
                reticle.visible = false;
            }
        }
    }
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