"use strict";

var events = require('events')
  , remotes = require('remote_resources')

function Preloader (items) {
    this.count = 0
    this.loaded = 0
    this.queue = []

    var listeners = {}

    if (items) {
        this.addToQueue(items)
    }

    var didLoadResource = (function (ref) {
        this.loaded++

        // Must remove listener or we'll leak memory
        if (listeners[ref]) {
            events.removeListener(listeners[ref]);
        }
        events.trigger(this, 'load', this, ref);

        if (this.loaded >= this.count) {
            events.trigger(this, 'complete', this);
        }
    }).bind(this)

    this.load = function () {
        // Store number of callbacks we're expecting
        this.count += this.queue.length 

        var ref, i
        for (i=0; i<this.count; i++) {
            ref = this.queue[i]

            if (!__jah__.resources[ref]) {
                console.warn("Unable to preload non-existant file: ", ref)
                didLoadResource(ref)
                continue
            }
            if (!__jah__.resources[ref].remote || __jah__.resources[ref].loaded) {
                // Already loaded
                didLoadResource(ref)
                continue
            }
            var url = __jah__.resources[ref].data
              // TODO handle non-image resources
              , file = new remotes.RemoteImage(url, ref)
              , callback = (function(ref) { return function () { didLoadResource(ref) } })(ref)

            // Notify when a resource has loaded
            listeners[ref] = events.addListener(file, 'load', callback);

            file.load()
        }

        this.clearQueue()
    }
}

Preloader.prototype.addToQueue = function (items) {
    if (items instanceof Array) {
        // Update array in place incase something else has a reference to it
        for (var i=0; i<items.length; i++) {
            this.queue.push(items[i])
        }
    } else {
        this.queue.push(items)
    }
}

Preloader.prototype.clearQueue = function () {
    this.queue.splice(0, this.queue.length)
}


exports.Preloader = Preloader;
