var elEditor = document.getElementById("editor");
elEditor.style.width = innerWidth + "px";
elEditor.style.height = innerHeight + "px";

var editor = ace.edit("editor");
editor.setFontSize(18);
editor.setTheme("ace/theme/one_dark");
editor.setShowPrintMargin(false);