var addSampleBtn = $("#add-sample");
var sampleList = $("#sample-list");
var outputLog = $("#error-log");

var noLog = false;

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

function print (msg) {
    if (noLog) return;
    var p = document.createElement("p");
    p.textContent = msg;
    outputLog.append(p);
    console.log(msg);
}

function warn (msg) {
    if (noLog) return;
    var p = document.createElement("p");
    p.style.color = "#ffa600";
    p.textContent = msg;
    outputLog.append(p);
    console.warn(msg);
}

var audioContext = new AudioContext();
var sampleRate = audioContext.sampleRate;

function timeCodeToSamples (code) {
    return (code.seconds + (60 * code.minutes) + (3600 * code.hours)) * sampleRate;
}

function parseTimeCode (code) {
    var time = { hours: 0, minutes: 0, seconds: 0 }, numbers = [];
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        if (/[0-9.]/g.test(char)) {
            numbers.push(char);
        } else if (/[hms]/g.test(char.toLowerCase())) {
            switch (char.toLowerCase()) {
                case "h":
                    time.hours = +(numbers.join(""));
                    numbers = [];
                    break;
                case "m":
                    time.minutes = +(numbers.join(""));
                    numbers = [];
                    break;
                case "s":
                    time.seconds = +(numbers.join(""));
                    numbers = [];
                    break;
                default: break;
            }
        }
    }
    console.log(time);
    return timeCodeToSamples(time);
}

addSampleBtn.on("click", () => {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.classList.add("audio-sample");
    inp.accept = "audio/*";
    var li = document.createElement("li");
    inp.addEventListener("contextmenu", (e) => {
        li.remove();
        e.preventDefault();
    });
    li.appendChild(inp);
    sampleList.append(li);
});

var scrambleBtn = $("#scramble-now");
var minSampLength = $("#min-cut-length");
var maxSampLength = $("#max-cut-length");
var reverseDiceSides = $("#revdice-sides");
var reverseDiceChance = $("#revdice-chance");
var channelReverseDiceSides = $("#chrev-sides");
var channelReverseDiceChance = $("#chrev-chance");

var audioLength = $("#min-audio-length");
var loopIter = $("#loop-iter");

if (localStorage.getItem("saved")) {
    minSampLength.val(localStorage.getItem("misamplen"));
    maxSampLength.val(localStorage.getItem("masamplen"));
    reverseDiceSides.val(localStorage.getItem("revdicesides"));
    reverseDiceChance.val(localStorage.getItem("revdicechance"));
    channelReverseDiceSides.val(localStorage.getItem("chrevdicesides"));
    channelReverseDiceChance.val(localStorage.getItem("chrevdicechance"));

    audioLength.val(localStorage.getItem("audlength"));
    loopIter.val(localStorage.getItem("loopiter"));
}

setInterval(() => {
    localStorage.setItem("misamplen", minSampLength.val());
    localStorage.setItem("masamplen", maxSampLength.val());
    localStorage.setItem("revdicesides", reverseDiceSides.val());
    localStorage.setItem("revdicechance", reverseDiceChance.val());
    localStorage.setItem("chrevdicesides", channelReverseDiceSides.val());
    localStorage.setItem("chrevdicechance", channelReverseDiceChance.val());

    localStorage.setItem("audlength", audioLength.val());
    localStorage.setItem("loopiter", loopIter.val());

    localStorage.setItem("saved", "1");
}, 1000);

function rollDice (sides, chance) {
    return irand(1, Math.abs(sides)) <= Math.abs(chance);
}

function shouldReverse () {
    return rollDice(+reverseDiceSides.val(), +reverseDiceChance.val());
};

async function readAudioDataFromElement (el) {
    return new Promise((resolve, reject) => {
        var file = el.files[0], reader = new FileReader();
        reader.onloadend = function () {
            audioContext.decodeAudioData(reader.result, (buffer) => {
                resolve(buffer);
            }, (e) => {
                reject("Decoding File Failed.");
            })
        };
        reader.onerror = function () {
            reject("Reading File Failed.");
        }
        reader.readAsArrayBuffer(file);
    });
};


