const EDITOR_MODE = {
    COMMAND: 0,
    INSERT: 1
};

var ctx = document.createElement("canvas").getContext("2d");
ctx.font = "bold 12px monospace";
var UNDERLINE_WIDTH = ctx.measureText("_").width;
ctx = null;

function LoadLib (aSource) {
    if (editor.libs.indexOf(aSource) == -1) {
        editor.libs.push(aSource);
        var script = document.createElement("script");
        script.src = aSource;
        document.head.appendChild(script);
    }
}

function runScript (aString) {
	var script = document.createElement("script");
	script.textContent = aString;
	script.classList.add("scripty");
	document.body.appendChild(script);
}

function parseINI (stream) {
    var lines = stream.split("\n")
    var ini = {}, ptr = ini;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("[") && line.endsWith("]")) {
            ptr = {};
            ini[line.substring(1, line.length - 1)] = ptr;
        } else if (line.indexOf("=") != -1 && !line.startsWith(";")) {
            var name = lines[i].substring(0, line.indexOf("=")).trim();
            var value = lines[i].substring(line.indexOf("=") + 1, line.length),
                trimmed = value.trim();
            if (/true|false/ig.test(trimmed)) {
                value = trimmed.toLowerCase() === "true";
            } else if (+trimmed === parseFloat(trimmed)) {
                value = +trimmed;
            }
            ptr[name] = value;
        }
    }

    return ini;
}

var EASTEREGG = new Sound("comegowithme.mp3");
var THINK = new Sound("think.mp3");
EASTEREGG.pitch = -150;

const STATE_NORMAL = 0;
const STATE_BOLD = 1;
const STATE_ITALIC = 2;

///////////////////////////////////////////////////////
// ReadStream /////////////////////////////////////////
///////////////////////////////////////////////////////

class ReadStream {
    constructor (contents) {
        this.contents = contents;
        this.index = 0;
    }

    // ReadStream constants:

    nonSpace = /\S|$/g;
    nonWord = /[\s\>\/\=]|$/g;

    // ReadStream functions:

    next (count) {
        var element, start;
        if (count === undefined) {
            element = this.contents[this.index];
            this.index += 1;
            return element;
        }
        start = this.index;
        this.index += count;
        return this.contents.slice(start, this.index);
    }

    peek () {
        return this.cotents[this.index];
    }

    peekNext () {
        return this.contents[this.index+1];
    }

    skip (count = 1) {
        this.index += count;
    }

    get atEnd () {
        return this.index >= this.contents.length;
    }

    upTo (str) {
        var i = this.contents.indexOf(str, this.index);
        return i === -1 ? '' : this.contents.slice(this.index, this.index = i);
    }

    peekUpTo (str) {
        var i = this.contents.indexOf(str, this.index);
        return i === -1 ? '' : this.contents.slice(this.index, i);
    }

    skipSpace () {
        this.nonSpace.lastIndex = this.index;
        var result = this.nonSpace.exec(this.contents);
        if (result) this.index = result.index;
    }

    get word () {
        this.nonWord.lastIndex = this.index;
        var result = this.nonWord.exec(this.contents);
        return result ? this.contents.slice(this.index, this.index = result.index) : '';
    }

    includes (aString) {
        return this.contents.indexOf(aString) != -1
    }
}

///////////////////////////////////////////////////////
// LineMorph //////////////////////////////////////////
///////////////////////////////////////////////////////

class LineMorph extends Morph {
    constructor (
        text = "TextMorph",
        fontSize = 12,
        fontStyle = "sans-serif",
        bold = false,
        italic = false,
        alignment = 'left',
        fontName = MorphicPreferences.globalFontFamily,
    ) {
        super();

        // additional properties:
        this.text = text;
        this.fontSize = fontSize;
        this.fontName = fontName;
        this.fontStyle = fontStyle || "sans-serif";
        this.isBold = bold;
        this.isItalic = italic;
        this.maxLineWidth = 0;
        this.backgroundColor = null;
        this.isEditable = false;
        this.enableLinks = false; // set to "true" if I can contain clickable URLs
        this.lastSelection = "";

        this.stream = new ReadStream(this.text);

        this.update()
    }

    render (ctx) {
        ctx.fillStyle = this.color.toString();
        
    };

