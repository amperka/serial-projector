/* Copyright (c) 2015, Amperka LLC
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var RETRY_CONNECT_MS = 1000;

var Connection = Backbone.Model.extend({
    defaults: {
        connectionId: null,
        path: null,
        bitrate: 9600,
        dataBits: 'eight',
        parityBit: 'no',
        stopBits: 'one',
        autoConnect: undefined,
        ports: [],
        buffer: null,
        text: 'Hello, world!',
        error: null,
        json: {},
        html: 'Hello, world!'
    },

    initialize: function() {
        chrome.serial.onReceive.addListener(this._onReceive.bind(this));
        chrome.serial.onReceiveError.addListener(this._onReceiveError.bind(this));
    },

    enumeratePorts: function() {
        var self = this;
        chrome.serial.getDevices(function(ports) {
            self.set('ports', ports);
            self._checkPath();
        });
    },

    hasPorts: function() {
        return this.get('ports').length > 0;
    },

    autoConnect: function(enable) {
        this.set('autoConnect', enable);
        if (enable) {
            this._tryConnect();
        } else {
            this._disconnect();
        }
    },

    _tryConnect: function() {
        if (!this.get('autoConnect')) {
            return;
        }

        var path = this.get('path');

        if (path) {
            var self = this;
            var opts = {
                bitrate: this.get('bitrate'),
                dataBits: this.get('dataBits'),
                parityBit: this.get('parityBit'),
                stopBits: this.get('stopBits'),
            }

            chrome.serial.connect(path, opts, function(connectionInfo) {
                self.set('buffer', new Uint8Array(0));
                if (connectionInfo) {
                  self.set('connectionId', connectionInfo.connectionId);
                  self.set('error', null);
                } else {
                  self.set('connectionId', null);
                  self.set('autoConnect', false);
                  self.set('error',
                      'Connection failed' + 
                      '<div style="font-size: 0.25em">' + 
                      'Can\'t open serial port ' + path +
                      '.<br>Possibly it is already in use ' +
                      'by another application.' +
                      '</div>');
                }
            });
        } else {
            this.enumeratePorts();
            setTimeout(this._tryConnect.bind(this), RETRY_CONNECT_MS);
        }
    },

    _disconnect: function() {
        var cid = this.get('connectionId');
        if (!cid) {
            return;
        }

        var self = this;
        chrome.serial.disconnect(cid, function() {
            self.set('connectionId', null);
            self.enumeratePorts();
        });
    },

    _checkPath: function() {
        var path = this.get('path');
        var ports = this.get('ports');

        if (ports.length == 0) {
            this.set('path', null);
            return;
        }

        for (var i = 0; i < ports.length; ++i) {
            var port = ports[i];
            if (port.path == path) {
                return;
            }
        }

        // We have to auto-choose any port. Use first
        // one but try to guess better on Mac
        var portIdx = 0;
        for (var i = 0; i < ports.length; ++i) {
            var port = ports[i];
            if (port.path.indexOf('/dev/cu.usbmodem') === 0) {
                portIdx = i;
                break;
            }
        }

        this.set('path', ports[portIdx].path);
    },

    _onReceive: function(receiveInfo) {
        var data = receiveInfo.data;
        data = new Uint8Array(data);
        this.set('buffer', catBuffers(this.get('buffer'), data));

        var lbr = findLineBreak(this.get('buffer'));
        if (lbr !== undefined) {
            var txt = this.get('buffer').slice(0, lbr),
                text = uintToString(txt);
            this.set('buffer', this.get('buffer').slice(lbr + 1));
            this.set('text', handleBackspaces(text));
            this.set('json', serializeData(handleBackspaces(text)));
        }
    },

    _onReceiveError: function(info) {
        this._disconnect();
        this.set('error', info.error);
        this.enumeratePorts();
    }
});

var ConnectionView = Backbone.View.extend({
    el: 'h1',

    initialize: function() {
        this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
        try {
            var text = this.model.get('text'),
                enable = $('#use').prop('checked'),
                error = this.model.get('error');

            if (error) return this.$el.html(error);

            if (enable) {
                var json = this.model.get('json'),
                    html = this.model.get('html'),
                    template = Mustache.to_html(html, json);

                return this.$el.html(template);
            } else {
                return this.$el.html(text);
            }
        } catch (e) {
            return this.$el.html(e);
        }
    },
});

$(function() {
    var connection = new Connection(),
        connectionView = new ConnectionView({model:connection});

    loadSettings(function(data) {
        connection.set({html: data});
        editor.setValue(data);
    });

    connection.on('change:ports', function(c) {
        var ports = c.get('ports');
        var $port = $('#port');
        $port.empty();

        for (var i = 0; i < ports.length; ++i) {
            var port = ports[i];
            $('<option value="' + port.path + '">' +
              port.path + ' ' + (port.displayName || '') + '</option>').appendTo($port);
        }

        if (ports.length == 0) {
            $('<option value="">[no device found]</option>').appendTo($port);
            $port.prop('disabled', true);
        } else {
            $port.val(c.get('path'));
        }
    });

    connection.on('change:autoConnect', function(c) {
        var autoConnect = !!c.get('autoConnect');
        $('#stop-connection').toggle(autoConnect);
        $('#connect').toggle(!autoConnect);
        $('#port').prop('disabled', autoConnect || !c.hasPorts());
        $('#bitrate, #dataBits, #parityBit, #stopBits').prop('disabled', autoConnect);
    });

    connection.on('change:path', function(c) {
        var path = c.get('path');
        $('#port').val(path);
    });

    connection.on('change:connectionId', function(c) {
        var connected = !!c.get('connectionId');
        $('.btn-connection').toggleClass('connected', connected);
    });

    $('.btn-connection').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $connection = $('#connection');
        $connection.toggle(0);
        if ($connection.is(':visible')) {
            connection.enumeratePorts();
        }
    });

    $('#connection').click(function(e) {
        e.stopPropagation();
    });

    $('body').click(function() {
        $('#connection').hide();
    });

    $('#connect').click(function(e) {
        e.preventDefault();
        connection.autoConnect(true);
    });

    $('#port').change(function(e) {
        connection.set('path', $(this).val());
    });

    $('#bitrate').change(function(e) {
        connection.set('bitrate', parseInt($(this).val()));
    });

    $('#dataBits, #parityBit, #stopBits').change(function(e) {
        connection.set($(this).attr('name'), $(this).val());
    });

    $('#stop-connection').click(function(e) {
        e.preventDefault();
        connection.autoConnect(false);
    });

    $('#update').click(function() {
        var object = {html: editor.getValue()};

        connection.set(object);
        setSetting(object);
    });

    $('#use').change(function(e) {
        var checked = $(e.target).prop('checked');

        setSetting({use: checked});
    });

    $('#platform').change(function(e) {
        var platform = $(e.target).val();

        setSetting({mode: platform});
    });

    connection.autoConnect(true);
});