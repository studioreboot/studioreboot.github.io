TriggerMorph.prototype.setLabel = function (aMorph) {
    if (this.label) this.label.destroy();
    this.label = aMorph;
    this.add(this.label);
    this.fixLayout();
};

var SnakeMorph;
var FoodMorph;
var MultiplayerSnakeGameMorph;
var SnakeAreaMorph;

function adjust (v, useHeight = false) {
    if (useHeight) {
        return (v / 599) * innerHeight;
    }
    return (v / 1366) * innerWidth;
};

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

MultiplayerSnakeGameMorph.CELL_SIZE = adjust(15);

SnakeMorph.prototype = new Morph();
SnakeMorph.prototype.constructor = SnakeMorph.prototype;
SnakeMorph.uber = Morph.prototype;

function SnakeMorph (doesMoveIndependently) {
    this.init(doesMoveIndependently);
}

SnakeMorph.prototype.init = function (doesMoveIndependently) {
    SnakeMorph.uber.init.call(this);

    this.tail = []; // tail format { direction: "up/down/left/right", depth: int }
    this.direction = "down";
    this.fps = 9;
    this.doesMoveIndependently = doesMoveIndependently || true;
    this.canMove = true;

    this.board = null;

    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE));
};

SnakeMorph.prototype.step = function () {
    if ((!this.doesMoveIndependently) || (!this.canMove)) return;

    this.move();
};

SnakeMorph.prototype.move = function () {
    switch (this.direction) {
        case "up":
            this.setTop(this.top() - MultiplayerSnakeGameMorph.CELL_SIZE);
            break;
        case "down":
            this.setTop(this.top() + MultiplayerSnakeGameMorph.CELL_SIZE);
            break;
        case "left":
            this.setLeft(this.left() - MultiplayerSnakeGameMorph.CELL_SIZE);
            break;
        case "right":
            this.setLeft(this.left() + MultiplayerSnakeGameMorph.CELL_SIZE);
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
};

SnakeMorph.prototype.addTail = function () {
    this.tail.push({ direction: this.tail[this.tail.length - 1], depth: this.tail[this.tail.length - 1].depth });
};

SnakeMorph.CLR_LIGHTGREEN = new Color(85, 255, 20);
SnakeMorph.CLR_DARKGREEN = new Color(10, 194, 0);
SnakeMorph.CLR_HEAD = new Color(204, 46, 0);

/** @param {CanvasRenderingContext2D} ctx */
SnakeMorph.prototype.render = function (ctx) {
    /* var head = this.headPos.multiplyBy(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE)).subtract(
        new Point(
            this.position().subtract(this.board.position()).divideBy(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE))
        )
    )

    ctx.fillStyle = SnakeMorph.CLR_HEAD.toString();
    //ctx.fillRect(head.x * MultiplayerSnakeGameMorph.CELL_SIZE, head.y * MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE);
 */
    ctx.fillRect(0, 0, 15, 15);
}

MultiplayerSnakeGameMorph.prototype = new FrameMorph();
MultiplayerSnakeGameMorph.prototype.constructor = MultiplayerSnakeGameMorph;
MultiplayerSnakeGameMorph.uber = FrameMorph.prototype;

function MultiplayerSnakeGameMorph () {
    this.init();

    this.color = BLACK;
};

MultiplayerSnakeGameMorph.prototype.init = function () {
    MultiplayerSnakeGameMorph.uber.init.call(this);
};

MultiplayerSnakeGameMorph.prototype.openIn = function (aWorld) {
    aWorld.add(this);

    /* let snake = new SnakeMorph(true);
    snake.board = this;
    snake.headPos = new Point(1, 1);
    this.add(snake); */

    this.setExtent(aWorld.extent());
    this.buildPanes();
};

MultiplayerSnakeGameMorph.prototype.mouseClickLeft = function () {
    this.world().keyboardFocus = this;
}

MultiplayerSnakeGameMorph.prototype.processKeyUp = function (ev) {
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
    console.log(ev.key);
};

MultiplayerSnakeGameMorph.prototype.buildPanes = function () {
    let area = new SnakeAreaMorph();
    area.buildPanes();
    area.setCenter(this.center());
    area.fixLayout();
    this.add(area);
};

MultiplayerSnakeGameMorph.prototype.reactToWorldResize = function () {
    this.childThatIsA(SnakeAreaMorph).setCenter(this.center());
}

FoodMorph.prototype = new Morph();
FoodMorph.prototype.constructor = FoodMorph;
FoodMorph.uber = Morph.prototype;

function FoodMorph () {
    this.init();
};

FoodMorph.prototype.init = function () {
    FoodMorph.uber.init.call(this);

    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE))

    this.foodType = 1;
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
            ctx.lineTo(w / 2 - adjust(5), adjust(2.5));
            ctx.closePath();
            ctx.stroke();
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

function SnakeAreaMorph () {
    this.init();
}

SnakeAreaMorph.prototype.init = function () {
    SnakeAreaMorph.uber.init.call(this);
    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE * 30, MultiplayerSnakeGameMorph.CELL_SIZE * 30));

    this.snake = new SnakeMorph();
    this.snake.board = this;
    this.add(this.snake);

    this.headPos = new Point(1, 1);
    this.foods = [];
};

SnakeAreaMorph.prototype.buildPanes = function () {
    this.spawnFood();
    this.makeButtons();
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

SnakeAreaMorph.prototype.spawnFood = function () {
    for (let f = 0; f < irand(15, 25); f++) {
        let food = new FoodMorph();
        let tX = irand(0, 29), tY = irand(0, 29);

        food.setPosition(new Point(MultiplayerSnakeGameMorph.CELL_SIZE * tX, MultiplayerSnakeGameMorph.CELL_SIZE * tY));

        this.foods.push({ food, x: tX, y: tY });

        this.add(food);
    }
    this.add(this.snake);
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

SnakeAreaMorph.prototype.snakeMoved = function (whichDirection) {
    switch (whichDirection) {
        case "up":
            this.headPos.y--;
            break;
        case "down":
            this.headPos.y++;
            break;
        case "left":
            this.headPos.x--;
            break;
        case "right":
            this.headPos.x++;
            break;
        default: break;
    }
}