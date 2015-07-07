chrome.app.runtime.onLaunched.addListener(function() {
    var w =chrome.app.window.create('window.html', {
        'id': 'monitor',
        'outerBounds': {
            'width': 400,
            'height': 500
        }
    });

    w.fullscreen();
});
