/*
    node-graph.js

    A basic web node graph library based on morphic.js

    requires:
    - node-engine.js
    - morphic.js

    contains:
    - node morphs
    - program nodes and it's own engine.

    how it works:
    - a NodeMorph requires it's own ProgramNode to figure out what it is suppose to
    display graphically, and what it's suppose to do.
    - a ProgramNode requires a NodeEngine, which links it up to all the other ProgramNodes.
    - ProgramNodes and NodeMorphs both require eachother. Why? They're marrie- They need the info from each
    other. Think of it like a client and server. One needs to sync up with the other.
*/

const isDevMode = true;

const PINK = new Color(255, 105, 180);

// type colors:

var typeColors = {
    wave: new Color(44, 185, 36),
    number: new Color(20, 97, 255),
    bool: new Color(255, 153, 0),
    audiostream: new Color(190, 20, 255),
    unknown: new Color(33, 33, 45)
};

// NodeGraphMorph: referenced constructors

var SelectionMorph;
var NodeGraphMorph;
var NodeMorph;
var NodeTemplate;
var ParameterContainerMorph;
var NodeBodyMorph;
var AttachmentMorph;
var NodeLinkerMorph;
var InfoPopupIconMorph;
var InfoPopupMorph;
var ConnectionMorph;

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
// AttachmentMorph ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

/*
    I serve one purpose, and that purpose is connect to nodes together.

    A NodeLinkerMorph will create me upon the mouse moving (and it's left button being down.).

    Should I be dropped, I will check if there are any Linkers near me and connect those
    two together. If I am dropped and there is no linkers near me, I will destroy the connection.
*/

// AttachmentMorph inherits from Morph:

AttachmentMorph.prototype = new Morph();
AttachmentMorph.prototype.constructor = AttachmentMorph;
AttachmentMorph.uber = Morph.prototype;

// AttachmentMorph instance creation:

function AttachmentMorph (aConnection, aLinker) {
    this.init(aConnection, aLinker);
};

// AttachmentMorph initialization:

AttachmentMorph.prototype.init = function (aConnection, aLinker) {
    AttachmentMorph.uber.init.call(this);

    this.updateTick = 5;
    this.connection = aConnection; // the connection of which we'll connect to another linker (if any.)
    this.linker = aLinker; // the linker of which this attachment was created from.

    this.setExtent(new Point(4, 4));
}

// AttachmentMorph mouse handling:

AttachmentMorph.prototype.render = nop;

AttachmentMorph.prototype.changed = function () {
    AttachmentMorph.uber.changed.call(this);

    if (this.connection) this.connection.update();
};

AttachmentMorph.prototype.justDropped = function () {
    var world = this.world();
    this.destroy();
    var morph = world.topMorphAt(this.position());
    if (morph instanceof NodeLinkerMorph) {
        if (morph.parentThatIsA(NodeMorph) === this.linker.parentThatIsA(NodeMorph) || morph.isInput === this.linker.isInput) {
            this.linker.severeConnection();
        } else {
            this.connection.setInputAndOutput(this.linker.isInput ? this.linker : morph, this.linker.isInput ? morph : this.linker);
            this.connection.update();
        }
    } else {
        this.linker.severeConnection();
    }
};

AttachmentMorph.prototype.moveBy = function (delta) {
    AttachmentMorph.uber.moveBy.call(this, delta);
    if (this.updateTick > 0) {
        this.updateTick--;
    }

    if (this.updateTick === 0) {
        if (this.connections.length && this.parentThatIsA(HandMorph)) {
            for (let idx = 0; idx < this.connections.length; idx++) {
                this.connections[idx].update();
            }
        }
    }

    this.updateTick = 5;
};

///////////////////////////////////////////////////////////////////
// NodeGraphMorph /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// NodeGraphMorph inherits from FrameMorph:

