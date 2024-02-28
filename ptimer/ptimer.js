function adjust (x, useHeight = false) {
    if (useHeight) {
        return (x / 599) * window.innerHeight;
    }
    return (x / 1366) * window.innerWidth;
};

function dateIs (month, date) {
    var dt = new Date();

    return ((dt.getMonth() + 1) === month) && dt.getDate() === date;
};

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

function ms (hour = 0, minute = 0, second = 0, millisecond = 0) {
    return (((hour * 60 * 60 * 1000) + (minute * 60 * 1000)) + (second * 1000)) + millisecond;
};

function msAt (hour = 0, minute = 0, second = 0, millisecond = 0) {
    var dt = new Date();
    dt.setHours(hour);
    dt.setMinutes(minute);
    dt.setSeconds(second, millisecond);
    return dt.getTime();
};

function time (ms) {
    return {
        seconds: (((ms / 1000) % 60)),
        minutes: (((ms / 60000) % 60)),
        hours: (((ms / 3600000) % 12))
    };
};

const tracks = [
    `Tommy Dorsey & His Orchestra - "I Guess I'll Have To Dream The Rest"\n(1941)`,
    `Roy Fox & His Orchestra - "Lullaby Of The Leaves" (1932)`,
    `Freddie Rich & His Orchestra - "I'm Wishing"\n(from the 1937 Walt Disney film "Snow White & the Seven Dwarfs")`,
    `George Olsen & His Music - "Lullaby Of The Leaves" (1932)`,
    `Ray Noble & His Orchestra - "It's All Forgotten Now" (1934)`,
    `Johnny Long & His Orchestra - "In The Middle Of May" (1940)`,
    `Ray Noble & His Orchestra - "Midnight, the Stars and You" (1934)\n(heard in the 1980 movie "The Shining")`,
    `Ray Noble & His Orchestra - "The Very Thought Of You" (1934)`,
    `Glenn Miller & His Orchestra - "In The Mood" (1939)\n(the title is an innuendo, in fact the word is an innuendo)`,
    `Sid Phillips & His Melodians - "Heartaches" (1931)\n(heard in the "Mr. Incredible" memes,\nyou know, when he turns more into a skeleton as time progresses.)`,
    `Glenn Miller & His Orchestra - "I Know Why (And So Do You)" (1941)\n(from "Sun Valley Serenade")`,
    `Layton & Johnstone - "The Wedding Of The Painted Doll" (1929)\n(the definition of the feeling "nobody's home, but i hear footsteps\noutside my door, and i don't like it.")`,
    /* `Pee Wee Hunt & His Orchestra - "Twelve Street Rag" (1948)\n("inspiration" of a theme heard in "Spongebob SquarePants")`, */
    `John Scott Trotter & His Orchestra - "Cloud Dreams" (1968)`,
    `Russ Morgan & His Orchestra - "Goodnight My Beautiful" (1937-38)\n(you might've heard this, depending on whether you have a life or not,\ni don't have one.)`,
    `Alex Mendham & His Orchestra - "Midnight, the Stars and You (2020)\n(in high fidelity, no this is not the one heard in\n"The Shining" you morons)`,
    `Ray Noble & His Orchestra - "This Is Romance" (1934)`,
    `Charlie Spivak & His Orchestra - "Time Alone Will Tell" (1944)`,
    `The Pied Pipers - "Alice Blue Gown" (1948)`
];

const BELL_DELAY = 48264;

var newNumber = irand(0, tracks.length - 1);

/** @param {XMLHttpRequest} anXMLHttpRequest */
function debugXHR (anXMLHttpRequest) {
    anXMLHttpRequest.addEventListener("readystatechange", (ev) => {
        console.log("XHR readyState has changed to " + anXMLHttpRequest.readyState);
    });
    anXMLHttpRequest.addEventListener("error", (ev) => {
        console.log("XHR request failed");
    });
}

function centerBetween (p1, p2) {
    return p1.add(p2.subtract(p1).divideBy(2));
};

function trand (min, max) {
    return new Promise((resolve, reject) => {
        var cancelOut = false;
        var xhr = new XMLHttpRequest();
        // debugXHR(xhr);
        xhr.open("GET", `https://www.random.org/integers/?num=1&min=${min}&max=${max}&format=plain&col=1&base=10&rnd=new`, true);
        xhr.onload = function () {
            if (!cancelOut) {
                resolve(+xhr.responseText);
            }
        };
        xhr.onerror = function () {
            if (!cancelOut) {
                resolve(irand(min, max));
            }
        };
        xhr.send(null);

        setTimeout(() => {
            cancelOut = true;
            resolve(irand(min, max));
        }, 2000);
    });
};

