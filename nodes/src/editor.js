/*
    editor.js

    an graphical implementation of the *fabulous* AudioContext, and it's several other nodes.

    ScriptProcessorNode should be used occasionally, however it is strongly
    advised to use AudioWorklets as to not interfere with the graphical rendering.

    (and because morphic is sluggish if it doesn't have full control.)

    notes:
    - plug-ins will be implemented via a js file that will have to be downloaded by the user
    and basically plugged in. they will be opened by the user and then saved for later using indexedDB.
*/

const version = 0.6;

var AudioEditorMorph;

///////////////////////////////////////////////////////////////////
// AudioEditorMorph ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// AudioEditorMorph inherits from FrameMorph:

AudioEditorMorph.prototype = new FrameMorph();
AudioEditorMorph.prototype.constructor = AudioEditorMorph;
AudioEditorMorph.uber = FrameMorph.prototype;

// AudioEditorMorph instance creation:

function AudioEditorMorph () {
    this.init();
}

// AudioEditorMorph initialization:

AudioEditorMorph.prototype.init = function () {
    AudioEditorMorph.uber.init.call(this);

    // additional properties:
    this.globalSampleRate = 48000; // subject to change.
    this.globalContext = new AudioContext({ sampleRate: 48000 }); // the thing we're gonna use for previewing shit.
    this.globalContext.suspend();
    this.nodeGraph = null;
    this.graphScroller = null;
    this.programEngine = new NodeEngine(this.globalContext);
    this.acceptsDrops = false;
    this.topBar = null;

    // override inherited properties:
    this.color = BLACK;

    // build the fuckin' panes:
    this.buildPanes();
};

AudioEditorMorph.prototype.reactToDropOf = function (aMorph) {
    if (aMorph instanceof NodeMorph) {
        this.nodeGraph.add(aMorph);
    }
};

AudioEditorMorph.prototype.userMenu = function () {
    return new MenuMorph();
};

AudioEditorMorph.prototype.step = function () {
    if (!this.programEngine) return;
    //this.programEngine.step();
};

AudioEditorMorph.prototype.timeCodeToSamples = function (aTimeCode) {
    return (aTimeCode.seconds + (60 * aTimeCode.minutes) + (3600 * aTimeCode.hours)) * this.globalContext.sampleRate;
};

AudioEditorMorph.prototype.openIn = function (aWorld) {
    aWorld.add(this);
    this.setExtent(aWorld.extent());
};

AudioEditorMorph.prototype.reactToWorldResize = function (aWorld) {
    this.setExtent(aWorld.extent());
};

AudioEditorMorph.prototype.buildPanes = function () {
    this.createTopbar();
    this.createNodeEditor();
};

AudioEditorMorph.prototype.fixLayout = function () {
    this.graphScroller.setPosition(this.topBar.bottomLeft());
    this.graphScroller.setExtent(this.extent().subtract(this.topBar.bottomLeft()));

    this.topBar.setWidth(this.width());
};

AudioEditorMorph.prototype.createNodeEditor = function () {
    // this entire implementation will probably be changed due to asthetic reasons.
    var graph = new NodeGraphMorph(this.programEngine);
    var scroll = new ScrollFrameMorph(graph, null, null);
    graph.isDraggable = false;

    scroll.color = graph.color;
    scroll.padding = 40;
    scroll.growth = 90;
    scroll.isDraggable = false;
    scroll.acceptsDrops = false;
    scroll.contents.acceptsDrops = true;

    graph.scrollFrame = scroll;

    scroll.scrollX(scroll.padding);
    scroll.scrollY(scroll.padding);

    this.nodeGraph = graph;
    this.graphScroller = scroll;
    
    this.add(this.graphScroller);
};

AudioEditorMorph.prototype.createTopbar = function () {
    var bar, title;
    
    bar = new Morph();
    bar.color = bar.color.darker(15);

    bar.setWidth(this.width());
    bar.setHeight(25);

    title = new TextMorph("Node Audio Editor", bar.height() - 5, "monospace", false, true);
    title.color = WHITE;
    title.setCenter(new Point(this.left() + 5 + (title.width() / 2), bar.height() / 2));
    bar.add(title);
    
    this.topBar = bar;
    this.add(this.topBar);
};