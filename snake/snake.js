TriggerMorph.prototype.setLabel = function (aMorph) {
    if (this.label) this.label.destroy();
    this.label = aMorph;
    this.add(this.label);
    this.fixLayout();
};

function isInDev () {
    return window.location.href.indexOf("studioreboot.github.io") === -1;
}

function getUrlLocation (fileName) {
    return (window.location.href.substring(0, window.location.href.lastIndexOf("/")) + "/" + fileName);
};

const ST_ACTIVE = 1;
const ST_STOPPED = 2;
const ST_FINISHED = 3;

const IMG_GRAPE = new Image();
IMG_GRAPE.src = "grape.svg";

const IMG_CARROT = new Image();
IMG_CARROT.src = "carrot.svg";

var SnakeMorph;

/** @extends {Morph} */
var ScreenMorph;
var SnakeTailMorph;
var FoodMorph;
var MultiplayerSnakeGameMorph;
var SnakeGameStatus;
var SingleplayerSnakeGameMorph;
var SnakeAreaMorph;
var SnakeGameMorph;

function adjust (v, useHeight = false) {
    if (useHeight) {
        return (v / 599) * innerHeight;
    }
    return (v / 1325) * innerWidth;
};

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

SnakeGameMorph.prototype = new FrameMorph();
SnakeGameMorph.prototype.constructor = SnakeGameMorph;
SnakeGameMorph.uber = FrameMorph.prototype;

function SnakeGameMorph () {
    this.init();
}

MultiplayerSnakeGameMorph.CELL_SIZE = adjust(12);

SnakeGameStatus.prototype = {};
SnakeGameStatus.prototype.constructor = SnakeGameStatus;

function SnakeGameStatus (side) {
    this.playerScore = 0;
    this.foodEaten = 0;
    this.whichSide = side;
};

SnakeGameStatus.prototype.reset = function () {
    this.playerScore = 0;
    this.foodEaten = 0;
};

ScreenMorph.prototype = new Morph();
ScreenMorph.prototype.constructor = ScreenMorph;
ScreenMorph.uber = Morph.prototype;

ScreenMorph.OP_CLICKABLE = 1;
ScreenMorph.OP_CONTROLLED = 2;
ScreenMorph.OP_NOTHING = 3;

function ScreenMorph () {
    this.init();
};

ScreenMorph.prototype.init = function () {
    ScreenMorph.uber.init.call(this);

    this.body = null;
    this.screenType = ScreenMorph.OP_CLICKABLE;

    this.color = new Color(0, 0, 0);
    this.color.a = 0.7;

    this.uponClosing = nop;
};

ScreenMorph.prototype.popUpIn = function (aMorph) {
    this.forAllChildren(m => {
        m.alpha = 0;
    });
    this.setPosition(aMorph.position());
    this.setExtent(aMorph.extent());
    this.fixLayout();
    aMorph.add(this);

    this.fadeTo(1, 1000, "linear", () => {
        this.forAllChildren(m => { m.alpha = 1; m.changed(); });
    });
};

ScreenMorph.prototype.setBody = function (aMorph) {
    if (this.body) this.body.destroy();
    this.body = aMorph;
    this.add(this.body);
};

ScreenMorph.prototype.fixLayout = function () {
    if (!this.body) return;
    this.body.setCenter(this.center());
    if (this.body instanceof StringMorph) {
        this.body.fixLayout(true);
    } else {
        this.body.fixLayout();
    }
}

ScreenMorph.prototype.mouseClickLeft = function () {
    if (this.screenType != ScreenMorph.OP_CLICKABLE) return;
    this.perish(1000);
    this.uponClosing();
};

ScreenMorph.prototype.fadeIn = function () {
    this.fadeTo(1, 1000, "linear", () => {
        this.forAllChildren(m => { m.alpha = 1; m.changed(); });
    });
};

ScreenMorph.prototype.fadeOut = function () {
    if (this.screenType === ScreenMorph.OP_CONTROLLED) {
        this.fadeTo(0, 1000, "linear", () => {
            this.forAllChildren(m => { m.alpha = 0; m.changed(); });
        });
    }
};

ScreenMorph.prototype.perish = function () {
    this.fadeTo(0, 1000, "linear", () => {
        this.destroy();
    });
};

SnakeMorph.prototype = new Morph();
SnakeMorph.prototype.constructor = SnakeMorph;
SnakeMorph.uber = Morph.prototype;

function SnakeMorph (doesMoveIndependently) {
    this.init(doesMoveIndependently);
}