var version = 0, gotVersionYet = false,
    versionURL = "https://raw.githubusercontent.com/studioreboot/studioreboot.github.io/main/ptimer/version";

(function(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", versionURL, true);
    xhr.onload = function () {
        version = +xhr.responseText;
        gotVersionYet = true;
    };
    xhr.send(null);
})();

function checkVersion () {
    if (gotVersionYet) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", versionURL, true);
        xhr.onload = function () {
            if (+xhr.responseText > version) {
                window.location.reload();
            }
        };
        xhr.send(null);
    }
}

var rain = new Audio("rain.ogg");
rain.loop = true;
rain.volume = 0;

var bell = new Sound("bell.ogg");
bell.volume = 80;
bell.applyTo();

//////////////////////////////////////////////////////////
// PeriodTimerClock //////////////////////////////////////
//////////////////////////////////////////////////////////

class PTimerClockMorph extends ClockMorph {
    constructor () {
        super();

        this.deadline = Date.now() + 500000000;
    }

    get currentTime () {
        return this.deadline - Date.now();
    }
}

//////////////////////////////////////////////////////////
// PeriodTimerApp ////////////////////////////////////////
//////////////////////////////////////////////////////////

class PeriodTimerApp extends FrameMorph {
    constructor () {
        super();

        // additional properties:
        this.color = BLACK;
        this.nextTrack = 0;
        this.nextTrackAudio = null;
        this.nextTrackMeta = [];
        this.currentTrack = -1;
        this.currentTrackAudio = null;
        this.currentTrackMeta = [];
        this.copyNext = false;

        this.selectableTracks = [];
        this.tracksToBeUsedNext = [];
        this.index = 0;
        this.lyricalIndex = 0;

        this.trackProgramCounter = 0;

        //this.microphone = new Microphone();

        this.audioContext = new AudioContext();

        var tonight = new Date();

        tonight.setHours(11);
        tonight.setMinutes(59);

        this.deadlines = [
            msAt(7, 30),
            msAt(7, 50),
            msAt(8, 25),
            msAt(8, 50),
            msAt(9, 30),
            msAt(9, 33),
            msAt(10, 14),
            msAt(10, 16),
            msAt(10, 58),
            msAt(11, 0),
            msAt(11, 40),
            msAt(11, 43),
            msAt(12, 26),
            msAt(12, 28),
            msAt(13, 0),
            msAt(13, 40),
            msAt(14, 29),
            tonight.getMilliseconds()
        ];

        this.bellHits = [];

        for (let i = 0; i < this.deadlines.length; i++) {
            const deadline = this.deadlines[i];
            this.bellHits.push(deadline - BELL_DELAY);
        };

        this.bellIndex = 0;
        this.waitTime = false;
        this.testBell = false;
        this.isBellPlaying = false;
        this.analyserNode = null;

        this.periods = [
            "Arrival",
            "Period 1",
            "Trojan TV",
            "Period 2",
            "Transfer Time 1",
            "Period 3",
            "Transfer Time 2",
            "Period 4",
            "Transfer Time 3",
            "Period 5",
            "Transfer Time 4",
            "Period 6",
            "Transfer Time 5",
            "Lunch (7th & 8th)",
            "Transfer Time 6",
            "Period 8",
            "Transfer Time 7",
            "Period 9",
            "Dismissal"
        ];

        this.didCheckEvent = false;
        this.nextUpdateDeadline = Date.now() + 15000;
        this.doPause = false;
        this.volume = 0;
        this.isMuted = false;

        for (let i = 1; i < (tracks.length + 1); i++) {
            this.selectableTracks.push(i);
        }

        // things:
        this.clock = null;
        this.periodTitle = null;
        this.disableGainControl = false;

        this.didMakeThingsYet = false;
        this.canTapYet = false;

        this.songLoadedYet = false;

        //this.audioContext.resume();

        this.checkDidGetSongYet();

        this.createNodes();
        this.pickNextTrack();
    }

    checkDidGetSongYet () {
        if (this.songLoadedYet) {
            this.canTapYet = true;
        } else {
            setTimeout(() => {
                this.checkDidGetSongYet();
            }, 1000);
        }
    }

