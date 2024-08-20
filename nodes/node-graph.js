// NodeGraphMorph: referenced constructors

var SelectionMorph;
var NodeGraphMorph;
var NodeMorph;
var NodeTemplate;
var NodeParamMorph;
var SequenceFlowMorph;
var InfoPopupIconMorph;

// SelectionMorph inherits from BlinkerMorph:

SelectionMorph.prototype = new BlinkerMorph();
SelectionMorph.prototype.constructor = SelectionMorph;
SelectionMorph.uber = BlinkerMorph.prototype;

function SelectionMorph (aMorph) {
    this.init(aMorph);
};

SelectionMorph.prototype.init = function (aMorph) {
    SelectionMorph.uber.init.call(this, 1);

    this.morph = aMorph;
    this.bounds = this.morph.fullBounds().expandBy(15);
    this.color = WHITE;
};

///////////////////////////////////////////////////////////////////
// NodeGraphMorph /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// NodeGraphMorph inherits from FrameMorph:

NodeGraphMorph.prototype = new FrameMorph();
NodeGraphMorph.prototype.constructor = NodeGraphMorph;
NodeGraphMorph.uber = FrameMorph.prototype;

// NodeGraphMorph instance creation:

function NodeGraphMorph () {
    this.init();
};

// NodeGraphMorph initialization:

NodeGraphMorph.prototype.init = function () {
    NodeGraphMorph.uber.init.call(this);

    this.color = new Color(50, 50, 50);
    this.renderLayer = null; // draw pass number
};

NodeGraphMorph.prototype.fullDrawOn = function () {
    if (!this.isVisible) return;
    this.renderLayer = 1;
    this.drawOn(aContext, aRect);
    for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        child.fullDrawOn(aContext, aRect);
    }
    this.renderLayer = 2;
    this.drawOn(aContext, aRect);
};

/** @param {CanvasRenderingContext2D} ctx */
NodeGraphMorph.prototype.render = function (ctx) {
    if (this.renderLayer === 1) {
        NodeGraphMorph.uber.render.call(this, ctx);
    } else {
        
    }
};

///////////////////////////////////////////////////////////////////
// NodeTemplate ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

NodeTemplate.prototype = {};
NodeTemplate.prototype.constructor = NodeTemplate;

function NodeTemplate () {

}

///////////////////////////////////////////////////////////////////
// NodeMorph //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// NodeMorph inherits from BoxMorph:

NodeMorph.prototype = new BoxMorph();
NodeMorph.prototype.constructor = NodeMorph;
NodeMorph.uber = BoxMorph.prototype;

// NodeMorph settings:

NodeMorph.DEFAULT_TITLE_HEIGHT = 23;

// NodeMorph instance creation:

function NodeMorph (aTemplate) {
    this.init(aTemplate);
};

// NodeMorph initialization:

NodeMorph.prototype.init = function (aTemplate) {
    // initialize inherited properties:
    NodeMorph.uber.init.call(this, 15, 3);

    // additional properties:
    this.title = null;
    this.body = null;
    this.titleBarHeight = NodeMorph.DEFAULT_TITLE_HEIGHT;
    this.infoIcon = null;

    /** @type {NodeTemplate} */
    this.blueprintTemplate = aTemplate;

    // override inherited properites:
    this.color = new Color(91, 91, 91);
    this.titleColor = new Color(0, 128, 204);

    this.buildNode();
    this.fixLayout();
};

// NodeMorph draw:

/** @param {CanvasRenderingContext2D} ctx */
NodeMorph.prototype.render = function (ctx) {
    if ((this.edge === 0) && (this.border === 0)) {
        BoxMorph.uber.render.call(this, ctx);
        return;
    }
    ctx.save()
    ctx.beginPath();
    this.outlinePath(
        ctx,
        Math.max(this.edge - this.border, 0),
        this.border
    );
    ctx.closePath();
    ctx.clip();

    // bg draw:

    var grad = ctx.createLinearGradient(0, 0, 0, this.height());
    grad.addColorStop(0, this.color.toString());
    grad.addColorStop(1, this.color.darker(10).toString());
    ctx.fillStyle = grad;
    ctx.beginPath();
    this.outlinePath(
        ctx,
        Math.max(this.edge - this.border, 0),
        this.border
    );
    ctx.closePath();
    ctx.fill();

    // title bg draw:
    ctx.fillStyle = this.titleColor;
    ctx.fillRect(0, 0, this.width(), this.titleBarHeight);

    ctx.restore();

    // border draw:
    if (this.border > 0) {
        ctx.lineWidth = this.border;
        ctx.strokeStyle = this.borderColor.toString();
        ctx.beginPath();
        this.outlinePath(ctx, this.edge, this.border / 2);
        ctx.closePath();
        ctx.stroke();
    };
};

