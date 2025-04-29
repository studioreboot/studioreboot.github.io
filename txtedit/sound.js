function nop () {};

//////////////////////////////////////////////////
// Sound /////////////////////////////////////////
//////////////////////////////////////////////////

/*
    I am a wrapper for a AudioContext
    and a AudioBufferSourceNode.

    I hold a buffer that gets given
    to a fresh source node after it has
    been used up.

    After a source node has been fully
    used it will be replaced by a new one.

    The audio buffer which contains the
    sound never leaves.
*/

class Sound {
    constructor (source) {
        this._props = {
            volume: 1,
            pan: 0,
            pitch: 0,
            loop: false,
            playbackRate: 1,
            source: source
        };

        // audio nodes:
        this.context = new AudioContext();
        this.gain = null;
        this.panner = null;
        this.source = null;
        this.loaded = false;
        this.isPlaying = false;

        this.createNodes();
        this._requestFor(source);
    }

    // Sound copying:

    copy () {
        var sound = new Sound(this.src);
        sound.pitch = this.pitch;
        sound.volume = this.pitch;
        sound.pan = this.pan;
        sound.playbackRate = this.playbackRate;
        sound.loop = this.loop;
        return sound;
    }

    // Sound - configuration:

    _configure () {
        this.gain.gain.value = this._props.volume;
        this.panner.pan.value = this._props.pan;
        if (this.source) {
            this.source.detune.value = this._props.pitch;
            this.source.playbackRate.value = this._props.playbackRate;
            this.source.loop = this._props.loop;
        }
    }

    get duration () {
        return this.buffer ? this.buffer.duration : 0
    }

    get sampleRate () {
        return this.buffer ? this.buffer.sampleRate : 0
    }

    get volume () {
        return this._props.volume * 100;
    }

    set volume (v) {
        this._props.volume = v / 100;
        this._configure();
    }

    get pan () {
        return this._props.pan * 100;
    }

    set pan (v) {
        this._props.pan = v / 100;
        this._configure();
    }

    get pitch () {
        return this._props.pitch;
    }

    set pitch (v) {
        this._props.pitch = v;
        this._configure();
    }

    get playbackRate () {
        return this._props.playbackRate * 100;
    }

    set playbackRate (v) {
        this._props.playbackRate = v / 100;
        this._configure();
    }

    get loop () {
        return this._props.loop;
    }

    set loop (l) {
        this._props.loop = l;
        this._configure();
    }

    get src () {
        return this._props.source;
    }

    set src (v) {
        this._props.source = v;
        this._requestFor(v);
        this._configure();
    }

    // Sound - node creation:

    createNodes () {
        var ctx = this.context;

        this.gain = ctx.createGain();
        this.panner = ctx.createStereoPanner();

        this.panner.connect(this.gain);
        this.gain.connect(ctx.destination);
    }

    _requestFor (source) {
        this.loaded = false;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", source, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
            this.context.decodeAudioData(xhr.response).then(buffer => {
                this.buffer = buffer;
                this.loaded = true;
                this.createSource();
                if (this.onload) {
                    this.onload(this);
                }
            });
        };
        xhr.send(null);
    }

    createSource () {
        if (this.source && !this.source.hasPlayed) return;
        var ctx = this.context;

        if (this.source) {
            this.source.disconnect(this.panner);
            this.source = null;
        }

        this.source = ctx.createBufferSource();
        this.source.creationStamp = Date.now();
        this.source.buffer = this.buffer;
        this.source.hasPlayed = false;
        this._configure();

        this.source.connect(this.panner);
    }

    // Sound playing:

    play () {
        if (!this.source) return;
        if (this.source.hasPlayed) this.createSource();
        this.isPlaying = true;
        this.context.resume();
        this.source.start();
        this.source.hasPlayed = true;
        this.source.onended = () => {
            this.isPlaying = false;
            if (this.onended) {
                this.onended();
            }
            this.createSource();
        }
    }

    pause () {
        this.stop();
    }

    stop () {
        if (!this.source) return;
        try {
            this.isPlaying = false;
            this.source.stop();
            this.createSource();
            if (this.onended) {
                this.onended();
            }
        } catch (e) {
            nop(e);
        }
    }
}
