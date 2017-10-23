(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sound = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Filterable = (function () {
    function Filterable(input, output) {
        this._output = output;
        this._input = input;
    }
    Object.defineProperty(Filterable.prototype, "destination", {
        get: function () {
            return this._input;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Filterable.prototype, "filters", {
        get: function () {
            return this._filters;
        },
        set: function (filters) {
            var _this = this;
            if (this._filters) {
                this._filters.forEach(function (filter) {
                    if (filter) {
                        filter.disconnect();
                    }
                });
                this._filters = null;
                this._input.connect(this._output);
            }
            if (filters && filters.length) {
                this._filters = filters.slice(0);
                this._input.disconnect();
                var prevFilter_1 = null;
                filters.forEach(function (filter) {
                    if (prevFilter_1 === null) {
                        _this._input.connect(filter.destination);
                    }
                    else {
                        prevFilter_1.connect(filter.destination);
                    }
                    prevFilter_1 = filter;
                });
                prevFilter_1.connect(this._output);
            }
        },
        enumerable: true,
        configurable: true
    });
    Filterable.prototype.destroy = function () {
        this.filters = null;
        this._input = null;
        this._output = null;
    };
    return Filterable;
}());
exports.default = Filterable;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var AUDIO_EXTENSIONS = ["wav", "mp3", "ogg", "oga", "m4a"];
function middleware(resource, next) {
    if (resource.data && AUDIO_EXTENSIONS.indexOf(resource._getExtension()) > -1) {
        resource.sound = index_1.default.add(resource.name, {
            loaded: next,
            preload: true,
            srcBuffer: resource.data,
        });
    }
    else {
        next();
    }
}
function middlewareFactory() {
    return middleware;
}
function install() {
    var Resource = PIXI.loaders.Resource;
    AUDIO_EXTENSIONS.forEach(function (ext) {
        Resource.setExtensionXhrType(ext, Resource.XHR_RESPONSE_TYPE.BUFFER);
        Resource.setExtensionLoadType(ext, Resource.LOAD_TYPE.XHR);
    });
    PIXI.loaders.Loader.addPixiMiddleware(middlewareFactory);
    PIXI.loader.use(middleware);
}
exports.install = install;

},{"./index":17}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var SoundInstance_1 = require("./SoundInstance");
var SoundNodes_1 = require("./SoundNodes");
var SoundSprite_1 = require("./SoundSprite");
var Sound = (function () {
    function Sound(context, source) {
        var options = {};
        if (typeof source === "string") {
            options.src = source;
        }
        else if (source instanceof ArrayBuffer) {
            options.srcBuffer = source;
        }
        else {
            options = source;
        }
        options = Object.assign({
            autoPlay: false,
            singleInstance: false,
            src: null,
            srcBuffer: null,
            preload: false,
            volume: 1,
            speed: 1,
            complete: null,
            loaded: null,
            loop: false,
            useXHR: true,
        }, options);
        this._context = context;
        this._nodes = new SoundNodes_1.default(this._context);
        this._source = this._nodes.bufferSource;
        this._instances = [];
        this._sprites = {};
        var complete = options.complete;
        this._autoPlayOptions = complete ? { complete: complete } : null;
        this.isLoaded = false;
        this.isPlaying = false;
        this.autoPlay = options.autoPlay;
        this.singleInstance = options.singleInstance;
        this.preload = options.preload || this.autoPlay;
        this.src = options.src;
        this.srcBuffer = options.srcBuffer;
        this.useXHR = options.useXHR;
        this.volume = options.volume;
        this.loop = options.loop;
        this.speed = options.speed;
        if (options.sprites) {
            this.addSprites(options.sprites);
        }
        if (this.preload) {
            this._beginPreload(options.loaded);
        }
    }
    Sound.from = function (options) {
        return new Sound(index_1.default.context, options);
    };
    Sound.prototype.destroy = function () {
        this._nodes.destroy();
        this._nodes = null;
        this._context = null;
        this._source = null;
        this.removeSprites();
        this._sprites = null;
        this.srcBuffer = null;
        this._removeInstances();
        this._instances = null;
    };
    Object.defineProperty(Sound.prototype, "isPlayable", {
        get: function () {
            return this.isLoaded && !!this._source && !!this._source.buffer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "context", {
        get: function () {
            return this._context;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "volume", {
        get: function () {
            return this._volume;
        },
        set: function (volume) {
            this._volume = this._nodes.gain.gain.value = volume;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "loop", {
        get: function () {
            return this._source.loop;
        },
        set: function (loop) {
            this._source.loop = !!loop;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "buffer", {
        get: function () {
            return this._source.buffer;
        },
        set: function (buffer) {
            this._source.buffer = buffer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "duration", {
        get: function () {
            console.assert(this.isPlayable, "Sound not yet playable, no duration");
            return this._source.buffer.duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "nodes", {
        get: function () {
            return this._nodes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "filters", {
        get: function () {
            return this._nodes.filters;
        },
        set: function (filters) {
            this._nodes.filters = filters;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "speed", {
        get: function () {
            return this._source.playbackRate.value;
        },
        set: function (value) {
            this._source.playbackRate.value = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "instances", {
        get: function () {
            return this._instances;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "sprites", {
        get: function () {
            return this._sprites;
        },
        enumerable: true,
        configurable: true
    });
    Sound.prototype.addSprites = function (source, data) {
        if (typeof source === "object") {
            var results = {};
            for (var alias in source) {
                results[alias] = this.addSprites(alias, source[alias]);
            }
            return results;
        }
        else if (typeof source === "string") {
            console.assert(!this._sprites[source], "Alias " + source + " is already taken");
            var sprite = new SoundSprite_1.default(this, data);
            this._sprites[source] = sprite;
            return sprite;
        }
    };
    Sound.prototype.removeSprites = function (alias) {
        if (!alias) {
            for (var name_1 in this._sprites) {
                this.removeSprites(name_1);
            }
        }
        else {
            var sprite = this._sprites[alias];
            if (sprite !== undefined) {
                sprite.destroy();
                delete this._sprites[alias];
            }
        }
        return this;
    };
    Sound.prototype.play = function (source, complete) {
        var _this = this;
        var options;
        if (typeof source === "string") {
            var sprite = source;
            options = { sprite: sprite, complete: complete };
        }
        else if (typeof source === "function") {
            options = {};
            options.complete = source;
        }
        else {
            options = source;
        }
        options = Object.assign({
            complete: null,
            loaded: null,
            sprite: null,
            start: 0,
            fadeIn: 0,
            fadeOut: 0,
        }, options || {});
        if (options.sprite) {
            var alias = options.sprite;
            console.assert(!!this._sprites[alias], "Alias " + alias + " is not available");
            var sprite = this._sprites[alias];
            options.start = sprite.start;
            options.end = sprite.end;
            options.speed = sprite.speed;
            delete options.sprite;
        }
        if (options.offset) {
            options.start = options.offset;
        }
        if (!this.isLoaded) {
            return new Promise(function (resolve, reject) {
                _this.autoPlay = true;
                _this._autoPlayOptions = options;
                _this._beginPreload(function (err, sound, instance) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        if (options.loaded) {
                            options.loaded(err, sound, instance);
                        }
                        resolve(instance);
                    }
                });
            });
        }
        if (this.singleInstance) {
            this._removeInstances();
        }
        var instance = SoundInstance_1.default.create(this);
        this._instances.push(instance);
        this.isPlaying = true;
        instance.once("end", function () {
            if (options.complete) {
                options.complete(_this);
            }
            _this._onComplete(instance);
        });
        instance.once("stop", function () {
            _this._onComplete(instance);
        });
        instance.play(options.start, options.end, options.speed, options.loop, options.fadeIn, options.fadeOut);
        return instance;
    };
    Sound.prototype.stop = function () {
        if (!this.isPlayable) {
            this.autoPlay = false;
            this._autoPlayOptions = null;
            return this;
        }
        this.isPlaying = false;
        for (var i = this._instances.length - 1; i >= 0; i--) {
            this._instances[i].stop();
        }
        return this;
    };
    Sound.prototype.pause = function () {
        for (var i = this._instances.length - 1; i >= 0; i--) {
            this._instances[i].paused = true;
        }
        this.isPlaying = false;
        return this;
    };
    ;
    Sound.prototype.resume = function () {
        for (var i = this._instances.length - 1; i >= 0; i--) {
            this._instances[i].paused = false;
        }
        this.isPlaying = this._instances.length > 0;
        return this;
    };
    Sound.prototype._beginPreload = function (callback) {
        if (this.src) {
            this.useXHR ? this._loadUrl(callback) : this._loadPath(callback);
        }
        else if (this.srcBuffer) {
            this._decode(this.srcBuffer, callback);
        }
        else if (callback) {
            callback(new Error("sound.src or sound.srcBuffer must be set"));
        }
        else {
            console.error("sound.src or sound.srcBuffer must be set");
        }
    };
    Sound.prototype._onComplete = function (instance) {
        if (this._instances) {
            var index = this._instances.indexOf(instance);
            if (index > -1) {
                this._instances.splice(index, 1);
            }
            this.isPlaying = this._instances.length > 0;
        }
        instance.destroy();
    };
    Sound.prototype._removeInstances = function () {
        for (var i = this._instances.length - 1; i >= 0; i--) {
            this._instances[i].destroy();
        }
        this._instances.length = 0;
    };
    Sound.prototype._loadUrl = function (callback) {
        var _this = this;
        var request = new XMLHttpRequest();
        var src = this.src;
        request.open("GET", src, true);
        request.responseType = "arraybuffer";
        request.onload = function () {
            _this.srcBuffer = request.response;
            _this._decode(request.response, callback);
        };
        request.send();
    };
    Sound.prototype._loadPath = function (callback) {
        var _this = this;
        var fs = require("fs");
        var src = this.src;
        fs.readFile(src, function (err, data) {
            if (err) {
                console.error(err);
                if (callback) {
                    callback(new Error("File not found " + _this.src));
                }
                return;
            }
            var arrayBuffer = new ArrayBuffer(data.length);
            var view = new Uint8Array(arrayBuffer);
            for (var i = 0; i < data.length; ++i) {
                view[i] = data[i];
            }
            _this.srcBuffer = arrayBuffer;
            _this._decode(arrayBuffer, callback);
        });
    };
    Sound.prototype._decode = function (arrayBuffer, callback) {
        var _this = this;
        this._context.decode(arrayBuffer, function (err, buffer) {
            if (err) {
                if (callback) {
                    callback(err);
                }
            }
            else {
                _this.isLoaded = true;
                _this.buffer = buffer;
                var instance = void 0;
                if (_this.autoPlay) {
                    instance = _this.play(_this._autoPlayOptions);
                }
                if (callback) {
                    callback(null, _this, instance);
                }
            }
        });
    };
    return Sound;
}());
exports.default = Sound;

},{"./SoundInstance":5,"./SoundNodes":7,"./SoundSprite":8,"./index":17,"fs":undefined}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Filterable_1 = require("./Filterable");
var SoundContext = (function (_super) {
    __extends(SoundContext, _super);
    function SoundContext() {
        var _this = this;
        var ctx = new SoundContext.AudioContext();
        var gain = ctx.createGain();
        var compressor = ctx.createDynamicsCompressor();
        var analyser = ctx.createAnalyser();
        analyser.connect(gain);
        gain.connect(compressor);
        compressor.connect(ctx.destination);
        _this = _super.call(this, analyser, gain) || this;
        _this._ctx = ctx;
        _this._offlineCtx = new SoundContext.OfflineAudioContext(1, 2, ctx.sampleRate);
        _this._unlocked = false;
        _this.gain = gain;
        _this.compressor = compressor;
        _this.analyser = analyser;
        _this.volume = 1;
        _this.muted = false;
        _this.paused = false;
        if ("ontouchstart" in window && ctx.state !== "running") {
            _this._unlock();
            _this._unlock = _this._unlock.bind(_this);
            document.addEventListener("mousedown", _this._unlock, true);
            document.addEventListener("touchstart", _this._unlock, true);
            document.addEventListener("touchend", _this._unlock, true);
        }
        return _this;
    }
    SoundContext.prototype._unlock = function () {
        if (this._unlocked) {
            return;
        }
        this.playEmptySound();
        if (this._ctx.state === "running") {
            document.removeEventListener("mousedown", this._unlock, true);
            document.removeEventListener("touchend", this._unlock, true);
            document.removeEventListener("touchstart", this._unlock, true);
            this._unlocked = true;
        }
    };
    SoundContext.prototype.playEmptySound = function () {
        var source = this._ctx.createBufferSource();
        source.buffer = this._ctx.createBuffer(1, 1, 22050);
        source.connect(this._ctx.destination);
        source.start(0, 0, 0);
    };
    Object.defineProperty(SoundContext, "AudioContext", {
        get: function () {
            var win = window;
            return (win.AudioContext ||
                win.webkitAudioContext ||
                null);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext, "OfflineAudioContext", {
        get: function () {
            var win = window;
            return (win.OfflineAudioContext ||
                win.webkitOfflineAudioContext ||
                null);
        },
        enumerable: true,
        configurable: true
    });
    SoundContext.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        var ctx = this._ctx;
        if (typeof ctx.close !== "undefined") {
            ctx.close();
        }
        this.analyser.disconnect();
        this.gain.disconnect();
        this.compressor.disconnect();
        this.gain = null;
        this.analyser = null;
        this.compressor = null;
        this._offlineCtx = null;
        this._ctx = null;
    };
    Object.defineProperty(SoundContext.prototype, "audioContext", {
        get: function () {
            return this._ctx;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "offlineContext", {
        get: function () {
            return this._offlineCtx;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "muted", {
        get: function () {
            return this._muted;
        },
        set: function (muted) {
            this._muted = !!muted;
            this.gain.gain.value = this._muted ? 0 : this._volume;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "volume", {
        get: function () {
            return this._volume;
        },
        set: function (volume) {
            this._volume = volume;
            if (!this._muted) {
                this.gain.gain.value = this._volume;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "paused", {
        get: function () {
            return this._paused;
        },
        set: function (paused) {
            if (paused && this._ctx.state === "running") {
                this._ctx.suspend();
            }
            else if (!paused && this._ctx.state === "suspended") {
                this._ctx.resume();
            }
            this._paused = paused;
        },
        enumerable: true,
        configurable: true
    });
    SoundContext.prototype.toggleMute = function () {
        this.muted = !this.muted;
        return this._muted;
    };
    SoundContext.prototype.decode = function (arrayBuffer, callback) {
        this._offlineCtx.decodeAudioData(arrayBuffer, function (buffer) {
            callback(null, buffer);
        }, function () {
            callback(new Error("Unable to decode file"));
        });
    };
    return SoundContext;
}(Filterable_1.default));
exports.default = SoundContext;

},{"./Filterable":1}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var id = 0;
var SoundInstance = (function (_super) {
    __extends(SoundInstance, _super);
    function SoundInstance(parent) {
        var _this = _super.call(this) || this;
        _this.id = id++;
        _this._parent = null;
        _this._paused = false;
        _this._elapsed = 0;
        _this._init(parent);
        return _this;
    }
    SoundInstance.create = function (parent) {
        if (SoundInstance._pool.length > 0) {
            var sound = SoundInstance._pool.pop();
            sound._init(parent);
            return sound;
        }
        else {
            return new SoundInstance(parent);
        }
    };
    SoundInstance.prototype.stop = function () {
        if (this._source) {
            this._internalStop();
            this.emit("stop");
        }
    };
    SoundInstance.prototype.play = function (start, end, speed, loop, fadeIn, fadeOut) {
        if (end) {
            console.assert(end > start, "End time is before start time");
        }
        this._paused = false;
        this._source = this._parent.nodes.cloneBufferSource();
        if (speed !== undefined) {
            this._source.playbackRate.value = speed;
        }
        this._speed = this._source.playbackRate.value;
        if (loop !== undefined) {
            this._loop = this._source.loop = !!loop;
        }
        if (this._loop && end !== undefined) {
            console.warn('Looping not support when specifying an "end" time');
            this._loop = this._source.loop = false;
        }
        this._end = end;
        var duration = this._source.buffer.duration;
        fadeIn = this._toSec(fadeIn);
        if (fadeIn > duration) {
            fadeIn = duration;
        }
        if (!this._loop) {
            fadeOut = this._toSec(fadeOut);
            if (fadeOut > duration - fadeIn) {
                fadeOut = duration - fadeIn;
            }
        }
        this._duration = duration;
        this._fadeIn = fadeIn;
        this._fadeOut = fadeOut;
        this._lastUpdate = this._now();
        this._elapsed = start;
        this._source.onended = this._onComplete.bind(this);
        if (end) {
            this._source.start(0, start, end - start);
        }
        else {
            this._source.start(0, start);
        }
        this.emit("start");
        this._update(true);
        this._enabled = true;
    };
    SoundInstance.prototype._toSec = function (time) {
        if (time > 10) {
            time /= 1000;
        }
        return time || 0;
    };
    Object.defineProperty(SoundInstance.prototype, "_enabled", {
        set: function (enabled) {
            var _this = this;
            this._parent.nodes.script.onaudioprocess = !enabled ? null : function () {
                _this._update();
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundInstance.prototype, "progress", {
        get: function () {
            return this._progress;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundInstance.prototype, "paused", {
        get: function () {
            return this._paused;
        },
        set: function (paused) {
            if (paused !== this._paused) {
                this._paused = paused;
                if (paused) {
                    this._internalStop();
                    this.emit("paused");
                }
                else {
                    this.emit("resumed");
                    this.play(this._elapsed % this._duration, this._end, this._speed, this._loop, this._fadeIn, this._fadeOut);
                }
                this.emit("pause", paused);
            }
        },
        enumerable: true,
        configurable: true
    });
    SoundInstance.prototype.destroy = function () {
        this.removeAllListeners();
        this._internalStop();
        this._source = null;
        this._speed = 0;
        this._end = 0;
        this._parent = null;
        this._elapsed = 0;
        this._duration = 0;
        this._loop = false;
        this._fadeIn = 0;
        this._fadeOut = 0;
        this._paused = false;
        if (SoundInstance._pool.indexOf(this) < 0) {
            SoundInstance._pool.push(this);
        }
    };
    SoundInstance.prototype.toString = function () {
        return "[SoundInstance id=" + this.id + "]";
    };
    SoundInstance.prototype._now = function () {
        return this._parent.context.audioContext.currentTime;
    };
    SoundInstance.prototype._update = function (force) {
        if (force === void 0) { force = false; }
        if (this._source) {
            var now = this._now();
            var delta = now - this._lastUpdate;
            if (delta > 0 || force) {
                this._elapsed += delta;
                this._lastUpdate = now;
                var duration = this._duration;
                var progress = ((this._elapsed * this._speed) % duration) / duration;
                if (this._fadeIn || this._fadeOut) {
                    var position = progress * duration;
                    var gain = this._parent.nodes.gain.gain;
                    var maxVolume = this._parent.volume;
                    if (this._fadeIn) {
                        if (position <= this._fadeIn && progress < 1) {
                            gain.value = maxVolume * (position / this._fadeIn);
                        }
                        else {
                            gain.value = maxVolume;
                            this._fadeIn = 0;
                        }
                    }
                    if (this._fadeOut && position >= duration - this._fadeOut) {
                        var percent = (duration - position) / this._fadeOut;
                        gain.value = maxVolume * percent;
                    }
                }
                this._progress = progress;
                this.emit("progress", this._progress, duration);
            }
        }
    };
    SoundInstance.prototype._init = function (parent) {
        this._parent = parent;
    };
    SoundInstance.prototype._internalStop = function () {
        if (this._source) {
            this._enabled = false;
            this._source.onended = null;
            this._source.stop();
            this._source = null;
            this._parent.volume = this._parent.volume;
        }
    };
    SoundInstance.prototype._onComplete = function () {
        if (this._source) {
            this._enabled = false;
            this._source.onended = null;
        }
        this._source = null;
        this._progress = 1;
        this.emit("progress", 1, this._duration);
        this.emit("end", this);
    };
    return SoundInstance;
}(PIXI.utils.EventEmitter));
SoundInstance._pool = [];
exports.default = SoundInstance;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Filterable_1 = require("./Filterable");
var filters = require("./filters");
var Sound_1 = require("./Sound");
var SoundContext_1 = require("./SoundContext");
var SoundInstance_1 = require("./SoundInstance");
var SoundSprite_1 = require("./SoundSprite");
var SoundUtils_1 = require("./SoundUtils");
var SoundLibrary = (function () {
    function SoundLibrary() {
        if (this.supported) {
            this._context = new SoundContext_1.default();
        }
        this._sounds = {};
        this.utils = SoundUtils_1.default;
        this.filters = filters;
        this.Sound = Sound_1.default;
        this.SoundInstance = SoundInstance_1.default;
        this.SoundLibrary = SoundLibrary;
        this.SoundSprite = SoundSprite_1.default;
        this.Filterable = Filterable_1.default;
    }
    Object.defineProperty(SoundLibrary.prototype, "context", {
        get: function () {
            return this._context;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundLibrary.prototype, "filtersAll", {
        get: function () {
            return this._context.filters;
        },
        set: function (filters) {
            this._context.filters = filters;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundLibrary.prototype, "supported", {
        get: function () {
            return SoundContext_1.default.AudioContext !== null;
        },
        enumerable: true,
        configurable: true
    });
    SoundLibrary.prototype.add = function (source, sourceOptions) {
        if (typeof source === "object") {
            var results = {};
            for (var alias in source) {
                var options = this._getOptions(source[alias], sourceOptions);
                results[alias] = this.add(alias, options);
            }
            return results;
        }
        else if (typeof source === "string") {
            console.assert(!this._sounds[source], "Sound with alias " + source + " already exists.");
            if (sourceOptions instanceof Sound_1.default) {
                this._sounds[source] = sourceOptions;
                return sourceOptions;
            }
            else {
                var options = this._getOptions(sourceOptions);
                var sound = new Sound_1.default(this.context, options);
                this._sounds[source] = sound;
                return sound;
            }
        }
    };
    SoundLibrary.prototype._getOptions = function (source, overrides) {
        var options;
        if (typeof source === "string") {
            options = { src: source };
        }
        else if (source instanceof ArrayBuffer) {
            options = { srcBuffer: source };
        }
        else {
            options = source;
        }
        return Object.assign(options, overrides || {});
    };
    SoundLibrary.prototype.remove = function (alias) {
        this.exists(alias, true);
        this._sounds[alias].destroy();
        delete this._sounds[alias];
        return this;
    };
    Object.defineProperty(SoundLibrary.prototype, "volumeAll", {
        get: function () {
            return this._context.volume;
        },
        set: function (volume) {
            this._context.volume = volume;
        },
        enumerable: true,
        configurable: true
    });
    SoundLibrary.prototype.pauseAll = function () {
        this._context.paused = true;
        return this;
    };
    SoundLibrary.prototype.resumeAll = function () {
        this._context.paused = false;
        return this;
    };
    SoundLibrary.prototype.muteAll = function () {
        this._context.muted = true;
        return this;
    };
    SoundLibrary.prototype.unmuteAll = function () {
        this._context.muted = false;
        return this;
    };
    SoundLibrary.prototype.removeAll = function () {
        for (var alias in this._sounds) {
            this._sounds[alias].destroy();
            delete this._sounds[alias];
        }
        return this;
    };
    SoundLibrary.prototype.stopAll = function () {
        for (var alias in this._sounds) {
            this._sounds[alias].stop();
        }
        return this;
    };
    SoundLibrary.prototype.exists = function (alias, assert) {
        if (assert === void 0) { assert = false; }
        var exists = !!this._sounds[alias];
        if (assert) {
            console.assert(exists, "No sound matching alias '" + alias + "'.");
        }
        return exists;
    };
    SoundLibrary.prototype.find = function (alias) {
        this.exists(alias, true);
        return this._sounds[alias];
    };
    SoundLibrary.prototype.play = function (alias, options) {
        return this.find(alias).play(options);
    };
    SoundLibrary.prototype.stop = function (alias) {
        return this.find(alias).stop();
    };
    SoundLibrary.prototype.pause = function (alias) {
        return this.find(alias).pause();
    };
    SoundLibrary.prototype.resume = function (alias) {
        return this.find(alias).resume();
    };
    SoundLibrary.prototype.volume = function (alias, volume) {
        var sound = this.find(alias);
        if (volume !== undefined) {
            sound.volume = volume;
        }
        return sound.volume;
    };
    SoundLibrary.prototype.duration = function (alias) {
        return this.find(alias).duration;
    };
    SoundLibrary.prototype.destroy = function () {
        this.removeAll();
        this._sounds = null;
        this._context = null;
    };
    return SoundLibrary;
}());
exports.default = SoundLibrary;

},{"./Filterable":1,"./Sound":3,"./SoundContext":4,"./SoundInstance":5,"./SoundSprite":8,"./SoundUtils":9,"./filters":16}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Filterable_1 = require("./Filterable");
var SoundNodes = (function (_super) {
    __extends(SoundNodes, _super);
    function SoundNodes(context) {
        var _this = this;
        var audioContext = context.audioContext;
        var bufferSource = audioContext.createBufferSource();
        var script = audioContext.createScriptProcessor(SoundNodes.BUFFER_SIZE);
        var gain = audioContext.createGain();
        var analyser = audioContext.createAnalyser();
        bufferSource.connect(analyser);
        analyser.connect(gain);
        gain.connect(context.destination);
        script.connect(context.destination);
        _this = _super.call(this, analyser, gain) || this;
        _this.context = context;
        _this.bufferSource = bufferSource;
        _this.script = script;
        _this.gain = gain;
        _this.analyser = analyser;
        return _this;
    }
    SoundNodes.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.bufferSource.disconnect();
        this.script.disconnect();
        this.gain.disconnect();
        this.analyser.disconnect();
        this.bufferSource = null;
        this.script = null;
        this.gain = null;
        this.analyser = null;
        this.context = null;
    };
    SoundNodes.prototype.cloneBufferSource = function () {
        var orig = this.bufferSource;
        var clone = this.context.audioContext.createBufferSource();
        clone.buffer = orig.buffer;
        clone.playbackRate.value = orig.playbackRate.value;
        clone.loop = orig.loop;
        clone.connect(this.destination);
        return clone;
    };
    return SoundNodes;
}(Filterable_1.default));
SoundNodes.BUFFER_SIZE = 256;
exports.default = SoundNodes;

},{"./Filterable":1}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SoundSprite = (function () {
    function SoundSprite(parent, options) {
        this.parent = parent;
        Object.assign(this, options);
        this.duration = this.end - this.start;
        console.assert(this.duration > 0, "End time must be after start time");
    }
    SoundSprite.prototype.play = function (complete) {
        return this.parent.play(Object.assign({
            complete: complete,
            speed: this.speed || this.parent.speed,
            end: this.end,
            start: this.start,
        }));
    };
    SoundSprite.prototype.destroy = function () {
        this.parent = null;
    };
    return SoundSprite;
}());
exports.default = SoundSprite;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid = require("uuid/v4");
var index_1 = require("./index");
var Sound_1 = require("./Sound");
var SoundUtils = (function () {
    function SoundUtils() {
    }
    SoundUtils.sineTone = function (hertz, seconds) {
        if (hertz === void 0) { hertz = 200; }
        if (seconds === void 0) { seconds = 1; }
        var soundContext = index_1.default.context;
        var soundInstance = new Sound_1.default(soundContext, {
            singleInstance: true,
        });
        var nChannels = 1;
        var sampleRate = 48000;
        var amplitude = 2;
        var buffer = soundContext.audioContext.createBuffer(nChannels, seconds * sampleRate, sampleRate);
        var fArray = buffer.getChannelData(0);
        for (var i = 0; i < fArray.length; i++) {
            var time = i / buffer.sampleRate;
            var angle = hertz * time * Math.PI;
            fArray[i] = Math.sin(angle) * amplitude;
        }
        soundInstance.buffer = buffer;
        soundInstance.isLoaded = true;
        return soundInstance;
    };
    SoundUtils.render = function (sound, options) {
        options = Object.assign({
            width: 512,
            height: 128,
            fill: "black",
        }, options || {});
        console.assert(!!sound.buffer, "No buffer found, load first");
        var canvas = document.createElement("canvas");
        canvas.width = options.width;
        canvas.height = options.height;
        var context = canvas.getContext("2d");
        context.fillStyle = options.fill;
        var data = sound.buffer.getChannelData(0);
        var step = Math.ceil(data.length / options.width);
        var amp = options.height / 2;
        for (var i = 0; i < options.width; i++) {
            var min = 1.0;
            var max = -1.0;
            for (var j = 0; j < step; j++) {
                var datum = data[(i * step) + j];
                if (datum < min) {
                    min = datum;
                }
                if (datum > max) {
                    max = datum;
                }
            }
            context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
        return PIXI.BaseTexture.fromCanvas(canvas);
    };
    SoundUtils.playOnce = function (src, callback) {
        var alias = uuid();
        index_1.default.add(alias, {
            src: src,
            preload: true,
            autoPlay: true,
            loaded: function (err) {
                if (err) {
                    console.error(err);
                    index_1.default.remove(alias);
                    if (callback) {
                        callback(err);
                    }
                }
            },
            complete: function () {
                index_1.default.remove(alias);
                if (callback) {
                    callback(null);
                }
            },
        });
        return alias;
    };
    return SoundUtils;
}());
exports.default = SoundUtils;

},{"./Sound":3,"./index":17,"uuid/v4":20}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Sound_1 = require("./Sound");
var SoundLibrary_1 = require("./SoundLibrary");
var SoundLibraryPrototype = SoundLibrary_1.default.prototype;
var SoundPrototype = Sound_1.default.prototype;
SoundLibraryPrototype.sound = function sound(alias) {
    console.warn("PIXI.sound.sound is deprecated, use PIXI.sound.find");
    return this.find(alias);
};
SoundLibraryPrototype.panning = function panning(alias, panningValue) {
    console.warn("PIXI.sound.panning is deprecated, use PIXI.sound.filters.StereoPan");
    return 0;
};
SoundLibraryPrototype.addMap = function addMap(map, globalOptions) {
    console.warn("PIXI.sound.addMap is deprecated, use PIXI.sound.add");
    return this.add(map, globalOptions);
};
Object.defineProperty(SoundLibraryPrototype, "SoundUtils", {
    get: function () {
        console.warn("PIXI.sound.SoundUtils is deprecated, use PIXI.sound.utils");
        return this.utils;
    },
});
Object.defineProperty(SoundPrototype, "block", {
    get: function () {
        console.warn("PIXI.sound.Sound.prototype.block is deprecated, use singleInstance instead");
        return this.singleInstance;
    },
    set: function (value) {
        console.warn("PIXI.sound.Sound.prototype.block is deprecated, use singleInstance instead");
        this.singleInstance = value;
    },
});
Object.defineProperty(SoundPrototype, "loaded", {
    get: function () {
        console.warn("PIXI.sound.Sound.prototype.loaded is deprecated, use constructor option instead");
        return null;
    },
    set: function (value) {
        console.warn("PIXI.sound.Sound.prototype.loaded is deprecated, use constructor option instead");
    },
});
Object.defineProperty(SoundPrototype, "complete", {
    get: function () {
        console.warn("PIXI.sound.Sound.prototype.complete is deprecated, use constructor option instead");
        return null;
    },
    set: function (value) {
        console.warn("PIXI.sound.Sound.prototype.complete is deprecated, use constructor option instead");
    },
});

},{"./Sound":3,"./SoundLibrary":6}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Filter_1 = require("./Filter");
var index_1 = require("../index");
var DistortionFilter = (function (_super) {
    __extends(DistortionFilter, _super);
    function DistortionFilter(amount) {
        if (amount === void 0) { amount = 0; }
        var _this = this;
        var distortion = index_1.default.context.audioContext.createWaveShaper();
        _this = _super.call(this, distortion) || this;
        _this._distortion = distortion;
        _this.amount = amount;
        return _this;
    }
    Object.defineProperty(DistortionFilter.prototype, "amount", {
        get: function () {
            return this._amount;
        },
        set: function (value) {
            value *= 1000;
            this._amount = value;
            var samples = 44100;
            var curve = new Float32Array(samples);
            var deg = Math.PI / 180;
            var i = 0;
            var x;
            for (; i < samples; ++i) {
                x = i * 2 / samples - 1;
                curve[i] = (3 + value) * x * 20 * deg / (Math.PI + value * Math.abs(x));
            }
            this._distortion.curve = curve;
            this._distortion.oversample = '4x';
        },
        enumerable: true,
        configurable: true
    });
    DistortionFilter.prototype.destroy = function () {
        this._distortion = null;
        _super.prototype.destroy.call(this);
    };
    return DistortionFilter;
}(Filter_1.default));
exports.default = DistortionFilter;

},{"../index":17,"./Filter":13}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Filter_1 = require("./Filter");
var index_1 = require("../index");
var EqualizerFilter = (function (_super) {
    __extends(EqualizerFilter, _super);
    function EqualizerFilter(f32, f64, f125, f250, f500, f1k, f2k, f4k, f8k, f16k) {
        if (f32 === void 0) { f32 = 0; }
        if (f64 === void 0) { f64 = 0; }
        if (f125 === void 0) { f125 = 0; }
        if (f250 === void 0) { f250 = 0; }
        if (f500 === void 0) { f500 = 0; }
        if (f1k === void 0) { f1k = 0; }
        if (f2k === void 0) { f2k = 0; }
        if (f4k === void 0) { f4k = 0; }
        if (f8k === void 0) { f8k = 0; }
        if (f16k === void 0) { f16k = 0; }
        var _this = this;
        var equalizerBands = [
            {
                f: EqualizerFilter.F32,
                type: 'lowshelf',
                gain: f32
            },
            {
                f: EqualizerFilter.F64,
                type: 'peaking',
                gain: f64
            },
            {
                f: EqualizerFilter.F125,
                type: 'peaking',
                gain: f125
            },
            {
                f: EqualizerFilter.F250,
                type: 'peaking',
                gain: f250
            },
            {
                f: EqualizerFilter.F500,
                type: 'peaking',
                gain: f500
            },
            {
                f: EqualizerFilter.F1K,
                type: 'peaking',
                gain: f1k
            },
            {
                f: EqualizerFilter.F2K,
                type: 'peaking',
                gain: f2k
            },
            {
                f: EqualizerFilter.F4K,
                type: 'peaking',
                gain: f4k
            },
            {
                f: EqualizerFilter.F8K,
                type: 'peaking',
                gain: f8k
            },
            {
                f: EqualizerFilter.F16K,
                type: 'highshelf',
                gain: f16k
            }
        ];
        var bands = equalizerBands.map(function (band) {
            var filter = index_1.default.context.audioContext.createBiquadFilter();
            filter.type = band.type;
            filter.gain.value = band.gain;
            filter.Q.value = 1;
            filter.frequency.value = band.f;
            return filter;
        });
        _this = _super.call(this, bands[0], bands[bands.length - 1]) || this;
        _this.bands = bands;
        _this.bandsMap = {};
        for (var i = 0; i < _this.bands.length; i++) {
            var node = _this.bands[i];
            if (i > 0) {
                _this.bands[i - 1].connect(node);
            }
            _this.bandsMap[node.frequency.value] = node;
        }
        return _this;
    }
    EqualizerFilter.prototype.setGain = function (frequency, gain) {
        if (gain === void 0) { gain = 0; }
        if (!this.bandsMap[frequency]) {
            throw 'No band found for frequency ' + frequency;
        }
        this.bandsMap[frequency].gain.value = gain;
    };
    EqualizerFilter.prototype.reset = function () {
        this.bands.forEach(function (band) {
            band.gain.value = 0;
        });
    };
    EqualizerFilter.prototype.destroy = function () {
        this.bands.forEach(function (band) {
            band.disconnect();
        });
        this.bands = null;
        this.bandsMap = null;
    };
    return EqualizerFilter;
}(Filter_1.default));
EqualizerFilter.F32 = 32;
EqualizerFilter.F64 = 64;
EqualizerFilter.F125 = 125;
EqualizerFilter.F250 = 250;
EqualizerFilter.F500 = 500;
EqualizerFilter.F1K = 1000;
EqualizerFilter.F2K = 2000;
EqualizerFilter.F4K = 4000;
EqualizerFilter.F8K = 8000;
EqualizerFilter.F16K = 16000;
exports.default = EqualizerFilter;

},{"../index":17,"./Filter":13}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Filter = (function () {
    function Filter(destination, source) {
        this.destination = destination;
        this.source = source || destination;
    }
    Filter.prototype.connect = function (destination) {
        this.source.connect(destination);
    };
    Filter.prototype.disconnect = function () {
        this.source.disconnect();
    };
    Filter.prototype.destroy = function () {
        this.disconnect();
        this.destination = null;
        this.source = null;
    };
    return Filter;
}());
exports.default = Filter;

},{}],14:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Filter_1 = require("./Filter");
var index_1 = require("../index");
var ReverbFilter = (function (_super) {
    __extends(ReverbFilter, _super);
    function ReverbFilter(seconds, decay, reverse) {
        if (seconds === void 0) { seconds = 3; }
        if (decay === void 0) { decay = 2; }
        if (reverse === void 0) { reverse = false; }
        var _this = this;
        var convolver = index_1.default.context.audioContext.createConvolver();
        _this = _super.call(this, convolver) || this;
        _this._convolver = convolver;
        _this._seconds = _this._clamp(seconds, 1, 50);
        _this._decay = _this._clamp(decay, 0, 100);
        _this._reverse = reverse;
        _this._rebuild();
        return _this;
    }
    ReverbFilter.prototype._clamp = function (value, min, max) {
        return Math.min(max, Math.max(min, value));
    };
    Object.defineProperty(ReverbFilter.prototype, "seconds", {
        get: function () {
            return this._seconds;
        },
        set: function (seconds) {
            this._seconds = this._clamp(seconds, 1, 50);
            this._rebuild();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReverbFilter.prototype, "decay", {
        get: function () {
            return this._decay;
        },
        set: function (decay) {
            this._decay = this._clamp(decay, 0, 100);
            this._rebuild();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReverbFilter.prototype, "reverse", {
        get: function () {
            return this._reverse;
        },
        set: function (reverse) {
            this._reverse = reverse;
            this._rebuild();
        },
        enumerable: true,
        configurable: true
    });
    ReverbFilter.prototype._rebuild = function () {
        var context = index_1.default.context.audioContext;
        var rate = context.sampleRate;
        var length = rate * this._seconds;
        var impulse = context.createBuffer(2, length, rate);
        var impulseL = impulse.getChannelData(0);
        var impulseR = impulse.getChannelData(1);
        var n;
        for (var i = 0; i < length; i++) {
            n = this._reverse ? length - i : i;
            impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, this._decay);
            impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, this._decay);
        }
        this._convolver.buffer = impulse;
    };
    ReverbFilter.prototype.destroy = function () {
        this._convolver = null;
        _super.prototype.destroy.call(this);
    };
    return ReverbFilter;
}(Filter_1.default));
exports.default = ReverbFilter;

},{"../index":17,"./Filter":13}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Filter_1 = require("./Filter");
var index_1 = require("../index");
var StereoFilter = (function (_super) {
    __extends(StereoFilter, _super);
    function StereoFilter(pan) {
        if (pan === void 0) { pan = 0; }
        var _this = this;
        var stereo;
        var panner;
        var destination;
        var audioContext = index_1.default.context.audioContext;
        if (audioContext.createStereoPanner) {
            stereo = audioContext.createStereoPanner();
            destination = stereo;
        }
        else {
            panner = audioContext.createPanner();
            panner.panningModel = 'equalpower';
            destination = panner;
        }
        _this = _super.call(this, destination) || this;
        _this._stereo = stereo;
        _this._panner = panner;
        _this.pan = pan;
        return _this;
    }
    Object.defineProperty(StereoFilter.prototype, "pan", {
        get: function () {
            return this._pan;
        },
        set: function (value) {
            this._pan = value;
            if (this._stereo) {
                this._stereo.pan.value = value;
            }
            else {
                this._panner.setPosition(value, 0, 1 - Math.abs(value));
            }
        },
        enumerable: true,
        configurable: true
    });
    StereoFilter.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this._stereo = null;
        this._panner = null;
    };
    return StereoFilter;
}(Filter_1.default));
exports.default = StereoFilter;

},{"../index":17,"./Filter":13}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Filter_1 = require("./Filter");
exports.Filter = Filter_1.default;
var EqualizerFilter_1 = require("./EqualizerFilter");
exports.EqualizerFilter = EqualizerFilter_1.default;
var DistortionFilter_1 = require("./DistortionFilter");
exports.DistortionFilter = DistortionFilter_1.default;
var StereoFilter_1 = require("./StereoFilter");
exports.StereoFilter = StereoFilter_1.default;
var ReverbFilter_1 = require("./ReverbFilter");
exports.ReverbFilter = ReverbFilter_1.default;

},{"./DistortionFilter":11,"./EqualizerFilter":12,"./Filter":13,"./ReverbFilter":14,"./StereoFilter":15}],17:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LoaderMiddleware_1 = require("./LoaderMiddleware");
var SoundLibrary_1 = require("./SoundLibrary");
require("./deprecations");
var sound = new SoundLibrary_1.default();
if (global.PIXI === undefined) {
    throw new Error("pixi.js is required");
}
if (PIXI.loaders !== undefined) {
    LoaderMiddleware_1.install();
}
Object.defineProperty(PIXI, "sound", {
    get: function () { return sound; },
});
exports.default = sound;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./LoaderMiddleware":2,"./SoundLibrary":6,"./deprecations":10}],18:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],19:[function(require,module,exports){
(function (global){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection
var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef
  rng = function whatwgRNG() {
    crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

module.exports = rng;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],20:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":18,"./lib/rng":19}]},{},[17])(17)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvRmlsdGVyYWJsZS5qcyIsImxpYi9Mb2FkZXJNaWRkbGV3YXJlLmpzIiwibGliL1NvdW5kLmpzIiwibGliL1NvdW5kQ29udGV4dC5qcyIsImxpYi9Tb3VuZEluc3RhbmNlLmpzIiwibGliL1NvdW5kTGlicmFyeS5qcyIsImxpYi9Tb3VuZE5vZGVzLmpzIiwibGliL1NvdW5kU3ByaXRlLmpzIiwibGliL1NvdW5kVXRpbHMuanMiLCJsaWIvZGVwcmVjYXRpb25zLmpzIiwibGliL2ZpbHRlcnMvRGlzdG9ydGlvbkZpbHRlci5qcyIsImxpYi9maWx0ZXJzL0VxdWFsaXplckZpbHRlci5qcyIsImxpYi9maWx0ZXJzL0ZpbHRlci5qcyIsImxpYi9maWx0ZXJzL1JldmVyYkZpbHRlci5qcyIsImxpYi9maWx0ZXJzL1N0ZXJlb0ZpbHRlci5qcyIsImxpYi9maWx0ZXJzL2luZGV4LmpzIiwibGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL2J5dGVzVG9VdWlkLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL3JuZy1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvdjQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgRmlsdGVyYWJsZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlsdGVyYWJsZShpbnB1dCwgb3V0cHV0KSB7XG4gICAgICAgIHRoaXMuX291dHB1dCA9IG91dHB1dDtcbiAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEZpbHRlcmFibGUucHJvdG90eXBlLCBcImRlc3RpbmF0aW9uXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5wdXQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGaWx0ZXJhYmxlLnByb3RvdHlwZSwgXCJmaWx0ZXJzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmlsdGVycztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIGlmICh0aGlzLl9maWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsdGVycy5mb3JFYWNoKGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbHRlcnMgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuX2lucHV0LmNvbm5lY3QodGhpcy5fb3V0cHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJzICYmIGZpbHRlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsdGVycyA9IGZpbHRlcnMuc2xpY2UoMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5wdXQuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIHZhciBwcmV2RmlsdGVyXzEgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZpbHRlcnMuZm9yRWFjaChmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2RmlsdGVyXzEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9pbnB1dC5jb25uZWN0KGZpbHRlci5kZXN0aW5hdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2RmlsdGVyXzEuY29ubmVjdChmaWx0ZXIuZGVzdGluYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByZXZGaWx0ZXJfMSA9IGZpbHRlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBwcmV2RmlsdGVyXzEuY29ubmVjdCh0aGlzLl9vdXRwdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBGaWx0ZXJhYmxlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbnB1dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX291dHB1dCA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gRmlsdGVyYWJsZTtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBGaWx0ZXJhYmxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RmlsdGVyYWJsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4vaW5kZXhcIik7XG52YXIgQVVESU9fRVhURU5TSU9OUyA9IFtcIndhdlwiLCBcIm1wM1wiLCBcIm9nZ1wiLCBcIm9nYVwiLCBcIm00YVwiXTtcbmZ1bmN0aW9uIG1pZGRsZXdhcmUocmVzb3VyY2UsIG5leHQpIHtcbiAgICBpZiAocmVzb3VyY2UuZGF0YSAmJiBBVURJT19FWFRFTlNJT05TLmluZGV4T2YocmVzb3VyY2UuX2dldEV4dGVuc2lvbigpKSA+IC0xKSB7XG4gICAgICAgIHJlc291cmNlLnNvdW5kID0gaW5kZXhfMS5kZWZhdWx0LmFkZChyZXNvdXJjZS5uYW1lLCB7XG4gICAgICAgICAgICBsb2FkZWQ6IG5leHQsXG4gICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgc3JjQnVmZmVyOiByZXNvdXJjZS5kYXRhLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBtaWRkbGV3YXJlRmFjdG9yeSgpIHtcbiAgICByZXR1cm4gbWlkZGxld2FyZTtcbn1cbmZ1bmN0aW9uIGluc3RhbGwoKSB7XG4gICAgdmFyIFJlc291cmNlID0gUElYSS5sb2FkZXJzLlJlc291cmNlO1xuICAgIEFVRElPX0VYVEVOU0lPTlMuZm9yRWFjaChmdW5jdGlvbiAoZXh0KSB7XG4gICAgICAgIFJlc291cmNlLnNldEV4dGVuc2lvblhoclR5cGUoZXh0LCBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CVUZGRVIpO1xuICAgICAgICBSZXNvdXJjZS5zZXRFeHRlbnNpb25Mb2FkVHlwZShleHQsIFJlc291cmNlLkxPQURfVFlQRS5YSFIpO1xuICAgIH0pO1xuICAgIFBJWEkubG9hZGVycy5Mb2FkZXIuYWRkUGl4aU1pZGRsZXdhcmUobWlkZGxld2FyZUZhY3RvcnkpO1xuICAgIFBJWEkubG9hZGVyLnVzZShtaWRkbGV3YXJlKTtcbn1cbmV4cG9ydHMuaW5zdGFsbCA9IGluc3RhbGw7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Mb2FkZXJNaWRkbGV3YXJlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi9pbmRleFwiKTtcbnZhciBTb3VuZEluc3RhbmNlXzEgPSByZXF1aXJlKFwiLi9Tb3VuZEluc3RhbmNlXCIpO1xudmFyIFNvdW5kTm9kZXNfMSA9IHJlcXVpcmUoXCIuL1NvdW5kTm9kZXNcIik7XG52YXIgU291bmRTcHJpdGVfMSA9IHJlcXVpcmUoXCIuL1NvdW5kU3ByaXRlXCIpO1xudmFyIFNvdW5kID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZChjb250ZXh0LCBzb3VyY2UpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuc3JjID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICBvcHRpb25zLnNyY0J1ZmZlciA9IHNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBzb3VyY2U7XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgYXV0b1BsYXk6IGZhbHNlLFxuICAgICAgICAgICAgc2luZ2xlSW5zdGFuY2U6IGZhbHNlLFxuICAgICAgICAgICAgc3JjOiBudWxsLFxuICAgICAgICAgICAgc3JjQnVmZmVyOiBudWxsLFxuICAgICAgICAgICAgcHJlbG9hZDogZmFsc2UsXG4gICAgICAgICAgICB2b2x1bWU6IDEsXG4gICAgICAgICAgICBzcGVlZDogMSxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBudWxsLFxuICAgICAgICAgICAgbG9hZGVkOiBudWxsLFxuICAgICAgICAgICAgbG9vcDogZmFsc2UsXG4gICAgICAgICAgICB1c2VYSFI6IHRydWUsXG4gICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBuZXcgU291bmROb2Rlc18xLmRlZmF1bHQodGhpcy5fY29udGV4dCk7XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IHRoaXMuX25vZGVzLmJ1ZmZlclNvdXJjZTtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VzID0gW107XG4gICAgICAgIHRoaXMuX3Nwcml0ZXMgPSB7fTtcbiAgICAgICAgdmFyIGNvbXBsZXRlID0gb3B0aW9ucy5jb21wbGV0ZTtcbiAgICAgICAgdGhpcy5fYXV0b1BsYXlPcHRpb25zID0gY29tcGxldGUgPyB7IGNvbXBsZXRlOiBjb21wbGV0ZSB9IDogbnVsbDtcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF1dG9QbGF5ID0gb3B0aW9ucy5hdXRvUGxheTtcbiAgICAgICAgdGhpcy5zaW5nbGVJbnN0YW5jZSA9IG9wdGlvbnMuc2luZ2xlSW5zdGFuY2U7XG4gICAgICAgIHRoaXMucHJlbG9hZCA9IG9wdGlvbnMucHJlbG9hZCB8fCB0aGlzLmF1dG9QbGF5O1xuICAgICAgICB0aGlzLnNyYyA9IG9wdGlvbnMuc3JjO1xuICAgICAgICB0aGlzLnNyY0J1ZmZlciA9IG9wdGlvbnMuc3JjQnVmZmVyO1xuICAgICAgICB0aGlzLnVzZVhIUiA9IG9wdGlvbnMudXNlWEhSO1xuICAgICAgICB0aGlzLnZvbHVtZSA9IG9wdGlvbnMudm9sdW1lO1xuICAgICAgICB0aGlzLmxvb3AgPSBvcHRpb25zLmxvb3A7XG4gICAgICAgIHRoaXMuc3BlZWQgPSBvcHRpb25zLnNwZWVkO1xuICAgICAgICBpZiAob3B0aW9ucy5zcHJpdGVzKSB7XG4gICAgICAgICAgICB0aGlzLmFkZFNwcml0ZXMob3B0aW9ucy5zcHJpdGVzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcmVsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLl9iZWdpblByZWxvYWQob3B0aW9ucy5sb2FkZWQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFNvdW5kLmZyb20gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gbmV3IFNvdW5kKGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LCBvcHRpb25zKTtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9ub2Rlcy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuX25vZGVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMucmVtb3ZlU3ByaXRlcygpO1xuICAgICAgICB0aGlzLl9zcHJpdGVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5zcmNCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLl9yZW1vdmVJbnN0YW5jZXMoKTtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VzID0gbnVsbDtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiaXNQbGF5YWJsZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNMb2FkZWQgJiYgISF0aGlzLl9zb3VyY2UgJiYgISF0aGlzLl9zb3VyY2UuYnVmZmVyO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImNvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcInZvbHVtZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodm9sdW1lKSB7XG4gICAgICAgICAgICB0aGlzLl92b2x1bWUgPSB0aGlzLl9ub2Rlcy5nYWluLmdhaW4udmFsdWUgPSB2b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwibG9vcFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvdXJjZS5sb29wO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChsb29wKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UubG9vcCA9ICEhbG9vcDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJidWZmZXJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb3VyY2UuYnVmZmVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChidWZmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiZHVyYXRpb25cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KHRoaXMuaXNQbGF5YWJsZSwgXCJTb3VuZCBub3QgeWV0IHBsYXlhYmxlLCBubyBkdXJhdGlvblwiKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb3VyY2UuYnVmZmVyLmR1cmF0aW9uO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcIm5vZGVzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiZmlsdGVyc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzLmZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZpbHRlcnMgPSBmaWx0ZXJzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcInNwZWVkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5wbGF5YmFja1JhdGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJpbnN0YW5jZXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwic3ByaXRlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Nwcml0ZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kLnByb3RvdHlwZS5hZGRTcHJpdGVzID0gZnVuY3Rpb24gKHNvdXJjZSwgZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGFsaWFzIGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbYWxpYXNdID0gdGhpcy5hZGRTcHJpdGVzKGFsaWFzLCBzb3VyY2VbYWxpYXNdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KCF0aGlzLl9zcHJpdGVzW3NvdXJjZV0sIFwiQWxpYXMgXCIgKyBzb3VyY2UgKyBcIiBpcyBhbHJlYWR5IHRha2VuXCIpO1xuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IG5ldyBTb3VuZFNwcml0ZV8xLmRlZmF1bHQodGhpcywgZGF0YSk7XG4gICAgICAgICAgICB0aGlzLl9zcHJpdGVzW3NvdXJjZV0gPSBzcHJpdGU7XG4gICAgICAgICAgICByZXR1cm4gc3ByaXRlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUucmVtb3ZlU3ByaXRlcyA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICBpZiAoIWFsaWFzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lXzEgaW4gdGhpcy5fc3ByaXRlcykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlU3ByaXRlcyhuYW1lXzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IHRoaXMuX3Nwcml0ZXNbYWxpYXNdO1xuICAgICAgICAgICAgaWYgKHNwcml0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3ByaXRlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fc3ByaXRlc1thbGlhc107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uIChzb3VyY2UsIGNvbXBsZXRlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBvcHRpb25zO1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IHNvdXJjZTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNwcml0ZTogc3ByaXRlLCBjb21wbGV0ZTogY29tcGxldGUgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc291cmNlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgICAgIG9wdGlvbnMuY29tcGxldGUgPSBzb3VyY2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25zID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiBudWxsLFxuICAgICAgICAgICAgbG9hZGVkOiBudWxsLFxuICAgICAgICAgICAgc3ByaXRlOiBudWxsLFxuICAgICAgICAgICAgc3RhcnQ6IDAsXG4gICAgICAgICAgICBmYWRlSW46IDAsXG4gICAgICAgICAgICBmYWRlT3V0OiAwLFxuICAgICAgICB9LCBvcHRpb25zIHx8IHt9KTtcbiAgICAgICAgaWYgKG9wdGlvbnMuc3ByaXRlKSB7XG4gICAgICAgICAgICB2YXIgYWxpYXMgPSBvcHRpb25zLnNwcml0ZTtcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KCEhdGhpcy5fc3ByaXRlc1thbGlhc10sIFwiQWxpYXMgXCIgKyBhbGlhcyArIFwiIGlzIG5vdCBhdmFpbGFibGVcIik7XG4gICAgICAgICAgICB2YXIgc3ByaXRlID0gdGhpcy5fc3ByaXRlc1thbGlhc107XG4gICAgICAgICAgICBvcHRpb25zLnN0YXJ0ID0gc3ByaXRlLnN0YXJ0O1xuICAgICAgICAgICAgb3B0aW9ucy5lbmQgPSBzcHJpdGUuZW5kO1xuICAgICAgICAgICAgb3B0aW9ucy5zcGVlZCA9IHNwcml0ZS5zcGVlZDtcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLnNwcml0ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5vZmZzZXQpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuc3RhcnQgPSBvcHRpb25zLm9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuaXNMb2FkZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuYXV0b1BsYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIF90aGlzLl9hdXRvUGxheU9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgICAgICAgIF90aGlzLl9iZWdpblByZWxvYWQoZnVuY3Rpb24gKGVyciwgc291bmQsIGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkZWQoZXJyLCBzb3VuZCwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNpbmdsZUluc3RhbmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVJbnN0YW5jZXMoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5zdGFuY2UgPSBTb3VuZEluc3RhbmNlXzEuZGVmYXVsdC5jcmVhdGUodGhpcyk7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcy5wdXNoKGluc3RhbmNlKTtcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICBpbnN0YW5jZS5vbmNlKFwiZW5kXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jb21wbGV0ZShfdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5fb25Db21wbGV0ZShpbnN0YW5jZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpbnN0YW5jZS5vbmNlKFwic3RvcFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5fb25Db21wbGV0ZShpbnN0YW5jZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpbnN0YW5jZS5wbGF5KG9wdGlvbnMuc3RhcnQsIG9wdGlvbnMuZW5kLCBvcHRpb25zLnNwZWVkLCBvcHRpb25zLmxvb3AsIG9wdGlvbnMuZmFkZUluLCBvcHRpb25zLmZhZGVPdXQpO1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUGxheWFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1BsYXkgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2F1dG9QbGF5T3B0aW9ucyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0uc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0ucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIDtcbiAgICBTb3VuZC5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0ucGF1c2VkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoID4gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX2JlZ2luUHJlbG9hZCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodGhpcy5zcmMpIHtcbiAgICAgICAgICAgIHRoaXMudXNlWEhSID8gdGhpcy5fbG9hZFVybChjYWxsYmFjaykgOiB0aGlzLl9sb2FkUGF0aChjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5zcmNCdWZmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2RlY29kZSh0aGlzLnNyY0J1ZmZlciwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJzb3VuZC5zcmMgb3Igc291bmQuc3JjQnVmZmVyIG11c3QgYmUgc2V0XCIpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzb3VuZC5zcmMgb3Igc291bmQuc3JjQnVmZmVyIG11c3QgYmUgc2V0XCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX29uQ29tcGxldGUgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luc3RhbmNlcykge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5faW5zdGFuY2VzLmluZGV4T2YoaW5zdGFuY2UpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaXNQbGF5aW5nID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCA+IDA7XG4gICAgICAgIH1cbiAgICAgICAgaW5zdGFuY2UuZGVzdHJveSgpO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9yZW1vdmVJbnN0YW5jZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuX2luc3RhbmNlc1tpXS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5zdGFuY2VzLmxlbmd0aCA9IDA7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX2xvYWRVcmwgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgdmFyIHNyYyA9IHRoaXMuc3JjO1xuICAgICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgc3JjLCB0cnVlKTtcbiAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4gICAgICAgIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuc3JjQnVmZmVyID0gcmVxdWVzdC5yZXNwb25zZTtcbiAgICAgICAgICAgIF90aGlzLl9kZWNvZGUocmVxdWVzdC5yZXNwb25zZSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fbG9hZFBhdGggPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xuICAgICAgICB2YXIgc3JjID0gdGhpcy5zcmM7XG4gICAgICAgIGZzLnJlYWRGaWxlKHNyYywgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiRmlsZSBub3QgZm91bmQgXCIgKyBfdGhpcy5zcmMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGFycmF5QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGRhdGEubGVuZ3RoKTtcbiAgICAgICAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmlld1tpXSA9IGRhdGFbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5zcmNCdWZmZXIgPSBhcnJheUJ1ZmZlcjtcbiAgICAgICAgICAgIF90aGlzLl9kZWNvZGUoYXJyYXlCdWZmZXIsIGNhbGxiYWNrKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX2RlY29kZSA9IGZ1bmN0aW9uIChhcnJheUJ1ZmZlciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5fY29udGV4dC5kZWNvZGUoYXJyYXlCdWZmZXIsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIF90aGlzLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBfdGhpcy5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgIGlmIChfdGhpcy5hdXRvUGxheSkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IF90aGlzLnBsYXkoX3RoaXMuX2F1dG9QbGF5T3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBfdGhpcywgaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmQ7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEZpbHRlcmFibGVfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlcmFibGVcIik7XG52YXIgU291bmRDb250ZXh0ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoU291bmRDb250ZXh0LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFNvdW5kQ29udGV4dCgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGN0eCA9IG5ldyBTb3VuZENvbnRleHQuQXVkaW9Db250ZXh0KCk7XG4gICAgICAgIHZhciBnYWluID0gY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdmFyIGNvbXByZXNzb3IgPSBjdHguY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCk7XG4gICAgICAgIHZhciBhbmFseXNlciA9IGN0eC5jcmVhdGVBbmFseXNlcigpO1xuICAgICAgICBhbmFseXNlci5jb25uZWN0KGdhaW4pO1xuICAgICAgICBnYWluLmNvbm5lY3QoY29tcHJlc3Nvcik7XG4gICAgICAgIGNvbXByZXNzb3IuY29ubmVjdChjdHguZGVzdGluYXRpb24pO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGFuYWx5c2VyLCBnYWluKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5fY3R4ID0gY3R4O1xuICAgICAgICBfdGhpcy5fb2ZmbGluZUN0eCA9IG5ldyBTb3VuZENvbnRleHQuT2ZmbGluZUF1ZGlvQ29udGV4dCgxLCAyLCBjdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgIF90aGlzLl91bmxvY2tlZCA9IGZhbHNlO1xuICAgICAgICBfdGhpcy5nYWluID0gZ2FpbjtcbiAgICAgICAgX3RoaXMuY29tcHJlc3NvciA9IGNvbXByZXNzb3I7XG4gICAgICAgIF90aGlzLmFuYWx5c2VyID0gYW5hbHlzZXI7XG4gICAgICAgIF90aGlzLnZvbHVtZSA9IDE7XG4gICAgICAgIF90aGlzLm11dGVkID0gZmFsc2U7XG4gICAgICAgIF90aGlzLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3cgJiYgY3R4LnN0YXRlICE9PSBcInJ1bm5pbmdcIikge1xuICAgICAgICAgICAgX3RoaXMuX3VubG9jaygpO1xuICAgICAgICAgICAgX3RoaXMuX3VubG9jayA9IF90aGlzLl91bmxvY2suYmluZChfdGhpcyk7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIF90aGlzLl91bmxvY2ssIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgX3RoaXMuX3VubG9jaywgdHJ1ZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgX3RoaXMuX3VubG9jaywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBTb3VuZENvbnRleHQucHJvdG90eXBlLl91bmxvY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl91bmxvY2tlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGxheUVtcHR5U291bmQoKTtcbiAgICAgICAgaWYgKHRoaXMuX2N0eC5zdGF0ZSA9PT0gXCJydW5uaW5nXCIpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5fdW5sb2NrLCB0cnVlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLl91bmxvY2ssIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5fdW5sb2NrLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX3VubG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRDb250ZXh0LnByb3RvdHlwZS5wbGF5RW1wdHlTb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMuX2N0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICAgICAgc291cmNlLmJ1ZmZlciA9IHRoaXMuX2N0eC5jcmVhdGVCdWZmZXIoMSwgMSwgMjIwNTApO1xuICAgICAgICBzb3VyY2UuY29ubmVjdCh0aGlzLl9jdHguZGVzdGluYXRpb24pO1xuICAgICAgICBzb3VyY2Uuc3RhcnQoMCwgMCwgMCk7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LCBcIkF1ZGlvQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHdpbiA9IHdpbmRvdztcbiAgICAgICAgICAgIHJldHVybiAod2luLkF1ZGlvQ29udGV4dCB8fFxuICAgICAgICAgICAgICAgIHdpbi53ZWJraXRBdWRpb0NvbnRleHQgfHxcbiAgICAgICAgICAgICAgICBudWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dCwgXCJPZmZsaW5lQXVkaW9Db250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgd2luID0gd2luZG93O1xuICAgICAgICAgICAgcmV0dXJuICh3aW4uT2ZmbGluZUF1ZGlvQ29udGV4dCB8fFxuICAgICAgICAgICAgICAgIHdpbi53ZWJraXRPZmZsaW5lQXVkaW9Db250ZXh0IHx8XG4gICAgICAgICAgICAgICAgbnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kQ29udGV4dC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7XG4gICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgIGlmICh0eXBlb2YgY3R4LmNsb3NlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBjdHguY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFuYWx5c2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5nYWluLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5jb21wcmVzc29yLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5nYWluID0gbnVsbDtcbiAgICAgICAgdGhpcy5hbmFseXNlciA9IG51bGw7XG4gICAgICAgIHRoaXMuY29tcHJlc3NvciA9IG51bGw7XG4gICAgICAgIHRoaXMuX29mZmxpbmVDdHggPSBudWxsO1xuICAgICAgICB0aGlzLl9jdHggPSBudWxsO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwiYXVkaW9Db250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3R4O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJvZmZsaW5lQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29mZmxpbmVDdHg7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcIm11dGVkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbXV0ZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKG11dGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9tdXRlZCA9ICEhbXV0ZWQ7XG4gICAgICAgICAgICB0aGlzLmdhaW4uZ2Fpbi52YWx1ZSA9IHRoaXMuX211dGVkID8gMCA6IHRoaXMuX3ZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwidm9sdW1lXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdm9sdW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2b2x1bWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZvbHVtZSA9IHZvbHVtZTtcbiAgICAgICAgICAgIGlmICghdGhpcy5fbXV0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdhaW4uZ2Fpbi52YWx1ZSA9IHRoaXMuX3ZvbHVtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwicGF1c2VkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGF1c2VkO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChwYXVzZWQpIHtcbiAgICAgICAgICAgIGlmIChwYXVzZWQgJiYgdGhpcy5fY3R4LnN0YXRlID09PSBcInJ1bm5pbmdcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N0eC5zdXNwZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghcGF1c2VkICYmIHRoaXMuX2N0eC5zdGF0ZSA9PT0gXCJzdXNwZW5kZWRcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N0eC5yZXN1bWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3BhdXNlZCA9IHBhdXNlZDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRDb250ZXh0LnByb3RvdHlwZS50b2dnbGVNdXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm11dGVkID0gIXRoaXMubXV0ZWQ7XG4gICAgICAgIHJldHVybiB0aGlzLl9tdXRlZDtcbiAgICB9O1xuICAgIFNvdW5kQ29udGV4dC5wcm90b3R5cGUuZGVjb2RlID0gZnVuY3Rpb24gKGFycmF5QnVmZmVyLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLl9vZmZsaW5lQ3R4LmRlY29kZUF1ZGlvRGF0YShhcnJheUJ1ZmZlciwgZnVuY3Rpb24gKGJ1ZmZlcikge1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgYnVmZmVyKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiVW5hYmxlIHRvIGRlY29kZSBmaWxlXCIpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRDb250ZXh0O1xufShGaWx0ZXJhYmxlXzEuZGVmYXVsdCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmRDb250ZXh0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmRDb250ZXh0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaWQgPSAwO1xudmFyIFNvdW5kSW5zdGFuY2UgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTb3VuZEluc3RhbmNlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFNvdW5kSW5zdGFuY2UocGFyZW50KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmlkID0gaWQrKztcbiAgICAgICAgX3RoaXMuX3BhcmVudCA9IG51bGw7XG4gICAgICAgIF90aGlzLl9wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgX3RoaXMuX2VsYXBzZWQgPSAwO1xuICAgICAgICBfdGhpcy5faW5pdChwYXJlbnQpO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFNvdW5kSW5zdGFuY2UuY3JlYXRlID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICBpZiAoU291bmRJbnN0YW5jZS5fcG9vbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgc291bmQgPSBTb3VuZEluc3RhbmNlLl9wb29sLnBvcCgpO1xuICAgICAgICAgICAgc291bmQuX2luaXQocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU291bmRJbnN0YW5jZShwYXJlbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnRlcm5hbFN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChcInN0b3BcIik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCwgc3BlZWQsIGxvb3AsIGZhZGVJbiwgZmFkZU91dCkge1xuICAgICAgICBpZiAoZW5kKSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydChlbmQgPiBzdGFydCwgXCJFbmQgdGltZSBpcyBiZWZvcmUgc3RhcnQgdGltZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fc291cmNlID0gdGhpcy5fcGFyZW50Lm5vZGVzLmNsb25lQnVmZmVyU291cmNlKCk7XG4gICAgICAgIGlmIChzcGVlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3BlZWQgPSB0aGlzLl9zb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlO1xuICAgICAgICBpZiAobG9vcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9sb29wID0gdGhpcy5fc291cmNlLmxvb3AgPSAhIWxvb3A7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2xvb3AgJiYgZW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignTG9vcGluZyBub3Qgc3VwcG9ydCB3aGVuIHNwZWNpZnlpbmcgYW4gXCJlbmRcIiB0aW1lJyk7XG4gICAgICAgICAgICB0aGlzLl9sb29wID0gdGhpcy5fc291cmNlLmxvb3AgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9lbmQgPSBlbmQ7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IHRoaXMuX3NvdXJjZS5idWZmZXIuZHVyYXRpb247XG4gICAgICAgIGZhZGVJbiA9IHRoaXMuX3RvU2VjKGZhZGVJbik7XG4gICAgICAgIGlmIChmYWRlSW4gPiBkdXJhdGlvbikge1xuICAgICAgICAgICAgZmFkZUluID0gZHVyYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9sb29wKSB7XG4gICAgICAgICAgICBmYWRlT3V0ID0gdGhpcy5fdG9TZWMoZmFkZU91dCk7XG4gICAgICAgICAgICBpZiAoZmFkZU91dCA+IGR1cmF0aW9uIC0gZmFkZUluKSB7XG4gICAgICAgICAgICAgICAgZmFkZU91dCA9IGR1cmF0aW9uIC0gZmFkZUluO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2R1cmF0aW9uID0gZHVyYXRpb247XG4gICAgICAgIHRoaXMuX2ZhZGVJbiA9IGZhZGVJbjtcbiAgICAgICAgdGhpcy5fZmFkZU91dCA9IGZhZGVPdXQ7XG4gICAgICAgIHRoaXMuX2xhc3RVcGRhdGUgPSB0aGlzLl9ub3coKTtcbiAgICAgICAgdGhpcy5fZWxhcHNlZCA9IHN0YXJ0O1xuICAgICAgICB0aGlzLl9zb3VyY2Uub25lbmRlZCA9IHRoaXMuX29uQ29tcGxldGUuYmluZCh0aGlzKTtcbiAgICAgICAgaWYgKGVuZCkge1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLnN0YXJ0KDAsIHN0YXJ0LCBlbmQgLSBzdGFydCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uuc3RhcnQoMCwgc3RhcnQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW1pdChcInN0YXJ0XCIpO1xuICAgICAgICB0aGlzLl91cGRhdGUodHJ1ZSk7XG4gICAgICAgIHRoaXMuX2VuYWJsZWQgPSB0cnVlO1xuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuX3RvU2VjID0gZnVuY3Rpb24gKHRpbWUpIHtcbiAgICAgICAgaWYgKHRpbWUgPiAxMCkge1xuICAgICAgICAgICAgdGltZSAvPSAxMDAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aW1lIHx8IDA7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRJbnN0YW5jZS5wcm90b3R5cGUsIFwiX2VuYWJsZWRcIiwge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChlbmFibGVkKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5fcGFyZW50Lm5vZGVzLnNjcmlwdC5vbmF1ZGlvcHJvY2VzcyA9ICFlbmFibGVkID8gbnVsbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRJbnN0YW5jZS5wcm90b3R5cGUsIFwicHJvZ3Jlc3NcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wcm9ncmVzcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLCBcInBhdXNlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhdXNlZDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAocGF1c2VkKSB7XG4gICAgICAgICAgICBpZiAocGF1c2VkICE9PSB0aGlzLl9wYXVzZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXVzZWQgPSBwYXVzZWQ7XG4gICAgICAgICAgICAgICAgaWYgKHBhdXNlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcm5hbFN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwicGF1c2VkXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwicmVzdW1lZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KHRoaXMuX2VsYXBzZWQgJSB0aGlzLl9kdXJhdGlvbiwgdGhpcy5fZW5kLCB0aGlzLl9zcGVlZCwgdGhpcy5fbG9vcCwgdGhpcy5fZmFkZUluLCB0aGlzLl9mYWRlT3V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwicGF1c2VcIiwgcGF1c2VkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5faW50ZXJuYWxTdG9wKCk7XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NwZWVkID0gMDtcbiAgICAgICAgdGhpcy5fZW5kID0gMDtcbiAgICAgICAgdGhpcy5fcGFyZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZWxhcHNlZCA9IDA7XG4gICAgICAgIHRoaXMuX2R1cmF0aW9uID0gMDtcbiAgICAgICAgdGhpcy5fbG9vcCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9mYWRlSW4gPSAwO1xuICAgICAgICB0aGlzLl9mYWRlT3V0ID0gMDtcbiAgICAgICAgdGhpcy5fcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIGlmIChTb3VuZEluc3RhbmNlLl9wb29sLmluZGV4T2YodGhpcykgPCAwKSB7XG4gICAgICAgICAgICBTb3VuZEluc3RhbmNlLl9wb29sLnB1c2godGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJbU291bmRJbnN0YW5jZSBpZD1cIiArIHRoaXMuaWQgKyBcIl1cIjtcbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9ub3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuY29udGV4dC5hdWRpb0NvbnRleHQuY3VycmVudFRpbWU7XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24gKGZvcmNlKSB7XG4gICAgICAgIGlmIChmb3JjZSA9PT0gdm9pZCAwKSB7IGZvcmNlID0gZmFsc2U7IH1cbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdmFyIG5vdyA9IHRoaXMuX25vdygpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gbm93IC0gdGhpcy5fbGFzdFVwZGF0ZTtcbiAgICAgICAgICAgIGlmIChkZWx0YSA+IDAgfHwgZm9yY2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbGFwc2VkICs9IGRlbHRhO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RVcGRhdGUgPSBub3c7XG4gICAgICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gdGhpcy5fZHVyYXRpb247XG4gICAgICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gKCh0aGlzLl9lbGFwc2VkICogdGhpcy5fc3BlZWQpICUgZHVyYXRpb24pIC8gZHVyYXRpb247XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZhZGVJbiB8fCB0aGlzLl9mYWRlT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IHByb2dyZXNzICogZHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgIHZhciBnYWluID0gdGhpcy5fcGFyZW50Lm5vZGVzLmdhaW4uZ2FpbjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1heFZvbHVtZSA9IHRoaXMuX3BhcmVudC52b2x1bWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9mYWRlSW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA8PSB0aGlzLl9mYWRlSW4gJiYgcHJvZ3Jlc3MgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2Fpbi52YWx1ZSA9IG1heFZvbHVtZSAqIChwb3NpdGlvbiAvIHRoaXMuX2ZhZGVJbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYWluLnZhbHVlID0gbWF4Vm9sdW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZhZGVJbiA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZhZGVPdXQgJiYgcG9zaXRpb24gPj0gZHVyYXRpb24gLSB0aGlzLl9mYWRlT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGVyY2VudCA9IChkdXJhdGlvbiAtIHBvc2l0aW9uKSAvIHRoaXMuX2ZhZGVPdXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBnYWluLnZhbHVlID0gbWF4Vm9sdW1lICogcGVyY2VudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IHByb2dyZXNzO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChcInByb2dyZXNzXCIsIHRoaXMuX3Byb2dyZXNzLCBkdXJhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5faW50ZXJuYWxTdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uub25lbmRlZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX3BhcmVudC52b2x1bWUgPSB0aGlzLl9wYXJlbnQudm9sdW1lO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5fZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLm9uZW5kZWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3Byb2dyZXNzID0gMTtcbiAgICAgICAgdGhpcy5lbWl0KFwicHJvZ3Jlc3NcIiwgMSwgdGhpcy5fZHVyYXRpb24pO1xuICAgICAgICB0aGlzLmVtaXQoXCJlbmRcIiwgdGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRJbnN0YW5jZTtcbn0oUElYSS51dGlscy5FdmVudEVtaXR0ZXIpKTtcblNvdW5kSW5zdGFuY2UuX3Bvb2wgPSBbXTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kSW5zdGFuY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZEluc3RhbmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEZpbHRlcmFibGVfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlcmFibGVcIik7XG52YXIgZmlsdGVycyA9IHJlcXVpcmUoXCIuL2ZpbHRlcnNcIik7XG52YXIgU291bmRfMSA9IHJlcXVpcmUoXCIuL1NvdW5kXCIpO1xudmFyIFNvdW5kQ29udGV4dF8xID0gcmVxdWlyZShcIi4vU291bmRDb250ZXh0XCIpO1xudmFyIFNvdW5kSW5zdGFuY2VfMSA9IHJlcXVpcmUoXCIuL1NvdW5kSW5zdGFuY2VcIik7XG52YXIgU291bmRTcHJpdGVfMSA9IHJlcXVpcmUoXCIuL1NvdW5kU3ByaXRlXCIpO1xudmFyIFNvdW5kVXRpbHNfMSA9IHJlcXVpcmUoXCIuL1NvdW5kVXRpbHNcIik7XG52YXIgU291bmRMaWJyYXJ5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZExpYnJhcnkoKSB7XG4gICAgICAgIGlmICh0aGlzLnN1cHBvcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5fY29udGV4dCA9IG5ldyBTb3VuZENvbnRleHRfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc291bmRzID0ge307XG4gICAgICAgIHRoaXMudXRpbHMgPSBTb3VuZFV0aWxzXzEuZGVmYXVsdDtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gZmlsdGVycztcbiAgICAgICAgdGhpcy5Tb3VuZCA9IFNvdW5kXzEuZGVmYXVsdDtcbiAgICAgICAgdGhpcy5Tb3VuZEluc3RhbmNlID0gU291bmRJbnN0YW5jZV8xLmRlZmF1bHQ7XG4gICAgICAgIHRoaXMuU291bmRMaWJyYXJ5ID0gU291bmRMaWJyYXJ5O1xuICAgICAgICB0aGlzLlNvdW5kU3ByaXRlID0gU291bmRTcHJpdGVfMS5kZWZhdWx0O1xuICAgICAgICB0aGlzLkZpbHRlcmFibGUgPSBGaWx0ZXJhYmxlXzEuZGVmYXVsdDtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kTGlicmFyeS5wcm90b3R5cGUsIFwiY29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZExpYnJhcnkucHJvdG90eXBlLCBcImZpbHRlcnNBbGxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0LmZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQuZmlsdGVycyA9IGZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZExpYnJhcnkucHJvdG90eXBlLCBcInN1cHBvcnRlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFNvdW5kQ29udGV4dF8xLmRlZmF1bHQuQXVkaW9Db250ZXh0ICE9PSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChzb3VyY2UsIHNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuX2dldE9wdGlvbnMoc291cmNlW2FsaWFzXSwgc291cmNlT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1thbGlhc10gPSB0aGlzLmFkZChhbGlhcywgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc291cmNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydCghdGhpcy5fc291bmRzW3NvdXJjZV0sIFwiU291bmQgd2l0aCBhbGlhcyBcIiArIHNvdXJjZSArIFwiIGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VPcHRpb25zIGluc3RhbmNlb2YgU291bmRfMS5kZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc291bmRzW3NvdXJjZV0gPSBzb3VyY2VPcHRpb25zO1xuICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLl9nZXRPcHRpb25zKHNvdXJjZU9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHZhciBzb3VuZCA9IG5ldyBTb3VuZF8xLmRlZmF1bHQodGhpcy5jb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zb3VuZHNbc291cmNlXSA9IHNvdW5kO1xuICAgICAgICAgICAgICAgIHJldHVybiBzb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5fZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChzb3VyY2UsIG92ZXJyaWRlcykge1xuICAgICAgICB2YXIgb3B0aW9ucztcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyYzogc291cmNlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc291cmNlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyY0J1ZmZlcjogc291cmNlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25zID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKG9wdGlvbnMsIG92ZXJyaWRlcyB8fCB7fSk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICB0aGlzLmV4aXN0cyhhbGlhcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3NvdW5kc1thbGlhc10uZGVzdHJveSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRMaWJyYXJ5LnByb3RvdHlwZSwgXCJ2b2x1bWVBbGxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0LnZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodm9sdW1lKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0LnZvbHVtZSA9IHZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5wYXVzZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5wYXVzZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUucmVzdW1lQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9jb250ZXh0LnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUubXV0ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5tdXRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS51bm11dGVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgYWxpYXMgaW4gdGhpcy5fc291bmRzKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VuZHNbYWxpYXNdLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zb3VuZHNbYWxpYXNdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5zdG9wQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiB0aGlzLl9zb3VuZHMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdW5kc1thbGlhc10uc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5leGlzdHMgPSBmdW5jdGlvbiAoYWxpYXMsIGFzc2VydCkge1xuICAgICAgICBpZiAoYXNzZXJ0ID09PSB2b2lkIDApIHsgYXNzZXJ0ID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIGV4aXN0cyA9ICEhdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICAgICAgaWYgKGFzc2VydCkge1xuICAgICAgICAgICAgY29uc29sZS5hc3NlcnQoZXhpc3RzLCBcIk5vIHNvdW5kIG1hdGNoaW5nIGFsaWFzICdcIiArIGFsaWFzICsgXCInLlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhpc3RzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHRoaXMuZXhpc3RzKGFsaWFzLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NvdW5kc1thbGlhc107XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoYWxpYXMsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykucGxheShvcHRpb25zKTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5zdG9wKCk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpLnBhdXNlKCk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5yZXN1bWUoKTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUudm9sdW1lID0gZnVuY3Rpb24gKGFsaWFzLCB2b2x1bWUpIHtcbiAgICAgICAgdmFyIHNvdW5kID0gdGhpcy5maW5kKGFsaWFzKTtcbiAgICAgICAgaWYgKHZvbHVtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzb3VuZC52b2x1bWUgPSB2b2x1bWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNvdW5kLnZvbHVtZTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuZHVyYXRpb24gPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykuZHVyYXRpb247XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsKCk7XG4gICAgICAgIHRoaXMuX3NvdW5kcyA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kTGlicmFyeTtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTb3VuZExpYnJhcnk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZExpYnJhcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBGaWx0ZXJhYmxlXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJhYmxlXCIpO1xudmFyIFNvdW5kTm9kZXMgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTb3VuZE5vZGVzLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFNvdW5kTm9kZXMoY29udGV4dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgYXVkaW9Db250ZXh0ID0gY29udGV4dC5hdWRpb0NvbnRleHQ7XG4gICAgICAgIHZhciBidWZmZXJTb3VyY2UgPSBhdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIHZhciBzY3JpcHQgPSBhdWRpb0NvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yKFNvdW5kTm9kZXMuQlVGRkVSX1NJWkUpO1xuICAgICAgICB2YXIgZ2FpbiA9IGF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHZhciBhbmFseXNlciA9IGF1ZGlvQ29udGV4dC5jcmVhdGVBbmFseXNlcigpO1xuICAgICAgICBidWZmZXJTb3VyY2UuY29ubmVjdChhbmFseXNlcik7XG4gICAgICAgIGFuYWx5c2VyLmNvbm5lY3QoZ2Fpbik7XG4gICAgICAgIGdhaW4uY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgc2NyaXB0LmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgYW5hbHlzZXIsIGdhaW4pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICBfdGhpcy5idWZmZXJTb3VyY2UgPSBidWZmZXJTb3VyY2U7XG4gICAgICAgIF90aGlzLnNjcmlwdCA9IHNjcmlwdDtcbiAgICAgICAgX3RoaXMuZ2FpbiA9IGdhaW47XG4gICAgICAgIF90aGlzLmFuYWx5c2VyID0gYW5hbHlzZXI7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgU291bmROb2Rlcy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5zY3JpcHQuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdhaW4uZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmFuYWx5c2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5idWZmZXJTb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLnNjcmlwdCA9IG51bGw7XG4gICAgICAgIHRoaXMuZ2FpbiA9IG51bGw7XG4gICAgICAgIHRoaXMuYW5hbHlzZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIH07XG4gICAgU291bmROb2Rlcy5wcm90b3R5cGUuY2xvbmVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcmlnID0gdGhpcy5idWZmZXJTb3VyY2U7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIGNsb25lLmJ1ZmZlciA9IG9yaWcuYnVmZmVyO1xuICAgICAgICBjbG9uZS5wbGF5YmFja1JhdGUudmFsdWUgPSBvcmlnLnBsYXliYWNrUmF0ZS52YWx1ZTtcbiAgICAgICAgY2xvbmUubG9vcCA9IG9yaWcubG9vcDtcbiAgICAgICAgY2xvbmUuY29ubmVjdCh0aGlzLmRlc3RpbmF0aW9uKTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kTm9kZXM7XG59KEZpbHRlcmFibGVfMS5kZWZhdWx0KSk7XG5Tb3VuZE5vZGVzLkJVRkZFUl9TSVpFID0gMjU2O1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmROb2Rlcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kTm9kZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU291bmRTcHJpdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvdW5kU3ByaXRlKHBhcmVudCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IHRoaXMuZW5kIC0gdGhpcy5zdGFydDtcbiAgICAgICAgY29uc29sZS5hc3NlcnQodGhpcy5kdXJhdGlvbiA+IDAsIFwiRW5kIHRpbWUgbXVzdCBiZSBhZnRlciBzdGFydCB0aW1lXCIpO1xuICAgIH1cbiAgICBTb3VuZFNwcml0ZS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uIChjb21wbGV0ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQucGxheShPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcbiAgICAgICAgICAgIHNwZWVkOiB0aGlzLnNwZWVkIHx8IHRoaXMucGFyZW50LnNwZWVkLFxuICAgICAgICAgICAgZW5kOiB0aGlzLmVuZCxcbiAgICAgICAgICAgIHN0YXJ0OiB0aGlzLnN0YXJ0LFxuICAgICAgICB9KSk7XG4gICAgfTtcbiAgICBTb3VuZFNwcml0ZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kU3ByaXRlO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kU3ByaXRlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmRTcHJpdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdXVpZCA9IHJlcXVpcmUoXCJ1dWlkL3Y0XCIpO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi9pbmRleFwiKTtcbnZhciBTb3VuZF8xID0gcmVxdWlyZShcIi4vU291bmRcIik7XG52YXIgU291bmRVdGlscyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU291bmRVdGlscygpIHtcbiAgICB9XG4gICAgU291bmRVdGlscy5zaW5lVG9uZSA9IGZ1bmN0aW9uIChoZXJ0eiwgc2Vjb25kcykge1xuICAgICAgICBpZiAoaGVydHogPT09IHZvaWQgMCkgeyBoZXJ0eiA9IDIwMDsgfVxuICAgICAgICBpZiAoc2Vjb25kcyA9PT0gdm9pZCAwKSB7IHNlY29uZHMgPSAxOyB9XG4gICAgICAgIHZhciBzb3VuZENvbnRleHQgPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dDtcbiAgICAgICAgdmFyIHNvdW5kSW5zdGFuY2UgPSBuZXcgU291bmRfMS5kZWZhdWx0KHNvdW5kQ29udGV4dCwge1xuICAgICAgICAgICAgc2luZ2xlSW5zdGFuY2U6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgbkNoYW5uZWxzID0gMTtcbiAgICAgICAgdmFyIHNhbXBsZVJhdGUgPSA0ODAwMDtcbiAgICAgICAgdmFyIGFtcGxpdHVkZSA9IDI7XG4gICAgICAgIHZhciBidWZmZXIgPSBzb3VuZENvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlcihuQ2hhbm5lbHMsIHNlY29uZHMgKiBzYW1wbGVSYXRlLCBzYW1wbGVSYXRlKTtcbiAgICAgICAgdmFyIGZBcnJheSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0aW1lID0gaSAvIGJ1ZmZlci5zYW1wbGVSYXRlO1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gaGVydHogKiB0aW1lICogTWF0aC5QSTtcbiAgICAgICAgICAgIGZBcnJheVtpXSA9IE1hdGguc2luKGFuZ2xlKSAqIGFtcGxpdHVkZTtcbiAgICAgICAgfVxuICAgICAgICBzb3VuZEluc3RhbmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgc291bmRJbnN0YW5jZS5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBzb3VuZEluc3RhbmNlO1xuICAgIH07XG4gICAgU291bmRVdGlscy5yZW5kZXIgPSBmdW5jdGlvbiAoc291bmQsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgd2lkdGg6IDUxMixcbiAgICAgICAgICAgIGhlaWdodDogMTI4LFxuICAgICAgICAgICAgZmlsbDogXCJibGFja1wiLFxuICAgICAgICB9LCBvcHRpb25zIHx8IHt9KTtcbiAgICAgICAgY29uc29sZS5hc3NlcnQoISFzb3VuZC5idWZmZXIsIFwiTm8gYnVmZmVyIGZvdW5kLCBsb2FkIGZpcnN0XCIpO1xuICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgY2FudmFzLndpZHRoID0gb3B0aW9ucy53aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xuICAgICAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gb3B0aW9ucy5maWxsO1xuICAgICAgICB2YXIgZGF0YSA9IHNvdW5kLmJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcbiAgICAgICAgdmFyIHN0ZXAgPSBNYXRoLmNlaWwoZGF0YS5sZW5ndGggLyBvcHRpb25zLndpZHRoKTtcbiAgICAgICAgdmFyIGFtcCA9IG9wdGlvbnMuaGVpZ2h0IC8gMjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLndpZHRoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtaW4gPSAxLjA7XG4gICAgICAgICAgICB2YXIgbWF4ID0gLTEuMDtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3RlcDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdHVtID0gZGF0YVsoaSAqIHN0ZXApICsgal07XG4gICAgICAgICAgICAgICAgaWYgKGRhdHVtIDwgbWluKSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbiA9IGRhdHVtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGF0dW0gPiBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gZGF0dW07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdChpLCAoMSArIG1pbikgKiBhbXAsIDEsIE1hdGgubWF4KDEsIChtYXggLSBtaW4pICogYW1wKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFBJWEkuQmFzZVRleHR1cmUuZnJvbUNhbnZhcyhjYW52YXMpO1xuICAgIH07XG4gICAgU291bmRVdGlscy5wbGF5T25jZSA9IGZ1bmN0aW9uIChzcmMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhbGlhcyA9IHV1aWQoKTtcbiAgICAgICAgaW5kZXhfMS5kZWZhdWx0LmFkZChhbGlhcywge1xuICAgICAgICAgICAgc3JjOiBzcmMsXG4gICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgYXV0b1BsYXk6IHRydWUsXG4gICAgICAgICAgICBsb2FkZWQ6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhfMS5kZWZhdWx0LnJlbW92ZShhbGlhcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGluZGV4XzEuZGVmYXVsdC5yZW1vdmUoYWxpYXMpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsaWFzO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kVXRpbHM7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmRVdGlscztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kVXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU291bmRfMSA9IHJlcXVpcmUoXCIuL1NvdW5kXCIpO1xudmFyIFNvdW5kTGlicmFyeV8xID0gcmVxdWlyZShcIi4vU291bmRMaWJyYXJ5XCIpO1xudmFyIFNvdW5kTGlicmFyeVByb3RvdHlwZSA9IFNvdW5kTGlicmFyeV8xLmRlZmF1bHQucHJvdG90eXBlO1xudmFyIFNvdW5kUHJvdG90eXBlID0gU291bmRfMS5kZWZhdWx0LnByb3RvdHlwZTtcblNvdW5kTGlicmFyeVByb3RvdHlwZS5zb3VuZCA9IGZ1bmN0aW9uIHNvdW5kKGFsaWFzKSB7XG4gICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5zb3VuZCBpcyBkZXByZWNhdGVkLCB1c2UgUElYSS5zb3VuZC5maW5kXCIpO1xuICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpO1xufTtcblNvdW5kTGlicmFyeVByb3RvdHlwZS5wYW5uaW5nID0gZnVuY3Rpb24gcGFubmluZyhhbGlhcywgcGFubmluZ1ZhbHVlKSB7XG4gICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5wYW5uaW5nIGlzIGRlcHJlY2F0ZWQsIHVzZSBQSVhJLnNvdW5kLmZpbHRlcnMuU3RlcmVvUGFuXCIpO1xuICAgIHJldHVybiAwO1xufTtcblNvdW5kTGlicmFyeVByb3RvdHlwZS5hZGRNYXAgPSBmdW5jdGlvbiBhZGRNYXAobWFwLCBnbG9iYWxPcHRpb25zKSB7XG4gICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5hZGRNYXAgaXMgZGVwcmVjYXRlZCwgdXNlIFBJWEkuc291bmQuYWRkXCIpO1xuICAgIHJldHVybiB0aGlzLmFkZChtYXAsIGdsb2JhbE9wdGlvbnMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZExpYnJhcnlQcm90b3R5cGUsIFwiU291bmRVdGlsc1wiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlBJWEkuc291bmQuU291bmRVdGlscyBpcyBkZXByZWNhdGVkLCB1c2UgUElYSS5zb3VuZC51dGlsc1wiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudXRpbHM7XG4gICAgfSxcbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kUHJvdG90eXBlLCBcImJsb2NrXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5Tb3VuZC5wcm90b3R5cGUuYmxvY2sgaXMgZGVwcmVjYXRlZCwgdXNlIHNpbmdsZUluc3RhbmNlIGluc3RlYWRcIik7XG4gICAgICAgIHJldHVybiB0aGlzLnNpbmdsZUluc3RhbmNlO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5Tb3VuZC5wcm90b3R5cGUuYmxvY2sgaXMgZGVwcmVjYXRlZCwgdXNlIHNpbmdsZUluc3RhbmNlIGluc3RlYWRcIik7XG4gICAgICAgIHRoaXMuc2luZ2xlSW5zdGFuY2UgPSB2YWx1ZTtcbiAgICB9LFxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRQcm90b3R5cGUsIFwibG9hZGVkXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5Tb3VuZC5wcm90b3R5cGUubG9hZGVkIGlzIGRlcHJlY2F0ZWQsIHVzZSBjb25zdHJ1Y3RvciBvcHRpb24gaW5zdGVhZFwiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQSVhJLnNvdW5kLlNvdW5kLnByb3RvdHlwZS5sb2FkZWQgaXMgZGVwcmVjYXRlZCwgdXNlIGNvbnN0cnVjdG9yIG9wdGlvbiBpbnN0ZWFkXCIpO1xuICAgIH0sXG59KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZFByb3RvdHlwZSwgXCJjb21wbGV0ZVwiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlBJWEkuc291bmQuU291bmQucHJvdG90eXBlLmNvbXBsZXRlIGlzIGRlcHJlY2F0ZWQsIHVzZSBjb25zdHJ1Y3RvciBvcHRpb24gaW5zdGVhZFwiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQSVhJLnNvdW5kLlNvdW5kLnByb3RvdHlwZS5jb21wbGV0ZSBpcyBkZXByZWNhdGVkLCB1c2UgY29uc3RydWN0b3Igb3B0aW9uIGluc3RlYWRcIik7XG4gICAgfSxcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGVwcmVjYXRpb25zLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBEaXN0b3J0aW9uRmlsdGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRGlzdG9ydGlvbkZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBEaXN0b3J0aW9uRmlsdGVyKGFtb3VudCkge1xuICAgICAgICBpZiAoYW1vdW50ID09PSB2b2lkIDApIHsgYW1vdW50ID0gMDsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZGlzdG9ydGlvbiA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dC5jcmVhdGVXYXZlU2hhcGVyKCk7XG4gICAgICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgZGlzdG9ydGlvbikgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX2Rpc3RvcnRpb24gPSBkaXN0b3J0aW9uO1xuICAgICAgICBfdGhpcy5hbW91bnQgPSBhbW91bnQ7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERpc3RvcnRpb25GaWx0ZXIucHJvdG90eXBlLCBcImFtb3VudFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Ftb3VudDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhbHVlICo9IDEwMDA7XG4gICAgICAgICAgICB0aGlzLl9hbW91bnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHZhciBzYW1wbGVzID0gNDQxMDA7XG4gICAgICAgICAgICB2YXIgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KHNhbXBsZXMpO1xuICAgICAgICAgICAgdmFyIGRlZyA9IE1hdGguUEkgLyAxODA7XG4gICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICB2YXIgeDtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgc2FtcGxlczsgKytpKSB7XG4gICAgICAgICAgICAgICAgeCA9IGkgKiAyIC8gc2FtcGxlcyAtIDE7XG4gICAgICAgICAgICAgICAgY3VydmVbaV0gPSAoMyArIHZhbHVlKSAqIHggKiAyMCAqIGRlZyAvIChNYXRoLlBJICsgdmFsdWUgKiBNYXRoLmFicyh4KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9kaXN0b3J0aW9uLmN1cnZlID0gY3VydmU7XG4gICAgICAgICAgICB0aGlzLl9kaXN0b3J0aW9uLm92ZXJzYW1wbGUgPSAnNHgnO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBEaXN0b3J0aW9uRmlsdGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9kaXN0b3J0aW9uID0gbnVsbDtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gRGlzdG9ydGlvbkZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gRGlzdG9ydGlvbkZpbHRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURpc3RvcnRpb25GaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4uL2luZGV4XCIpO1xudmFyIEVxdWFsaXplckZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEVxdWFsaXplckZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBFcXVhbGl6ZXJGaWx0ZXIoZjMyLCBmNjQsIGYxMjUsIGYyNTAsIGY1MDAsIGYxaywgZjJrLCBmNGssIGY4aywgZjE2aykge1xuICAgICAgICBpZiAoZjMyID09PSB2b2lkIDApIHsgZjMyID0gMDsgfVxuICAgICAgICBpZiAoZjY0ID09PSB2b2lkIDApIHsgZjY0ID0gMDsgfVxuICAgICAgICBpZiAoZjEyNSA9PT0gdm9pZCAwKSB7IGYxMjUgPSAwOyB9XG4gICAgICAgIGlmIChmMjUwID09PSB2b2lkIDApIHsgZjI1MCA9IDA7IH1cbiAgICAgICAgaWYgKGY1MDAgPT09IHZvaWQgMCkgeyBmNTAwID0gMDsgfVxuICAgICAgICBpZiAoZjFrID09PSB2b2lkIDApIHsgZjFrID0gMDsgfVxuICAgICAgICBpZiAoZjJrID09PSB2b2lkIDApIHsgZjJrID0gMDsgfVxuICAgICAgICBpZiAoZjRrID09PSB2b2lkIDApIHsgZjRrID0gMDsgfVxuICAgICAgICBpZiAoZjhrID09PSB2b2lkIDApIHsgZjhrID0gMDsgfVxuICAgICAgICBpZiAoZjE2ayA9PT0gdm9pZCAwKSB7IGYxNmsgPSAwOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBlcXVhbGl6ZXJCYW5kcyA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjMyLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdsb3dzaGVsZicsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjMyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GNjQsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGY2NFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjEyNSxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjEyNVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjI1MCxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjI1MFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjUwMCxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjUwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjFLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmMWtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYySyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjJrXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GNEssXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGY0a1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjhLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmOGtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYxNkssXG4gICAgICAgICAgICAgICAgdHlwZTogJ2hpZ2hzaGVsZicsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjE2a1xuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICB2YXIgYmFuZHMgPSBlcXVhbGl6ZXJCYW5kcy5tYXAoZnVuY3Rpb24gKGJhbmQpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgICAgICBmaWx0ZXIudHlwZSA9IGJhbmQudHlwZTtcbiAgICAgICAgICAgIGZpbHRlci5nYWluLnZhbHVlID0gYmFuZC5nYWluO1xuICAgICAgICAgICAgZmlsdGVyLlEudmFsdWUgPSAxO1xuICAgICAgICAgICAgZmlsdGVyLmZyZXF1ZW5jeS52YWx1ZSA9IGJhbmQuZjtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXI7XG4gICAgICAgIH0pO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGJhbmRzWzBdLCBiYW5kc1tiYW5kcy5sZW5ndGggLSAxXSkgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuYmFuZHMgPSBiYW5kcztcbiAgICAgICAgX3RoaXMuYmFuZHNNYXAgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfdGhpcy5iYW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBfdGhpcy5iYW5kc1tpXTtcbiAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmJhbmRzW2kgLSAxXS5jb25uZWN0KG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuYmFuZHNNYXBbbm9kZS5mcmVxdWVuY3kudmFsdWVdID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIEVxdWFsaXplckZpbHRlci5wcm90b3R5cGUuc2V0R2FpbiA9IGZ1bmN0aW9uIChmcmVxdWVuY3ksIGdhaW4pIHtcbiAgICAgICAgaWYgKGdhaW4gPT09IHZvaWQgMCkgeyBnYWluID0gMDsgfVxuICAgICAgICBpZiAoIXRoaXMuYmFuZHNNYXBbZnJlcXVlbmN5XSkge1xuICAgICAgICAgICAgdGhyb3cgJ05vIGJhbmQgZm91bmQgZm9yIGZyZXF1ZW5jeSAnICsgZnJlcXVlbmN5O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFuZHNNYXBbZnJlcXVlbmN5XS5nYWluLnZhbHVlID0gZ2FpbjtcbiAgICB9O1xuICAgIEVxdWFsaXplckZpbHRlci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYmFuZHMuZm9yRWFjaChmdW5jdGlvbiAoYmFuZCkge1xuICAgICAgICAgICAgYmFuZC5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFcXVhbGl6ZXJGaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYmFuZHMuZm9yRWFjaChmdW5jdGlvbiAoYmFuZCkge1xuICAgICAgICAgICAgYmFuZC5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmJhbmRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5iYW5kc01hcCA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gRXF1YWxpemVyRmlsdGVyO1xufShGaWx0ZXJfMS5kZWZhdWx0KSk7XG5FcXVhbGl6ZXJGaWx0ZXIuRjMyID0gMzI7XG5FcXVhbGl6ZXJGaWx0ZXIuRjY0ID0gNjQ7XG5FcXVhbGl6ZXJGaWx0ZXIuRjEyNSA9IDEyNTtcbkVxdWFsaXplckZpbHRlci5GMjUwID0gMjUwO1xuRXF1YWxpemVyRmlsdGVyLkY1MDAgPSA1MDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjFLID0gMTAwMDtcbkVxdWFsaXplckZpbHRlci5GMksgPSAyMDAwO1xuRXF1YWxpemVyRmlsdGVyLkY0SyA9IDQwMDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjhLID0gODAwMDtcbkVxdWFsaXplckZpbHRlci5GMTZLID0gMTYwMDA7XG5leHBvcnRzLmRlZmF1bHQgPSBFcXVhbGl6ZXJGaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FcXVhbGl6ZXJGaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgRmlsdGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGaWx0ZXIoZGVzdGluYXRpb24sIHNvdXJjZSkge1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gZGVzdGluYXRpb247XG4gICAgICAgIHRoaXMuc291cmNlID0gc291cmNlIHx8IGRlc3RpbmF0aW9uO1xuICAgIH1cbiAgICBGaWx0ZXIucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAoZGVzdGluYXRpb24pIHtcbiAgICAgICAgdGhpcy5zb3VyY2UuY29ubmVjdChkZXN0aW5hdGlvbik7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc291cmNlLmRpc2Nvbm5lY3QoKTtcbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnNvdXJjZSA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gRmlsdGVyO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IEZpbHRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUZpbHRlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEZpbHRlcl8xID0gcmVxdWlyZShcIi4vRmlsdGVyXCIpO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi4vaW5kZXhcIik7XG52YXIgUmV2ZXJiRmlsdGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUmV2ZXJiRmlsdGVyLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJldmVyYkZpbHRlcihzZWNvbmRzLCBkZWNheSwgcmV2ZXJzZSkge1xuICAgICAgICBpZiAoc2Vjb25kcyA9PT0gdm9pZCAwKSB7IHNlY29uZHMgPSAzOyB9XG4gICAgICAgIGlmIChkZWNheSA9PT0gdm9pZCAwKSB7IGRlY2F5ID0gMjsgfVxuICAgICAgICBpZiAocmV2ZXJzZSA9PT0gdm9pZCAwKSB7IHJldmVyc2UgPSBmYWxzZTsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgY29udm9sdmVyID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUNvbnZvbHZlcigpO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGNvbnZvbHZlcikgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX2NvbnZvbHZlciA9IGNvbnZvbHZlcjtcbiAgICAgICAgX3RoaXMuX3NlY29uZHMgPSBfdGhpcy5fY2xhbXAoc2Vjb25kcywgMSwgNTApO1xuICAgICAgICBfdGhpcy5fZGVjYXkgPSBfdGhpcy5fY2xhbXAoZGVjYXksIDAsIDEwMCk7XG4gICAgICAgIF90aGlzLl9yZXZlcnNlID0gcmV2ZXJzZTtcbiAgICAgICAgX3RoaXMuX3JlYnVpbGQoKTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBSZXZlcmJGaWx0ZXIucHJvdG90eXBlLl9jbGFtcCA9IGZ1bmN0aW9uICh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJldmVyYkZpbHRlci5wcm90b3R5cGUsIFwic2Vjb25kc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NlY29uZHM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHNlY29uZHMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlY29uZHMgPSB0aGlzLl9jbGFtcChzZWNvbmRzLCAxLCA1MCk7XG4gICAgICAgICAgICB0aGlzLl9yZWJ1aWxkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZXZlcmJGaWx0ZXIucHJvdG90eXBlLCBcImRlY2F5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVjYXk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGRlY2F5KSB7XG4gICAgICAgICAgICB0aGlzLl9kZWNheSA9IHRoaXMuX2NsYW1wKGRlY2F5LCAwLCAxMDApO1xuICAgICAgICAgICAgdGhpcy5fcmVidWlsZCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmV2ZXJiRmlsdGVyLnByb3RvdHlwZSwgXCJyZXZlcnNlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmV2ZXJzZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAocmV2ZXJzZSkge1xuICAgICAgICAgICAgdGhpcy5fcmV2ZXJzZSA9IHJldmVyc2U7XG4gICAgICAgICAgICB0aGlzLl9yZWJ1aWxkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFJldmVyYkZpbHRlci5wcm90b3R5cGUuX3JlYnVpbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQuYXVkaW9Db250ZXh0O1xuICAgICAgICB2YXIgcmF0ZSA9IGNvbnRleHQuc2FtcGxlUmF0ZTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHJhdGUgKiB0aGlzLl9zZWNvbmRzO1xuICAgICAgICB2YXIgaW1wdWxzZSA9IGNvbnRleHQuY3JlYXRlQnVmZmVyKDIsIGxlbmd0aCwgcmF0ZSk7XG4gICAgICAgIHZhciBpbXB1bHNlTCA9IGltcHVsc2UuZ2V0Q2hhbm5lbERhdGEoMCk7XG4gICAgICAgIHZhciBpbXB1bHNlUiA9IGltcHVsc2UuZ2V0Q2hhbm5lbERhdGEoMSk7XG4gICAgICAgIHZhciBuO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuID0gdGhpcy5fcmV2ZXJzZSA/IGxlbmd0aCAtIGkgOiBpO1xuICAgICAgICAgICAgaW1wdWxzZUxbaV0gPSAoTWF0aC5yYW5kb20oKSAqIDIgLSAxKSAqIE1hdGgucG93KDEgLSBuIC8gbGVuZ3RoLCB0aGlzLl9kZWNheSk7XG4gICAgICAgICAgICBpbXB1bHNlUltpXSA9IChNYXRoLnJhbmRvbSgpICogMiAtIDEpICogTWF0aC5wb3coMSAtIG4gLyBsZW5ndGgsIHRoaXMuX2RlY2F5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb252b2x2ZXIuYnVmZmVyID0gaW1wdWxzZTtcbiAgICB9O1xuICAgIFJldmVyYkZpbHRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udm9sdmVyID0gbnVsbDtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gUmV2ZXJiRmlsdGVyO1xufShGaWx0ZXJfMS5kZWZhdWx0KSk7XG5leHBvcnRzLmRlZmF1bHQgPSBSZXZlcmJGaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1SZXZlcmJGaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4uL2luZGV4XCIpO1xudmFyIFN0ZXJlb0ZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFN0ZXJlb0ZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTdGVyZW9GaWx0ZXIocGFuKSB7XG4gICAgICAgIGlmIChwYW4gPT09IHZvaWQgMCkgeyBwYW4gPSAwOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzdGVyZW87XG4gICAgICAgIHZhciBwYW5uZXI7XG4gICAgICAgIHZhciBkZXN0aW5hdGlvbjtcbiAgICAgICAgdmFyIGF1ZGlvQ29udGV4dCA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dDtcbiAgICAgICAgaWYgKGF1ZGlvQ29udGV4dC5jcmVhdGVTdGVyZW9QYW5uZXIpIHtcbiAgICAgICAgICAgIHN0ZXJlbyA9IGF1ZGlvQ29udGV4dC5jcmVhdGVTdGVyZW9QYW5uZXIoKTtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uID0gc3RlcmVvO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFubmVyID0gYXVkaW9Db250ZXh0LmNyZWF0ZVBhbm5lcigpO1xuICAgICAgICAgICAgcGFubmVyLnBhbm5pbmdNb2RlbCA9ICdlcXVhbHBvd2VyJztcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uID0gcGFubmVyO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgZGVzdGluYXRpb24pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9zdGVyZW8gPSBzdGVyZW87XG4gICAgICAgIF90aGlzLl9wYW5uZXIgPSBwYW5uZXI7XG4gICAgICAgIF90aGlzLnBhbiA9IHBhbjtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RlcmVvRmlsdGVyLnByb3RvdHlwZSwgXCJwYW5cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYW47XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9wYW4gPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zdGVyZW8pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGVyZW8ucGFuLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYW5uZXIuc2V0UG9zaXRpb24odmFsdWUsIDAsIDEgLSBNYXRoLmFicyh2YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTdGVyZW9GaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLl9zdGVyZW8gPSBudWxsO1xuICAgICAgICB0aGlzLl9wYW5uZXIgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIFN0ZXJlb0ZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gU3RlcmVvRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3RlcmVvRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEZpbHRlcl8xID0gcmVxdWlyZShcIi4vRmlsdGVyXCIpO1xuZXhwb3J0cy5GaWx0ZXIgPSBGaWx0ZXJfMS5kZWZhdWx0O1xudmFyIEVxdWFsaXplckZpbHRlcl8xID0gcmVxdWlyZShcIi4vRXF1YWxpemVyRmlsdGVyXCIpO1xuZXhwb3J0cy5FcXVhbGl6ZXJGaWx0ZXIgPSBFcXVhbGl6ZXJGaWx0ZXJfMS5kZWZhdWx0O1xudmFyIERpc3RvcnRpb25GaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0Rpc3RvcnRpb25GaWx0ZXJcIik7XG5leHBvcnRzLkRpc3RvcnRpb25GaWx0ZXIgPSBEaXN0b3J0aW9uRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBTdGVyZW9GaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL1N0ZXJlb0ZpbHRlclwiKTtcbmV4cG9ydHMuU3RlcmVvRmlsdGVyID0gU3RlcmVvRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBSZXZlcmJGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL1JldmVyYkZpbHRlclwiKTtcbmV4cG9ydHMuUmV2ZXJiRmlsdGVyID0gUmV2ZXJiRmlsdGVyXzEuZGVmYXVsdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvYWRlck1pZGRsZXdhcmVfMSA9IHJlcXVpcmUoXCIuL0xvYWRlck1pZGRsZXdhcmVcIik7XG52YXIgU291bmRMaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi9Tb3VuZExpYnJhcnlcIik7XG5yZXF1aXJlKFwiLi9kZXByZWNhdGlvbnNcIik7XG52YXIgc291bmQgPSBuZXcgU291bmRMaWJyYXJ5XzEuZGVmYXVsdCgpO1xuaWYgKGdsb2JhbC5QSVhJID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwaXhpLmpzIGlzIHJlcXVpcmVkXCIpO1xufVxuaWYgKFBJWEkubG9hZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgTG9hZGVyTWlkZGxld2FyZV8xLmluc3RhbGwoKTtcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShQSVhJLCBcInNvdW5kXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNvdW5kOyB9LFxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBzb3VuZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIi8qKlxuICogQ29udmVydCBhcnJheSBvZiAxNiBieXRlIHZhbHVlcyB0byBVVUlEIHN0cmluZyBmb3JtYXQgb2YgdGhlIGZvcm06XG4gKiBYWFhYWFhYWC1YWFhYLVhYWFgtWFhYWC1YWFhYWFhYWFhYWFhcbiAqL1xudmFyIGJ5dGVUb0hleCA9IFtdO1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7ICsraSkge1xuICBieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xufVxuXG5mdW5jdGlvbiBieXRlc1RvVXVpZChidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwO1xuICB2YXIgYnRoID0gYnl0ZVRvSGV4O1xuICByZXR1cm4gYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ5dGVzVG9VdWlkO1xuIiwiLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIEluIHRoZVxuLy8gYnJvd3NlciB0aGlzIGlzIGEgbGl0dGxlIGNvbXBsaWNhdGVkIGR1ZSB0byB1bmtub3duIHF1YWxpdHkgb2YgTWF0aC5yYW5kb20oKVxuLy8gYW5kIGluY29uc2lzdGVudCBzdXBwb3J0IGZvciB0aGUgYGNyeXB0b2AgQVBJLiAgV2UgZG8gdGhlIGJlc3Qgd2UgY2FuIHZpYVxuLy8gZmVhdHVyZS1kZXRlY3Rpb25cbnZhciBybmc7XG5cbnZhciBjcnlwdG8gPSBnbG9iYWwuY3J5cHRvIHx8IGdsb2JhbC5tc0NyeXB0bzsgLy8gZm9yIElFIDExXG5pZiAoY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0byBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIHZhciBybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICBybmcgPSBmdW5jdGlvbiB3aGF0d2dSTkcoKSB7XG4gICAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhybmRzOCk7XG4gICAgcmV0dXJuIHJuZHM4O1xuICB9O1xufVxuXG5pZiAoIXJuZykge1xuICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXG4gIC8vXG4gIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gIC8vIHF1YWxpdHkuXG4gIHZhciBybmRzID0gbmV3IEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIHJuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJuZHM7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcm5nO1xuIiwidmFyIHJuZyA9IHJlcXVpcmUoJy4vbGliL3JuZycpO1xudmFyIGJ5dGVzVG9VdWlkID0gcmVxdWlyZSgnLi9saWIvYnl0ZXNUb1V1aWQnKTtcblxuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG5cbiAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGJ1ZiA9IG9wdGlvbnMgPT0gJ2JpbmFyeScgPyBuZXcgQXJyYXkoMTYpIDogbnVsbDtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgcm5kcyA9IG9wdGlvbnMucmFuZG9tIHx8IChvcHRpb25zLnJuZyB8fCBybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgKytpaSkge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IGJ5dGVzVG9VdWlkKHJuZHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHY0O1xuIl19
