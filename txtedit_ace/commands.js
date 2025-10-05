editor.commands = {
    settextsize: function (fontsize) {
        editor.changeFontSize(+fontsize);
    },
    import: function () {
        var inp = document.createElement("input");
        inp.style.position = "fixed";
        inp.style.left = "0px";
        inp.style.right = "0px";

        inp.type = "file";

        document.body.appendChild(inp);

        inp.click();

        editor.goToLine(0);

        inp.onchange = function () {
            var file = inp.files[0];
            var reader = new FileReader();
            reader.onload = function () {
                editor.importTextFile(reader.result);
                inp.remove();

                reader = null;
                inp = null;
            };
            reader.readAsText(file);
        }
    },
    about: function () {
        editor.importTextFile(
            "Kath's Personal Text Editor - ver. 1.0 \n" +
            "\n" + 
            "Editor running on Ace (" + ace.version + ")\n" +
            "Programmed in vanilla HTML5, JavaScript, and CSS"
        );
    },
    replace: function (thingToReplace, thingToBeReplacedWith) {
        editor.textEditor.replace(thingToBeReplacedWith, { needle: thingToReplace });
    },
    replaceall: function (thingToReplace, thingToBeReplacedWith) {
        editor.textEditor.replace(thingToBeReplacedWith, { needle: thingToReplace });
    },
    find: function (thing) {
        editor.textEditor.findNext(thing, null, true);
    },
    wordwrap: function (enable) {
        editor.textEditor.getSession().setUseWrapMode(Boolean(enable));
    },
    download: function (fileName) {
        saveAs(new Blob([ editor.textEditor.getValue() ], { type: "text/plain" }), fileName + ".txt")
    },
    setmode: function (mode) {
        editor.textEditor.setOption("mode", "ace/mode/" + mode);
    }
}