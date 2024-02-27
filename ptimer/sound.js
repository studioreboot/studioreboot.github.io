class Sound {
    static LOADING = 1;
    static LOADED = 2;

    #config = {
        pitch: 1,
        volume: 100,
        pan: 0,
        doLoop: false,
        uponEnding: nop
    };

    constructor (audioUrl) {
        this.url = audioUrl;
        this.audioContext = new AudioContext();
        this.buffer = null;
        this.sourcePool = [];
        this.gainNode = null;
        this.pannerNode = null;
        this.loadStatus = Sound.LOADING;

        this.latestStamp = 0;

        this.lastPlayedSource = null;

        this.#config = {
            pitch: 1,
            volume: 100,
            pan: 0,
            doLoop: false,
            uponEnding: nop
        };
        
        this.load();
    }

    #removeFromPool (aSource) {
        try {
            aSource.stop();
        } catch (e) {};
        this.sourcePool.splice(this.sourcePool.indexOf(aSource), 1);
    }

    createNodes () {
        var ctx = this.audioContext, gain, stereoPanner;

        gain = ctx.createGain();
        stereoPanner = ctx.createStereoPanner();

        gain.connect(this.audioContext.destination);
        stereoPanner.connect(gain);

        return { gain, stereoPanner };
    }

    sourceWithId (sourceId) {
        return this.sourcePool.find(v => v.id === sourceId) || null;
    }

    load () {
        var req = new XMLHttpRequest(), self = this;
        if (/https:|http:/gi.test(this.url)) {
            req.open("GET", this.url, true);
        } else {
            req.open("GET", window.location.href.substring(0, window.location.href.lastIndexOf("/")) + "/" + this.url, true);
        }
        req.responseType = "arraybuffer";
        req.onload = function () {
            self.audioContext.decodeAudioData(req.response, (aBuffer) => {
                self.buffer = aBuffer;
                self.loadStatus = Sound.LOADED;
            });
        };
        req.send(null);
    }

    play (offset = 0, duration = -1) {
        var ctx = this.audioContext, source, whenEnd = this.#config.uponEnding;

        var nodes = this.createNodes();

        source = ctx.createBufferSource();
        source.buffer = this.buffer;
        source.id = Date.now();
        source.onended = () => {
            nodes.gain.disconnect();
            this.#removeFromPool(source);
            whenEnd();
            source.onended = null;
        };
        source.loop = this.#config.doLoop;
        source.detune.value = this.#config.pitch;

        source.pannerNode = nodes.stereoPanner;
        source.gainNode = nodes.gain;

        source.connect(nodes.stereoPanner);
        nodes.gain.connect(this.audioContext.destination);

        this.sourcePool.push(source);

        this.#applyConfigTo(source.id);

        source.start(this.audioContext.currentTime + 0.0001, offset, duration === -1 ? source.buffer.duration : duration);

        this.latestStamp = ctx.currentTime + 0.0001;

        this.lastPlayedSource = source;
    }

    pause () {
        this.audioContext.suspend();
    }

    resume () {
        this.audioContext.resume();
    }

    get currentTime () {
        return this.audioContext.currentTime - this.latestStamp;
    }

    stop (sourceId = -1) {
        if (sourceId === -1) {
            for (let i = 0; i < this.sourcePool.length; i++) {
                const source = this.sourcePool[i];
                this.#removeFromPool(source);
            }
        } else {
            var source = this.sourceWithId(sourceId);
            if (source) {
                this.#removeFromPool(source);
            }
        }
    }

    get volume () {
        return this.#config.volume;
    }

    /** when setting a property, make sure to call "applyTo" to apply to sources or a specific source */
    set volume (v) {
        this.#config.volume = Number(v);
    }

    get pitch () {
        return this.#config.pitch;
    }

    /** when setting a property, make sure to call ```"applyTo"``` to apply to sources or a specific source */
    set pitch (p) {
        this.#config.pitch = Number(p);
    }

    get loop () {
        return this.#config.doLoop;
    }

    /** when setting a property, make sure to call ```"applyTo"``` to apply to sources or a specific source */
    set loop (l) {
        this.#config.doLoop = Boolean(l);
    }

    get pan () {
        return this.#config.pan;
    }

    /** when setting a property, make sure to call ```"applyTo"``` to apply to sources or a specific source */
    set pan (p) {
        this.#config.p = Number(p);
    }

    get onended () {
        return this.#config.uponEnding;
    }

    /** when setting a property, make sure to call ```"applyTo"``` to apply to sources or a specific source */
    set onended (func) {
        this.#config.uponEnding = func;
    }

    applyTo (...sourceIds) {
        if (sourceIds.length > 0) {
            for (let i = 0; i < sourceIds.length; i++) {
                const id = sourceIds[i];
                this.#applyConfigTo(id);
            }
        } else {
            for (let i = 0; i < this.sourcePool.length; i++) {
                const id = this.sourcePool[i].id;
                this.#applyConfigTo(id);
            }
        }
    }

    #applyConfigTo (sourceId) {
        var source = this.sourceWithId(sourceId);

        source.gainNode.gain.value = this.#config.volume / 100;
        source.pannerNode.pan.value = this.#config.pan / 100;
        source.loop = this.#config.doLoop;
        source.detune.value = this.#config.pitch;

        var whenEnd = this.#config.uponEnding;

        source.onended = () => {
            source.gainNode.disconnect();
            this.#removeFromPool(source);
            whenEnd();
            source.onended = null;
        };
    }
}