SnakeMorph.prototype.init = function (doesMoveIndependently) {
    SnakeMorph.uber.init.call(this);

    this.tail = [{ direction: "up", depth: 1 }]; // tail format { direction: "up/down/left/right", depth: int }
    this.direction = "down";
    this.fps = 4;
    this.doesMoveIndependently = doesMoveIndependently || true;
    this.canMove = true;
    this.color = SnakeMorph.CLR_HEAD // new Color(255, 0, 174);

    this.head = new Point(1, 1);

    this.board = null;

    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE));
};

SnakeMorph.prototype.step = function () {
    if ((!this.doesMoveIndependently) || (!this.canMove)) return;

    this.move();
};

SnakeMorph.prototype.move = function () {
    if (!this.canMove) return;

    switch (this.direction) {
        case "up":
            this.setTop(this.top() - MultiplayerSnakeGameMorph.CELL_SIZE);
            this.head.y--;
            break;
        case "down":
            this.setTop(this.top() + MultiplayerSnakeGameMorph.CELL_SIZE);
            this.head.y++;
            break;
        case "left":
            this.setLeft(this.left() - MultiplayerSnakeGameMorph.CELL_SIZE);
            this.head.x--;
            break;
        case "right":
            this.setLeft(this.left() + MultiplayerSnakeGameMorph.CELL_SIZE);
            this.head.x++;
            break;
        default:
            break;
    };

    this.board.snakeMoved(this.direction);

    var newDirections = [this.direction].concat(this.tail.map((v) => v.direction));
    for (let i = 0; i < this.tail.length; i++) {
        const part = this.tail[i];
        part.direction = newDirections[i];
    }

    this.fixTail();
};

SnakeMorph.prototype.addTail = function () {
    this.tail.push({ direction: this.tail[this.tail.length - 1], depth: this.tail[this.tail.length - 1].depth });
};

SnakeMorph.prototype.consume = function (foodObj) {
    this.addTail();
    this.board.gameStatus.playerScore += foodObj.food.foodType * 5;
    this.board.gameStatus.foodEaten++;
    foodObj.food.destroy();

    this.board.foods.splice(this.board.foods.indexOf(foodObj), 1);

    this.board.checkFoodAmount();
    this.board.updateScore();
};

SnakeMorph.CLR_LIGHTGREEN = new Color(85, 255, 20);
SnakeMorph.CLR_DARKGREEN = new Color(10, 194, 0);
SnakeMorph.CLR_HEAD = new Color(204, 46, 0);

SnakeMorph.HEAD_SIZE = new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE);

SnakeMorph.prototype.fixTail = function () {
    this.children.forEach(m => m.destroy());
    this.children = [];
    var lastPos = this.position();
    for (let i = 0; i < this.tail.length; i++) {
        const tailObj = this.tail[i];
        let tailMorph = new SnakeTailMorph(this);
        tailMorph.color = (i + 1) % 2 == 0 ? SnakeMorph.CLR_LIGHTGREEN : SnakeMorph.CLR_DARKGREEN;
        switch (tailObj.direction) {
            case "down":
                tailMorph.setPosition(lastPos.subtract(new Point(0, MultiplayerSnakeGameMorph.CELL_SIZE)));
                break;
            case "up":
                tailMorph.setPosition(lastPos.add(new Point(0, MultiplayerSnakeGameMorph.CELL_SIZE)));
                break;
            case "left":
                tailMorph.setPosition(lastPos.add(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, 0)));
                break;
            case "right":
                tailMorph.setPosition(lastPos.subtract(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, 0)));
                break;
            default:
                break;
        }
        lastPos = tailMorph.position();
        this.add(tailMorph);
    }
};

SnakeMorph.prototype.developersMenu = function () {
    var menu = SnakeMorph.uber.developersMenu.call(this);
    menu.addLine();
    menu.addItem(
        "stop",
        () => {
            this.canMove = false;
        }
    )
    return menu;
};

SnakeTailMorph.prototype = new Morph();
SnakeTailMorph.prototype.constructor = SnakeTailMorph;
SnakeTailMorph.uber = Morph.prototype;

function SnakeTailMorph (mySnake) {
    this.init(mySnake);
};

SnakeTailMorph.prototype.init = function () {
    SnakeTailMorph.uber.init.call(this);
    this.setExtent(SnakeMorph.HEAD_SIZE);
};

MultiplayerSnakeGameMorph.prototype = new SnakeGameMorph();
MultiplayerSnakeGameMorph.prototype.constructor = MultiplayerSnakeGameMorph;
MultiplayerSnakeGameMorph.uber = SnakeGameMorph.prototype;

function MultiplayerSnakeGameMorph (canPlayMusic) {
    this.init(canPlayMusic);
};

