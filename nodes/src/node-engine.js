// some parts of this file require morphic.js, such as Color and other sorts of things.

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

    setContext (newContext) {
        this.previewContext = newContext;
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


/* ///////////////////////////////////////////////////////////////////
// ProcessNodeInstance ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

// ProcessNodeInstance inherits from BaseNode:

ProcessNodeInstance.prototype = new BaseNode();
ProcessNodeInstance.prototype.constructor = ProcessNodeInstance;
ProcessNodeInstance.uber = BaseNode.prototype;

// ProcessNodeInstance instance creation:

function ProcessNodeInstance () {
    this.init();
}

// ProcessNodeInstance initialization:

ProcessNodeInstancea.prototype.init = function () {
    
}; */