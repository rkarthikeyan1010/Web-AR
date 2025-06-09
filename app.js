// Wait for the scene to be ready
AFRAME.registerComponent('marker-handler', {
    init: function() {
        this.el.addEventListener('markerFound', () => {
            console.log('Marker found!');
        });

        this.el.addEventListener('markerLost', () => {
            console.log('Marker lost!');
        });
    }
}); 