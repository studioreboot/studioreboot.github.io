// Microphone /////////////////////////////////////////////////////////

// I am a microphone and know about volume, note, pitch, as well as
// signals and frequencies.
// mostly meant to be a singleton of the stage
// I stop when I'm not queried something for 5 seconds
// to free up system resources
//
// modifying and metering output is currently experimental
// and only fully works in Chrome. Modifiers work in Firefox, but only with
// a significant lag, metering output is currently not supported by Firefox.
// Safari... well, let's not talk about Safari :-)

class Microphone {
    constructor () {
        // web audio components:
        this.audioContext = null; // shared with Note.prototype.audioContext
        this.sourceStream = null;
        this.processor = null;
        this.analyser = null;

        // parameters:
        this.resolution = 2;
        this.GOOD_ENOUGH_CORRELATION = 0.96;

        // modifier
        this.modifier = null;
        this.compiledModifier = null;
        this.compilerProcess = null;

        // memory alloc
        this.correlations = [];
        this.wrapper = [0];
        this.outChannels = [];

        // metered values:
        this.volume = 0;
        this.signals = [];
        this.output = [];
        this.frequencies = [];
        this.pitch = -1;

        // asynch control:
        this.isStarted = false;
        this.isReady = false;

        // idling control:
        this.isAutoStop = (location.protocol !== 'file:');
        this.lastTime = Date.now();
    }
    
    isOn () {
        if (this.isReady) {
            this.lastTime = Date.now();
            return true;
        }
        this.start();
        return false;
    }
    
    // Microphone resolution
    
    binSize () {
        return this.binSizes[this.resolution - 1];
    }
    
    setResolution (num) {
        if (contains([1, 2, 3, 4], num)) {
            if (this.isReady) {
                this.stop();
            }
            this.resolution = num;
        }
    }
    
    // Microphone ops

    start () {
        if (this.isStarted) { return; }
        this.isStarted = true;
        this.isReady = false;
        this.audioContext = new AudioContext();

        navigator.mediaDevices.getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }
        ).then(
            stream => this.setupNodes(stream)
        ).catch(nop);
    }

    stop () {
        this.processor.onaudioprocess = null;
        this.sourceStream.getTracks().forEach(track => track.stop());
        this.processor.disconnect();
        this.analyser.disconnect();
        this.processor = null;
        this.analyser = null;
        this.audioContext = null;
        this.isReady = false;
        this.isStarted = false;
    }
    
    // Microphone initialization
    
    setupNodes (stream) {
        this.sourceStream = stream;
        this.createProcessor();
        this.createAnalyser();
        this.analyser.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
        this.audioContext.createMediaStreamSource(stream).connect(this.analyser);
        this.lastTime = Date.now();
    }

    createAnalyser () {
        var bufLength;
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.binSizes[this.resolution];
        bufLength = this.analyser.frequencyBinCount;
        this.frequencies = new Uint8Array(bufLength);

        // setup pitch detection correlations:
        this.correlations = new Array(Math.floor(bufLength / 2));
    }

    createProcessor () {
        var myself = this;
        this.processor = this.audioContext.createScriptProcessor(
            this.binSizes[this.resolution - 1]
        );

        this.processor.onaudioprocess = function (event) {
            myself.stepAudio(event);
        };

        this.processor.clipping = false;
        this.processor.lastClip = 0;
        this.processor.clipLevel = 0.98;
        this.processor.averaging = 0.95;
        this.processor.clipLag = 750;
    }

    // Microphone stepping
    
    stepAudio (event) {
        var channels, i;
        if (this.isAutoStop &&
            ((Date.now() - this.lastTime) > 5000) &&
            !this.modifier) {
            this.stop();
            return;
        }

        // signals:
        this.signals = event.inputBuffer.getChannelData(0);

        // output:
        if (this.modifier) {
            channels = event.outputBuffer.numberOfChannels;
            if (this.outChannels.length !== channels) {
                this.outChannels = new Array(channels);
            }
            for (i = 0; i < channels; i += 1) {
                this.outChannels[i] = event.outputBuffer.getChannelData(i);
            }
            this.output = this.outChannels[0];
        } else {
            this.output = event.outputBuffer.getChannelData(0);
        }

        // frequency bins:
        this.analyser.getByteFrequencyData(this.frequencies);

        // pitch & volume:
        this.pitch = this.detectPitchAndVolume(
            this.signals,
            this.audioContext.sampleRate
        );

        // note:
        if (this.pitch > 0) {
            this.note = Math.round(
                12 * (Math.log(this.pitch / 440) / Math.log(2))
            ) + 69;
        }

        this.isReady = true;
        this.isStarted = false;
    }

    detectPitchAndVolume (buf, sampleRate) {
        // https://en.wikipedia.org/wiki/Autocorrelation
        // thanks to Chris Wilson:
        // https://plus.google.com/+ChrisWilson/posts/9zHsF9PCDAL
        // https://github.com/cwilso/PitchDetect/
        var SIZE = buf.length, MAX_SAMPLES = Math.floor(SIZE / 2), best_offset = -1,
            best_correlation = 0, rms = 0, foundGoodCorrelation = false, correlations = this.correlations,
            channels = this.outChannels.length, correlation, lastCorrelation, offset, shift, i, k, val, modified;

        for (i = 0; i < SIZE; i += 1) {
            val = buf[i];
            if (Math.abs(val) >= this.processor.clipLevel) {
                this.processor.clipping = true;
                this.processor.lastClip = window.performance.now();
            }
            rms += val * val;

            // apply modifier, if any
            if (this.modifier) {
                this.wrapper[0] = val;
                modified = invoke(
                    this.compiledModifier,
                    this.wrapper,
                    null,
                    null,
                    null,
                    null,
                    this.compilerProcess
                );
                for (k = 0; k < channels; k += 1) {
                    this.outChannels[k][i] = modified;
                }
            }
        }
        rms = Math.sqrt(rms / SIZE);
        this.volume = Math.max(rms, this.volume * this.processor.averaging);
        if (rms < 0.01)
            return this.pitch;

        lastCorrelation = 1;
        for (offset = 1; offset < MAX_SAMPLES; offset += 1) {
            correlation = 0;

            for (i = 0; i < MAX_SAMPLES; i += 1) {
                correlation += Math.abs((buf[i]) - (buf[i + offset]));
            }
            correlation = 1 - (correlation / MAX_SAMPLES);
            correlations[offset] = correlation;
            if ((correlation > this.GOOD_ENOUGH_CORRELATION)
                && (correlation > lastCorrelation)) {
                foundGoodCorrelation = true;
                if (correlation > best_correlation) {
                    best_correlation = correlation;
                    best_offset = offset;
                }
            } else if (foundGoodCorrelation) {
                shift = (correlations[best_offset + 1] -
                    correlations[best_offset - 1]) /
                    correlations[best_offset];
                return sampleRate / (best_offset + (8 * shift));
            }
            lastCorrelation = correlation;
        }
        if (best_correlation > 0.01) {
            return sampleRate / best_offset;
        }
        return this.pitch;
    }

    // Microphone shared properties
    
    binSizes = [256, 512, 1024, 2048, 4096];
}