    update () {
        this.children.forEach(child => child.destroy());
        this.extent = ZERO;

        
    }
}

///////////////////////////////////////////////////////
// EditorMorph ////////////////////////////////////////
///////////////////////////////////////////////////////

/*
    I serve as a JavaScript port of VIM (in Snap!)
*/

class EditorMorph extends FrameMorph {
    constructor () {
        super();

        // EditorMorph additional properties:

        this.textColor = WHITE;

        if (localStorage.getItem("dark mode") == "true") {
            this.textColor = WHITE;
            this.color = BLACK;
            this.tcursor.color = this.textColor;
        } else if (localStorage.getItem("dark mode") == "false") {
            this.textColor = BLACK;
            this.color = WHITE;
        }

        this.lines = [
            "// very simple javascript program:",
            "console.log(\"Hello World!\");"
        ];
        this.line = 0;
        this.cursor = new Point();
        this.pcursor = 0
        this.color = BLACK;
        this.offY = 0;
        this.offX = 0;
		this.fontSize = 12;
        this.currentMode = EDITOR_MODE.COMMAND;
        this.underline = "_";
        this.undDeadline = Date.now() + 250;
        this.hitControlLast = false;
		this.isInverted = false;
        this.inUnicode = false;
		this.charCache = [];
        this.lastInput = "";
        this.currentKey = "";
        this.isSelecting = false;
        this.selectionStart = new Point();
        this.libs = [];
        this.textColor = WHITE;

		this.loadStuff();
        this.createCursor();

		this.saveInterval = setInterval(() => {
			this.saveStuff();
		}, 500);

        // EditorMorph autoexec:

        if (!localStorage.getItem("db_autoexec")) {
            localStorage.setItem("db_autoexec", "nop();");
        }

        eval(localStorage.getItem("db_autoexec"));

        // EditorMorph panes:

        this.terminal = null;
        this.mode = null;
		this.calculateLetterWidth();

        this.buildPanes();
        this.fixLayout();

		this.switchModeTo(EDITOR_MODE.COMMAND);

        if (localStorage.getItem("EFONTSIZE")) {
            this.fontSize = +localStorage.getItem("EFONTSIZE");
        }
    }

    // EditorMorph saving & loading:

    saveStuff () {
        localStorage.setItem("AUTOSAVE", this.lines.join("\n"));
        localStorage.setItem("CURSORSAVE", this.cursor.toString());
        localStorage.setItem("OFFSETSAVE", `${this.offX}@${this.offY}`);
        localStorage.setItem("EFONTSIZE", this.fontSize.toString());
    }

    loadStuff () {
        if (localStorage.getItem("AUTOSAVE")) {
			this.lines = this.format(localStorage.getItem("AUTOSAVE")).split("\n");
		}
        if (localStorage.getItem("CURSORSAVE")) {
            var cur = localStorage.getItem("CURSORSAVE").split("@")
            this.cursor = new Point(+cur[0], +cur[1]);
        }
        if (localStorage.getItem("OFFSETSAVE")) {
            var cur = localStorage.getItem("OFFSETSAVE").split("@")
            this.offX = +cur[0];
            this.offY = +cur[1];
        }
    }

	// EditorMorph calculating letter width:

	calculateLetterWidth () {
		ctx = document.createElement("canvas").getContext("2d");
		ctx.font = "bold " + this.fontSize + "px monospace";
		UNDERLINE_WIDTH = ctx.measureText("_").width;
		ctx = null;
	}
 
    // EditorMorph cursor:

    createCursor () {
        this.tcursor = new StringMorph("", 
            null, null, true, null, null, null, null, 
            this.textColor
        );
        this.tcursor.color = this.textColor;
        this.tcursor.fontStyle = "monospace";
        this.tcursor.isBold = true;
        this.tcursor.fixSelf();
        this.tcursor.text = this.underline;
		this.tcursor.shadowOffset = new Point(0, 1);
		this.tcursor.shadowColor = this.textColor;

        this.terminalInput = "";
        
        this.cmdInput = new StringMorph("");
        this.cmdInput.fontStyle = "monospace";
        this.cmdInput.color = this.textColor;
        this.cmdInput.fixSelf();
    }

