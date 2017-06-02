/* Copyright (c) 2015, Amperka LLC
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

Uint8Array.prototype.slice = function(begin, end) {
    if (typeof begin === 'undefined') {
        begin = 0;
    }

    if (typeof end === 'undefined') {
        end = Math.max(this.length, begin);
    }

    var result = new Uint8Array(end - begin);
    for (var i = begin; i < end; ++i) {
        result[i - begin] = this[i];
    }

    return result;
}

function catBuffers(a, b) {
    var result = new Uint8Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);
    return result;
}

function uintToString(uintArray) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
        decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
}

function findLineBreak(b) {
    for (var i = 0; i < b.length; ++i) {
        if (b[i] == 10)
            return i;
    }
}

function handleBackspaces(s) {
    var len;
    do {
        len = s.length;
        s = s.replace(/[^\x08]\x08/, '');
        s = s.replace(/^\x08/, '');
    } while (s.length != len);

    return s;
}

function serializeData(s) {
    var platform = $('#platform').val();

    switch (platform) {
        case 'arduino':
            var object = {},
                items = s.split(';');

            items.forEach(function(item) {
                var [key, value] = item.split('|');
                object[key] = value;
            });

            return object;
        case 'espruino':
            return JSON.parse(s);
    }
}

function loadSettings(callback) {
    var storage = chrome.storage.sync;

    storage.get(['mode', 'use', 'html'], function(data) {
        var storageMode = _.get(data, 'mode', 'arduino'),
            storageUse = _.get(data, 'use', false),
            storageHtml = _.get(data, 'html', 'Hello, world!');

        $('#platform').val(storageMode);
        $('#use').attr('checked', storageUse);

        return callback(storageHtml);
    });
}

function setSetting(object) {
    return chrome.storage.sync.set(object);
}

$(function() {
    $('.btn-fullscreen').click(function(e) {
        e.preventDefault();
        var w = chrome.app.window.current();
        if (w.isFullscreen()) {
            w.restore();
        } else {
            w.fullscreen();
        }
    });

    $(document).keyup(function(e) {
        switch (e.which) {
            case 122: // F11
                $('#menu .btn-fullscreen').trigger('click');
                break;
            case 121: // F10
                $('#menu .btn-settings').trigger('click');
                break;
            case 113: // F2
                $('#menu .btn-code').trigger('click');
                break;
            case 112: // F1
                $('#menu .btn-about').trigger('click');
                break;
            case 114: // F3
                $('#menu .btn-connection').trigger('click');
                break;
            case 115: // F4
                $('#connection button:visible').trigger('click');
                break;
        }
    });
});

var editor = ace.edit("editor");
editor.getSession().setMode("ace/mode/html");
