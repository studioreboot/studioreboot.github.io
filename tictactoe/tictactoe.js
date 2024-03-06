var debug = false;

function adjust (v, useHeight = false) {
    if (useHeight) {
        return (v / 599) * innerHeight;
    }
    return (v / 1366) * innerWidth;
};

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

function freq (note) {
    return Math.pow(2, (note - 69) / 12) * 440;
}

function box (origin, corner) {
    return new Rectangle(origin.x, origin.y, corner.x, corner.y);
};

/** @param {OscillatorNode} osc */
function vibrato (osc, dur) {
    var baseFreq = osc.frequency.value, ctx = osc.context, startTime = ctx.currentTime + 0.15;

    function freqAt (time) {
        return (Math.sin((time - startTime) * 24) * 15) + baseFreq;
    }

    for (let i = 0; i < dur; i += (1/24)) {
        osc.frequency.exponentialRampToValueAtTime(freqAt(i), startTime + i);
    }

    osc.frequency.exponentialRampToValueAtTime(baseFreq, startTime + dur + 0.15);
};

Math.clamp = function (v, min, max) {
    return Math.min(Math.max(v, min), max);
};

function areAllThat (lst, thing) {
    var result = true;
    for (let i = 0; i < lst.length; i++) {
        const itemToTest = lst[i];
        result = result && (itemToTest === thing);
    }
    return result;
};

// Constants ///////////////////////////////////////////////

const BTN_IDLE = 0;
const BTN_USED = 1;

const SCRN_NONE = 0;
const SCRN_TIE = 1;
const SCRN_WIN = 2;
const SCRN_INSTR = 3;

// Classes /////////////////////////////////////////////////

var TTTWinScreen;
var TTTSoundHandler;
var TTTGameMorph;
var TTTGameStateContext;
var TTTButtonMorph;
var TTTPlayerIconMorph;
var AlignmentMorph;

// AlignmentMorph /////////////////////////////////////////////////////

// I am a reified layout, either a row or a column of submorphs

// AlignmentMorph inherits from Morph:

AlignmentMorph.prototype = new Morph();
AlignmentMorph.prototype.constructor = AlignmentMorph;
AlignmentMorph.uber = Morph.prototype;

// AlignmentMorph instance creation:

function AlignmentMorph(orientation, padding) {
    this.init(orientation, padding);
}

AlignmentMorph.prototype.init = function (orientation, padding) {
    // additional properties:
    this.orientation = orientation || 'row'; // or 'column'
    this.alignment = 'center'; // or 'left' in a column
    this.padding = padding || 0;
    this.respectHiddens = false;

    // initialize inherited properties:
    AlignmentMorph.uber.init.call(this);

    // override inherited properites:
};

// AlignmentMorph displaying and layout

AlignmentMorph.prototype.render = nop;

AlignmentMorph.prototype.fixLayout = function () {
    var last = null,
        newBounds;
    if (this.children.length === 0) {
        return null;
    }
    this.children.forEach(c => {
        var cfb = c.fullBounds(),
            lfb;
        if (c.isVisible || this.respectHiddens) {
            if (last) {
                lfb = last.fullBounds();
                if (this.orientation === 'row') {
                    c.setPosition(
                        lfb.topRight().add(new Point(
                            this.padding,
                            (lfb.height() - cfb.height()) / 2
                        ))
                    );
                } else { // orientation === 'column'
                    c.setPosition(
                        lfb.bottomLeft().add(new Point(
                            this.alignment === 'center' ?
                                    (lfb.width() - cfb.width()) / 2
                                            : 0,
                            this.padding
                        ))
                    );
                }
                cfb = c.fullBounds();
                newBounds = newBounds.merge(cfb);
            } else {
                newBounds = cfb;
            }
            last = c;
        }
    });
    this.bounds = newBounds;
};

const DEBUG_CONTEXT = false;

function join (...lines) {
    return lines.join("\n");
}