    moveCursor () {
        if (this.currentMode == EDITOR_MODE.COMMAND) {
            this.tcursor.position = new Point(
                this.pcursor * UNDERLINE_WIDTH,
                this.cmdInput ? this.cmdInput.top : this.height - 14
            )
        } else if (this.currentMode == EDITOR_MODE.INSERT) {
            this.tcursor.position = new Point(
                ((this.cursor.x * UNDERLINE_WIDTH) + (this.offX * UNDERLINE_WIDTH)), 
                ((this.cursor.y * this.fontSize) + (-this.offY * this.fontSize)) + this.top
            )
        }
		this.tcursor.left += this.left;
    }
    
    // EditorMorph screen size:

    get screenSize () {
        return Math.floor(this.height / this.fontSize) - 3;
    }

    get savedDB () {
        return Object.keys(localStorage).filter(key => {
            return key.startsWith("db") && !key.startsWith("db_")
        }).sort();
    }

    get command () {
        return this.cmdInput.text;
    }

    set command (text) {
        this.cmdInput = text;
        this.cmdInput.fixSelf();
    }

    get curLine () {
        return this.lines[this.cursor.y];
    }

    set curLine (aString) {
        this.lines[this.cursor.y] = aString;
    }

    get frame () {
        var result = [];
        for (let i = this.offY; i < this.screenSize + this.offY; i++) {
            if (i < 0) {
                result.push("");
            } else {
                result.push(this.lines[i]);
            }
        }
        return result;
    }

    get selectionData () {
        if (this.isSelecting) {
            
        }
        return [];
    }

	// EditorMorph formatting:

	format (aString) {
		return aString.replaceAll("\t", "    ").replaceAll("\r", "");
	}

	searchFor (aString) {
		for (let i = this.cursor.y; i < this.lines.length; i++) {
			const line = this.lines[i];
			if (line.indexOf(aString) !== -1) {
				return i;
			}
		}
		return this.cursor.y;
	}

    speak (vol = 0, pit = 0, rate = 0) {
        var ssu = new SpeechSynthesisUtterance(this.lines.join("\n"));
        ssu.volume = +vol || 1;
        ssu.pitch = +pit || 1;
        ssu.rate = +rate || 1;
        window.speechSynthesis.speak(ssu);
    }

    wantsDropOf (aMorph) {
        return false;
    }

    // EditorMorph updating:

    updateEditor () {
        this.updateLines();
        this.moveCursor();
        this.changed();
    }

    // EditorMorph checking:

	invertColors () {
		this.isInverted = !this.isInverted;
		if (this.isInverted) {
			this.setColor(WHITE);
		} else {
			this.setColor(BLACK);
		}
		this.children.forEach(child => child.destroy());
		this.buildPanes();
	}

    checkLineAmount () {
        if (this.editor.children.length !== (this.screenSize + 1)) {
            this.createLines();
            this.fixLayout();
        }
    }

    openSelectMenu () {
        var menu = new MenuMorph(this, "Please Select:"), savedDB = this.savedDB;
        for (let i = 0; i < savedDB.length; i++) {
            menu.addItem(
                savedDB[i].substring(2, savedDB[i].length),
                Function.apply(null, ["editor.loadSelected(\"" + savedDB[i] + "\");"]),
                "load this file?"
            );
        }
        menu.addLine();
        menu.addItem("Cancel", function () {
            menu.destroy();
        });
        menu.popUpCenteredInWorld(this.world);
    }

    loadSelected (name) {
        this.lines = localStorage.getItem(name).split("\n");
        this.cursor = new Point();
        this.offX = this.offY = 0;
        this.switchModeTo(EDITOR_MODE.INSERT);
        this.updateLines();
        this.moveCursor();
        this.fullChanged();
    }

	reset () {
		this.offX = this.offY = 0;
		this.cursor = new Point();
	}

	fetchURL (aString) {
		var xhr = new XMLHttpRequest(), self = this;
        xhr.open("GET", aString, true);
        xhr.onload = function () {
            self.lines = self.format(xhr.responseText).split("\n");
            self.cursor = new Point();
            self.moveCursor();
            self.offX = self.offY = 0;
			self.currentMode = EDITOR_MODE.INSERT;
            self.updateLines();
			self.fullChanged();
		}
        xhr.send();
	}