NodeGraphMorph.prototype = new FrameMorph();
NodeGraphMorph.prototype.constructor = NodeGraphMorph;
NodeGraphMorph.uber = FrameMorph.prototype;

// NodeGraphMorph instance creation:

function NodeGraphMorph (aNodeEngine) {
    this.init(aNodeEngine);
};

// NodeGraphMorph initialization:

NodeGraphMorph.prototype.init = function (aNodeEngine) {
    NodeGraphMorph.uber.init.call(this);

    this.color = new Color(25, 30, 35);
    /** @type {NodeEngine} */
    this.nodeEngine = aNodeEngine;

    this.setBackgroundTexture();

    this.onNextStep = () => {
        var node = new NodeMorph(new ProcessNode());
        this.add(node);
        node.setCenter(this.center());
    };
};

NodeGraphMorph.prototype.setBackgroundTexture = function () {
    this.cachedTexture = (function(){
        var canvas = document.createElement('canvas');
        normalizeCanvas(canvas);

        var ctx = canvas.getContext("2d");
        canvas.width = 50;
        canvas.height = 50;
        ctx.strokeStyle = new Color(25, 30, 35).lighter(8).toString();
        ctx.fillStyle = "rgb(25,30,35)";
        ctx.lineWidth = 2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        return canvas;
    })();
};

NodeGraphMorph.prototype.userMenu = function () {
    var menu = new MenuMorph(this, "Create Node");
    this.nodeEngine.registeredNodes.forEach(node => {

    });
    if (isDevMode || this.world().isDevMode) {
        menu.addItem(
            "dev node.",
            () => {
                var node = new NodeMorph(new ProcessNode());
                node.pickUp(this.world());
            }
        )
    }
    return menu;
};

NodeGraphMorph.prototype.wantsDropOf = function (aMorph) {
    if (aMorph instanceof AttachmentMorph) {
        return true; // it'll remove itself anyway.
    }
    if (!(aMorph instanceof NodeMorph)) {
        return false;
    }
    return true;
};

///////////////////////////////////////////////////////////////////
// NodeMorph //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

/*
    I am node in an NodeGraphMorph.
    
    I require a ProgramNode and a NodeGraphMorph in order to function.
*/

// NodeMorph inherits from BoxMorph:

NodeMorph.prototype = new BoxMorph();
NodeMorph.prototype.constructor = NodeMorph;
NodeMorph.uber = BoxMorph.prototype;

// NodeMorph settings:

NodeMorph.DEFAULT_TITLE_HEIGHT = 23;

// NodeMorph instance creation:

function NodeMorph (aProcessNode) {
    this.init(aProcessNode);
};

// NodeMorph initialization:

NodeMorph.prototype.init = function (aProcessNode) {
    // initialize inherited properties:
    NodeMorph.uber.init.call(this, 15, 3);

    // additional properties:
    this.title = null;
    this.body = null;
    this.titleBarHeight = NodeMorph.DEFAULT_TITLE_HEIGHT;
    this.infoIcon = null;
    this.hasBuiltNodeYet = false;

    // implementing this shit will be scary.
    this.scale = 1; // display scale, "fixNodeLayout" will fix node layout.
    /** @type {ProcessNode} */
    this.processNode = aProcessNode;
    this.paramPadding = 10;

    // override inherited properites:
    this.color = new Color(91, 91, 91);
    this.titleColor = new Color(0, 128, 204);
    this.isDraggable = true;
    this.noDropShadow = true;
    this.fullShadowSource = false;

    this.buildNode();
    this.fixLayout();
};

// NodeMorph draw:

// slightly altered version of BoxMorph.render

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
    grad.addColorStop(1, this.color.darker(20).toString());
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
    grad = ctx.createLinearGradient(0, 0, this.width(), 0);
    grad.addColorStop(0, this.titleColor.darker(25).toString());
    grad.addColorStop(0.25, this.titleColor.darker(25).toString());
    grad.addColorStop(1, this.titleColor.toString());
    ctx.fillStyle = grad;
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

    if (!this.hasBuiltNodeYet) return;

    this.title.setCenter(new Point(
        (this.title.width() / 2) + 15,
        this.titleBarHeight / 2
    ).add(p));

    this.infoIcon.setCenter(new Point(
        w - 24, (this.titleBarHeight / 2) + 1
    ).add(p));

    this.body.setWidth(this.width() - (this.paramPadding * 2));
    this.body.setCenter(this.center());
    this.body.setTop(this.top() + this.border + this.titleBarHeight);

    // morph shadow:
    if (this.extent().ge(ZERO.add(1))) {
        this.removeShadow();
        this.addShadow(null, 0.4);
        this.getShadow().setPosition(this.position());
    }
};

NodeMorph.prototype.buildNode = function () {
    this.setExtent(new Point(0, 0));
    this.createTopbarElements();
    this.createBody();

    this.hasBuiltNodeYet = true;
    this.fixLayout();

    this.removeShadow();
    fb = this.fullBounds();
    this.setExtent(fb.extent().add(4).add(new Point(10, 5)));
};

NodeMorph.prototype.createTopbarElements = function () {
    var title, infoIcon;

    var className = this.processNode.nodeTitle || (this.constructor.name || this.constructor.toString().split(' ')[1].split('(')[0]);

    title = new StringMorph(className, 16, "monospace", true);
    title.setColor(this.titleColor.inverted().isCloseTo(WHITE, false, 50) ? WHITE : BLACK);
    title.isEditable = world.isDevMode;

    infoIcon = new InfoPopupIconMorph(this.processNode.info || `${className}:
        A generic node used for testing/development\npurposes.
        
        It serves no use as of the given moment.`);
    infoIcon.setExtent(new Point(16, 16));

    this.title = title;
    this.infoIcon = infoIcon;
    this.add(this.title);
    this.add(this.infoIcon);
};

NodeMorph.prototype.createBody = function () {
    var body = new NodeBodyMorph(this, this.processNode);
    this.processNode.buildBody(body);
    this.body = body;
    this.add(this.body);
};

NodeMorph.prototype.userMenu = function () {
    var menu = new MenuMorph(this);
    menu.addItem(
        "destroy node...",
        () => {
            this.destroy();
        }
    );
    return menu;
};

NodeMorph.prototype.destroy = function () {
    NodeMorph.uber.destroy.call(this);
    this.forAllChildren(c => {
        if (c instanceof NodeLinkerMorph) {
            c.severeConnection();
        }
    });
};

NodeMorph.prototype.justDropped = function () {
    this.forAllChildren(c => {
        if (c instanceof NodeLinkerMorph) {
            c.connections.forEach(conn => conn.update(true));
        }
    });
};

///////////////////////////////////////////////////////////////////
// NodeBodyMorph //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

/*
    I am the body the user sees inside of a Node.
    
    I contain various functions that can be used by a ProgramNode to see
    various connections and my various parameters.

    If you want to, you could basically call me the Avatar.
*/

// NodeBodyMorph inherits from Morph:

NodeBodyMorph.prototype = new Morph();
NodeBodyMorph.prototype.constructor = NodeBodyMorph;
NodeBodyMorph.uber = Morph.prototype;

// NodeBodyMorph settings:

NodeBodyMorph.STANDARD_TEXT_SIZE = 9.5;
NodeBodyMorph.STANDARD_TEXT_FONT = "monospace";
NodeBodyMorph.PADDING = 2.5;

// NodeBodyMorph instance creation:

function NodeBodyMorph (aNodeMorph, aProcessNode) {
    this.init(aNodeMorph, aProcessNode);
};

// NodeBodyMorph initialization:

