///////////////////////////////////////
// GradientMorph //////////////////////
///////////////////////////////////////

class GradientMorph extends Morph {
    constructor () {
        super();
        this.colorStops = {};
        this.color = CLEAR;
    }

    // GradientMorph color stops:

    addColorStop (loc, color) {
        if (!this.colorStops[loc]) {
            this.colorStops[loc] = color;
        }
    }

    replaceColorStop (loc, color) {
        if (this.colorStops[loc]) {
            this.colorStops[loc] = color;
        }
    }

    removeColorStop (loc) {
        delete this.colorStops[loc];
    }

    // GradientMorph rendering:

    render (ctx) {
        var grad = ctx.createLinearGradient(0, 0, this.width, 0);
        
        var keys = Object.keys(this.colorStops);
        for (let i = 0; i < keys.length; i++) {
            grad.addColorStop(+keys[i], this.colorStops[keys[i]].toString());
        }

        ctx.fillStyle = this.color.toString();
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
    }
}

const NUMBERS = /[0-9]/ig;
const LETTERS = /[a-zA-Z]/ig;

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
}

function uid () {
    const soup_ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          am = irand(0, 15), result = "";
    for (let i = 0; i < am; i++) {
        result += soup_[irand(0, soup_.length - 1)];
    }
    return "a" + btoa(result);
}

function tokenize (string) {
    var tokens = [];

    let cursor = 0;
    while (cursor < string.length) {
        let char = string[cursor], lastChar = string[cursor-1] || "";
        
        if (/\s/.test(char)) {
            cursor++; continue;
        }

        if (char === "(") {
            tokens.push({ type: "OpenParenToken" });
            cursor++; continue;
        }

        if (char === ")") {
            tokens.push({ type: "CloseParenToken" });
            cursor++; continue;
        }

        if (NUMBERS.test(char)) {
            let value = '';
            while (NUMBERS.test(char)) {
                value += char;
                char = string[++cursor];
            }
            tokens.push({ type: "NumericLiteral", value });
            continue;
        }

        if (LETTERS.test(char)) {
            let value = '';
            while (NUMBERS.test(char) || LETTERS.test(char)) {
                value += char;
                char = string[++cursor];
            }
            tokens.push({ type: "IdentifierToken", value });
            continue;
        }

        if (char === '"') {
            let value = '';
            while (char === '"' && !lastChar === '\\') {
                value += char;
                char = string[++cursor];
            }
            tokens.push({ type: "StringToken", value });
            continue;
        }
    }

    return tokens;
}

function parseTokens (tokens) {
    var program = {body:[]}, cursor = 0;

    function parse () {
        const token = tokens[cursor];
        if (token.type === "IdentifierToken") {
            return parseIdentifier(token);
        }
    }

    function parseIdentifier () {
        
    }

    while (cursor < tokens.length) {
        
    }

    return program;
}