    get time () {
        var dt = new Date(), days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var months = ["Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sept", "Nov", "Dec"];
        return dt.getHours() + ":" + dt.getMinutes() + " on " + 
            days[dt.getDay()] + " | " + months[dt.getMonth()] + ", " + dt.getDate() + " " + dt.getFullYear();
    }

    // EditorMorph input processing:

    processKeyDown (ev) {
        this.currentKey = ev.key;
        if (this.currentMode == EDITOR_MODE.COMMAND) {
            this.processTerminal(ev);
        } else {
            this.editorInput(ev);
        }
    }

    processVimCommand (aString) {
        var self = this;
        if (aString.startsWith(":")) {
            var args = aString.split(" ");
            var command = args.shift();
            switch (command.substring(1, command.length)) {
                case "save":
                    var blob = new Blob([this.lines.join("\n")], { type: "text/plain" });
                    saveAs(blob, args.join(" "));
                    break;
                case "load":
                    var input = document.createElement("input");
                    input.multiple = false;
                    input.type = "file";
                    input.onchange = function () {
                        var reader = new FileReader();
                        reader.onload = function () {
                            self.lines = reader.result.split("\n");
							self.reset();
							self.updateLines();
                        }
                        reader.readAsText(input.files[0]);
                    }
                    document.body.appendChild(input);
                    input.click();
                    break;
				case "invert":
					this.invert();
                    this.fullChanged();
					break;
                case "insert":
                    this.switchModeTo(EDITOR_MODE.INSERT);
                    break;
                case "savedb":
                    if (this.lines[0] == ".LOG") {
                        this.lines.push(this.time);
                    }
                    localStorage.setItem("db" + args.join(" "), this.lines.join("\n"));
                    break;
                case "loaddb":
                    this.lines = localStorage.getItem("db" + args.join(" ")).split("\n");
                    this.cursor = new Point();
                    this.offX = this.offY = 0;
                    this.moveCursor();
                    break;
                case "removedb":
                    localStorage.removeItem("db" + args.join(" "));
                    break;
                case "help":
                    this.fetchURL(window.location.origin + "/help.txt");
                    break;
                case "quit":
                    window.location.replace("https://www.google.com/");
                    break;
                case "find":
                    var keyword = args.join(" ");
                   	this.cursor.y = this.offY = this.searchFor(keyword);
					this.updateStats();
                    this.fullChanged();
                    break;
                case "goto":
                    var lineNumber = Math.min(this.lines.length, Math.max(+args[0], 1));
                    this.offY = lineNumber - 1;
                    this.cursor.y = lineNumber - 1;
                    this.switchModeTo(EDITOR_MODE.INSERT);
                    this.fullChanged();
                    break;
                case "selectsaved":
                    this.openSelectMenu();
                    break;
                case "speek": case "speak":
                    this.speak.apply(this, args);
                    break;
                case "update":
                    reg.unregister();
                    window.location.reload(true);
                    break;
                case "clear":
                    this.cursor = new Point();
                    this.offX = this.offY = 0;
                    this.lines = [""];
                    break;
				case "runjs":
					if (args[0] === "eval") {
                        eval(this.lines.join("\n"));
                    } else {
                        runScript(this.lines.join("\n"));
                    }
					break;
				case "url":
					this.fetchURL(args.join(""));
					break;
				case "xerb": case "XERB": case "very_secret_stuff":
					EASTEREGG.play();
					break;
				case "BREX":
					EASTEREGG.pause();
					EASTEREGG.currentTime = 0;
					break;
				case "world_mode":
					if (args[0] === "dev") {
						this.world.isDevMode = true;
						this.extent = this.extent.subtract(40);
						this.position = new Point(20, 20);
						this.fixLayout();
					} else if (args[0] === "user") {
						this.world.isDevMode = false;
						this.position = ZERO;
						this.reactToWorldResize(this.world.bounds);
					}
					break;
				case "testjs":
					window.open(
						"https://testing.studioreboot.repl.co/?bjs=" + 
						encodeURIComponent(btoa(this.lines.join("\n")))
					);
					break;
				case "clearsaved":
					var saved = this.savedDB;
					for (let i = 0; i < saved; i++) {
						localStorage.removeItem("db" + saved[i]);
					}
					break;
				case "copy":
					navigator.clipboard.writeText(this.lines.join("\n"));
					break;
				case "savecloud":
					var xhr = new XMLHttpRequest();
					xhr.open(
                        "POST", 
                        (
                            "https://snext.studioreboot.repl.co/fs/write?name=" +
                            encodeURIComponent(args.join(" ")) + "&data=" +
                            encodeURIComponent(this.lines.join("\n"))
                        ), 
                        true
                    );
					xhr.send(null);
					break;
                case "getcloud":
                    var xhr = new XMLHttpRequest();
					xhr.open(
                        "GET", 
                        (
                            "https://snext.studioreboot.repl.co/fs/read?name=" +
                            encodeURIComponent(args.join(" "))
                        ), 
                        true
                    );
                    xhr.onload = function () {
                        self.lines = xhr.responseText.split("\n");
                        self.offX = self.offY = 0;
                        self.cursor = new Point();
                        self.updateLines();
                        self.moveCursor();
                        self.fullChanged();
                    }
					xhr.send(null);
                    break;
				case "zoom":
					this.fontSize = +args[0];
					this.updateFntSize();
					break;
                case "replace":
                    if (!this.searchFor(args[1])) return;
                    var idx = this.searchFor(args[1]);
                    if (args[0] == "once") {
                   	    this.lines[idx] = this.lines[idx].replace(args[1], args[2]);
                    } else if (args[0] == "all") {
                        this.lines = this.lines.map(val => val.replaceAll(args[1], args[2]));
                    }
                    this.updateLines();
                    this.moveCursor();
                    this.fullChanged();
                    break;
            }
        }
        this.cmdInput.text = "";
        this.cmdInput.fixSelf();
        this.cmdInput.changed();
        this.pcursor = 0;
        this.moveCursor();
        this.updateLines();
        this.updateStats();
    }
    