NodeBodyMorph.prototype.init = function (aNodeMorph, aProcessNode) {
    // initialize inherited properties:
    NodeBodyMorph.uber.init.call(this);

    // additional properties:
    this.nodeMorph = aNodeMorph;
    this.process = aProcessNode;
    this.isBuilding = true;

    // a list that will be expanded upon by a ProcessNode, via it's "buildBody" function.
    // this list will become empty once "finalize" is called.
    this.unfinalizedContents = [];

    // override inherited properites:
    this.color = PINK.darker(35);
};

// NodeBodyMorph rendering:

if (!isDevMode) NodeBodyMorph.prototype.render = nop;

// NodeBodyMorph - adding additional contents:

NodeBodyMorph.prototype.addText = function (text) {
    if (!this.isBuilding) return;
    this.unfinalizedContents.push(
        new TextMorph(text, NodeBodyMorph.STANDARD_TEXT_SIZE, NodeBodyMorph.STANDARD_TEXT_FONT, false, true)
    );
};

NodeBodyMorph.prototype.addParam = function (paramName, paramType, defaultValue, isInput) {
    if (!this.isBuilding) return;
    var param = new ParameterContainerMorph({
        name: paramName,
        acceptedType: paramType,
        value: defaultValue
    }, isInput);
    this.unfinalizedContents.push(param);
};

// NodeBodyMorph - finalizing contents and sorting each item:

NodeBodyMorph.prototype.finalize = function () {
    this.setExtent(new Point(0, 0));

    this.unfinalizedContents.forEach(c => {
        if (c instanceof StringMorph || c instanceof TextMorph) {
            c.color = WHITE;
        }
        this.add(c);
        if (c instanceof ParameterContainerMorph) {
            c.build();
        }
    });
    this.fixLayout();

    this.setExtent(this.fullBounds().extent());
    this.children.forEach(c => {
        if (c instanceof ParameterContainerMorph) {
            c.fixLayout();
        }
    })
};

// NodeBodyMorph - fixing layout:

NodeBodyMorph.prototype.fixLayout = function () {
    var cY = this.top();

    for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        child.fixLayout();
        child.setTop(cY);
        cY += child.fullBounds().height();
        cY += NodeBodyMorph.PADDING;
    }
};

///////////////////////////////////////////////////////////////////
// NodeLinkerMorph ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// NodeLinkerMorph inherits from Morph:

NodeLinkerMorph.prototype = new Morph();
NodeLinkerMorph.prototype.constructor = NodeLinkerMorph;
NodeLinkerMorph.uber = Morph.prototype;

// NodeLinkerMorph instance creation:

function NodeLinkerMorph (aParamContainer) {
    this.init(aParamContainer);
};

// NodeLinkerMorph initialization:

NodeLinkerMorph.prototype.init = function (aParamContainer) {
    NodeLinkerMorph.uber.init.call(this);

    // additonal properties:
    this.connections = [];
    this.newConnection = null;
    this.container = aParamContainer;
    this.isDraggable = false;
    this.updateTick = 0;

    // overriding inherited properties:
    this.typeColor = WHITE;
    if (this.container) this.typeColor = typeColors[this.container.paramInfo.acceptedType];
    this.color = this.typeColor.copy();
    this.outlineColor = new Color(25, 25, 25);
    this.outlineWidth = 1.5;

    this.setExtent(new Point(15, 15));
};

Object.defineProperty(NodeLinkerMorph.prototype, "isInput", {
    get: function () {
        if (!this.container) {
            return null;
        }
        return this.container.isInput;
    }
});

/** @returns {NodeMorph|null} */
NodeLinkerMorph.prototype.node = function () {
    return this.parentThatIsA(NodeMorph) || null;
};

/** @param {CanvasRenderingContext2D} ctx */ // because i'm a widdle baby who needs their hand to be held.
NodeLinkerMorph.prototype.render = function (ctx) {
    var w = this.width(), h = this.height();
    
    ctx.fillStyle = this.color.toString();
    ctx.strokeStyle = this.outlineColor.toString();

    ctx.lineWidth = this.outlineWidth;

    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, (w / 2) - ctx.lineWidth, (h / 2) - ctx.lineWidth, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
};

