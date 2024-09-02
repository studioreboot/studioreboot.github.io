// the most frightening part of all of this, the project saving part.
// (more less the loading part's gonna be worse but oh well.)

/*
    anf (Audio Node Workstation File) file format (actually a zip, but no one needs to know that.):
    - the main project that contains the node data, their parameters, and the other bullshit will be
    contained in a xml file.
    - the samples used will be contained in the rest of the zip file.
    - there will be no directories, as they are not needed.
    - plug-ins are going to be not saved at the given moment, however they may be put into the project
    file later on.

    the horrifying part of all of this is that i basically need to write all of this shit in the context
    of morphic.js, which does not have an easy tree system that i can just use, considering how node-graph.js
    is written, i don't think i'm going to particularly like writing it.
*/

class ProjectSerializer {
    constructor () {
        this.projectFile = JSZip();
        this.generatedXML = null;
    }

    beginSerialization () {
        this.generatedXML = new XML_Element("node-project");
        this.generatedXML.attributes["creation-timestamp"] = Date.now();
    }
}