////////////////////////////////////////////////////////////
// TTTGameStateContext /////////////////////////////////////
////////////////////////////////////////////////////////////

TTTGameStateContext.DEFAULT_WIDTH = 3;
TTTGameStateContext.DEFAULT_HEIGHT = 3;
TTTGameStateContext.DEFAULT_NUM_PLAYERS = 4;

TTTGameStateContext.prototype = {};
TTTGameStateContext.prototype.constructor = TTTGameStateContext;

function TTTGameStateContext (aGameMorph) {
    this.boardWidth = TTTGameStateContext.DEFAULT_WIDTH;
    this.boardHeight = TTTGameStateContext.DEFAULT_HEIGHT;
    this.winLineLength = 3;

    this.gameMorph = aGameMorph;

    this.board = new Uint8Array(this.boardWidth * this.boardHeight);
    this.winner = null;

    this.numberOfPlayers = TTTGameStateContext.DEFAULT_NUM_PLAYERS;
    this.currentPlayer = irand(1, 2);

    this.playerScores = {};

    for (let i = 0; i < this.numberOfPlayers; i++) {
        this.playerScores[`p${i}`] = 0;
    }

    this.reset();
};

TTTGameStateContext.prototype.reset = function () {
    this.board = new Uint8Array(this.boardWidth * this.boardHeight);
    this.winner = null;
    this.currentPlayer = irand(1, this.numberOfPlayers);
};

TTTGameStateContext.prototype.getScoreFor = function (plr) {
    return this.playerScores[`p${plr}`] || 0;
}

TTTGameStateContext.prototype.nextPlayer = function () {
    this.currentPlayer++;
    if (this.currentPlayer >= (this.numberOfPlayers+1)) {
        this.currentPlayer = 1;
    }
};

TTTGameStateContext.prototype.changeTileTo = function (idx, value) {
    if (this.board[idx] !== 0) return;

    this.board[idx] = value;
};

TTTGameStateContext.prototype.tileIndexFor = function (x, y) {
    return (y * (this.boardWidth)) + x;
};

TTTGameStateContext.prototype.tileAt = function (x, y) {
    var ind = this.tileIndexFor(x, y);
    return this.board[ind];
};

/** @param {"up"|"down"|"left"|"right"} dir */
TTTGameStateContext.prototype.fillLine = function (x, y, dir, value) {
    for (let k = 0; k < this.winLineLength; k++) {
        switch (dir) {
            case "up":
                this.forciblySetTileTo(x, y - k, value);
                break;
            case "down":
                this.forciblySetTileTo(x, y + k, value);
                break;
            case "left":
                this.forciblySetTileTo(x - k, y, value);
                break;
            case "right":
                this.forciblySetTileTo(x + k, y, value);
                break;
            default:
                break;
        }
    }
}

/** @param {"up"|"down"} dir */
TTTGameStateContext.prototype.fillDiagnoalLine = function (x, y, dir, value) {
    for (let k = 0; k < this.winLineLength; k++) {
        switch (dir) {
            case "up":
                this.forciblySetTileTo(x + k, y - k, value);
                break;
            case "down":
                this.forciblySetTileTo(x + k, y + k, value);
                break;
            default:
                break;
        }
    }
};

/** @param {"up"|"down"} whichWay */
TTTGameStateContext.prototype.checkDiagnoal = function (x, y, whichWay, forPlayer) {
    var testers = [], lW = this.winLineLength;
    if (whichWay === "up") {
        for (let k = 0; k < lW; k++) {
            testers.push(this.tileAt(x + k, y - k) === forPlayer);
            /* console.log(x + k, y - k, this.tileAt(x + k, y - k)); */
        }
    } else if (whichWay === "down") {
        for (let k = 0; k < lW; k++) {
            testers.push(this.tileAt(x + k, y + k) === forPlayer);
            /* console.log(x + k, y + k, this.tileAt(x + k, y + k)); */
        }
    } else {
        throw new Error("Invalid direction");
    }
    /* console.log(testers); */
    return testers.indexOf(false) === -1;
};