// no no change size.
NodeLinkerMorph.prototype.setExtent = function (aPoint) {
	var size = Math.min(aPoint.x, aPoint.y);
    NodeLinkerMorph.uber.setExtent.call(this, new Point(size, size));
};

NodeLinkerMorph.prototype.mouseEnter = function () {
    this.color = this.typeColor.lighter(15);
    this.changed();
};

NodeLinkerMorph.prototype.step = function () {
    if (this.updateTick > 0) {
        this.updateTick--;
    }
}

NodeLinkerMorph.prototype.mouseLeave = function () {
    this.color = this.typeColor.copy();
    this.changed();
};

NodeLinkerMorph.prototype.rootForGrab = function () {
    return this.world();
};

NodeLinkerMorph.prototype.mouseClickLeft = function () {
    if (this.newConnection) {
        this.severeConnection();
    }
}

NodeLinkerMorph.prototype.mouseDownLeft = function () {
    if (!this.connection) {
        var attach = new AttachmentMorph(null, this);
        this.newConnection = new ConnectionMorph(this.isInput ? this : attach, this.isInput ? attach : this);
        attach.connection = this.newConnection;
        attach.pickUp(this.world());
        this.parentThatIsA(NodeGraphMorph).addBack(this.newConnection);
    }
};

NodeLinkerMorph.prototype.severeConnection = function () {
    this.newConnection.destroy();
    this.newConnection = null;
};

NodeLinkerMorph.prototype.moveBy = function (delta) {
    NodeLinkerMorph.uber.moveBy.call(this, delta);
    if (this.connections.length && this.parentThatIsA(HandMorph)) {
        for (let idx = 0; idx < this.connections.length; idx++) {
            this.connections[idx].update();
        }
    }
};

NodeLinkerMorph.prototype.removeConnection = function (conn) {
    if (this.newConnection === conn) {
        this.newConnection = null;
    }
    if (this.connections.indexOf(conn) !== -1) {
        this.connections.splice(this.connections.indexOf(conn), 1);
    }
};

NodeLinkerMorph.prototype.addConnection = function (conn) {
    if (this.newConnection === conn) {
        this.newConnection = null;
    }
    if (this.connections.indexOf(conn) === -1) {
        this.connections.push(conn);
    }
};

///////////////////////////////////////////////////////////////////
// ParameterContainerMorph ////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// ParameterContainerMorph inherits from Morph:

ParameterContainerMorph.prototype = new Morph();
ParameterContainerMorph.prototype.constructor = ParameterContainerMorph;
ParameterContainerMorph.uber = Morph.prototype;

// ParameterContainerMorph instance creation:

function ParameterContainerMorph (param, isInputOutput) {
    this.init(param, isInputOutput);
};

// ParameterContainerMorph initialization:

ParameterContainerMorph.prototype.init = function (param, isInputOutput) {
    ParameterContainerMorph.uber.init.call(this);

    // additional properties:
    this.isInput = isInputOutput;
    this.paramInfo = param;

    this.linker = null; // optional, makes a value variable and requires the other node to know it's shit.
    this.aligner = null;

    // overriding inherited properties:
    this.color = PINK;

    this.isBuildYet = false;
};

// ParameterContainerMorph rendering:

if (!isDevMode) ParameterContainerMorph.prototype.render = nop;

/** @returns {NodeMorph|null} */
ParameterContainerMorph.prototype.node = function () {
    return this.parentThatIsA(NodeMorph);
};

ParameterContainerMorph.prototype.build = function () {
    this.setExtent(ZERO.copy());
    this.construct();
    this.aligner.fixLayout();
    this.setExtent(this.fullBounds().extent());

    this.isBuildYet = true;
}