    processTerminal (ev) {
        const key = ev.key.toLowerCase();
        switch (key) {
            case "arrowleft":
                this.pcursor = Math.max(this.pcursor - 1, 0);
                break;
            case "arrowright":
                this.pcursor = Math.min(this.pcursor + 1, this.cmdInput.text.length);
                break;
            case "enter":
                this.processVimCommand(this.cmdInput.text);
                this.fullChanged();
                break;
            case "backspace":
                var chars = Array.from(this.command);
                chars.splice(this.pcursor - 1, 1);
                this.pcursor--;
                this.cmdInput.text = chars.join("");
                this.cmdInput.fixSelf();
                this.pcursor = Math.max(this.pcursor, 0);
                break;
            case "delete":
                var chars = Array.from(this.command);
                chars.splice(this.pcursor, 1);
                this.cmdInput.text = chars.join("");
                this.cmdInput.fixSelf();
                break;
            default:
                if (key.length === 1) {
                    this.cmdInput.text += ev.key;
                    this.cmdInput.fixSelf();
                    this.pcursor++;
                }
                break;
        }
        this.moveCursor();
    }

    processKeyUp (ev) {
        setTimeout(() => {
            this.hitControlLast = ev.ctrlKey;
        }, 100);
    }

    processInput (ev) {
        var textarea = this.world.keyboardHandler;
        
        this.lastInput = textarea.value.substring(+textarea.lastIdx, textarea.value.length);
        textarea.lastIdx = textarea.value.length;

        if (this.currentMode == EDITOR_MODE.INSERT) {
            if (ev.ctrlKey && this.world.currentKey == 86) {
                var line = Array.from(this.lines[this.cursor.y]);
                line.splice(this.cursor.x, 0, this.lastInput);
                this.lines[this.cursor.y] = line.join("");
                this.updateEditor();
            }
        }
    }

    isUnicodeKey (ev) {
        var uni = ev.key.toLowerCase() == "l" && ev.shiftKey && ev.ctrlKey;
        if (uni)
            ev.preventDefault();
        return uni;
    }
    
