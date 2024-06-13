function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
}

var searchParams = new URL(window.location.href).searchParams;

window.onclick = function () {
    if (!searchParams.has("noNoise")) {
        setInterval(() => {
            let noise = new Audio("tracks/noise.ogg");
            noise.volume = 0.8;
            noise.play();
        }, 2500);
    }
    var track;

    function playNextTrack () {
        track = new Audio("tracks/track" + irand(1, 17) + ".ogg");
        track.volume = 0.9;

        track.onended = function () {
            setTimeout(() => {
                playNextTrack();
            }, 2000);
        }
        track.play();
    }

    setTimeout(() => {
        playNextTrack();
    }, 2000);

    window.onclick = null;

    if (!searchParams.has("noNoise")) {
        let noise = new Audio("tracks/noise.ogg");
        noise.volume = 0.8;
        noise.play();
    }
}