ParameterContainerMorph.prototype.construct = function () {
    var linker, paramTitle, align;

    align = new AlignmentMorph("column", 4);
    align.alignment = "left";
    
    linker = new NodeLinkerMorph(this);
    paramTitle = new TextMorph(this.paramInfo.name, 9, "monospace", false, true);
    paramTitle.color = WHITE.darker(15);

    align.add(paramTitle);

    if (this.paramInfo.acceptedType === "number") {
        var inpField = new InputFieldMorph(this.paramInfo.defaultValue, true);
        inpField.setWidth(this.width());
        align.add(inpField);
    }

    this.aligner = align;

    this.linker = linker;
    this.add(this.linker);
    this.add(this.aligner);
};

ParameterContainerMorph.prototype.fixLayout = function () {
    if (!this.node()) return;
    if (!this.isBuildYet) return;

    var thisNode = this.node();

    if (this.aligner) {
        this.aligner.fixLayout();
    }

    this.bounds.setWidth(this.parentThatIsA(NodeBodyMorph).width());

    if (this.isInput) {
        this.linker.setCenter(new Point(thisNode.left() + (thisNode.border / 2), this.center().y));
    } else {
        this.linker.setCenter(new Point(thisNode.right() - (thisNode.border / 2), this.center().y));
    }
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
        if (!this.lastBubble) {
            var bubble = new InfoPopupMorph(self.textDescr);
            bubble.popUp(self.parentThatIsA(NodeMorph).parent, self.topRight().add(new Point(5, 0)), false);
            self.lastBubble = bubble;
        }
    }, 250);
};

InfoPopupIconMorph.prototype.mouseLeave = function () {
    if (this.lastBubble instanceof InfoPopupMorph) {
        clearTimeout(this.lastTimeout);
        this.lastBubble.slowPerish();
        this.lastBubble = null;
    }
};

///////////////////////////////////////////////////////////////////
// InfoPopupMorph /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// InfoPopupMorph inherits from BoxMorph:

InfoPopupMorph.prototype = new BoxMorph();
InfoPopupMorph.prototype.constructor = InfoPopupMorph;
InfoPopupMorph.uber = BoxMorph.prototype;

// InfoPopupMorph settings:

InfoPopupMorph.TEXT_PADDING = 5;

// InfoPopupMorph instance creation:

function InfoPopupMorph (descr) {
    this.init(descr);
};

// InfoPopupMorph initialization:

InfoPopupMorph.prototype.init = function (descr) {
    InfoPopupMorph.uber.init.call(this);

    this.color = new Color(255, 255, 0);
    this.borderColor = this.color.darker(20);
    this.border = 2.5;
    this.edge = 0;
    this.didStartAnim = false;

    this.descrFrame = null;
    this.descrText = null;
    this.perishTimeout = null;

    this.setup(descr);
};

InfoPopupMorph.prototype.setup = function (descr) {
    this.descrFrame = new FrameMorph();
    this.descrText = new TextMorph(descr, 12, null, false, true);
    this.descrText.fontName = "Helvetica";
    this.descrFrame.add(this.descrText);
    this.descrFrame.render = nop;

    this.add(this.descrFrame);

    var lastPos = this.position();
    this.bounds = this.descrText.bounds.expandBy(InfoPopupMorph.TEXT_PADDING);
    this.descrFrame.bounds = this.bounds.translateBy(ZERO);
    this.fixLayout();
    this.setPosition(lastPos);

    this.heightToGoto = this.height();
    this.setExtent(new Point(this.width(), 0));
};

InfoPopupMorph.prototype.fixLayout = function () {
    this.descrFrame.setPosition(this.position().add(InfoPopupMorph.TEXT_PADDING));
    this.descrFrame.setExtent(this.extent().subtract(InfoPopupMorph.TEXT_PADDING * 2));
    this.descrText.setPosition(this.bottomRight().subtract(this.descrText.extent().add(InfoPopupMorph.TEXT_PADDING)));
};