/** @param {"up"|"down"|"left"|"right"} whichWay */
TTTGameStateContext.prototype.checkLine = function (x, y, whichWay, forPlayer) {
    var testers = [], lW = this.winLineLength;
    switch (whichWay) {
        case "right":
            for (let kx = 0; kx < lW; kx++) {
                testers.push(this.tileAt(x + kx, y) === forPlayer);
            }
            break;
        case "down":
            for (let ky = 0; ky < lW; ky++) {
                testers.push(this.tileAt(x, y + ky) === forPlayer);
            }
            break;
        case "up":
            for (let ky = 0; ky < lW; ky++) {
                testers.push(this.tileAt(x, y - ky) === forPlayer);
            }
            break;
        case "left":
            for (let kx = 0; kx < lW; kx++) {
                testers.push(this.tileAt(x - kx, y) === forPlayer);
                
            }
            break;
        default:
            throw new Error("Invalid direction");
    }
    //console.log(testers, forPlayer);
    return testers.indexOf(false) === -1;
};

TTTGameStateContext.prototype.checkBoard = function () {
    var isTie = false, whoWon = 0,
        bW = this.boardWidth, bH = this.boardHeight;
    var plr = 1;
    while (whoWon === 0 && plr < (this.numberOfPlayers + 1)) {
        /* console.log("checking win for " + plr); */

        if (!(this.boardHeight < this.winLineLength)) {
            // diagnoal up checks:
            for (let y = 2; y < bH; y++) {
                for (let x = 0; x < (bW - 2); x++) {
                    if (this.checkDiagnoal(x, y, "up", plr)) {
                        whoWon = plr;

                        /* console.log("DIAGNOAL win at " + x + "," + y + " up"); */
                    }
                }
            }

            // diagnoal down checks:
            for (let y = 0; y < (bH - 2); y++) {
                for (let x = 0; x < (bW - 2); x++) {
                    if (this.checkDiagnoal(x, y, "down", plr)) {
                        whoWon = plr;

                        /* console.log("DIAGNOAL win at " + x + "," + y + " down"); */
                    }
                }
            }

            for (let y = 0; y < (bH - 2); y++) {
                for (let x = 0; x < bW; x++) {
                    if (this.checkLine(x, y, "down", plr)) {
                        whoWon = plr;
                        /* console.log("LINE win at " + x + "," + y + " down"); */
                    }
                }
            }
        }

        if (!(this.boardWidth < this.winLineLength)) {
            for (let x = 0; x < (bW - 2); x++) {
                for (let y = 0; y < bH; y++) {
                    if (this.checkLine(x, y, "right", plr)) {
                        whoWon = plr;
                        /* console.log("LINE win at " + x + "," + y + " right"); */
                    }
                }
            }
        }

        plr++;
    }

    var winScreen = new TTTWinScreen(this);

    if (this.board.indexOf(0) === -1 && whoWon === 0) {
        isTie = true;
        winScreen.setScreenTo(SCRN_TIE);
        this.gameMorph.popUp(winScreen);
    }

    if (whoWon > 0) {
        this.playerScores["p" + (whoWon - 1)] = this.playerScores["p" + (whoWon - 1)] + 1;
        this.winner = whoWon;
        winScreen.setScreenTo(SCRN_WIN);
        winScreen.createObjects();

        this.gameMorph.soundHandler.playWin();
        this.gameMorph.popUp(winScreen);
    }

    return whoWon;
};

TTTGameStateContext.prototype.fillWithGarbage = function () {
    for (let x = 0; x < this.boardWidth; x++) {
        for (let y = 0; y < this.boardHeight; y++) {
            this.forciblySetTileTo(x, y, irand(1, this.numberOfPlayers));
        }
    }
};

