let scene, camera, renderer;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Check device compatibility
    checkDeviceCompatibility();

    // Add AR button
    document.getElementById('start-ar').addEventListener('click', () => {
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
                if (supported) {
                    const button = ARButton.createButton(renderer, {
                        onUnsupported: () => {
                            showMessage('WebXR not supported on this device. Please use a compatible browser.');
                        }
                    });
                    document.getElementById('ar-button').appendChild(button);
                } else {
                    if (isIOS) {
                        showMessage('Please use WebXR Viewer app on iOS devices. Download from the App Store.');
                    } else {
                        showMessage('AR is not supported on your device');
                    }
                }
            });
        } else {
            if (isIOS) {
                showMessage('Please use WebXR Viewer app on iOS devices. Download from the App Store.');
            } else {
                showMessage('WebXR is not supported on your device');
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function checkDeviceCompatibility() {
    const deviceInfo = document.getElementById('device-info');
    if (isIOS) {
        deviceInfo.innerHTML = '<p style="color: #ff6b6b;">iOS detected: Please use WebXR Viewer app from the App Store</p>';
    } else if (/Android/.test(navigator.userAgent)) {
        deviceInfo.innerHTML = '<p style="color: #4CAF50;">Android detected: Chrome browser recommended</p>';
    } else {
        deviceInfo.innerHTML = '<p style="color: #ff6b6b;">Desktop detected: Please use a mobile device</p>';
    }
}

function showMessage(message) {
    const deviceInfo = document.getElementById('device-info');
    deviceInfo.innerHTML = `<p style="color: #ff6b6b;">${message}</p>`;
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
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    hitTestSource = source;
                });
            });

            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
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
    // Create a plane geometry for the image
    const geometry = new THREE.PlaneGeometry(1, 1);
    const texture = new THREE.TextureLoader().load('https://picsum.photos/200/200');
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);

    // Set the position and rotation from the hit test result
    plane.matrix.fromArray(matrix);
    plane.matrix.decompose(plane.position, plane.quaternion, plane.scale);

    // Add the plane to the scene
    scene.add(plane);
} 