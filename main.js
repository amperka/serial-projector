
var RETRY_CONNECT_MS = 1000;

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

var buffer = new Uint8Array(0);

function onConnect(connectionInfo) {
    buffer = new Uint8Array(0);
    $('.status').addClass('connected');
}

function setText(txt) {
    $('h1').text(txt);
}

function onReceive(receiveInfo) {
    var data = receiveInfo.data;
    data = new Uint8Array(data);
    buffer = catBuffers(buffer, data);

    var lbr = findLineBreak(buffer);
    if (lbr !== undefined) {
        var txt = buffer.slice(0, lbr);
        buffer = buffer.slice(lbr + 1);
        txt = uintToString(txt);
        setText(txt);
    }
}

function retryConnect() {
    setTimeout(tryConnect, RETRY_CONNECT_MS);
}

function onReceiveError(info) {
    setText(info.error);
    $('.status').removeClass('connected');
    retryConnect();
}

function tryConnect() {
    chrome.serial.getDevices(function(ports) {
        if (!ports.length) {
            setText("No device found >:(");
            retryConnect();
            return;
        }

        var port = ports[0];
        chrome.serial.connect(port.path, {bitrate: 9600}, onConnect);
    });
}

$(function() {
    chrome.serial.onReceive.addListener(onReceive);
    chrome.serial.onReceiveError.addListener(onReceiveError);

    tryConnect();
});

$(function() {
    $('.fullscreen').click(function(e) {
        e.preventDefault();
        var w = chrome.app.window.current();
        if (w.isFullscreen()) {
            w.restore();
        } else {
            w.fullscreen();
        }
    });
});
