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
    this.init();

    this.doesMoveIndependently = doesMoveIndependently || true;
}

SnakeMorph.prototype.init = function () {
    SnakeMorph.uber.init.call(this);

    this.tail = []; // tail format { direction: "up/down/left/right", depth: int }
    this.direction = "down";
    this.fps = 0.5

    this.headPos = new Point();
    this.board = null;

    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE));
};

SnakeMorph.prototype.step = function () {
    if (!this.doesMoveIndependently) return;

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
    }

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
    var head = this.headPos.multiplyBy(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE)).subtract(
        new Point(
            this.position().subtract(this.board.position()).divideBy(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE))
        )
    )

    ctx.fillStyle = SnakeMorph.CLR_HEAD.toString();
    //ctx.fillRect(head.x * MultiplayerSnakeGameMorph.CELL_SIZE, head.y * MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE);

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
    this.buildPanes();
    aWorld.add(this);

    /* let snake = new SnakeMorph(true);
    snake.board = this;
    snake.headPos = new Point(1, 1);
    this.add(snake); */

    this.setExtent(aWorld.extent());
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
    this.add(new SnakeAreaMorph());
    this.childThatIsA(SnakeAreaMorph).snake.board = this;
}

FoodMorph.prototype = new Morph();
FoodMorph.prototype.constructor = FoodMorph;
FoodMorph.uber = Morph.prototype;

function FoodMorph () {
    this.init();
}

FoodMorph.prototype.init = function () {
    FoodMorph.uber.init.call(this);

    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE, MultiplayerSnakeGameMorph.CELL_SIZE))
};

SnakeAreaMorph.prototype = new FrameMorph();
SnakeAreaMorph.prototype.constructor = SnakeAreaMorph;
SnakeAreaMorph.uber = FrameMorph.prototype;

function SnakeAreaMorph () {
    this.init();
}

SnakeAreaMorph.prototype.init = function () {
    SnakeAreaMorph.uber.init.call(this);
    this.setExtent(new Point(MultiplayerSnakeGameMorph.CELL_SIZE * 30, MultiplayerSnakeGameMorph.CELL_SIZE * 30));

    this.snake = new SnakeMorph();
    this.add(this.snake);

    this.spawnFood();
};

SnakeAreaMorph.prototype.spawnFood = function () {
    for (let f = 0; f < irand(15, 25); f++) {
        let food = new FoodMorph();
        food.setPosition(new Point(MultiplayerSnakeGameMorph.CELL_SIZE * irand(0, 29), MultiplayerSnakeGameMorph.CELL_SIZE * irand(0, 29)));
        this.add(food);
    }
};