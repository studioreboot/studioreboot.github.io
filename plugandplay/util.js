function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

function adjust (x, useHeight = false) {
    if (useHeight) {
        return (x / 599) * window.innerHeight;
    }
    return (x / 1366) * window.innerWidth;
};

var AlignmentMorph;

// AlignmentMorph /////////////////////////////////////////////////////

// I am a reified layout, either a row or a column of submorphs

// AlignmentMorph inherits from Morph:

AlignmentMorph.prototype = new Morph();
AlignmentMorph.prototype.constructor = AlignmentMorph;
AlignmentMorph.uber = Morph.prototype;

// AlignmentMorph instance creation:

function AlignmentMorph(orientation, padding) {
    this.init(orientation, padding);
}

AlignmentMorph.prototype.init = function (orientation, padding) {
    // additional properties:
    this.orientation = orientation || 'row'; // or 'column'
    this.alignment = 'center'; // or 'left' in a column
    this.padding = padding || 0;
    this.respectHiddens = false;

    // initialize inherited properties:
    AlignmentMorph.uber.init.call(this);

    // override inherited properites:
};

// AlignmentMorph displaying and layout

AlignmentMorph.prototype.render = function (ctx) {
    // override to not draw anything, as alignments are just containers
    // for layout of their components
    nop(ctx);
};

AlignmentMorph.prototype.fixLayout = function () {
    var last = null,
        newBounds;
    if (this.children.length === 0) {
        return null;
    }
    this.children.forEach(c => {
        var cfb = c.fullBounds(),
            lfb;
        if (c.isVisible || this.respectHiddens) {
            if (last) {
                lfb = last.fullBounds();
                if (this.orientation === 'row') {
                    c.setPosition(
                        lfb.topRight().add(new Point(
                            this.padding,
                            (lfb.height() - cfb.height()) / 2
                        ))
                    );
                } else { // orientation === 'column'
                    c.setPosition(
                        lfb.bottomLeft().add(new Point(
                            this.alignment === 'center' ?
                                    (lfb.width() - cfb.width()) / 2
                                            : 0,
                            this.padding
                        ))
                    );
                }
                cfb = c.fullBounds();
                newBounds = newBounds.merge(cfb);
            } else {
                newBounds = cfb;
            }
            last = c;
        }
    });
    this.bounds = newBounds;
};