    developersMenu () {
        var menu = super.developersMenu();
        menu.addLine();
        menu.addItem(
            "test bell",
            () => {
                this.testBell = true;
            },
            "starts the bell sequence"
        );
        if (this.nextTrackAudio) {
            menu.addItem(
                "skip this track",
                () => {
                    this.currentTrackAudio.stop();
                },
                "skips the current track"
            );
        }
        menu.addItem(
            this.isMuted ? "unmute" : "mute",
            () => {
                this.isMuted = !this.isMuted;
                if (this.isMuted) {
                    this.gainNode.gain.value = 0;
                } else {
                    this.gainNode.gain.value = 0.25;
                }
            },
            `${this.isMuted ? "un" : ""}mutes the audio`
        );
        return menu;
    }

    showTapMenu () {
        var tappers = new TextMorph("tap here please.", adjust(36), "monospace");
        tappers.fontName = "Consolas";

        tappers.color = WHITE;
        tappers.center = this.center;
        this.tappers = tappers;
        
        this.add(this.tappers);
    }

    async pickNextTrack () {
        var idx = this.selectableTracks.length > 1 ? +(await trand(0, this.selectableTracks.length - 1)) : 0;

        this.tracksToBeUsedNext.push(this.selectableTracks[idx]);
        this.selectableTracks.splice(idx, 1);

        if (this.selectableTracks.length < 1) {
            this.selectableTracks = this.tracksToBeUsedNext.slice();
            this.tracksToBeUsedNext = [];
        }

        this.nextTrack = this.tracksToBeUsedNext[this.tracksToBeUsedNext.length - 1];

        this.loadNextTrack();
        // this.parseNextTrackMeta();
    }

    /** @param {CanvasRenderingContext2D} ctx */
    render (ctx) {
        super.render(ctx);

        /* if (this.didMakeThingsYet) {
            ctx.fillStyle = BLACK.lighter(15).toString();
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, adjust(500), 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        } */
    }

    createNodes () {
        var gain = this.audioContext.createGain(), analyzer;

        this.gainNode = gain;
        this.gainNode.connect(this.audioContext.destination);
        
        analyzer = this.audioContext.createAnalyser();
        analyzer.fftSize = 1024;

        this.analyserNode = analyzer;
        this.analyserNode.connect(this.gainNode);
    }

    loadNextTrack () {
        var ctx = this.audioContext, buffer, source,
            url = "tracks/bg" + this.nextTrack + (this.nextTrack < 10 ? ".wav" : ".ogg"),
            self = this;

        if ((this.nextTrack !== 12 && !this.disableGainControl) && !this.isMuted) {
            this.gainNode.gain.value = 0.25;
        };

        url = window.location.href.substring(0, window.location.href.lastIndexOf("/")) + "/" + url;

        console.log("fetching audio: " + url);
        
        var xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";
        xhr.open("GET", url, true);
        xhr.onload = function () {
            ctx.decodeAudioData(xhr.response, (aBuffer) => {
                buffer = aBuffer;
                source = ctx.createBufferSource();
                source.buffer = buffer;
                source.onended = function () {
                    source.disconnect();
                    self.currentTrack = -1;
                    self.currentTrackAudio = null;
                    setTimeout(() => {
                        self.playTrack();
                    }, 2000);
                    self.trackProgramCounter = 0;
                    self.updateUI();
                }
                source.connect(self.gainNode);
                self.nextTrackAudio = source;
                self.songLoadedYet = true;
                self.floatTimeDomain = self.analyserNode.getByteTimeDomainData(aBuffer);
                console.log("audio loaded: " + url);
            });
        };
        xhr.send(null);
    }

    openIn (aWorld) {
        aWorld.add(this);
        this.extent = aWorld.extent;
    
        this.showTapMenu();
    }

    reactToWorldResize (aRect) {
        this.extent = aRect.extent;
    }

    buildUI () {
        this.createClockAndPeriodTitle();
        this.createTrackDisplays();

        this.didMakeThingsYet = true;

        this.audioContext.resume();
        //this.microphone.start();

        setTimeout(() => {
            this.waitTime = true;
        }, 2500);
    }

    createClockAndPeriodTitle () {
        var clock, periodTitle, smallerText;

        clock = new PTimerClockMorph();
        clock.setRadius(adjust(270, true));
        clock.lineWidth = adjust(2.5);
        clock.handWidth = adjust(5, true);

        clock.center = this.center;

        periodTitle = new StringMorph("Period 1", adjust(48), "monospace");
        periodTitle.position = new Point(this.left + adjust(15), this.bottom + adjust(15));
        periodTitle.color = WHITE;

        smallerText = new StringMorph("", adjust(36, true), "monospace", false, false);
        smallerText.position = periodTitle.bottomRight.subtract(new Point(0, smallerText.height));
        smallerText.color = WHITE.darker(36);
        
        periodTitle.fontName = smallerText.fontName = "Consolas";

        this.clock = clock;
        this.periodTitle = periodTitle;
        this.periodDetails = smallerText;

        this.add(this.clock);
        this.add(this.periodTitle);
        this.add(this.periodDetails);
    }

