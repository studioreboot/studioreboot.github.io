TriggerMorph.prototype.setLabel = function (aMorph) {
    if (this.label) this.label.destroy();
    this.label = aMorph;
    this.add(this.label);
    this.fixLayout();
};

var SnakeMorph;
var SnakeTailMorph;
var FoodMorph;
var MultiplayerSnakeGameMorph;
var SnakeAreaMorph;

function adjust (v, useHeight = false) {
    if (useHeight) {
        return (v / 599) * innerHeight;
    }
    return (v / 1325) * innerWidth;
};

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

MultiplayerSnakeGameMorph.CELL_SIZE = adjust(12);

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
    this.board.playerScore += foodObj.food.foodType * 5;
    foodObj.food.destroy();

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

    this.foodType = irand(1, 2);
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

    this.playerScore = 0;
    this.snake = new SnakeMorph();
    this.scoreValue = new StringMorph("", adjust(18), "monospace", true, false, true, null, null, WHITE);
    this.add(this.scoreValue);
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

        this.foods.push({ food, pt: new Point(tX + 1, tY + 1) });

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

    this.scoreValue.setPosition(this.position());
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

SnakeAreaMorph.prototype.snakeMoved = function () {
    this.headPos = this.snake.position().subtract(this.position()).divideBy(SnakeMorph.HEAD_SIZE);
    if (this.headPos.x < 0 || this.headPos.x > 30 || this.headPos.y < 0 || this.headPos.y > 30) {
        this.snake.canMove = false;
    }

    let fewd = this.foods.find(v => v.pt.eq(this.snake.head));
    if (!isNil(fewd)) {
        this.snake.consume(fewd);
    }
};

SnakeAreaMorph.prototype.updateScore = function () {
    this.scoreValue.text = this.playerScore.toString();
    this.scoreValue.rerender();
    this.scoreValue.changed();
    this.scoreValue.fixLayout();
};