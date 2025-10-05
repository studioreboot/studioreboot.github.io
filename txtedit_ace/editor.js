function $ (elementId) {
    return document.getElementById(elementId);
}

var editor = {};

// Heights, sizes, positions, are all measured in pixels

editor.settings = {
    font_size: 16,
    font_family: "Roboto Mono",
    console_height: (16 * 2) + (3 * 2) + 6
};

editor.elTextEdit = null;
editor.elEditWindow = null;
editor.elConsole = null;

editor.console = {
    /** @type {HTMLElement|null} */
    modeText: null,
    
    /** @type {HTMLElement|null} */
    lineAndColumnText: null,

    /** @type {HTMLElement|null} */
    commandLine: null
};

editor.textEditor = null; // instance of Ace
editor.consoleHistory = [];

editor.commands = {};

editor.init = function () {

    // grabbing the elements
    editor.elTextEdit = $("text-editor");
    editor.elEditWindow = $("edit-window");
    editor.elConsole = $("console");

    // building
    editor.buildEditor();
    editor.fixLayout();
    editor.bindListeners();
};

editor.changeFontSize = function (newFontSize) {
    editor.settings.font_size = newFontSize;
    editor.settings.console_height = (editor.settings.font_size * 2) + (3 * 2) + 6;

    editor.applyChanges("font-size");
    editor.fixLayout();
};

editor.fixLayout = function () {
    editor.fixLayoutOfApp();
    editor.fixLayoutOfConsole();
};

editor.fixLayoutOfApp = function () {
    // grabbing the elements
    var con = editor.elConsole, win = editor.elEditWindow, app = editor.elTextEdit;

    // adjusting the main div
    app.style.width = window.innerWidth + "px";
    app.style.height = window.innerHeight  + "px";

    // adjusting the console
    con.style.top = (window.innerHeight - editor.settings.console_height) + "px";
    con.style.width = window.innerWidth + "px";
    con.style.height = editor.settings.console_height + "px";

    // adjusting the editorial window (fuck you New York Times, except for wordle)
    win.style.width = window.innerWidth + "px";
    win.style.height = (window.innerHeight - editor.settings.console_height) + "px";

    editor.textEditor.resize();
};

editor.fixLayoutOfConsole = function () {
    // grabbing the elements
    var mt = editor.console.modeText, lc = editor.console.lineAndColumnText, cl = editor.console.commandLine;

    lc.style.top = mt.style.top = ((window.innerHeight - editor.settings.console_height) + 3) + "px";
    lc.style.right = "0px";

    cl.style.top = ((window.innerHeight - editor.settings.console_height) + 6 + editor.settings.font_size) + "px";
    cl.style.left = "0px";
    cl.style.width = innerWidth + "px";
    cl.style.height = editor.settings.font_size + "px";
};

editor.buildConsole = function () {
    // creating the elements
    editor.console.modeText = document.createElement("p");
    editor.console.lineAndColumnText = document.createElement("p");
    editor.console.commandLine = document.createElement("textarea");
    
    // this is why i use morphic, shit is insane.
    editor.console.commandLine.autocorrect = "off";
    editor.console.commandLine.autocapitalize = "off";
    editor.console.commandLine.ariaAutoComplete = "off";
    editor.console.commandLine.setAttribute("autocomplete", "off");
    editor.console.commandLine.classList.add("command-line");
    editor.console.commandLine.spellcheck = false;
    editor.console.commandLine.setAttribute('wrap', 'off');

    editor.console.commandLine.setAttribute("rows", "1");

    editor.console.commandLine.style.height = (editor.settings.font_size + 3) + "px";

    // configuring the line and column text
    editor.console.lineAndColumnText.style.position = "absolute";
    editor.console.lineAndColumnText.style.textAlign = "right";

    editor.elConsole.appendChild(editor.console.modeText);
    editor.elConsole.appendChild(editor.console.lineAndColumnText);
    editor.elConsole.appendChild(editor.console.commandLine);
};

editor.buildEditor = function () {
    editor.buildConsole();
    
    editor.textEditor = ace.edit(editor.elEditWindow, {
        dragEnabled: false,
        enableMobileMenu: false
    });

    // do a lil' polishing
    editor.applyChanges();
};

editor.applyChanges = function (whatChanged) {
    var ace = editor.textEditor;

    switch (whatChanged) {
        case "font-size":
            ace.setFontSize(editor.settings.font_size);

            editor.console.commandLine.style.fontSize = editor.settings.font_size + "px";
            editor.console.lineAndColumnText.style.fontSize = editor.settings.font_size + "px";
            editor.console.modeText.style.fontSize = editor.settings.font_size + "px";
            break;
        default:
            editor.console.commandLine.style.fontSize = editor.settings.font_size + "px";
            editor.console.lineAndColumnText.style.fontSize = editor.settings.font_size + "px";
            editor.console.modeText.style.fontSize = editor.settings.font_size + "px";

            ace.setFontSize(editor.settings.font_size);
            ace.setTheme("ace/theme/one_dark");
            ace.setShowPrintMargin(false);
            break;
    }
};

editor.executeCommand = function (aCommand = "") {
    if (aCommand.charAt(0) != ":") return;

    var command = aCommand.substring(1, aCommand.length).trim()
    if (command.indexOf(" ") !== -1) {
        var args = [];
        var commandId = command.substring(0, command.indexOf(" "));

        let inLargeString = false, ptr = "";

        // much slower? but i don't trust myself with a damn while loop
        for (let i = command.indexOf(" ") + 1; i < command.length; i++) {
            const char = command[i];
            if (char === " " && !inLargeString) {
                args.push(ptr);
                ptr = "";
            } else if (char === '"') {
                if (inLargeString) {
                    args.push(ptr);
                    ptr = "";
                }
                inLargeString = !inLargeString;
            } else {
                ptr += char;
            }
        }
        
        // wonkyliciuos fix
        if (ptr.length > 0) {
            args.push(ptr);
        }
        
        editor.commands[commandId].apply(globalThis, args);
    } else {
        editor.commands[command]()
    }
};

editor.bindListeners = function () {
    var cl = editor.console.commandLine;

    cl.addEventListener("keydown", (ev) => {
        if (ev.key == "Enter") {
            if (editor.consoleHistory.length > 100) {
                editor.consoleHistory.shift();
            }
            editor.consoleHistory.push(cl.value);
            let command = cl.value;
            ev.preventDefault();
            cl.value = "";

            editor.executeCommand(command);
        }

        if (ev.key === "ArrowUp") {
            ev.preventDefault();
            let newCommand = editor.consoleHistory.pop();
            cl.value = newCommand ? newCommand : '';
        }
    });

    window.addEventListener("resize", () => {
        editor.fixLayout();
    });
};

editor.goToLine = function (lnNumber, callback) {
    editor.textEditor.scrollToLine(lnNumber, null, true, callback ? callback : null);
};

editor.importTextFile = function (textFile) {
    editor.textEditor.setValue(textFile);
};

editor.init();