    createTrackDisplays () {
        var trackDisplay, verse1, verse2;

        trackDisplay = new TextMorph("", adjust(24, true), "monospace", false, true, "center");
        trackDisplay.center = new Point(
            this.center.x,
            this.clock.top - ((this.top - this.clock.top) / 2)
        );
        trackDisplay.color = WHITE;
        trackDisplay.fontName = "Consolas";

        this.trackDisplay = trackDisplay;

        this.add(this.trackDisplay);

        verse1 = new TextMorph("", adjust(18, true), "monospace", null, null, "center", adjust(480));
        verse2 = new TextMorph("", adjust(18, true), "monospace", null, null, "center", adjust(480));
        verse1.fontName = verse2.fontName = "Consolas";

        verse1.color = verse2.color = WHITE;

        this.verse1 = verse1;
        this.verse2 = verse2;

        this.add(this.verse1);
        this.add(this.verse2);
    }

    incLyricalIndex () {
        this.lyricalIndex++;
        if (this.lyricalIndex > 2) {
            this.lyricalIndex = 1;
        }
    }

    mouseClickLeft () {
        if (this.tappers instanceof TextMorph && this.canTapYet) {
            this.tappers.destroy();
            this.tappers = null;

            this.audioContext.resume();

            this.buildUI();
            this.fixLayout();
            this.playTrack();
        } else {
            if (this.audioContext.state === "suspended") {
                this.audioContext.resume();
            } else {
                this.audioContext.suspend();
            }
        };
    }

    fixLayout () {
        if (this.tappers instanceof TextMorph) {
            this.tappers.center = this.center;
        }

        if (!this.didMakeThingsYet) return;

        var periodTitle = this.periodTitle, clock = this.clock,
            w = this.width, c = this.center, smallerText = this.periodDetails;

        clock.setRadius(adjust(270, true));
        clock.center = c.add(new Point(0, adjust(16)));
        clock.handWidth = adjust(5, true);

        periodTitle.position = new Point(
            this.left + adjust(30),
            this.bottom - periodTitle.height - adjust(15)
        );

        this.trackDisplay.fontSize = adjust(24, true);
        this.trackDisplay.rerender();
        this.trackDisplay.fixLayout();
        this.trackDisplay.changed();
        this.trackDisplay.center = new Point(
            c.x,
            this.clock.top - ((this.top - this.clock.top) / 2) - adjust(5, true)
        );

        smallerText.position = periodTitle.bottomRight.subtract(new Point(0, smallerText.height));

        this.verse1.center = new Point(w / 6, c.y);
        this.verse2.center = new Point(w - (w / 6), c.y);
    }

    fixVersePositions () {
        var w = this.width, c = this.center;

        this.verse1.center = new Point(w / 6, c.y);
        this.verse2.center = new Point(w - (w / 6), c.y);
    }

    updateUI () {
        this.periodTitle.text = this.periods[this.index-1] + " ";
        this.periodTitle.fixLayout();

        this.clock.deadline = this.deadlines[this.index];

        this.trackDisplay.text = this.currentTrack === -1 ? "" : "playing: " + tracks[this.currentTrack - 1];
        this.trackDisplay.fixLayout();

        this.fixLayout();
        this.changed();
    }

    setTrackText (nText) {
        if (this.trackDisplay.text !== nText) {
            this.trackDisplay.changed();
            this.trackDisplay.text = nText;
            this.trackDisplay.fixLayout();
            this.fixLayout();
            this.trackDisplay.fullChanged();
        }
    }

    step () {
        if (!this.didMakeThingsYet) return;

        var now = new Date(), self = this

        if (now >= this.deadlines[this.index] && this.index < this.deadlines.length) {
            this.index++;
            this.updateUI();
        };

        if ((now >= this.bellHits[this.bellIndex] && this.bellIndex < this.bellHits.length) || this.testBell) {
            this.bellIndex++;
            if (this.waitTime) {
                this.disableGainControl = true;
                this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.25);
                this.bellTextFade = false;
                setTimeout(() => {
                    this.isBellPlaying = true;
                    bell.play();
                    this.audioContext.suspend();
                    this.oldTrackText = this.trackDisplay.text;
                    bell.onended = function () {
                        setTimeout(() => {
                            self.trackDisplay.alpha = 1;
                            self.setTrackText(self.oldTrackText);
                            self.audioContext.resume();
                            self.gainNode.gain.linearRampToValueAtTime(0.25, self.audioContext.currentTime + 1.25);
                            setTimeout(() => {
                                self.disableGainControl = false;
                                self.isBellPlaying = false;
                            }, 1250);
                        }, 500);
                    };
                    bell.applyTo();
                }, 1250);
            }
            this.testBell = false;
        };