TTTGameStateContext.prototype.logBoard = function () {
    console.log(this.board[0] + " " + this.board[1] + " " + this.board[2]);
    console.log(this.board[3] + " " + this.board[4] + " " + this.board[5]);
    console.log(this.board[6] + " " + this.board[7] + " " + this.board[8]);
};

TTTGameStateContext.prototype.forciblySetTileTo = function (x, y, tileValue) {
    this.board[this.tileIndexFor(x, y)] = tileValue;
    console.log("tried changing " + this.tileIndexFor(x, y) + " to " + tileValue);
    this.gameMorph.buttonFor(x, y).setPlayerTo(tileValue);
};

TTTGameStateContext.prototype.fullReset = function () {
    this.reset();
    for (let i = 0; i < this.gameMorph.buttons.length; i++) {
        const btn = this.gameMorph.buttons[i];
        btn.setPlayerTo(0);
    }
    this.gameMorph.fullChanged();
};

/** @param {"diagnoal up"|"diagnoal down"|"horizontal line"|"vertical line"} what */
TTTGameStateContext.prototype.test = function (what) {
    var bW = this.boardWidth, bH = this.boardHeight;

    //console.log("testing with \"" + what + "\".");
    switch (what) {
        case "diagnoal up":
            this.forciblySetTileTo(0, bH - 1, 1);
            this.forciblySetTileTo(1, bH - 2, 1);
            this.forciblySetTileTo(2, bH - 3, 1);
            break;
        default: break;
    }
    var boardCheck = this.checkBoard();
    //console.log("test returned: " + (boardCheck === 1 ? "success" : "fail"));
};

////////////////////////////////////////////////////////////
// TTTSoundHandler /////////////////////////////////////////
////////////////////////////////////////////////////////////

TTTSoundHandler.prototype = {};
TTTSoundHandler.prototype.constructor = TTTSoundHandler;

function TTTSoundHandler () {
    this.audioContext = new AudioContext();

    this.winBuffer = null;
    this.loadWin();
};

TTTSoundHandler.prototype.unlock = function () {
    while (this.audioContext.state === "suspended") {
        this.audioContext.resume();
    };
};

TTTSoundHandler.prototype.playHit = function (whichPlayer) {
    var osc = this.audioContext.createOscillator();

    osc.type = "triangle";
    osc.frequency.value = 245 + ((whichPlayer-1) * 50);
    
    osc.connect(this.audioContext.destination);
    osc.start();

    setTimeout(() => {
        osc.stop();
        osc.disconnect();
    }, 250);
};

TTTSoundHandler.prototype.playWin = function () {
    var source = this.audioContext.createBufferSource();
    source.buffer = this.winBuffer;

    source.connect(this.audioContext.destination);
    source.start();

    source.onended = function () {
        source.disconnect();
    };
};

TTTSoundHandler.prototype.loadWin = function () {
    var req, self = this;

    req = new XMLHttpRequest();
    req.responseType = "arraybuffer";
    req.open("GET", (window.location.href.substring(0, window.location.href.lastIndexOf("/"))) + "/win.ogg", true);
    req.onload = function () {
        self.audioContext.decodeAudioData(req.response, (aBuffer) => {
            self.winBuffer = aBuffer;
        });
    };
    req.send(null);
};

////////////////////////////////////////////////////////////
// TTTWinScreen ////////////////////////////////////////////
////////////////////////////////////////////////////////////

TTTWinScreen.prototype = new Morph();
TTTWinScreen.prototype.constructor = TTTWinScreen;
TTTWinScreen.uber = Morph.prototype;

function TTTWinScreen (aGameState) {
    TTTWinScreen.uber.init.call(this);

    this.color = new Color(0, 0, 0, 0.7);
    this.alpha = 0;
    this.screen = SCRN_NONE;
    this.gameState = aGameState;
};

