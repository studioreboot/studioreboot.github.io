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
    var txt;

    txt = new TextMorph("there should be something here.");
    txt.color = BLACK;
    txt.setCenter(this.center());

    this.add(txt);
};

PlugAndPlayMorph.prototype.openIn = function (aWorld) {
    aWorld.add(this);
    this.setExtent(aWorld.extent());
    this.makeTest();
}

PlugAndPlayMorph.prototype.reactToWorldResize = function (aRect) {
    this.setExtent(aRect.extent());
};