        if (this.isBellPlaying) {
            var time = bell.currentTime;
            if (time <= 0.403) {
                this.setTrackText(`"Oranges & Lemons" - a song telling the british topography.`);
            } else if (time <= 1.083) {
                this.setTrackText("Or-");
            } else if (time <= 1.688) {
                this.setTrackText("Orange");
            } else if (time <= 2.313) {
                this.setTrackText("Oranges");
            } else if (time <= 2.932) {
                this.setTrackText("Oranges &");
            } else if (time <= 3.557) {
                this.setTrackText("Oranges & Lemons,");
            } else if (time <= 3.945) {
                this.setTrackText("Oranges & Lemons,\nSay");
            } else if (time <= 4.232) {
                this.setTrackText("Oranges & Lemons,\nSay the");
            } else if (time <= 4.842) {
                this.setTrackText("Oranges & Lemons,\nSay the bells");
            } else if (time <= 5.497) {
                this.setTrackText("Oranges & Lemons,\nSay the bells of");
            } else if (time <= 6.137) {
                this.setTrackText("Oranges & Lemons,\nSay the bells of St.");
            } else if (time <= 6.787) {
                this.setTrackText("Oranges & Lemons,\nSay the bells of St. Clem-");
            } else if (time <= 8.077) {
                this.setTrackText("Oranges & Lemons,\nSay the bells of St. Clement's");
            } else if (time <= 8.092) {
                this.setTrackText("");
            } else if (time <= 8.767) {
                this.setTrackText("You");
            } else if (time <= 9.402) {
                this.setTrackText("You owe");
            } else if (time <= 10.047) {
                this.setTrackText("You owe me");
            } else if (time <= 10.692) {
                this.setTrackText("You owe me five");
            } else if (time <= 11.352) {
                this.setTrackText("You owe me five farthings!");
            } else if (time <= 11.699) {
                this.setTrackText("You owe me five farthings!\nSay");
            } else if (time <= 11.966) {
                this.setTrackText("You owe me five farthings!\nSay the");
            } else if (time <= 12.591) {
                this.setTrackText("You owe me five farthings!\nSay the bells");
            } else if (time <= 13.226) {
                this.setTrackText("You owe me five farthings!\nSay the bells of");
            } else if (time <= 13.906) {
                this.setTrackText("You owe me five farthings!\nSay the bells of St.");
            } else if (time <= 14.632) {
                this.setTrackText("You owe me five farthings!\nSay the bells of St. Martin's");
            } else if (time <= 15.937) {
                this.setTrackText("");
            } else if (time <= 16.622) {
                this.setTrackText("When");
            } else if (time <= 17.267) {
                this.setTrackText("When will");
            } else if (time <= 17.881) {
                this.setTrackText("When will you");
            } else if (time <= 18.582) {
                this.setTrackText("When will you pay");
            } else if (time <= 19.212) {
                this.setTrackText("When will you pay me?");
            } else if (time <= 19.554) {
                this.setTrackText("When will you pay me?\nSay");
            } else if (time <= 19.867) {
                this.setTrackText("When will you pay me?\nSay the");
            } else if (time <= 20.506) {
                this.setTrackText("When will you pay me?\nSay the bells");
            } else if (time <= 21.151) {
                this.setTrackText("When will you pay me?\nSay the bells at");
            } else if (time <= 21.821) {
                this.setTrackText("When will you pay me?\nSay the bells at Old");
            } else if (time <= 22.456) {
                this.setTrackText("When will you pay me?\nSay the bells at Old Bai-");
            } else if (time <= 22.769) {
                this.setTrackText("When will you pay me?\nSay the bells at Old Bailey");
            } else if (time <= 23.756) {
                this.setTrackText("");
            } else if (time <= 24.421) {
                this.setTrackText("When");
            } else if (time <= 25.051) {
                this.setTrackText("When I");
            } else if (time <= 25.716) {
                this.setTrackText("When I grow");
            } else if (time <= 26.411) {
                this.setTrackText("When I grow ri-");
            } else if (time <= 27.041) {
                this.setTrackText("When I grow rich,");
            } else if (time <= 27.394) {
                this.setTrackText("When I grow rich,\nSay");
            } else if (time <= 27.737) {
                this.setTrackText("When I grow rich,\nSay the");
            } else if (time <= 28.351) {
                this.setTrackText("When I grow rich,\nSay the bells");
            } else if (time <= 29.021) {
                this.setTrackText("When I grow rich,\nSay the bells at");
            } else if (time <= 29.686) {
                this.setTrackText("When I grow rich,\nSay the bells at Shore")
            } else if (time <= 30.936) {
                this.setTrackText("When I grow rich,\nSay the bells at Shoreditch");
            } else if (time <= 31.582) {
                this.setTrackText("*sending drums to Jesus,\nplease wait*")
            } else if (time <= 32.422) {
                this.setTrackText("When");
            } else if (time <= 33.067) {
                this.setTrackText("When will");
            } else if (time <= 33.717) {
                this.setTrackText("When will that");
            } else if (time <= 35.382) {
                this.setTrackText("When will that be?");
            } else if (time <= 35.802) {
                this.setTrackText("When will that be?\nSay");
            } else if (time <= 35.717) {
                this.setTrackText("When will that be?\nSay the");
            } else if (time <= 36.372) {
                this.setTrackText("When will that be?\nSay the bells");
            } else if (time <= 37.032) {
                this.setTrackText("When will that be?\nSay the bells of");
            } else if (time <= 37.642) {
                this.setTrackText("When will that be?\nSay the bells of St.");
            } else if (time <= 38.358) {
                this.setTrackText("When will that be?\nSay the bells of St. Dun");
            } else if (time <= 39.683) {
                this.setTrackText("When will that be?\nSay the bells of St. Dunstan's");
            } else if (time <= 40.433) {
                this.setTrackText("I");
            } else if (time <= 41.058) {
                this.setTrackText("I do");
            } else if (time <= 41.723) {
                this.setTrackText("I do not");
            } else if (time <= 42.378) {
                this.setTrackText("I do not k-");
            } else if (time <= 43.033) {
                this.setTrackText("I do not know.");
            } else if (time <= 43.401) {
                this.setTrackText("I do not know.\nSays");
            } else if (time <= 43.723) {
                this.setTrackText("I do not know.\nSays the");
            } else if (time <= 44.363) {
                this.setTrackText("I do not know.\nSays the great");
            } else if (time <= 45.028) {
                this.setTrackText("I do not know.\nSays the great bell");
            } else if (time <= 45.739) {
                this.setTrackText("I do not know.\nSays the great bell at");
            } else if (time <= 46.535) {
                this.setTrackText("I do not know.\nSays the great bell at Bow");
            } else if (time <= 46.641 && !this.bellTextFade) {
                this.trackDisplay.fadeTo(0, 350, "linear", () => {
                    this.trackDisplay.alpha = 0;
                    this.fullChanged();
                });
                this.bellTextFade = true;
            }
        }