/** @param {SCRN_INSTR|SCRN_NONE|SCRN_TIE|SCRN_WIN} screenType */
TTTWinScreen.prototype.setScreenTo = function (screenType) {
    this.screen = screenType;
    this.children.forEach(c => c.destroy());
    this.createObjects();
    this.changed();

    this.alpha = 1;
    this.creatingImage = true;
    this.thingImage = this.fullImage();
    this.children.forEach(c => c.destroy());
    this.creatingImage = false;
    this.alpha = 0;
};

TTTWinScreen.prototype.createObjects = function () {
    var gameState = this.gameState, aligner = new AlignmentMorph("column", adjust(12));
    switch (this.screen) {
        case SCRN_TIE:
            var tieText = new StringMorph("Tie", adjust(48), "monospace", true, true);
            tieText.setCenter(this.center().subtract(new Point(0, adjust(24))));
            aligner.add(tieText);
            break;
        case SCRN_WIN:
            var icon = new TTTPlayerIconMorph(), align = new AlignmentMorph("row", adjust(12));
            icon.whichPlayer = gameState.winner;
            icon.setExtent(new Point(adjust(82), adjust(82)));
            align.add(icon);
            align.add(new StringMorph("wins!", adjust(48), "monospace",  true, true));
            align.add(new StringMorph("h", adjust(12)));
            align.children[align.children.length - 1].color = CLEAR;
            aligner.add(align);
            break;
        case SCRN_INSTR:
            var title, contents;

            title = new StringMorph("Usage:", adjust(24), "monospace", true, true);
            
            contents = new TextMorph(join(
                "The board of this game can be changed to fit any size you'd like.",
                "",
                "If you go lower than 3 by 3, i'm just gonna say some bugs might",
                "occur.",
                "",
                "You can also specify how many players you'd like there to be.",
                "There is a limit, right now it's 7."
            ), adjust(18), "monospace");
            contents.alignment = 'center';

            aligner.add(title);
            aligner.add(contents);
            break;
        default: break;
    }
    if (this.screen === SCRN_TIE || this.screen === SCRN_WIN) {
        var ico, temp, levels = Math.ceil(gameState.numberOfPlayers / 2), count = 0;

        for (let i = 0; i < levels; i++) {
            let align = new AlignmentMorph("row");

            for (let k = 0; k < 2; k++) {
                if (count < gameState.numberOfPlayers) {
                    ico = new TTTPlayerIconMorph();
                    ico.whichPlayer = (count+1);
                    align.add(ico);
        
                    temp = new TextMorph("'s Score: " + gameState.getScoreFor(count), adjust(24), "monospace");
                    align.add(temp);
        
                    count++;
                }
            }

            aligner.add(align);

            for (let i = 0; i < align.children.length; i++) {
                const child = align.children[i];
                if (child instanceof TTTPlayerIconMorph) {
                    child.setExtent(new Point(adjust(82), adjust(82)));
                }
            }
        }
    }

    this.add(aligner);

    var allChildren = this.allChildren();

    for (let i = 0; i < allChildren.length; i++) {
        const child = allChildren[i];
        if (child instanceof StringMorph || child instanceof TextMorph) {
            child.color = WHITE;
        }
        if (child instanceof AlignmentMorph) {
            child.fixLayout();
        }
    }

    aligner.fixLayout();
    aligner.setCenter(this.center());
};

/** @param {CanvasRenderingContext2D} ctx */
TTTWinScreen.prototype.render = function (ctx) {
    if (this.creatingImage) {
        TTTWinScreen.uber.render.call(this, ctx);
    } else {
        /* ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, this.width(), this.height()); */

        ctx.drawImage(this.thingImage, 0, 0);
    }
};

TTTWinScreen.prototype.animatedShow = function (endFunc) {
    this.children = [];
    this.beforeDestroy = endFunc;
    var self = this;
    this.fadeTo(1, 1000, "sine-out", () => {
        this.alpha = 1;
        this.changed();
        setTimeout(() => {
            if (this.screen !== SCRN_INSTR) {
                this.fadeTo(0, 1000, "sine-out", () => {
                    this.alpha = 0;
                    this.changed();
                    self.beforeDestroy();
                    this.destroy();
                });
            }
        }, 5000);
    });
};

