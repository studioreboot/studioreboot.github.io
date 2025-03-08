function $ (elId) {
    return document.querySelector(elId);
}

var sX = $("#sX"), sY = $("#sY"), sZ = $("#sZ");
var dX = $("#dX"), dY = $("#dY"), dZ = $("#dZ");

$("#generate").onclick = function () {
    var res = "return run execute ";
    for (let tX = Math.min(+sX.value, +dX.value); tX <= Math.max(+sX.value, +dX.value); tX++) {
        for (let tY = Math.min(+sY.value, +dY.value); tY <= Math.max(+sY.value, +dY.value); tY++) {
            for (let tZ = Math.min(+sZ.value, +dZ.value); tZ <= Math.max(+sZ.value, +dZ.value); tZ++) {
                res += `if block ~${tX.toString() === "0" ? "" : tX} ~${tY.toString() === "0" ? "" : tY} ~${tZ.toString() === "0" ? "" : tZ} air `;
            }
        }
    }
    $("#result").value = res.substring(0, res.length - 1);
};