NodeMorph.prototype.fixLayout = function () {
    var p = this.position(), w = this.width(), h = this.height();

    this.title.setCenter(new Point(
        (this.title.width() / 2) + 15,
        this.titleBarHeight / 2
    ).add(p));

    this.infoIcon.setCenter(new Point(
        w - 24, (this.titleBarHeight / 2) + 1
    ).add(p));
};

NodeMorph.prototype.buildNode = function () {
    var title, infoIcon;

    title = new StringMorph("NodeMorph", 16, "monospace", true);
    title.setColor(this.titleColor.inverted().isCloseTo(WHITE, false, 50) ? WHITE : BLACK);

    infoIcon = new InfoPopupIconMorph(`This is a NodeMorph`);
    infoIcon.setExtent(new Point(16, 16));

    this.title = title;
    this.infoIcon = infoIcon;
    this.add(this.title);
    this.add(this.infoIcon);
};

///////////////////////////////////////////////////////////////////
// NodeParamMorph /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

NodeParamMorph.prototype = new Morph();
NodeParamMorph.prototype.constructor = NodeParamMorph;
NodeParamMorph.uber = Morph.prototype;

function NodeParamMorph () {
    this.init();
}

NodeParamMorph.prototype.init = function () {

};

///////////////////////////////////////////////////////////////////
// SequenceFlowMorph //////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// SequenceFlowMorph inherits from FrameMorph:

SequenceFlowMorph.prototype = new Morph();
SequenceFlowMorph.prototype.constructor = SequenceFlowMorph;
SequenceFlowMorph.uber = Morph.prototype;

// SequenceFlowMorph instance creation:

function SequenceFlowMorph () {
    this.init();
};

// SequenceFlowMorph initialization:

SequenceFlowMorph.prototype.init = function () {
    SequenceFlowMorph.uber.init.call(this);
};

///////////////////////////////////////////////////////////////////
// InfoPopupIconMorph /////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

InfoPopupIconMorph.prototype = new Morph();
InfoPopupIconMorph.prototype.constructor = InfoPopupIconMorph;
InfoPopupIconMorph.uber = Morph.prototype;

// InfoPopupIconMorph instance creation:

function InfoPopupIconMorph (aDescription) {
    this.init(aDescription);
}

// InfoPopupIconMorph initialization:

InfoPopupIconMorph.prototype.init = function (aDescription) {
    InfoPopupIconMorph.uber.init.call(this);
    
    // override inherited properites:
    this.color = WHITE;

    // additional properties:
    this.questionMark = new StringMorph("?", 16, "sans-serif", true);
    this.questionMark.color = new Color(232, 173, 12);
    this.add(this.questionMark);

    this.lastTimeout = null;
    this.textDescr = aDescription;

    // make round;
    this.setExtent(new Point(20, 20));
};

// no no change size.
InfoPopupIconMorph.prototype.setExtent = function (aPoint) {
	var size = Math.min(aPoint.x, aPoint.y);
    InfoPopupIconMorph.uber.setExtent.call(this, new Point(size, size));
};

InfoPopupIconMorph.prototype.render = function (ctx) {
    var r = this.width();

    ctx.fillStyle = this.color.toString();

    ctx.beginPath();
    ctx.arc(r / 2, r / 2, r / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
};

InfoPopupIconMorph.prototype.fixLayout = function () {
    this.questionMark.fontSize = this.width() / 1.3;
    this.questionMark.fixLayout(true);
    this.questionMark.setCenter(this.center());
};

InfoPopupIconMorph.prototype.mouseEnter = function () {
    var self = this;
    this.lastTimeout = setTimeout(() => {
        var bubble = new SpeechBubbleMorph(self.textDescr);
        bubble.popUp(self.world(), self.rightCenter(), false);
        self.lastBubble = bubble;
    }, 250);
};

InfoPopupIconMorph.prototype.mouseLeave = function () {
    if (this.lastBubble instanceof SpeechBubbleMorph) {
        clearTimeout(this.lastTimeout);
        this.lastBubble.destroy();
        this.lastBubble = null;
    }
};