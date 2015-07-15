/* Copyright (c) 2015, Amperka LLC
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

chrome.app.runtime.onLaunched.addListener(function() {
    var w = chrome.app.window.create('window.html', {
        'outerBounds': {
            'width': 800,
            'height': 500
        }
    });
});
