// some parts of this file require morphic.js, such as Color and other sorts of things.

/*
    09/07/2024 (basic idea of node-engine.js)

    a ProcessNode will need to build a AudioNode tree whenever the NodeEngine gets the call to start
    playing the project.

    a NodeMorph, if parameters are changed, will call a function in it's ProcessNode to adjust itself
    to it's new parameters.

    nodes that are deemed "static" will have a function that will get called by the NodeEngine,
    such nodes will only be able to write into a buffer that will then get played by the NodeEngine
    later on.

    function names have not yet been decided, however the basic idea has been established.
*/

// operation types:

const OperationType = {
    SETANDFORGET: 1,
    TICKING: 2
};

///////////////////////////////////////////////////////////////////
// SpatialPosition ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

/*
    I am a positional descriptor.
*/

class SpatialPosition {
    constructor () {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}

///////////////////////////////////////////////////////////////////
// NodeEngine /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

class NodeEngine {
    // NodeEngine instance creation:

    constructor (anAudioContext) {
        // requires a context.
        if (!anAudioContext) {
            throw new Error("AudioContext not given.");
        }
        this.previewContext = anAudioContext;

        // used for making new nodes.
        this.registeredNodes = [];

        // node shit:
        this.nodePool = [];
        this.destinationNode = null;
    }

    newContext () {
        return new AudioContext();
    }

    registerNode (aNodeClass) {
        this.registeredNodes.push(aNodeClass);
    }
};

///////////////////////////////////////////////////////////////////
// ProcessNode ////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// ProcessNode instance creation:

class ProcessNode {
    // ProcessNode initialization:

    constructor () {
        this.nodeEngine = null;

        // configurable settings, can be changed by descendant classes.
        this.operationType = OperationType.SETANDFORGET;
        this.nodeTitle = "ProcessNode";
        this.info = "This node has no information at the moment.";
    }

    /** @param {NodeBodyMorph} aBody */
    buildBody (aBody) {
        aBody.addText("This is a basic node with no");
        aBody.addText("particular function.");
        aBody.addParam("Test", "number");
        aBody.finalize();
    }
};