var audio = {
    /** @param {AudioBuffer} aAudioBuffer */
    unmonoify: function (aAudioBuffer) {
        if (aAudioBuffer.numberOfChannels === 1) {
            warn("Detected mono file. Converting to stereo...");
            var nBuffer = audioContext.createBuffer(2, aAudioBuffer.length, aAudioBuffer.sampleRate);
            nBuffer.copyToChannel(aAudioBuffer.getChannelData(0), 0, 0);
            nBuffer.copyToChannel(aAudioBuffer.getChannelData(0), 1, 0);
            return nBuffer;
        }
        return aAudioBuffer;
    },
    /** @param {AudioBuffer} aAudioBuffer */
    getSamplesAt: function (aAudioBuffer, channel, offset, copyLength) {
        var nBuffer = audioContext.createBuffer(1, copyLength, aAudioBuffer.sampleRate);
        nBuffer.copyToChannel(aAudioBuffer.getChannelData(channel).slice(offset, offset + copyLength), 0, 0);
        return nBuffer;
    },
    /** @param {AudioBuffer} aAudioBuffer */
    reverse: function (aAudioBuffer, whatChannel) {
        var nBuffer = audioContext.createBuffer(1, aAudioBuffer.length, aAudioBuffer.sampleRate);
        nBuffer.copyToChannel(aAudioBuffer.getChannelData(whatChannel).reverse(), 0, 0);
        return nBuffer;
    },
    /** @param {AudioBuffer[]} buffers */
    mergeBuffers: function (buffers) {
        var nBuffer = audioContext.createBuffer(2, buffers[0].length, buffers[0].sampleRate);
        var leftChn = nBuffer.getChannelData(0);
        var rightChn = nBuffer.getChannelData(1);
        for (let i = 0; i < buffers.length; i++) {
            const buffer = buffers[i];
            let lBuffer = buffer.getChannelData(0);
            for (let k = 0; k < lBuffer.length; k++) {
                const sample = lBuffer[k];
                leftChn[k] = leftChn[k] + sample;
            }
            let rBuffer = buffer.getChannelData(1);
            for (let k = 0; k < rBuffer.length; k++) {
                const sample = rBuffer[k];
                rightChn[k] = rightChn[k] + sample;
            }
        }
        return nBuffer;
    },
    /** @param {AudioBuffer} aAudioBuffer */
    multiply: function (aAudioBuffer, multiplier) {
        var nBuffer = audioContext.createBuffer(aAudioBuffer.numberOfChannels, aAudioBuffer.length, aAudioBuffer.sampleRate);
        nBuffer.copyToChannel(aAudioBuffer.getChannelData(0).map(v => v * multiplier), 0, 0);
        if (nBuffer.numberOfChannels === 2) {
            nBuffer.copyToChannel(aAudioBuffer.getChannelData(1).map(v => v * multiplier), 1, 0);
        }
        return nBuffer;
    },
    /** @param {AudioBuffer} aAudioBuffer */
    panBuffer: function (aAudioBuffer, pan) {
        var leftUntouched = pan < 0;
        var nBuffer = audioContext.createBuffer(2, aAudioBuffer.length, aAudioBuffer.sampleRate);
        noLog = true;
        aAudioBuffer = audio.unmonoify(aAudioBuffer);
        noLog = false;
        if (leftUntouched) {
            nBuffer.copyToChannel(aAudioBuffer.getChannelData(0), 0, 0);
            var jBuffer = audioContext.createBuffer(1, aAudioBuffer.length, aAudioBuffer.sampleRate);
            jBuffer.copyToChannel(aAudioBuffer.getChannelData(1), 0, 0);
            nBuffer.copyToChannel(audio.multiply(jBuffer, (pan / 100) === 0 ? 1 : (pan / 100)).getChannelData(0), 1, 0);
        } else {
            pan = Math.abs(pan);
            nBuffer.copyToChannel(aAudioBuffer.getChannelData(1), 1, 0);
            var jBuffer = audioContext.createBuffer(1, aAudioBuffer.length, aAudioBuffer.sampleRate);
            jBuffer.copyToChannel(aAudioBuffer.getChannelData(0), 0, 0);
            nBuffer.copyToChannel(audio.multiply(jBuffer, (pan / 100) === 0 ? 1 : (pan / 100)).getChannelData(0), 0, 0);
        }
        return nBuffer;
    },
    /** @param {AudioBuffer} sourceBuffer @param {AudioBuffer} destBuffer */
    stereoCopy: function (sourceBuffer, destBuffer, destOffset) {
        destBuffer.copyToChannel(sourceBuffer.getChannelData(0), 0, destOffset);
        destBuffer.copyToChannel(sourceBuffer.getChannelData(1), 1, destOffset);
    }
}

