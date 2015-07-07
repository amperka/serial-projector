
Uint8Array.prototype.slice = function(begin, end) {
    if (typeof begin === 'undefined')
        begin = 0;
    if (typeof end === 'undefined')
        end = Math.max(this.length, begin);

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

$(function() {
    var onConnect = function(connectionInfo) {
        $('h1').text('Connected!');
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
            $('h1').text(txt);
        }
    };

    chrome.serial.connect("/dev/ttyACM0", {bitrate: 9600}, onConnect);
    chrome.serial.onReceive.addListener(onReceive);
});