MultiplayerSnakeGameMorph.prototype.init = function (canPlayMusic) {
    MultiplayerSnakeGameMorph.uber.init.call(this);

    this.color = BLACK;
    this.audioContext = new AudioContext();

    this.leftArea = null;
    this.leftGameStatus = new SnakeGameStatus('left');
    this.rightArea = null;
    this.rightGameStatus = new SnakeGameStatus('right');
    this.timerDial = null;

    this.musicSwitcher = false;

    this.canPlayMusic = canPlayMusic;
    this.bgMusicTracks = {};
    this.currentMusic = null;

    this.winTimer = Date.now() + 1000;
    this.winStep = 1;

    this.winSoundBuffer = null;
    this.loseSoundBuffer = null;

    this.loadTracks();
};

MultiplayerSnakeGameMorph.prototype.loadTracks = function () {
    var self = this;

    let xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.open("GET", getUrlLocation("gameover.mp3"), true);
    xhr.onload = function () {
        self.audioContext.decodeAudioData(xhr.response, (data) => {
            self.loseSoundBuffer = data;
        });
    }
    xhr.send(null);

    console.log(xhr);

    let xhr2 = new XMLHttpRequest();
    xhr2.responseType = "arraybuffer";
    xhr2.open("GET", getUrlLocation("win.mp3"), true);
    xhr2.onload = function () {
        self.audioContext.decodeAudioData(xhr2.response, (data) => {
            self.winSoundBuffer = data;
        });
    }
    xhr2.send(null);

    if (!this.canPlayMusic) return;

    for (let i = 0; i < 2; i++) {
        let xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";
        xhr.open("GET", getUrlLocation(`bg${i+1}.mp3`), true);
        xhr.onload = function () {
            self.audioContext.decodeAudioData(xhr.response, (data) => {
                self.bgMusicTracks[i+1] = data;
            });
        }
        xhr.send(null);
    }
};

MultiplayerSnakeGameMorph.prototype.playMusic = function () {
    var ctx = this.audioContext, src = ctx.createBufferSource(), gain = ctx.createGain();
    
    src.buffer = this.bgMusicTracks[this.canPlayMusic ? 1 : 2];
    src.connect(gain);

    gain.gain.value = 0.3;
    gain.connect(ctx.destination);

    this.currentMusic = src;
    src.start();
};

MultiplayerSnakeGameMorph.prototype.openIn = function (aWorld) {
    aWorld.add(this);

    /* let snake = new SnakeMorph(true);
    snake.board = this;
    snake.headPos = new Point(1, 1);
    this.add(snake); */

    this.gameState = ST_STOPPED;
    this.setExtent(aWorld.extent());
    
    this.showLoadScreen();
};

MultiplayerSnakeGameMorph.prototype.showLoadScreen = function () {
    var xhr = new XMLHttpRequest(), self = this;
    xhr.open("GET", getUrlLocation("loadscreen.txt"), true);
    xhr.onload = function () {
        let screen = new ScreenMorph();
        screen.screenType = ScreenMorph.OP_CLICKABLE;

        self.fps = 9e9;
        
        let align = new AlignmentMorph("column");
        align.add((function(){
            var t = new TextMorph("multi-player snake", adjust(48), "monospace", false, true);
            t.color = WHITE;
            return t;
        })());
        align.add((function(){
            var m = new Morph();
            m.setWidth(1);
            m.alpha = 0;
            m.color = new Color(0, 0, 0, 0);
            m.setHeight(adjust(15));
            return m;
        })());
        align.add((function(){
            var t = new TextMorph(xhr.responseText, adjust(20), "monospace", false, false, "center");
            t.color = WHITE;
            return t;
        })());

        screen.setBody(align);
        screen.popUpIn(self);

        screen.uponClosing = () => { 
            self.buildPanes();
            self.fps = 0; 
        }
    }
    xhr.send();
};