        if (now >= this.nextUpdateDeadline) {
            this.nextUpdateDeadline = Date.now() + 2000;
            checkVersion();
        }

        var details = this.periodDetails,
            timeLeft = window.time(this.clock.deadline - now), current = new Date(), isAM = true, hours = current.getHours();
        
        if (current.getHours() >= 13) {
            isAM = false;
            hours -= 12;
        }

        details.text = `(${Math.floor(timeLeft.hours)}hr ${Math.floor(timeLeft.minutes)}m ${Math.floor(timeLeft.seconds)}s) [${hours}:${current.getMinutes() < 10 ?  "0" + current.getMinutes() : current.getMinutes()} ${isAM ? "AM" : "PM"}]`;

        details.rerender();
        details.fixLayout();
        details.changed();

        /* if (this.currentTrackAudio instanceof Audio && this.verse1 && this.verse2) {
            var event = this.currentTrackMeta[this.trackProgramCounter];
            var next = this.currentTrackMeta[this.trackProgramCounter+1];

            if (!this.didCheckEvent) {
                this.didCheckEvent = true;
                switch (event.type) {
                    case 1:
                        if (this.copyNext) {
                            for (let i = 0; i < 2; i++) {
                                this.incLyricalIndex();
                                let verse = this[`verse${this.lyricalIndex}`];
                                verse.text = event.text;
                                verse.show();
                                verse.rerender();
                                verse.fixLayout();
                                verse.changed();
                            }
                            this.copyNext = false;
                        } else {
                            this.incLyricalIndex();
                            let verse = this[`verse${this.lyricalIndex}`];
                            verse.text = event.text;
                            verse.show();
                            verse.rerender();
                            verse.fixLayout();
                            verse.changed();
                        }
                        this.fixVersePositions();
                        break;
                    case 2:
                        this.verse1.text = this.verse2.text = "";
                        this.verse1.hide();
                        this.verse2.hide();
                        break;
                    case 3:
                        this.copyNext = true;
                        break;
                    default: break;
                }
                this.didCheckEvent = true;
            }

            if (!isNil(next) && next.at < this.currentTrackAudio.currentTime) {
                this.trackProgramCounter++;
                this.didCheckEvent = false;
            }
        } */
    }

    playTrack () {
        this.currentTrackAudio = this.nextTrackAudio;
        this.currentTrack = this.nextTrack;
        this.currentTrackMeta = this.nextTrackMeta;

        this.nextTrack = this.nextTrackAudio = this.nextTrackMeta = null;

        this.currentTrackAudio.start();

        this.pickNextTrack();

        this.updateUI();
    }

    parseNextTrackMeta () {
        var xhr = new XMLHttpRequest(), self = this, meta = [];
        xhr.open("GET", window.location.href.substring(0, window.location.href.lastIndexOf("/")) + "/tracks/bg" + (this.nextTrack) + ".meta", true);
        xhr.onload = function () {
            if (xhr.responseText.indexOf("html") !== -1) {
                meta.push({ at: 0, type: 2 });
            } else {
                var res = xhr.responseText.split("\n");
                for (let i = 0; i < res.length; i++) {
                    let line = res[i].split(" ");
                    let time = line.shift();
                    line = line.join(" ").replaceAll("\r", "");

                    switch (line) {
                        case "CLEAR":
                            meta.push({ at: +time, type: 2 });
                            break;
                        case "COPY":
                            meta.push({ at: +time, type: 3 });
                            break;
                        default:
                            meta.push({ at: +time, type: 1, text: line || "" });
                            break;
                    }
                }
            }
            self.nextTrackMeta = meta;
        };
        xhr.send(null);
    }
};