async function grabSampleData () {
    var samples = document.querySelectorAll(".audio-sample");
    if (+samples.length == 0) {
        throw new Error("Couldn't find any samples in listing.");
    }
    var sampleDataList = [];
    for (let i = 0; i < samples.length; i++) {
        const sampleEl = samples.item(i);
        sampleDataList.push(await readAudioDataFromElement(sampleEl));
    }
    return sampleDataList.map(v => audio.unmonoify(v));
}

function playSample (aAudioBuffer) {
    var source = audioContext.createBufferSource();
    source.buffer = aAudioBuffer;
    source.connect(audioContext.destination);
    source.onended = function () {
        source.disconnect();
    };
    source.start(0);
};

scrambleBtn.on("click", async () => {
    try {
        audioContext.resume();
        var sampData = await grabSampleData();
        sampleRate = 0;
        sampData.forEach(v => {
            sampleRate = Math.max(v.sampleRate, sampleRate);
        });
        var sampLength = { min: parseTimeCode(minSampLength.val()), max: parseTimeCode(maxSampLength.val()) };
        var minAudioLength = parseTimeCode(audioLength.val());
        var buffers = [];

        for (let i = 0; i < +(loopIter.val()); i++) {
            let outBuffer = audioContext.createBuffer(2, minAudioLength, sampleRate), audioPointer = 0, startTime = Date.now();
            while ((audioPointer < minAudioLength) && (Date.now() - startTime) < 15000) {
                let clipDuration = irand(sampLength.min, sampLength.max);
                let sample = sampData[irand(0, sampData.length - 1)];

                let tBuffer = audio.getSamplesAt(sample, irand(0, 1), irand(0, sample.length - clipDuration), clipDuration);
                if (shouldReverse()) {
                    tBuffer = audio.reverse(tBuffer);
                }

                let panAmount = irand(-100, 100);

                let shouldChannelsReverse = rollDice(+channelReverseDiceSides.val(), +channelReverseDiceChance.val());

                if (shouldChannelsReverse) {
                    let whichToReverse = irand(0, 1);
                    if (whichToReverse === 1) {
                        outBuffer.copyToChannel(audio.reverse(tBuffer, 0).getChannelData(0), 1, audioPointer);
                        outBuffer.copyToChannel(tBuffer.getChannelData(0), 0, audioPointer);
                    } else {
                        outBuffer.copyToChannel(audio.reverse(tBuffer, 0).getChannelData(0), 0, audioPointer);
                        outBuffer.copyToChannel(tBuffer.getChannelData(0), 1, audioPointer);
                    }
                } else {
                    audio.stereoCopy(audio.panBuffer(tBuffer, panAmount), outBuffer, audioPointer);
                }
                audioPointer += clipDuration;
            }
            buffers.push(outBuffer);
        }

        console.log(buffers);

        var outBuffer = audio.mergeBuffers(buffers);
        
        saveAs(new Blob([ audioBufferToWav(outBuffer) ], { type: "audio/wav" }), "o" + Date.now() + ".wav");
    } catch (e) {
        console.log(e);
        var p = document.createElement("p");
        p.style.color = "red";
        p.textContent = e.toString();
        outputLog.append(p);
        return;
    }
    print("DONE");
});