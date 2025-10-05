// taken from: https://raw.githubusercontent.com/jmoenig/Snap/refs/heads/master/src/xml.js

var ReadStream;

// ReadStream ////////////////////////////////////////////////////////////

// I am a sequential reading interface to an Array or String

// ReadStream instance creation:

function ReadStream(arrayOrString) {
    this.contents = arrayOrString || '';
    this.index = 0;
}

// ReadStream constants:

ReadStream.prototype.nonSpace = /\S|$/g;
ReadStream.prototype.nonWord = /[\s\>\/\=]|$/g;

// ReadStream accessing:

ReadStream.prototype.next = function (count) {
    var element, start;
    if (count === undefined) {
        element = this.contents[this.index];
        this.index += 1;
        return element;
    }
    start = this.index;
    this.index += count;
    return this.contents.slice(start, this.index);
};

ReadStream.prototype.peek = function () {
    return this.contents[this.index];
};

ReadStream.prototype.skip = function (count) {
    this.index += count || 1;
};

ReadStream.prototype.atEnd = function () {
    return this.index > (this.contents.length - 1);
};

// ReadStream accessing String contents:

ReadStream.prototype.upTo = function (str) {
    var i = this.contents.indexOf(str, this.index);
    return i === -1 ? '' : this.contents.slice(this.index, this.index = i);
};

ReadStream.prototype.peekUpTo = function (str) {
    var i = this.contents.indexOf(str, this.index);
    return i === -1 ? '' : this.contents.slice(this.index, i);
};

ReadStream.prototype.skipSpace = function () {
    this.nonSpace.lastIndex = this.index;
    var result = this.nonSpace.exec(this.contents);
    if (result) this.index = result.index;
};

ReadStream.prototype.word = function () {
    this.nonWord.lastIndex = this.index;
    var result = this.nonWord.exec(this.contents);
    return result ? this.contents.slice(this.index, this.index = result.index) : '';
};