    editorInput (ev) {
        const key = ev.key.toLowerCase();
        var self = this;
        if (key == "x" && ev.ctrlKey) {
            ev.preventDefault();
            navigator.clipboard.writeText(this.lines.splice(this.cursor.y, 1)).then(nop, nop);
            this.updateLines();
            return;
        }
        if (key == "v" && ev.ctrlKey) {
            navigator.clipboard.readText().then(val => {
                for (let i = 0; i < val.length; i++) {
                    this.insertAtCursor(val[i]);
                }
                this.updateLines();
            })
            return;
        }
        if (this.isUnicodeKey(ev)) {
            ev.preventDefault();
            this.inUnicode = true;
            return;
        }
        if (this.inUnicode && key != "enter") {
            this.charCache.push(key);
            return;
        } else if (this.inUnicode && key == "enter") {
            try {
                this.insertAtCursor(String.fromCharCode(parseInt(this.charCache.join(""), 16)));
            } catch (e) {nop(e);};
            this.inUnicode = false;
            this.charCache = [];
            this.updateLines();
            this.moveCursor();
            this.hitControlLast = false;
            return;
        }
        if (key.length === 1 && !this.isUnicodeKey(ev)) {
            this.insertAtCursor(ev.key);
			this.updateStats();
            return;
        }
        this.handleScreenAndCursorKeys(key, ev);
        this.handleHotKeys(key, ev);
		this.hitControlLast = ev.ctrlKey;
        this.world.keyboardFocus = this;
        this.moveCursor();
		this.updateStats();
    }

    handleScreenAndCursorKeys (key, ev) {
        this.isSelecting = ev.shiftKey;
        if (!ev.ctrlKey && !this.isSelecting) {
            switch (key) {
                case "arrowup":
                    this.cursor.y = Math.max(this.cursor.y - 1, 0);
                    if (this.cursor.x > this.curLine.length) {
                        this.cursor.x = this.curLine.length;
                        this.moveCursor();
                    }
					if (this.tcursor.top == 0) {
						this.offY--;
                        this.offY = Math.max(this.offY, 0);
						this.updateLines();
                        this.moveCursor();
					}
                    break;
                case "arrowdown":
                    this.cursor.y = Math.min(this.cursor.y + 1, this.lines.length - 1);
                    if (this.cursor.x > this.curLine.length) {
                        this.cursor.x = this.curLine.length;
                        this.moveCursor();
                    }
					if (this.tcursor.top > (this.terminal.top - 15)) {
						this.offY++;
						this.updateLines();
					}
                    break;
                case "arrowleft":
                    if (isString(this.lines[this.cursor.y-1]) && this.cursor.x == 0) {
                        this.cursor.y--;
                        this.cursor.x = this.curLine.length;
                    } else {
                        this.cursor.x = Math.max(this.cursor.x - 1, -1);
                    }
                    break;
                case "arrowright":
                    if (isString(this.lines[this.cursor.y+1]) && this.cursor.x == this.curLine.length) {
                        this.cursor.y++;
                        this.cursor.x = 0;
                    } else {
                        this.cursor.x++;
						this.cursor.x = Math.min(this.curLine.length, this.cursor.x);
                    }
                    break;
                default:
                    break;
            }
        } else if (ev.ctrlKey && !this.isSelecting) {
            ev.preventDefault();
            switch (key) {
                case "arrowdown":
                    this.offY++;
                    break;
                case "arrowup":
                    this.offY--;
                    break;
                case "arrowright":
                    this.offX++;
                    break;
                case "arrowleft":
                    this.offX--;
                    break;
            }
            this.moveCursor();
            this.updateLines();
        } else if (!ev.ctrlKey && this.isSelecting) {
            switch (key) {
                case "arrowup":
                    this.selectionStart = this.cursor.copy();
                    break;
            }
            this.moveCursor();
            this.updateLines();
        }
    }

    handleHotKeys (key, ev) {
        switch (key) {
            case "enter":
                var nContents = this.curLine.substring(this.cursor.x, this.curLine.length + 1);
                this.curLine = this.curLine.substring(0, this.cursor.x);
                this.lines.splice(this.cursor.y + 1, 0, nContents);
                this.updateLines();
                this.cursor.y++;
                this.cursor.x = 0;
                if (this.cursor.y > (this.offY + this.screenSize)) {
                    this.offY += 2;
                    this.updateLines();
                }
                break;
            case "backspace":
                if (!this.hitControlLast) {
                    if (!this.cursor.eq(ZERO)) {
						this.deleteCharAtCursor();
					}
                } else {
                    this.switchModeTo(EDITOR_MODE.COMMAND);
                    this.fullChanged();
                }
                break;
            case "end":
                this.cursor.x = this.curLine.length;
                break;
            case "home":
                this.cursor.x = 0;
                break;
            case "delete":
                var chars = Array.from(this.curLine);
                chars.splice(this.cursor.x, 1);
                this.lines[this.cursor.y] = chars.join("");
				this.updateLines();
                break;
			case "tab":
				ev.preventDefault();
				this.insertAtCursor(" ");
				this.insertAtCursor(" ");
				this.insertAtCursor(" ");
				this.insertAtCursor(" ");
				break;
        }
        
    }

