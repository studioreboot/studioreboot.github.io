var save = {
    memory: {},
    setKeyTo: function (key, value) {
        save.memory[key] = value;
    },
    getKey: function (key) {
        return save.memory[key] || null;
    },
    save: function () {
        var saveStr = "", keys = Object.keys(save.memory);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            saveStr += key + "=" + save.memory[key] + ";";
        }
        localStorage.setItem("siteSave", saveStr);
    },
    load: function () {
        var curSaveFile = localStorage.getItem("siteSave");
        if (!curSaveFile) return;
        var storedValues = curSaveFile.split(";");
        for (let i = 0; i < storedValues.length; i++) {
            const keyValue = storedValues[i].split("=");
            save.memory[keyValue[0]] = keyValue.length >= 3 ? keyValue.slice(1, keyValue.length).join("=") : keyValue[1];
        }
    }
}