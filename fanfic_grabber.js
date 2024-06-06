var storytxt = document.getElementById("storytext"), nChildren = storytxt.children.length, out = "";
for (let i = 0; i < nChildren; i++) {
    const itm = storytxt.children[i];
    if (itm.tagName == "HR") {
        out += "<hr>\n\n";
    } else {
        out += itm.innerHTML.replaceAll("<br>", "\n") + "\n\n";
    }
}