TTTWinScreen.prototype.mouseClickLeft = function () {
    if (this.screen === SCRN_INSTR) {
        this.fadeTo(0, 1000, "sine-out", () => {
            this.alpha = 0;
            this.changed();
            if (this.beforeDestroy) {
                this.beforeDestroy();
            }
            this.destroy();
        });
    }
};

////////////////////////////////////////////////////////////
// TTTGameMorph ////////////////////////////////////////////
////////////////////////////////////////////////////////////

/*
    I am a Tic Tac Toe game implemented in Morph.

    I hold TTTButtonMorphs that are the buttons for the game.

    I calculate which player has won using a TTTStateContext
*/

TTTGameMorph.prototype = new FrameMorph();
TTTGameMorph.prototype.constructor = TTTGameMorph;
TTTGameMorph.uber = FrameMorph.prototype;

function TTTGameMorph () {
    this.init();
};

TTTGameMorph.prototype.init = function () {
    TTTGameMorph.uber.init.call(this);

    // additional properties:
    this.color = BLACK.lighter(5);
    this.boardLineThickness = 10;
    this.boardMargin = 15;
    this.soundHandler = new TTTSoundHandler();

    this.state = new TTTGameStateContext(this);

    this.hitboxes = [];
    this.buttons = [];

    this.isRunning = true;
};

TTTGameMorph.prototype.updateAccordingToState = function () {
    for (let tileIdx = 0; tileIdx < this.state.board.length; tileIdx++) {
        const tile = this.state.board[tileIdx];
        this.buttons[tileIdx].whichPlayer = tile;
    }
    this.fullChanged();
}

/** @param {CanvasRenderingContext2D} ctx */
TTTGameMorph.prototype.render = function (ctx) {
    TTTGameMorph.uber.render.call(this, ctx);

    var w = this.width(), h = this.height(),
        margin = this.boardMargin;

    ctx.lineWidth = adjust(this.boardLineThickness);
    ctx.lineJoin = ctx.lineCap = "round";

    /* var rect = this.bounds.translateBy(this.position().neg()).insetBy(adjust(5)); */

    ctx.strokeStyle = "white";

    var bW = this.state.boardWidth,
        bH = this.state.boardHeight;

    ctx.beginPath();
    ctx.rect(0, 0, w - (margin / 2), h - (margin / 2));
    ctx.closePath();
    ctx.clip();

    for (let i = 0; i < bW; i++) {
        if (i === 0) continue;
        
        ctx.beginPath();
        ctx.moveTo(margin, (i * (h / bH)));
        ctx.lineTo(w - margin, (i * (h / bH)));
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((i * (w / bW)), margin);
        ctx.lineTo((i * (w / bW)), h - margin);
        ctx.closePath();
        ctx.stroke();
    }
};

TTTGameMorph.prototype.setButtonPlayerTo = function (idx, value) {
    var btn = this.buttons[idx];
    
    btn.state = BTN_USED;
    btn.whichPlayer = value;
    btn.changed();
};

TTTGameMorph.prototype.showTieScreen = function () {
    var winScreen = new TTTWinScreen(this.state);
    winScreen.setExtent(this.world().extent());
    winScreen.setScreenTo(SCRN_TIE);
    this.world().add(winScreen);
    this.isRunning = false;
    winScreen.animatedShow(() => {
        this.state.fullReset();
        this.isRunning = true;
    });
};

TTTGameMorph.prototype.popUp = function (aWinScreen) {
    var self = this;
    this.isRunning = false;
    aWinScreen.setExtent(this.world().extent());
    aWinScreen.children.forEach(c => c.destroy());
    aWinScreen.children = [];
    aWinScreen.setScreenTo(aWinScreen.screen);
    this.world().add(aWinScreen);
    aWinScreen.animatedShow();
    aWinScreen.beforeDestroy = () => {
        self.state.fullReset();
        self.isRunning = true;
    };
};