MultiplayerSnakeGameMorph.prototype.buildPanes = function () {
    let area = new SnakeAreaMorph(this.leftGameStatus);
    area.buildPanes();
    area.fixLayout();
    this.leftArea = area;

    let area2 = new SnakeAreaMorph(this.rightGameStatus);
    area2.buildPanes();
    area2.fixLayout();
    this.rightArea = area2;

    let dial = new DialMorph(0, 60000, 10, 5000);
    this.timerDial = dial;
    this.timerDial.render = function (ctx) {
        var i, angle, x1, y1, x2, y2,
            light = this.color.lighter().toString(),
            range = this.max - this.min,
            ticks = range / this.tick,
            face = this.radius * 0.75,
            inner = face * 0.85,
            outer = face * 0.95;
    
        // draw a light border:
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face + Math.min(1, this.radius - face),
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();
    
        // fill circle:
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();
    
        // fill value
        angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
        ctx.fillStyle = (this.fillColor || this.color.darker()).toString();
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face,
            Math.PI / -2,
            angle,
            false
        );
        ctx.lineTo(this.radius, this.radius);
        ctx.closePath();
        ctx.fill();
    
        // draw ticks:
        ctx.strokeStyle = new Color(35, 35, 35).toString();
        ctx.lineWidth = 1;
        for (i = 0; i < ticks; i += 1) {
            angle = (i - 3) * (Math.PI * 2) / ticks - Math.PI / 2;
            ctx.beginPath();
            x1 = this.radius + Math.cos(angle) * inner;
            y1 = this.radius + Math.sin(angle) * inner;
            x2 = this.radius + Math.cos(angle) * outer;
            y2 = this.radius + Math.sin(angle) * outer;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    
        // draw a filled center:
        inner = face * 0.05;
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            inner,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();
    
        // draw the inner hand:
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
        outer = face * 0.8;
        x1 = this.radius + Math.cos(angle) * inner;
        y1 = this.radius + Math.sin(angle) * inner;
        x2 = this.radius + Math.cos(angle) * outer;
        y2 = this.radius + Math.sin(angle) * outer;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    
        // draw a read-out circle:
        inner = inner * 2;
        x2 = this.radius + Math.cos(angle) * (outer + inner);
        y2 = this.radius + Math.sin(angle) * (outer + inner);
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            x2,
            y2,
            inner,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.stroke();
    };
    this.timerDial.mouseDownLeft = nop;
    this.add(this.timerDial);

    this.addBack(this.leftArea);
    this.addBack(this.rightArea);

    this.gameEndDeadline = Date.now() + 60000;
    this.gameState = ST_ACTIVE;

    this.fixLayout();
};

MultiplayerSnakeGameMorph.prototype.fixLayout = function () {
    if (!this.leftArea) return;

    this.leftArea.setCenter(this.center().subtract(new Point((this.width() / 2) / 2, 0)));
    this.rightArea.setCenter(this.rightCenter().subtract(new Point((this.width() / 2) / 2, 0)));

    this.timerDial.setRadius(adjust(45));
    this.timerDial.setCenter(this.center());
};

MultiplayerSnakeGameMorph.prototype.reactToWorldResize = function (aRect) {
    this.setExtent(aRect.extent());
    this.fixLayout();
};

MultiplayerSnakeGameMorph.prototype.step = function () {
    if (!this.leftArea) return;
    switch (this.gameState) {
        case ST_ACTIVE:
            var now = Date.now();

            this.timerDial.value = Math.max(this.gameEndDeadline - now, 1);
            this.timerDial.changed();

            if (now >= this.gameEndDeadline) {
                this.gameState = ST_FINISHED;
                this.winStep = 0;
            }

            if (this.leftArea.didDie && this.rightArea.didDie) {
                this.gameState = ST_FINISHED;
                this.winStep = 0;
            }
            break;
        case ST_STOPPED:
            this.leftArea.snake.canMove = false;
            this.rightArea.snake.canMove = false;
            break;
        case ST_FINISHED:
            if (this.winStep === 0) {
                this.leftArea.snake.canMove = false;
                this.rightArea.snake.canMove = false;
                this.winStep = 1;
            } else {
                if (Date.now() > this.winTimer) {
                    this.stepWinSequence();
                }
            }
            break;
        default: break;
    }
};

MultiplayerSnakeGameMorph.prototype.userMenu = function () {
    if (!isInDev()) {
        return new MenuMorph();
    }
}

MultiplayerSnakeGameMorph.prototype.playTone = function (at) {
    var ctx = this.audioContext, osc, pan;

    osc = ctx.createOscillator();
    osc.frequency.value = 800;
    osc.type = "sine";
    
    pan = ctx.createStereoPanner();
    pan.pan.value = at;
    osc.connect(pan);
    pan.connect(ctx.destination);

    osc.start();

    setTimeout(() => {
        osc.stop();
        pan.disconnect();
    }, 250);
};

MultiplayerSnakeGameMorph.prototype.playLose = function (whichSide) {
    var ctx = this.audioContext, osc, pan;

    osc = ctx.createBufferSource();
    osc.buffer = this.loseSoundBuffer;
    
    pan = ctx.createStereoPanner();
    pan.pan.value = whichSide === "left" ? -1 : 1;
    osc.connect(pan);
    pan.connect(ctx.destination);

    osc.start();

    osc.onended = function () {
        pan.disconnect();
    }
}