InfoPopupMorph.prototype.popUp = function (aWorld, aPoint) {
    this.setPosition(aPoint);
    aWorld.add(this);
    this.world().animations.push(new Animation(
        w => this.setHeight(w),
        () => this.height(),
        this.heightToGoto,
        500,
        "linear",
        () => {
            this.setHeight(this.heightToGoto);
            if (!this.bounds.containsPoint(this.world().hand.position())) {
                this.slowPerish();
            }
        }
    ));
};

InfoPopupMorph.prototype.mouseEnter = function () {
    clearTimeout(this.perishTimeout);
};

InfoPopupMorph.prototype.mouseMove = function () {
    clearTimeout(this.perishTimeout);
};

InfoPopupMorph.prototype.mouseLeave = function () {
    this.slowPerish();
};

InfoPopupMorph.prototype.slowPerish = function () {
    this.perishTimeout = setTimeout(() => {
        if (!this.bounds.containsPoint(this.world().hand.position())) {
            this.world().animations.push(new Animation(
                w => this.setHeight(w),
                () => this.height(),
                -this.height(),
                500,
                "linear",
                () => {
                    this.destroy();
                }
            ));
        }
    }, 1000);
};

///////////////////////////////////////////////////////////////////
// ConnectionMorph ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

ConnectionMorph.prototype = new Morph();
ConnectionMorph.prototype.constructor = ConnectionMorph;
ConnectionMorph.uber = Morph.prototype;

function ConnectionMorph (inpLinker, outLinker) {
    this.init(inpLinker, outLinker);
};

ConnectionMorph.prototype.init = function (inpLinker, outLinker) {
    ConnectionMorph.uber.init.call(this);
    
    // additional properties:
    this.input = inpLinker;
    this.output = outLinker;
    this.updateTick = 0;

    this.listeners = {
        input: null,
        output: null
    };

    this.holes = [this.bounds];
    this.color = PINK;

    this.update();
};

ConnectionMorph.prototype.setInputAndOutput = function (inp, out) {
    this.input = inp;
    this.output = out;

    if (this.input instanceof NodeLinkerMorph) {
        this.input.addConnection(this);
    }
    if (this.output instanceof NodeLinkerMorph) {
        this.output.addConnection(this);
    }

    this.update();
};