TTTGameMorph.prototype.createHitboxes = function () {
    this.hitboxes.splice(0, this.hitboxes.length);

    var w = this.width(), h = this.height(), margin = this.boardMargin,
        state = this.state;

    var boxes = [];

    for (let y = 0; y < state.boardHeight; y++) {
        for (let x = 0; x < state.boardWidth; x++) {
            let origin, corner;

            origin = new Point((x * (w / state.boardWidth)) + margin, (y * (h / state.boardHeight)) + margin);
            corner = new Point(((x+1) * (w / state.boardWidth)) - margin, ((y+1) * (h / state.boardHeight)) - margin);

            boxes.push(box(origin, corner));
        }
    }

    var thingButtons = [], cX = 0, cY = 0;

    for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        
        var morph = new TTTButtonMorph(this);
        morph.bounds = box.translateBy(this.position());
        morph.color = new Color(irand(0, 255), irand(0, 255), irand(0, 255));
        morph.tilePos = new Point(cX, cY);
        
        thingButtons.push(morph);
        this.add(morph);

        if (cX >= (state.boardWidth-1)) {
            cX = -1;
            cY++;
        }
        cX++;
    }

    this.buttons = thingButtons;
};

TTTGameMorph.prototype.buttonFor = function (x, y) {
    return this.buttons.find(v => v.tilePos.eq(new Point(x, y)));
};

TTTGameMorph.prototype.registerHitFor = function (aButtonMorph) {
    if (!this.isRunning) return;

    aButtonMorph.whichPlayer = this.state.currentPlayer;
    aButtonMorph.changed();

    this.soundHandler.playHit(aButtonMorph.whichPlayer);

    this.state.changeTileTo(this.buttons.indexOf(aButtonMorph), aButtonMorph.whichPlayer);
    this.state.nextPlayer();

    this.state.checkBoard();
};

TTTGameMorph.prototype.openIn = function (aWorld) {
    aWorld.add(this);
    this.setExtent(aWorld.extent());

    var scrn = new TTTWinScreen(this);
    scrn.setScreenTo(SCRN_INSTR);
    scrn.setExtent(aWorld.extent());
    this.popUp(scrn);
};

////////////////////////////////////////////////////////////
// TTTPlayerIconMorph //////////////////////////////////////
////////////////////////////////////////////////////////////

TTTPlayerIconMorph.prototype = new Morph();
TTTPlayerIconMorph.prototype.constructor = TTTPlayerIconMorph;
TTTPlayerIconMorph.uber = Morph.prototype;

function TTTPlayerIconMorph () {
    this.init();
};

TTTPlayerIconMorph.prototype.init = function () {
    TTTPlayerIconMorph.uber.init.call(this);
    this.whichPlayer = 0;
};