MultiplayerSnakeGameMorph.prototype.playWin = function (whichSide) {
    var ctx = this.audioContext, osc, pan;

    osc = ctx.createBufferSource();
    osc.buffer = this.winSoundBuffer;
    
    pan = ctx.createStereoPanner();
    pan.pan.value = whichSide === "left" ? -1 : 1;
    osc.connect(pan);
    pan.connect(ctx.destination);

    osc.start();

    osc.onended = function () {
        pan.disconnect();
    }
}

MultiplayerSnakeGameMorph.prototype.stepWinSequence = function () {
    console.log(this.winStep);
    switch (this.winStep) {
        case 1:
            this.winTimer = Date.now() + 500;
            this.winStep = 2;
            break;
        case 2:
            var scrn = new ScreenMorph(), align = new AlignmentMorph("column"), txt;
            if (this.leftGameStatus.playerScore > this.rightGameStatus.playerScore) {                
                txt = new TextMorph("Left Side Won!", adjust(36), "monospace");
                txt.color = new Color(39, 84, 245);
                align.add(txt);

                txt = new TextMorph(`Total Score: ${this.leftGameStatus.playerScore}\n# of Foods Eaten: ${this.leftGameStatus.foodEaten}`, adjust(24), "monospace", false, false, "center");
                txt.color = WHITE;
                align.add(txt);

                scrn.setBody(align);
                scrn.popUpIn(this);
                scrn.setExtent(new Point(this.width() / 2, this.height()));
                scrn.screenType = ScreenMorph.OP_CONTROLLED;
                this.playWin("left");
            }
            if (this.leftGameStatus.playerScore < this.rightGameStatus.playerScore) {                
                txt = new TextMorph("Right Side Won!", adjust(36), "monospace");
                txt.color = new Color(219, 42, 7);
                align.add(txt);

                txt = new TextMorph(`Total Score: ${this.rightGameStatus.playerScore}\n# of Foods Eaten: ${this.rightGameStatus.foodEaten}`, adjust(24), "monospace", false, false, "center");
                txt.color = WHITE;
                align.add(txt);

                scrn.setBody(align);
                scrn.popUpIn(this);
                scrn.setPosition(this.topCenter());
                scrn.setExtent(new Point(this.width() / 2, this.height()));
                scrn.screenType = ScreenMorph.OP_CONTROLLED;
                this.playWin("right");
            };
            this.winTimer = Date.now() + 5500;
            this.winStep = 3;
            break;
        case 3:
            var scrn = new ScreenMorph(), align = new AlignmentMorph("column"), txt;
            if (this.leftGameStatus.playerScore > this.rightGameStatus.playerScore) {                
                txt = new TextMorph("Right Side Lost!", adjust(36), "monospace");
                txt.color = new Color(184, 0, 0);
                align.add(txt);

                txt = new TextMorph(`Total Score: ${this.rightGameStatus.playerScore}\n# of Foods Eaten: ${this.rightGameStatus.foodEaten}`, adjust(24), "monospace", false, false, "center");
                txt.color = WHITE;
                align.add(txt);

                scrn.setBody(align);
                scrn.popUpIn(this);
                scrn.setPosition(this.topCenter());
                scrn.setExtent(new Point(this.width() / 2, this.height()));
                scrn.screenType = ScreenMorph.OP_NOTHING;
                this.playLose("right");
            }
            if (this.leftGameStatus.playerScore < this.rightGameStatus.playerScore) {
                txt = new TextMorph("Left Side Lost!", adjust(36), "monospace");
                txt.color = new Color(184, 0, 0);
                align.add(txt);

                txt = new TextMorph(`Total Score: ${this.leftGameStatus.playerScore}\n# of Foods Eaten: ${this.leftGameStatus.foodEaten}`, adjust(24), "monospace", false, false, "center");
                txt.color = WHITE;
                align.add(txt);

                scrn.setBody(align);
                scrn.popUpIn(this);
                scrn.setExtent(new Point(this.width() / 2, this.height()));
                scrn.screenType = ScreenMorph.OP_NOTHING;
                this.playLose("left");
            };
            this.winTimer = Date.now() + 8500;
            this.winStep++;
            break;
        case 4:
            this.children.filter(v => v instanceof ScreenMorph).forEach(v => v.perish(1000));
            var scrn = new ScreenMorph(), txt;
            
            txt = new TextMorph("Tap the screen to play again.", adjust(36), "monospace");
            txt.color = WHITE;
            scrn.setBody(txt);
            scrn.popUpIn(this);
            scrn.uponClosing = () => {
                this.winTimer = Date.now() + 50;
            };

            this.winTimer = Infinity;
            this.winStep++;
            break;
        case 5:
            this.leftArea.resetThisBoard();
            this.rightArea.resetThisBoard();
            this.gameEndDeadline = Date.now() + 60000;
            this.gameState = ST_ACTIVE;
            break;
        default:
            break;
    }
};