	// EditorMorph statistics updating:

	updateStats () {
		var stats = this.terminal.stats;

		stats.text = "Ln " + (this.cursor.y + 1) + " Col " + (this.cursor.x + 1);
		stats.fixSelf();
	}

    // EditorMorph stepping:

    step () {
        if (Date.now() > this.undDeadline) {
            this.undDeadline = Date.now() + 250;
            this.underline = this.underline === "" ? "_" : "";
            this.tcursor.text = this.underline;
            this.tcursor.fixSelf();
		}
    }

	// EditorMorph checking:

	checkLines () {
		if (this.editor.children.length < this.screenSize) {
			this.createLines();
		}
	}

	// EditorMorph switching modes:

	switchModeTo (aMode) {
		this.currentMode = aMode;
		if (aMode === EDITOR_MODE.COMMAND) {
            this.mode.text = "--COMMAND--";
			this.add(this.terminal);
			this.add(this.tcursor);
		} else {
            this.mode.text = "--INSERT--";
			this.add(this.editor);
			this.add(this.tcursor);
			this.add(this.terminal);
		}
		this.fixLayout();
		this.fullChanged();
	}

    // EditorMorph handling cursor stuff:

    insertAtCursor (aCharacter) {
        var stuff = Array.from(this.curLine);
        stuff.splice(this.cursor.x, 0, aCharacter);
        this.lines[this.cursor.y] = stuff.join("");
        this.updateLines();
        this.cursor.x++;
        this.moveCursor();
    }

    deleteCharAtCursor () {
        this.cursor.x--;
        if (this.cursor.x == -1) {
            var contentsOfLine = this.curLine;
            this.lines.splice(this.cursor.y, 1);
            this.cursor.y = Math.max(this.cursor.y - 1, 0);
            this.cursor.x = this.curLine.length;
            this.curLine = this.curLine + contentsOfLine;
        } else {
            if ((this.cursor.x + 1) == this.curLine.length) {
                var stuff = Array.from(this.curLine);
                stuff.pop();
                this.lines[this.cursor.y] = stuff.join("");
            } else {
                this.lines[this.cursor.y] = this.curLine.substring(0, this.cursor.x) +
					this.curLine.substring(this.cursor.x + 1, this.curLine.length);
            }
        }
        this.updateLines();
    }

    // EditorMorph world stuff:

    openIn (aWorld) {
        aWorld.add(this);
        aWorld.keyboardFocus = this;
		aWorld.isDevMode = false;
        this.extent = aWorld.extent;
        
        this.checkLineAmount();
        this.updateFntSize();
    }

    reactToWorldResize (aRect) {
        this.extent = aRect.extent;

        this.checkLineAmount();
    }

    // EditorMorph fix layout:

    fixLayout () {
		var am = Math.floor((this.fontSize * 3) / 10) * 10;
        this.terminal.top = this.bottom - am;
        this.terminal.width = this.width
		this.terminal.height = am;

		if (!this.mode.position.eq(this.terminal.position)) 
			this.mode.positon = this.terminal.position;

		this.cmdInput.top = this.mode.bottom;
        this.cmdInput.fixSelf();

		var stats = this.terminal.stats;
		stats.right = this.right - 2;
		if (stats.top != this.terminal.top) {
			stats.top = this.terminal.top;
			stats.fixSelf();
		}

		if (!this.editor.position.eq(this.position))
			this.editor.position = this.position.copy();

		if (!this.editor.bottomRight.eq(this.terminal.topRight))
			this.editor.extent = new Point(this.width, this.height - this.terminal.height);

        this.editor.children.forEach(child => {
            if (child.fixSelf) child.fixSelf();
        });

		this.checkLines();

        if (this.currentMode == EDITOR_MODE.COMMAND) {
            this.moveCursor();
        }
    }
    
    // EditorMorph building:

	updateFntSize () {
		this.createLines();
        
		this.terminal.children.forEach(child => {
			child.fontSize = this.fontSize;
			child.fixSelf();
		});
        
		this.tcursor.fontSize = this.fontSize;
		this.tcursor.fixSelf();
		this.calculateLetterWidth();
		this.world.broken = [];
		this.fixLayout();
		this.changed();
		this.calculateLetterWidth();
		this.calculateLetterWidth();
	}

    updateLines () {
        var frame = this.frame, lines = this.editor.children;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            line.left = (UNDERLINE_WIDTH * this.offX) + this.left;
			line.fontSize = this.fontSize;
            line.startMark = line.endMark = 0;
            if (!isNil(frame[i]) && frame[i].startsWith("**") && frame[i].endsWith("**")) {
                line.text = isNil(frame[i]) ? "" : frame[i];
                line.isBold = true;
            } else if (!isNil(frame[i]) && frame[i].startsWith("*") && frame[i].endsWith("*")) {
                line.text = isNil(frame[i]) ? "" : frame[i];
                line.isItalic = true;
            } else {
                line.text = isNil(frame[i]) ? "" : frame[i];
                line.isBold = false;
                line.isItalic = false;
            }
            line.color = this.textColor;
            line.fixSelf();
        }
    }

    buildPanes () {
        this.createLines();
        this.createTerminal();

        this.moveCursor();
    }

	rootForGrab () {
		return this.parentThatIsA(EditorMorph);
	}

    createLines () {
        if (this.editor)
            this.editor.destroy();

		var lines = new FrameMorph();
        lines.render = nop;
		lines.rootForGrab = this.rootForGrab;
        lines.color = this.color;

        for (let i = 0; i < this.screenSize; i++) {
            const line = new StringMorph(), tline = this.frame[i];
            line.color = this.textColor;
            line.text = isNil(tline) ? "" : tline
            line.top = i * this.fontSize;
            line.fontSize = this.fontSize;
            line.fontStyle = "monospace";
            line.markedBackgroundColor = WHITE;
            line.markedTextColor = BLACK;
            line.fixSelf();

            lines.add(line);
        }

        this.editor = lines;

        this.add(this.editor);
    }

    createTerminal () {
        var terminal, mode, input, stats;

        terminal = new FrameMorph();
        terminal.color = this.color;
		terminal.rootForGrab = this.rootForGrab;
        
        mode = new StringMorph("--COMMAND--");
        input = new StringMorph("");

        mode.isBold = true;
        
        mode.fontStyle = input.fontStyle = "monospace";
        mode.color = input.color = this.textColor;

		stats = mode.fullCopy();
		stats.isBold = false;
		stats.text = "Ln 1 Col 1";

        this.mode = mode;
        this.terminal = terminal;
		this.terminal.stats = stats;
        this.terminal.input = input;

        this.terminal.add(this.mode);
		this.terminal.add(this.terminal.stats);
		this.terminal.add(this.terminal.input);
        this.terminal.add(this.cmdInput);

        this.add(this.terminal);
    }

    invert () {
        if (this.color.eq(BLACK)) {
            this.color = WHITE;
            this.textColor = BLACK;
            this.children.forEach(child => child.destroy());
            this.buildPanes();
            localStorage.setItem("darkMode", "false");
        } else if (this.color.eq(WHITE)) {
            this.color = BLACK;
            this.textColor = WHITE;
            this.children.forEach(child => child.destroy());
            this.buildPanes();
            localStorage.setItem("darkMode", "true");
        }

        if (reg) {
            reg.unregister();
        }
    }

    userMenu () {
        return new MenuMorph();
    }

    mouseClickLeft () {
        this.world.keyboardFocus = this;
    }
}

///////////////////////////////////////////////////////
// PopupMorph /////////////////////////////////////////
///////////////////////////////////////////////////////

class PopupMorph extends Morph {
    constructor () {
        super();
        this.color = BLACK;
        this.outlineColor = WHITE;
        this.outlineWidth = 5;
    }

    userMenu () {
        return new MenuMorph();
    }

    // PopupMorph rendering:

    render (ctx) {
        ctx.fillStyle = this.color.toString();
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.strokeStyle = this.outlineColor.toString();
        ctx.lineWidth = this.outlineWidth * 2;
        ctx.strokeRect(0, 0, this.width, this.height);
    }
}