/** @param {CanvasRenderingContext2D} ctx */
ConnectionMorph.prototype.render = function (ctx) {
    var w = this.width(), h = this.height(), grad, drawType, l = this.left(), t = this.top();

    if (isDevMode) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ConnectionMorph.uber.render.call(this, ctx);
        ctx.restore();
    }

    ctx.lineWidth = 2.5;

    // flipped because weirdness
    var iCenter = this.output.center(), oCenter = this.input.center(),
        iX = iCenter.x - l, iY = iCenter.y - t,
        oX = oCenter.x - l, oY = oCenter.y - t,
        farthestLeft = Math.min(iX, oX), farthestRight = Math.max(iX, oX);

    var cX = (farthestRight + farthestLeft) / 2,
        cY = (Math.max(iY, oY) + Math.min(iY, oY)) / 2;

    let maxPaddingAdjust = 45;
    let xPadding = Math.min(distance(iX, 0, oX, 0) / 2, maxPaddingAdjust); //, yPadding = 25, vPadding = 30;

    var yQuarter = Math.abs(Math.min(distance(0, iY, 0, oY) / 2, maxPaddingAdjust)),
        xQuarter = (Math.min(distance(iX, 0, oX, 0) / 2, maxPaddingAdjust));

    var grad = ctx.createLinearGradient(iX, iY, oX, oY);
    grad.addColorStop(0, this.output.color.toString());
    grad.addColorStop(1, this.input.color.toString());

    ctx.strokeStyle = grad;

    // to remember: the input goes to the output.
    if (iX > oX) {
        // output line:
        ctx.beginPath();
        ctx.moveTo(oX, oY);
        ctx.bezierCurveTo(oX < iX ? oX - xPadding : oX + xPadding, oY, oX - xPadding, oY < iY ? oY + yQuarter : oY - yQuarter, cX, cY);
        ctx.moveTo(cX, cY);
        ctx.closePath();
        ctx.stroke();

        // input line:
        ctx.beginPath();
        ctx.moveTo(iX, iY);
        ctx.bezierCurveTo(oX < iX ? iX + xPadding : iX - xPadding, iY, iX + xPadding, oY < iY ? iY - yQuarter : iY + yQuarter, cX, cY);
        ctx.moveTo(cX, cY);
        ctx.closePath();
        ctx.stroke();
    } else {
        // output line:
        ctx.beginPath();
        ctx.moveTo(oX, oY);
        ctx.quadraticCurveTo(oX - xQuarter, oY, cX, cY);
        ctx.moveTo(cX, cY);
        ctx.closePath();
        ctx.stroke();

        // input line:
        ctx.beginPath();
        ctx.moveTo(iX, iY);
        ctx.quadraticCurveTo(iX + xQuarter, iY, cX, cY);
        ctx.moveTo(cX, cY);
        ctx.closePath();
        ctx.stroke();
    }

    // old draw routine:

    /*
    if (oCenter.x > iCenter.x && oCenter.y < iCenter.y - vPadding) {
        ctx.beginPath();
        ctx.moveTo(iX, iY);
        ctx.quadraticCurveTo(iX - xPadding, iY - yPadding, cX, cY);
        ctx.moveTo(cX, cY);
        ctx.quadraticCurveTo(oX + xPadding, oY + (yPadding / 2.5), oX, oY);
        ctx.moveTo(oX, oY);
        ctx.closePath();
        ctx.stroke();
    } else if (oCenter.x > iCenter.x && oCenter.y > iCenter.y + vPadding) {
        ctx.beginPath();
        ctx.moveTo(iX, iY);
        ctx.quadraticCurveTo(iX - xPadding, iY - yPadding, cX, cY);
        ctx.moveTo(cX, cY);
        ctx.quadraticCurveTo(oX + xPadding, oY + yPadding, oX, oY);
        ctx.moveTo(oX, oY);
        ctx.closePath();
        ctx.stroke();
    } else if (oCenter.x > iCenter.x && (oCenter.y > iCenter.y - vPadding || iCenter.y < iCenter.y + vPadding)) {
        ctx.beginPath();
        ctx.moveTo(iX, iY);
        ctx.quadraticCurveTo(iX - xPadding, iY, cX, cY);
        ctx.moveTo(cX, cY);
        ctx.quadraticCurveTo(oX + xPadding, oY, oX, oY);
        ctx.moveTo(oX, oY);
        ctx.closePath();
        ctx.stroke();
    } else if (oCenter.x > iCenter.x) {}
    */
};

ConnectionMorph.prototype.update = function (forceUpdate = false) {
    if (!forceUpdate && this.updateTick > 0) {
        this.updateTick--;
        return;
    }

    // this *should* give the "render" function more room to work with.
    this.changed();
    this.bounds = this.input.fullBounds().merge(this.output.fullBounds()).expandBy(30);
    this.changed();
    this.holes = [this.bounds.translateBy(this.position().neg())];

    this.updateTick = 2;
};

ConnectionMorph.prototype.destroy = function () {
    ConnectionMorph.uber.destroy.call(this);

    if (this.input instanceof NodeLinkerMorph) {
        this.input.removeConnection(this);
    } else {
        this.input.connection = null;
    }

    if (this.output instanceof NodeLinkerMorph) {
        this.output.removeConnection(this);
    } else {
        this.output.connection = null;
    }
};