MultiplayerSnakeGameMorph.prototype.developersMenu = function () {
    var menu = MultiplayerSnakeGameMorph.uber.developersMenu.call(this);
    menu.addLine();
    menu.addItem(
        "test win screen (left)",
        () => {
            this.winStep = 0;
            this.winTimer = Date.now() + 1000;
            this.leftGameStatus.playerScore = 1000;
            this.gameState = ST_FINISHED;
        }
    );
    menu.addItem(
        "test win screen (right)",
        () => {
            this.winStep = 0;
            this.winTimer = Date.now() + 1000;
            this.rightGameStatus.playerScore = 1000;
            this.gameState = ST_FINISHED;
        }
    );
    return menu;
};

SingleplayerSnakeGameMorph.prototype = new SnakeGameMorph();
SingleplayerSnakeGameMorph.prototype.constructor = SingleplayerSnakeGameMorph;
SingleplayerSnakeGameMorph.uber = SnakeGameMorph.prototype;

function SingleplayerSnakeGameMorph () {
    this.init();
};

SingleplayerSnakeGameMorph.prototype.init = function () {
    SingleplayerSnakeGameMorph.uber.init.call(this);

    this.color = BLACK;
    this.audioContext = new AudioContext();

    this.gameArea = null;
};

SingleplayerSnakeGameMorph.prototype.openIn = function (aWorld) {
    aWorld.add(this);

    /* let snake = new SnakeMorph(true);
    snake.board = this;
    snake.headPos = new Point(1, 1);
    this.add(snake); */

    this.setExtent(aWorld.extent());
    
    this.buildPanes();
    this.fixLayout();
};

SingleplayerSnakeGameMorph.prototype.mouseClickLeft = function () {
    this.audioContext.resume();
};

SingleplayerSnakeGameMorph.prototype.processKeyUp = function (ev) {
    if (ev.key === "ArrowUp") {
        this.childThatIsA(SnakeMorph).direction = "up";
    } else if (ev.key === "ArrowDown") {
        this.childThatIsA(SnakeMorph).direction = "down";
    } else if (ev.key === "ArrowLeft") {
        this.childThatIsA(SnakeMorph).direction = "left";
    } else {
        this.childThatIsA(SnakeMorph).direction = "right";
    }
    this.childThatIsA(SnakeMorph).move();
};

SingleplayerSnakeGameMorph.prototype.buildPanes = function () {
    let area1 = new SnakeAreaMorph(new SnakeGameStatus("middle"));
    area1.buildPanes();
    area1.fixLayout();
    this.gameArea = area1;
    this.add(area1);
};

SingleplayerSnakeGameMorph.prototype.reactToWorldResize = function (aRect) {
    this.setExtent(aRect.extent());
    this.fixLayout();
};

SingleplayerSnakeGameMorph.prototype.playTone = function (at) {
    var ctx = this.audioContext, osc, pan;

    osc = ctx.createOscillator();
    osc.frequency.value = 800;
    osc.type = "triangle";
    
    pan = ctx.createStereoPanner();
    pan.pan.value = at;
    osc.connect(pan);
    pan.connect(ctx.destination);

    osc.start();

    setTimeout(() => {
        osc.stop();
        pan.disconnect();
    }, 250);
};

SingleplayerSnakeGameMorph.prototype.fixLayout = function () {
    if (!this.gameArea) return;
    this.gameArea.setCenter(this.center());
};

FoodMorph.prototype = new Morph();
FoodMorph.prototype.constructor = FoodMorph;
FoodMorph.uber = Morph.prototype;

function FoodMorph () {
    this.init();
};

FoodMorph.prototype.init = function () {
    FoodMorph.uber.init.call(this);

    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE))

    this.foodType = irand(1, 4);
    this.whereOnBoard = null;
};