/** @param {CanvasRenderingContext2D} ctx */
TTTPlayerIconMorph.prototype.render = function (ctx) {
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.lineWidth = adjust(15);

    var w = this.width(), h = this.height();

    /* TTTButtonMorph.uber.render.call(this, ctx); */

    ctx.fillStyle = ctx.strokeStyle = TTTPlayerIconMorph.getColorFor(this.whichPlayer);

    switch (this.whichPlayer) {
        case 1:
            ctx.beginPath();
            ctx.moveTo(ctx.lineWidth, ctx.lineWidth);
            ctx.lineTo(w - ctx.lineWidth, h - ctx.lineWidth);
            ctx.moveTo(ctx.lineWidth, h - ctx.lineWidth);
            ctx.lineTo(w - ctx.lineWidth, ctx.lineWidth);
            ctx.closePath();
            ctx.stroke();
            break;
        case 2:
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, Math.min(h / 2, w / 2) - ctx.lineWidth, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();
            break;
        case 3:
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, Math.min(h / 2, w / 2) - ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, Math.min(h / 2, w / 2) - ctx.lineWidth, 0, Math.PI * 2);
            ctx.moveTo(0, 0);
            ctx.lineTo(w, h);
            ctx.moveTo(w, 0);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.stroke();
            break;
        case 4:
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, Math.min(h / 2, w / 2) - ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, Math.min(h / 2, w / 2) - ctx.lineWidth, 0, Math.PI * 2);
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w / 2, h);
            ctx.closePath();
            ctx.stroke();
            break;
        case 5:
            ctx.beginPath();
            ctx.moveTo(ctx.lineWidth, ctx.lineWidth);
            ctx.lineTo(w - ctx.lineWidth, ctx.lineWidth);
            ctx.lineTo(w - ctx.lineWidth, h - ctx.lineWidth);
            ctx.lineTo(ctx.lineWidth, h - ctx.lineWidth);
            ctx.closePath();
            ctx.stroke();
            break;
        case 6:
            ctx.beginPath();
            ctx.moveTo(ctx.lineWidth, ctx.lineWidth);
            ctx.lineTo(w - ctx.lineWidth, ctx.lineWidth);
            ctx.lineTo(w - ctx.lineWidth, h - ctx.lineWidth);
            ctx.lineTo(ctx.lineWidth, h - ctx.lineWidth);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(ctx.lineWidth, ctx.lineWidth);
            ctx.lineTo(w - ctx.lineWidth, h - ctx.lineWidth);
            ctx.closePath();
            ctx.stroke();
            break;
        case 7:
            ctx.beginPath();
            ctx.moveTo(ctx.lineWidth, h - ctx.lineWidth);
            ctx.lineTo(w / 2, ctx.lineWidth);
            ctx.lineTo(w - ctx.lineWidth, h - ctx.lineWidth);
            ctx.lineTo(ctx.lineWidth, h - ctx.lineWidth);
            ctx.closePath();
            ctx.stroke();
            break;
        default:
            break;
    }
};

TTTPlayerIconMorph.getColorFor = function (plr) {
    switch (plr) {
        case 1:
            return "rgb(255,0,0)";
        case 2:
            return "rgb(0,100,255)";
        case 3:
            return "rgb(0,255,100)";
        case 4:
            return "yellow";
        case 5:
            return "purple";
        case 6:
            return "cyan";
        case 7:
            return "orange";
        default: break;
    }
};

////////////////////////////////////////////////////////////
// TTTButtonMorph //////////////////////////////////////////
////////////////////////////////////////////////////////////

TTTButtonMorph.prototype = new TTTPlayerIconMorph();
TTTButtonMorph.prototype.constructor = TTTButtonMorph;
TTTButtonMorph.uber = TTTPlayerIconMorph.prototype;

function TTTButtonMorph (aGameMorph) {
    this.init(aGameMorph);
};

TTTButtonMorph.prototype.init = function (aGameMorph) {
    TTTButtonMorph.uber.init.call(this);

    this.gameMorph = aGameMorph;
    this.state = BTN_IDLE;
    this.whichPlayer = -1;
    this.tilePos = ZERO.copy();
};

TTTButtonMorph.prototype.toString = function () {
    return `a TTTButtonMorph (${this.tilePos.toString()}) ${this.whichPlayer}`
};

TTTButtonMorph.prototype.mouseClickLeft = function () {
    if (!this.gameMorph.isRunning) return;

    var game = this.gameMorph;

    if (this.state === BTN_IDLE) {
        game.registerHitFor(this);
        this.state = BTN_USED;
    }
};

TTTButtonMorph.prototype.setPlayerTo = function (plr) {
    if (plr === 0) {
        this.whichPlayer = 0;
        this.state = BTN_IDLE;
        this.changed();
    } else {
        this.whichPlayer = plr;
        this.state = BTN_USED;
        this.changed();
    }
};

TTTButtonMorph.prototype.render = function (ctx) {
    if (debug) {
        Morph.prototype.render.call(this, ctx);
    }
    TTTButtonMorph.uber.render.call(this, ctx);
};