//////////////////////////////////////////////////////////
// BellLyricalMorph //////////////////////////////////////
//////////////////////////////////////////////////////////

class BellLyricalMorph {
    constructor (aPeriodTimerMorph) {
        this.periodTimerMorph = aPeriodTimerMorph;

        this.color = new Color(18, 18, 18);
        this.lyricalText = null;
    }

    createLyricalText () {
        
    }

    step () {
        var time = bell.currentTime;
        if (time <= 0.403) {
            this.setTrackText(`"Oranges & Lemons" - a song telling the british topography.`);
        } else if (time <= 1.083) {
            this.setTrackText("Or-");
        } else if (time <= 1.688) {
            this.setTrackText("Orange");
        } else if (time <= 2.313) {
            this.setTrackText("Oranges");
        } else if (time <= 2.932) {
            this.setTrackText("Oranges &");
        } else if (time <= 3.557) {
            this.setTrackText("Oranges & Lemons,");
        } else if (time <= 3.945) {
            this.setTrackText("Oranges & Lemons,\nSay");
        } else if (time <= 4.232) {
            this.setTrackText("Oranges & Lemons,\nSay the");
        } else if (time <= 4.842) {
            this.setTrackText("Oranges & Lemons,\nSay the bells");
        } else if (time <= 5.497) {
            this.setTrackText("Oranges & Lemons,\nSay the bells of");
        } else if (time <= 6.137) {
            this.setTrackText("Oranges & Lemons,\nSay the bells of St.");
        } else if (time <= 6.787) {
            this.setTrackText("Oranges & Lemons,\nSay the bells of St. Clem-");
        } else if (time <= 8.077) {
            this.setTrackText("Oranges & Lemons,\nSay the bells of St. Clement's");
        } else if (time <= 8.092) {
            this.setTrackText("");
        } else if (time <= 8.767) {
            this.setTrackText("You");
        } else if (time <= 9.402) {
            this.setTrackText("You owe");
        } else if (time <= 10.047) {
            this.setTrackText("You owe me");
        } else if (time <= 10.692) {
            this.setTrackText("You owe me five");
        } else if (time <= 11.352) {
            this.setTrackText("You owe me five farthings!");
        } else if (time <= 11.699) {
            this.setTrackText("You owe me five farthings!\nSay");
        } else if (time <= 11.966) {
            this.setTrackText("You owe me five farthings!\nSay the");
        } else if (time <= 12.591) {
            this.setTrackText("You owe me five farthings!\nSay the bells");
        } else if (time <= 13.226) {
            this.setTrackText("You owe me five farthings!\nSay the bells of");
        } else if (time <= 13.906) {
            this.setTrackText("You owe me five farthings!\nSay the bells of St.");
        } else if (time <= 14.632) {
            this.setTrackText("You owe me five farthings!\nSay the bells of St. Martin's");
        } else if (time <= 15.937) {
            this.setTrackText("");
        } else if (time <= 16.622) {
            this.setTrackText("When");
        } else if (time <= 17.267) {
            this.setTrackText("When will");
        } else if (time <= 17.881) {
            this.setTrackText("When will you");
        } else if (time <= 18.582) {
            this.setTrackText("When will you pay");
        } else if (time <= 19.212) {
            this.setTrackText("When will you pay me?");
        } else if (time <= 19.554) {
            this.setTrackText("When will you pay me?\nSay");
        } else if (time <= 19.867) {
            this.setTrackText("When will you pay me?\nSay the");
        } else if (time <= 20.506) {
            this.setTrackText("When will you pay me?\nSay the bells");
        } else if (time <= 21.151) {
            this.setTrackText("When will you pay me?\nSay the bells at");
        } else if (time <= 21.821) {
            this.setTrackText("When will you pay me?\nSay the bells at Old");
        } else if (time <= 22.456) {
            this.setTrackText("When will you pay me?\nSay the bells at Old Bai-");
        } else if (time <= 22.769) {
            this.setTrackText("When will you pay me?\nSay the bells at Old Bailey");
        } else if (time <= 23.756) {
                this.setTrackText("");
        } else if (time <= 24.421) {
            this.setTrackText("When");
        } else if (time <= 25.051) {
            this.setTrackText("When I");
        } else if (time <= 25.716) {
            this.setTrackText("When I grow");
        } else if (time <= 26.411) {
            this.setTrackText("When I grow ri-");
        } else if (time <= 27.041) {
            this.setTrackText("When I grow rich,");
        } else if (time <= 27.394) {
                this.setTrackText("When I grow rich,\nSay");
            } else if (time <= 27.737) {
                this.setTrackText("When I grow rich,\nSay the");
            } else if (time <= 28.351) {
                this.setTrackText("When I grow rich,\nSay the bells");
            } else if (time <= 29.021) {
                this.setTrackText("When I grow rich,\nSay the bells at");
            } else if (time <= 29.686) {
                this.setTrackText("When I grow rich,\nSay the bells at Shore")
            } else if (time <= 30.936) {
                this.setTrackText("When I grow rich,\nSay the bells at Shoreditch");
            } else if (time <= 31.582) {
                this.setTrackText("*sending drums to Jesus,\nplease wait*")
            } else if (time <= 32.422) {
                this.setTrackText("When");
            } else if (time <= 33.067) {
                this.setTrackText("When will");
            } else if (time <= 33.717) {
                this.setTrackText("When will that");
            } else if (time <= 35.382) {
                this.setTrackText("When will that be?");
            } else if (time <= 35.802) {
                this.setTrackText("When will that be?\nSay");
            } else if (time <= 35.717) {
                this.setTrackText("When will that be?\nSay the");
            } else if (time <= 36.372) {
                this.setTrackText("When will that be?\nSay the bells");
            } else if (time <= 37.032) {
                this.setTrackText("When will that be?\nSay the bells of");
        } else if (time <= 37.642) {
            this.setTrackText("When will that be?\nSay the bells of St.");
        } else if (time <= 38.358) {
            this.setTrackText("When will that be?\nSay the bells of St. Dun");
        } else if (time <= 39.683) {
            this.setTrackText("When will that be?\nSay the bells of St. Dunstan's");
        } else if (time <= 40.433) {
                this.setTrackText("I");
        } else if (time <= 41.058) {
            this.setTrackText("I do");
        } else if (time <= 41.723) {
            this.setTrackText("I do not");
        } else if (time <= 42.378) {
            this.setTrackText("I do not k-");
        } else if (time <= 43.033) {
            this.setTrackText("I do not know.");
        } else if (time <= 43.401) {
            this.setTrackText("I do not know.\nSays");
        } else if (time <= 43.723) {
            this.setTrackText("I do not know.\nSays the");
        } else if (time <= 44.363) {
            this.setTrackText("I do not know.\nSays the great");
        } else if (time <= 45.028) {
            this.setTrackText("I do not know.\nSays the great bell");
        } else if (time <= 45.739) {
            this.setTrackText("I do not know.\nSays the great bell at");
        } else if (time <= 46.535) {
            this.setTrackText("I do not know.\nSays the great bell at Bow");
        } else if (time <= 46.641 && !this.bellTextFade) {
            this.trackDisplay.fadeTo(0, 350, "linear", () => {
                this.trackDisplay.alpha = 0;
                this.fullChanged();
            });
            this.bellTextFade = true;
        }
    }
}