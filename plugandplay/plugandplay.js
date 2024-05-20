var PlugMorph;
var SocketMorph;
var PlugAndPlayMorph;

PlugAndPlayMorph.prototype = new FrameMorph();
PlugAndPlayMorph.prototype.constructor = PlugAndPlayMorph;
PlugAndPlayMorph.uber = FrameMorph.prototype;

function PlugAndPlayMorph () {
    this.init();
}

PlugAndPlayMorph.prototype.init = function () {
    PlugAndPlayMorph.uber.init.call(this);

    this.color = WHITE;
};

PlugAndPlayMorph.prototype.makeTest = function () {
    var txt, align;

    align = new AlignmentMorph("column", adjust(16));

    txt = new TextMorph("Plug & Play", adjust(48), "monospace", true, true);
    txt.color = BLACK;
    txt.setCenter(this.center());

    align.add(txt);

    txt = new TextMorph("a game i was legally obligated to make.", adjust(36), "monospace", false, true);
    txt.color = BLACK.lighter(10);
    txt.setCenter(this.center());

    align.add(txt);

    this.add(align);
};

PlugAndPlayMorph.prototype.openIn = function (aWorld) {
    aWorld.add(this);
    this.setExtent(aWorld.extent());
    this.makeTest();
};

PlugAndPlayMorph.prototype.reactToWorldResize = function (aRect) {
    this.setExtent(aRect.extent());
};

PlugMorph.prototype = new BoxMorph();
PlugMorph.prototype.constructor = PlugMorph;
PlugMorph.uber = BoxMorph.prototype;

function PlugMorph () {
    this.init();
};

PlugMorph.prototype.init = function () {
    PlugMorph.uber.init.call(this);

    this.color = BLACK;
};

PlugMorph.prototype.render = function (ctx) {
    PlugMorph.uber.render.call(this, ctx);
}