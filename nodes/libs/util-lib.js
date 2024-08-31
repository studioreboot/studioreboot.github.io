// util-lib.js
// a set of random utils.

function adjust (x, useHeight = false) {
    if (useHeight) {
        return (x / 599) * window.innerHeight;
    }
    return (x / 1366) * window.innerWidth;
};

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

const now = Date.now;

function parseTimeCode (code) {
    var time = { hours: 0, minutes: 0, seconds: 0 }, numbers = [];
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        if (/[0-9.]/g.test(char)) {
            numbers.push(char);
        } else if (/[hms]/g.test(char.toLowerCase())) {
            switch (char.toLowerCase()) {
                case "h":
                    time.hours = +(numbers.join(""));
                    numbers = [];
                    break;
                case "m":
                    time.minutes = +(numbers.join(""));
                    numbers = [];
                    break;
                case "s":
                    time.seconds = +(numbers.join(""));
                    numbers = [];
                    break;
                default: break;
            }
        }
    }
    return time;
};

async function requestFiles (accepts) {
    return new Promise((resolve, reject) => {
        var inp = document.createElement('input');
        inp.type = "file";
        inp.accept = accepts;
        inp.onchange = function () {
            resolve(inp.files);
            inp.remove();
        }
        document.body.appendChild(inp);
        inp.click();
    })
};