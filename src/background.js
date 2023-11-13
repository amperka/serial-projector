/* Copyright (c) 2015, Amperka LLC
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

function disconnectAll() {
    chrome.serial.getConnections(function(connections) {
        connections.forEach(function(c) {
            chrome.serial.disconnect(c.connectionId, function() {});
        });
    });
}
 
chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('window.html', {
        'outerBounds': {
            'width': 800,
            'height': 500
        }
    }, function(window) {
        window.onClosed.addListener(disconnectAll);
    });
});