/** @param {CanvasRenderingContext2D} ctx */
FoodMorph.prototype.render = function (ctx) {
    var w = this.width(), h = this.height();
    switch (this.foodType) {
        case 1:
            ctx.fillStyle = "#ed2626";

            ctx.beginPath();
            ctx.ellipse(w / 2, h / 2, w / 2.35, h / 2.35, 0, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();

            ctx.lineWidth = adjust(2.5);
            ctx.strokeStyle = "#8c450b";

            ctx.beginPath();
            ctx.moveTo(w / 2, h / 3);
            ctx.lineTo(w / 2 - adjust(2), 0);
            ctx.closePath();
            ctx.stroke();
            break;
        case 2:
            ctx.fillStyle = "#ff6600";

            ctx.beginPath();
            ctx.ellipse(w / 2, h / 2, w / 2.35, h / 2.35, 0, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();

            ctx.lineWidth = adjust(2.5);
            ctx.strokeStyle = "#8c450b";

            ctx.beginPath();
            ctx.moveTo(w / 2, h / 3);
            ctx.lineTo(w / 2 - adjust(2), 0);
            ctx.closePath();
            ctx.stroke();
            break;
        case 3:
            ctx.drawImage(IMG_GRAPE, 0, 0, this.width(), this.height());
            break;
        case 4:
            ctx.drawImage(IMG_CARROT, 0, 0, this.width(), this.height());
            break;
        default:
            FoodMorph.uber.render.call(this, ctx);
            break;
    }
}

SnakeAreaMorph.prototype = new Morph();
SnakeAreaMorph.prototype.constructor = SnakeAreaMorph;
SnakeAreaMorph.uber = Morph.prototype;

SnakeAreaMorph.BUTTON_HEIGHT = adjust(30);

function SnakeAreaMorph (aGameStatus) {
    this.init(aGameStatus);
}

SnakeAreaMorph.prototype.init = function (aGameStatus) {
    SnakeAreaMorph.uber.init.call(this);
    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE * 30, MultiplayerSnakeGameMorph.CELL_SIZE * 30));

    this.snake = new SnakeMorph();
    this.scoreValue = new StringMorph("0", adjust(18), "monospace", true, false, true, null, null, WHITE);
    this.snake.board = this;

    this.area = new FrameMorph();
    this.area.render = nop;
    this.area.add(this.snake);
    this.add(this.scoreValue);

    this.gameStatus = aGameStatus;

    this.headPos = new Point(1, 1);
    this.foods = [];
};

SnakeAreaMorph.prototype.buildPanes = function () {
    this.spawnFood();
    this.makeButtons();

    this.fixLayers();

    this.add(this.area);
    this.add(this.scoreValue);
};

SnakeAreaMorph.prototype.checkFoodAmount = function () {
    if (this.foods.length < 10) {
        this.spawnFood();
    }
};

SnakeAreaMorph.prototype.makeButtons = function () {
    var upBtn, downBtn, leftBtn, rightBtn, defaultColor = BLACK.lighter(20);

    upBtn = new TriggerMorph(this, "setSnakeDirectionUp");
    upBtn.color = defaultColor;
    upBtn.highlightColor = defaultColor.lighter(15);
    upBtn.pressColor = defaultColor.darker(15);
    upBtn.setLabel(new SymbolMorph("arrowUp", SnakeAreaMorph.BUTTON_HEIGHT - adjust(5)));

    downBtn = new TriggerMorph(this, "setSnakeDirectionDown");
    downBtn.color = defaultColor;
    downBtn.highlightColor = defaultColor.lighter(15);
    downBtn.pressColor = defaultColor.darker(15);
    downBtn.setLabel(new SymbolMorph("arrowDown", SnakeAreaMorph.BUTTON_HEIGHT - adjust(5)));

    leftBtn = new TriggerMorph(this, "setSnakeDirectionLeft");
    leftBtn.color = defaultColor;
    leftBtn.highlightColor = defaultColor.lighter(15);
    leftBtn.pressColor = defaultColor.darker(15);
    leftBtn.setLabel(new SymbolMorph("arrowLeft", SnakeAreaMorph.BUTTON_HEIGHT - adjust(5)));

    rightBtn = new TriggerMorph(this, "setSnakeDirectionRight");
    rightBtn.color = defaultColor;
    rightBtn.highlightColor = defaultColor.lighter(15);
    rightBtn.pressColor = defaultColor.darker(15);
    rightBtn.setLabel(new SymbolMorph("arrowRight", SnakeAreaMorph.BUTTON_HEIGHT - adjust(5)));

    this.buttons = {
        up: upBtn,
        down: downBtn,
        left: leftBtn,
        right: rightBtn
    };

    Object.values(this.buttons).forEach(v => {
        v.childThatIsA(SymbolMorph).setColor(WHITE);
    })

    this.add(this.buttons.up);
    this.add(this.buttons.down);
    this.add(this.buttons.left);
    this.add(this.buttons.right);
};

SnakeAreaMorph.prototype.fixLayers = function () {
    this.area.add(this.snake);
    this.add(this.buttons.up);
    this.add(this.buttons.down);
    this.add(this.buttons.left);
    this.add(this.buttons.right);
    this.add(this.scoreValue);
};

