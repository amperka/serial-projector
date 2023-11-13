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
    var rawString = new TextDecoder().decode(uintArray),
        processedString = removeEscSeq(rawString);
    return processedString;
}

function removeEscSeq(rawString) {
    //encode raw string to hex and remove escape sequence ">(zero or one times) CR ESC [ J"
    var encodedString = encodeURIComponent(rawString).replace(/^(?:%3E)?%0D%1B%5BJ/gi, ""),
        decodedString = decodeURIComponent(encodedString);
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
    } while (s.length != len);

    return s;
}

function setText(txt) {
    txt = handleBackspaces(txt);
    $('h1').html(txt);
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
            case 70:  // F
                $('#menu .btn-fullscreen').trigger('click');
                break;
            case 121: // F10
                $('#menu .btn-settings').trigger('click');
                break;
            case 112: // F1
                $('#menu .btn-about').trigger('click');
                break;
            case 67: // C
                $('#menu .btn-connection').trigger('click');
                break;
            case 32: // Space
                $('#connection button:visible').trigger('click');
                break;
        }
    });
});