SnakeAreaMorph.prototype.spawnFood = function () {
    for (let f = 0; f < irand(15, 25); f++) {
        let food = new FoodMorph();
        let tX = irand(0, 29), tY = irand(0, 29);

        food.setPosition(new Point(MultiplayerSnakeGameMorph.CELL_SIZE * tX, MultiplayerSnakeGameMorph.CELL_SIZE * tY).translateBy(this.position()));

        this.foods.push({ food, pt: new Point(tX + 1, tY + 1) });

        this.area.addBack(food);
    }
    this.area.add(this.snake);
    this.fullChanged();

    if (this.world()) {
        this.fixLayers();
    }
};

SnakeAreaMorph.prototype.fixLayout = function () {
    var w = this.width(), h = this.height();

    if (!this.buttons) return;

    this.buttons.up.setExtent(new Point(w, SnakeAreaMorph.BUTTON_HEIGHT));
    this.buttons.down.setExtent(new Point(w, SnakeAreaMorph.BUTTON_HEIGHT));
    this.buttons.left.setExtent(new Point(SnakeAreaMorph.BUTTON_HEIGHT, h));
    this.buttons.right.setExtent(new Point(SnakeAreaMorph.BUTTON_HEIGHT, h));

    this.buttons.left.setPosition(this.position().subtract(new Point(SnakeAreaMorph.BUTTON_HEIGHT, 0)));
    this.buttons.right.setPosition(this.topRight());
    this.buttons.down.setPosition(this.bottomLeft());
    this.buttons.up.setPosition(this.position().subtract(new Point(0, SnakeAreaMorph.BUTTON_HEIGHT)));

    this.scoreValue.setCenter(this.center());

    this.area.setExtent(this.extent());
};

SnakeAreaMorph.prototype.setSnakeDirectionUp = function () {
    this.childThatIsA(SnakeMorph).direction = "up";
};

SnakeAreaMorph.prototype.setSnakeDirectionDown = function () {
    this.childThatIsA(SnakeMorph).direction = "down";
};

SnakeAreaMorph.prototype.setSnakeDirectionLeft = function () {
    this.childThatIsA(SnakeMorph).direction = "left";
};

SnakeAreaMorph.prototype.setSnakeDirectionRight = function () {
    this.childThatIsA(SnakeMorph).direction = "right";
};

SnakeAreaMorph.prototype.mouseClickLeft = function () {
    this.world().keyboardFocus = this;
}

SnakeAreaMorph.prototype.processKeyUp = function (ev) {
    if (ev.key === "ArrowUp") {
        this.childThatIsA(SnakeMorph).direction = "up";
    } else if (ev.key === "ArrowDown") {
        this.childThatIsA(SnakeMorph).direction = "down";
    } else if (ev.key === "ArrowLeft") {
        this.childThatIsA(SnakeMorph).direction = "left";
    } else {
        this.childThatIsA(SnakeMorph).direction = "right";
    }
    this.childThatIsA(SnakeMorph).move();
};

SnakeAreaMorph.prototype.snakeMoved = function () {
    this.headPos = this.snake.position().subtract(this.position()).divideBy(SnakeMorph.HEAD_SIZE);
    if (this.headPos.x < 0 || this.headPos.x > 29 || this.headPos.y < 0 || this.headPos.y > 29) {
        this.snake.canMove = false;
        this.fixLayers();
        this.didDie = true;
        this.showOutOfBoundsScreen();
    }

    let fewd = this.foods.find(v => v.pt.eq(this.snake.head));
    if (!isNil(fewd)) {
        this.snake.consume(fewd);
        this.parentThatIsA(SnakeGameMorph).playTone(this.gameStatus.whichSide === "left" ? -1 : 1);
    }
};

SnakeAreaMorph.prototype.updateScore = function () {
    this.scoreValue.text = this.gameStatus.playerScore.toString();
    this.scoreValue.rerender();
    this.scoreValue.changed();
    this.scoreValue.fixLayout();
};

SnakeAreaMorph.prototype.resetThisBoard = function () {
    this.gameStatus.reset();
    this.area.children.filter(v => v instanceof FoodMorph).forEach(v => v.destroy());
    this.foods = [];
    this.headPos = new Point(1, 1);
    this.snake.destroy();
    this.snake = new SnakeMorph();
    this.snake.board = this;
    this.snake.setPosition(this.position());
    this.area.add(this.snake);
    this.didDie = false;
    this.spawnFood();
    this.fixLayers();

    this.updateScore();

    this.children.filter(v => v instanceof ScreenMorph).forEach(v => v.destroy());
};

SnakeAreaMorph.prototype.showOutOfBoundsScreen = function () {
    if (!this.didDie) return;
    this.snake.canMove = false;
    
    var screen = new ScreenMorph();
    screen.screenType = ScreenMorph.OP_CONTROLLED;
    screen.setBody(new StringMorph("You lost!", adjust(36), "monospace", true, false, null, null, null, WHITE));
    screen.popUpIn(this);
};