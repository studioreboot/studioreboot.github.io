var tBiomes = [
    "in a forest",
    "in a pine forest",
    "knee deep in a swamp",
    "in a mountain range",
    "in a desert",
    "in a grassy plain",
    "in frozen tundra"
];

var seed = Date.now().toString();
Math.seedrandom(seed);

function nop () {
    return null;
};

function isNil (thing) {
    return typeof thing === "undefined" || thing === null;
};

function irand (min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min));
};

function choose (...choices) {
    return choices[irand(0, choices.length - 1)];
};

function hasTrees (_nBiome) {
    return _nBiome <= 3
};

function hasStone (_nBiome) {
    return _nBiome == 4
};

function hasRivers (_nBiome) {
    return _nBiome != 3 && _nBiome != 5
}

var items = {
    "no tea": {
        "droppable": false,
        "desc": "Pull yourself together man."
    },
    "a pig": {
        "heavy": true,
        "creature": true,
        "drops": [
            "some pork"
        ],
        "aliases": [
            "pig"
        ],
        "desc": "The pig has a square nose."
    },
    "a cow": {
        "heavy": true,
        "creature": true,
        "aliases": [
            "cow"
        ],
        "desc": "The cow stares at you blankly."
    },
    "a sheep": {
        "heavy": true,
        "creature": true,
        "hitDrops": [
            "some wool"
        ],
        "aliases": [
            "sheep"
        ],
        "desc": "The sheep is fluffy."
    },
    "a chicken": {
        "heavy": true,
        "creature": true,
        "drops": [
            "some chicken"
        ],
        "aliases": [
            "chicken"
        ],
        "desc": "The chicken looks delicious."
    },
    "a creeper": {
        "heavy": true,
        "creature": true,
        "monster": true,
        "aliases": [
            "creeper"
        ],
        "desc": "The creeper needs a hug."
    },
    "a skeleton": {
        "heavy": true,
        "creature": true,
        "monster": true,
        "aliases": [
            "skeleton"
        ],
        "nocturnal": true,
        "desc": "The head bone's connected to the neck bone, the neck bone's connected to the chest bone, the chest bone's connected to the arm bone, the arm bone's connected to the bow, and the bow is pointed at you."
    },
    "a zombie": {
        "heavy": true,
        "creature": true,
        "monster": true,
        "aliases": [
            "zombie"
        ],
        "nocturnal": true,
        "desc": "All he wants to do is eat your brains."
    },
    "a spider": {
        "heavy": true,
        "creature": true,
        "monster": true,
        "aliases": [
            "spider"
        ],
        "desc": "Dozens of eyes stare back at you."
    },
    "a cave entrance": {
        "heavy": true,
        "aliases": [
            "cave entrance",
            "cave",
            "entrance"
        ],
        "desc": "The entrance to the cave is dark, but it looks like you can climb down."
    },
    "an exit to the surface": {
        "heavy": true,
        "aliases": [
            "exit to the surface",
            "exit",
            "opening"
        ],
        "desc": "You can just see the sky through the opening."
    },
    "a river": {
        "heavy": true,
        "aliases": [
            "river"
        ],
        "desc": "The river flows majestically towards the horizon. It doesn't do anything else."
    },
    "some wood": {
        "aliases": [
            "wood"
        ],
        "material": true,
        "desc": "You could easily craft this wood into planks."
    },
    "some planks": {
        "aliases": [
            "planks",
            "wooden planks",
            "wood planks"
        ],
        "desc": "You could easily craft these planks into sticks."
    },
    "some sticks": {
        "aliases": [
            "sticks",
            "wooden sticks",
            "wood sticks"
        ],
        "desc": "A perfect handle for torches or a pickaxe."
    },
    "a crafting table": {
        "aliases": [
            "crafting table",
            "craft table",
            "work bench",
            "workbench",
            "crafting bench",
            "table"
        ],
        "desc": "It's a crafting table. I shouldn't tell you this, but these don't actually do anything in this game, you can craft tools whenever you like."
    },
    "a furnace": {
        "aliases": [
            "furnace"
        ],
        "desc": "It's a furnace. Between you and me, these don't actually do anything in this game."
    },
    "a wooden pickaxe": {
        "aliases": [
            "pickaxe",
            "pick",
            "wooden pick",
            "wooden pickaxe",
            "wood pick",
            "wood pickaxe"
        ],
        "tool": true,
        "toolLevel": 1,
        "toolType": "pick",
        "desc": "The pickaxe looks good for breaking stone and coal."
    },
    "a stone pickaxe": {
        "aliases": [
            "pickaxe",
            "pick",
            "stone pick",
            "stone pickaxe"
        ],
        "tool": true,
        "toolLevel": 2,
        "toolType": "pick",
        "desc": "The pickaxe looks good for breaking iron."
    },
    "an iron pickaxe": {
        "aliases": [
            "pickaxe",
            "pick",
            "iron pick",
            "iron pickaxe"
        ],
        "tool": true,
        "toolLevel": 3,
        "toolType": "pick",
        "desc": "The pickaxe looks strong enough to break diamond."
    },
    "a diamond pickaxe": {
        "aliases": [
            "pickaxe",
            "pick",
            "diamond pick",
            "diamond pickaxe"
        ],
        "tool": true,
        "toolLevel": 4,
        "toolType": "pick",
        "desc": "Best. Pickaxe. Ever."
    },
    "a wooden sword": {
        "aliases": [
            "sword",
            "wooden sword",
            "wood sword"
        ],
        "tool": true,
        "toolLevel": 1,
        "toolType": "sword",
        "desc": "Flimsy, but better than nothing."
    },
    "a stone sword": {
        "aliases": [
            "sword",
            "stone sword"
        ],
        "tool": true,
        "toolLevel": 2,
        "toolType": "sword",
        "desc": "A pretty good sword."
    },
    "an iron sword": {
        "aliases": [
            "sword",
            "iron sword"
        ],
        "tool": true,
        "toolLevel": 3,
        "toolType": "sword",
        "desc": "This sword can slay any enemy."
    },
    "a diamond sword": {
        "aliases": [
            "sword",
            "diamond sword"
        ],
        "tool": true,
        "toolLevel": 4,
        "toolType": "sword",
        "desc": "Best. Sword. Ever."
    },
    "a wooden shovel": {
        "aliases": [
            "shovel",
            "wooden shovel",
            "wood shovel"
        ],
        "tool": true,
        "toolLevel": 1,
        "toolType": "shovel",
        "desc": "Good for digging holes."
    },
    "a stone shovel": {
        "aliases": [
            "shovel",
            "stone shovel"
        ],
        "tool": true,
        "toolLevel": 2,
        "toolType": "shovel",
        "desc": "Good for digging holes."
    },
    "an iron shovel": {
        "aliases": [
            "shovel",
            "iron shovel"
        ],
        "tool": true,
        "toolLevel": 3,
        "toolType": "shovel",
        "desc": "Good for digging holes."
    },
    "a diamond shovel": {
        "aliases": [
            "shovel",
            "diamond shovel"
        ],
        "tool": true,
        "toolLevel": 4,
        "toolType": "shovel",
        "desc": "Good for digging holes."
    },
    "some coal": {
        "aliases": [
            "coal"
        ],
        "ore": true,
        "toolLevel": 1,
        "toolType": "pick",
        "desc": "That coal looks useful for building torches, if only you had a pickaxe to mine it."
    },
    "some dirt": {
        "aliases": [
            "dirt"
        ],
        "material": true,
        "desc": "Why not build a mud hut?"
    },
    "some stone": {
        "aliases": [
            "stone",
            "cobblestone"
        ],
        "material": true,
        "ore": true,
        "infinite": true,
        "toolLevel": 1,
        "toolType": "pick",
        "desc": "Stone is useful for building things, and making stone pickaxes."
    },
    "some iron": {
        "aliases": [
            "iron"
        ],
        "material": true,
        "ore": true,
        "toolLevel": 2,
        "toolType": "pick",
        "desc": "That iron looks mighty strong, you'll need a stone pickaxe to mine it."
    },
    "some diamond": {
        "aliases": [
            "diamond",
            "diamonds"
        ],
        "material": true,
        "ore": true,
        "toolLevel": 3,
        "toolType": "pick",
        "desc": "Sparkly, rare, and impossible to mine without an iron pickaxe."
    },
    "some torches": {
        "aliases": [
            "torches",
            "torch"
        ],
        "desc": "These won't run out for a while."
    },
    "a torch": {
        "aliases": [
            "torch"
        ],
        "desc": "Fire, fire, burn so bright, won't you light my cave tonight?"
    },
    "some wool": {
        "aliases": [
            "wool"
        ],
        "material": true,
        "desc": "Soft and good for building."
    },
    "some pork": {
        "aliases": [
            "pork",
            "porkchops"
        ],
        "food": true,
        "desc": "Delicious and nutritious."
    },
    "some chicken": {
        "aliases": [
            "chicken"
        ],
        "food": true,
        "desc": "Finger licking good."
    }
}

var tAnimals = [
    "a pig", "a cow", "a sheep", "a chicken",
]

var tMonsters = [
    "a creeper", "a skeleton", "a zombie", "a spider",
]

var tRecipes = {
    "some planks": [ "some wood" ],
    "some sticks": [ "some planks" ],
    "a crafting table": [ "some planks" ],
    "a furnace": [ "some stone" ],
    "some torches": [ "some sticks", "some coal" ],
    "a wooden pickaxe": [ "some planks", "some sticks" ],
    "a stone pickaxe": [ "some stone", "some sticks" ],
    "an iron pickaxe": [ "some iron", "some sticks" ],
    "a diamond pickaxe": [ "some diamond", "some sticks" ],
    "a wooden sword": [ "some planks", "some sticks" ],
    "a stone sword": [ "some stone", "some sticks" ],
    "an iron sword": [ "some iron", "some sticks" ],
    "a diamond sword": [ "some diamond", "some sticks" ],
    "a wooden shovel": [ "some planks", "some sticks" ],
    "a stone shovel": [ "some stone", "some sticks" ],
    "an iron shovel": [ "some iron", "some sticks" ],
    "a diamond shovel": [ "some diamond", "some sticks" ]
}

var tGoWest = [
    "(life is peaceful there)",
    "(lots of open air)",
    "(to begin life anew)",
    "(this is what we'll do)",
    "(sun in winter time)",
    "(we will do just fine)",
    "(where the skies are blue)",
    "(this and more we'll do)"
];

var nGoWest = 0;
var bRunning = true;
var tMap = {};
var x = 0, y = 0, z = 0;
var inventory = {
    "no tea": items["no tea"]
};

var nTurn = 0;
var nTimeInRoom = 0;
var hitPoints = 5;

var tDayCycle = [
    "It is daytime.",
    "It is daytime.",
    "It is daytime.",
    "It is daytime.",
    "It is daytime.",
    "It is daytime.",
    "It is daytime.",
    "It is daytime.",
    "The sun is setting.",
    "It is night.",
    "It is night.",
    "It is night.",
    "It is night.",
    "It is night.",
    "The sun is rising."
];

function getTimeOfDay () {
    return ((Math.floor(nTurn / 3) % tDayCycle.length)) + 1;
}

function time () {
    return tDayCycle[getTimeOfDay()-1];
}

function compareObjects (obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function isSunny () {
    return getTimeOfDay() < 10;
}

function getRoom (x, y, z, dontCreate) {
    if (isNil(tMap[`${x}|${y}|${z}`]) && !dontCreate) {
        var room = {
            items: {},
            exits: {},
            nMonsters: 0,
            dark: false
        };

        if (y == 0) {
            room.biome = irand(1, tBiomes.length);
            room.trees = hasTrees(room.biome);

            if (irand(1, 3) === 1) {
                let nAnimals = irand(1, 3);
                for (let i = 0; i < nAnimals; i++) {
                    let sAnimal = tAnimals[irand(0, tAnimals.length - 1)];
                    room.items[sAnimal] = items[sAnimal];
                }
            }

            if (irand(1, 5) == 1 || hasStone(room.biome)) {
                room.items["some stone"] = items["some stone"];
            }
            if (irand(1, 8) == 1) {
                room.items["some coal"] = items["some coal"];
            }
            if (irand(1, 8) == 1 && hasRivers(room.biome)) {
                room.items["a river"] = items["a river"];
            }

            room.exits = {
                north: true,
                south: true,
                east: true,
                west: true,
                down: false
            };

            if (irand(1, 8) == 1) {
                room.exits.down = true;
                room.items["a cave entrance"] = items["a cave entrance"];
            }
        } else {
            function tryExit (sDir, sOpp, x, y, z) {
                var adj = getRoom(x, y, z, true);
                if (adj) {
                    if (adj.exits[sOpp]) {
                        room.exits[sDir] = true;
                    }
                } else {
                    if (irand(1, 3) == 1) {
                        room.exits[sDir] = true;
                    }
                }
            }

            if (y === - 1) {
                var above = getRoom(x, y + 1, z);
                if (above.exits.down) {
                    room.exits.up = true;
                    room.items["an exit to the surface"] = items["an exit to the surface"];
                }
            } else {
                tryExit("up", "down", x, y + 1, z);
            }

            if (y > -3) {
                tryExit("down", "up", x, y - 1, z);
            }

            tryExit("east", "west", x - 1, y, z);
            tryExit("west", "east", x + 1, y, z);
            tryExit("north", "south", x, y, z + 1);
            tryExit("south", "north", x, y, z - 1);

            room.items["some stone"] = items["some stone"]
            if (irand(1, 3) == 1) {
                room.items["some coal"] = items["some coal"]
            }
            if (irand(1, 8) == 1) {
                room.items["some iron"] = items["some iron"]
            }
            if ((y == -3) && (irand(1, 15) == 1)) {
                room.items["some diamond"] = items["some diamond"]
            }

            room.dark = true;
        }

        tMap[`${x}|${y}|${z}`] = room;
    }

    return tMap[`${x}|${y}|${z}`];
};

function nameOf (anItem) {
    var keys = Object.keys(items);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (items[key] == anItem) {
            return key;
        }
    }
    return "";
};

function itemize (t) {
    if (t.length === 0) {
        return "nothing";
    } else {
        var isSecondToLast = false, o = "";

        var keys = Object.keys(t);
        keys = keys.filter((v) => !isNil(t[v]));
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            isSecondToLast = (i === (keys.length - 2));
            if (i == (keys.length - 1)) {
                o += key;
            } else if (isSecondToLast) {
                o += key + ", and ";
            } else {
                o += key + ", ";
            }
        }

        return o;
    }
};

function findItem (tList, sQuery) {
    const keys = Object.keys(tList);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i], value = tList[key];
        if (key === sQuery) {
            return key;
        }
        if (typeof value.aliases !== "undefined") {
            for (let j = 0; j < value.aliases.length; j++) {
                const alias = value.aliases[j];
                if (alias === sQuery) {
                    return key;
                }
            }
        }
    }
    return null;
};

var commands = {};

var tMatches = {
    "wait": [
        "wait",
    ],
    "look": [
        "look at the ([a-zA-Z0-9\\s]+)",
        "look at ([a-zA-Z0-9\\s]+)",
        "look",
        "inspect ([a-zA-Z0-9\\s]+)",
        "inspect the ([a-zA-Z0-9\\s]+)",
        "inspect",
    ],
    "inventory": [
        "check self",
        "check inventory",
        "inventory",
        "i",
    ],
    "go": [
        "go ([a-zA-Z0-9]+)",
        "travel ([a-zA-Z0-9]+)",
        "walk ([a-zA-Z0-9]+)",
        "run ([a-zA-Z0-9]+)",
        "go",
    ],
    "dig": [
        "dig ([a-zA-Z0-9]+) using ([a-zA-Z0-9\\s]+)",
        "dig ([a-zA-Z0-9]+) with ([a-zA-Z0-9\\s]+)",
        "dig ([a-zA-Z0-9]+)",
        "dig",
    ],
    "take": [
        "pick up the ([a-zA-Z0-9\\s]+)",
        "pick up ([a-zA-Z0-9\\s]+)",
        "pickup ([a-zA-Z0-9\\s]+)",
        "take the ([a-zA-Z0-9\\s]+)",
        "take ([a-zA-Z0-9\\s]+)",
        "take",
    ],
    "drop": [
        "put down the ([a-zA-Z0-9\\s]+)",
        "put down ([a-zA-Z0-9\\s]+)",
        "drop the ([a-zA-Z0-9\\s]+)",
        "drop ([a-zA-Z0-9\\s]+)",
        "drop",
    ],
    "place": [
        "place the ([a-zA-Z0-9\\s]+)",
        "place ([a-zA-Z0-9\\s]+)",
        "place",
    ],
    "cbreak": [
        "punch the ([a-zA-Z0-9\\s]+)",
        "punch ([a-zA-Z0-9\\s]+)",
        "punch",
        "break the ([a-zA-Z0-9\\s]+) with the ([a-zA-Z0-9\\s]+)",
        "break ([a-zA-Z0-9\\s]+) with ([a-zA-Z0-9\\s]+) ",
        "break the ([a-zA-Z0-9\\s]+)",
        "break ([a-zA-Z0-9\\s]+)",
        "break",
    ],
    "mine": [
        "mine the ([a-zA-Z0-9\\s]+) with the ([a-zA-Z0-9\\s]+)",
        "mine ([a-zA-Z0-9\\s]+) with ([a-zA-Z0-9\\s]+)",
        "mine ([a-zA-Z0-9\\s]+)",
        "mine",
    ],
    "attack": [
        "attack the ([a-zA-Z0-9\\s]+) with the ([a-zA-Z0-9\\s]+)",
        "attack ([a-zA-Z0-9\\s]+) with ([a-zA-Z0-9\\s]+)",
        "attack ([a-zA-Z0-9\\s]+)",
        "attack",
        "kill the ([a-zA-Z0-9\\s]+) with the ([a-zA-Z0-9\\s]+)",
        "kill ([a-zA-Z0-9\\s]+) with ([a-zA-Z0-9\\s]+)",
        "kill ([a-zA-Z0-9\\s]+)",
        "kill",
        "hit the ([a-zA-Z0-9\\s]+) with the ([a-zA-Z0-9\\s]+)",
        "hit ([a-zA-Z0-9\\s]+) with ([a-zA-Z0-9\\s]+)",
        "hit ([a-zA-Z0-9\\s]+)",
        "hit",
    ],
    "craft": [
        "craft a ([a-zA-Z0-9\\s]+)",
        "craft some ([a-zA-Z0-9\\s]+)",
        "craft ([a-zA-Z0-9\\s]+)",
        "craft",
        "make a ([a-zA-Z0-9\\s]+)",
        "make some ([a-zA-Z0-9\\s]+)",
        "make ([a-zA-Z0-9\\s]+)",
        "make",
    ],
    "build": [
        "build ([a-zA-Z0-9\\s]+) out of ([a-zA-Z0-9\\s]+)",
        "build ([a-zA-Z0-9\\s]+) from ([a-zA-Z0-9\\s]+)",
        "build ([a-zA-Z0-9\\s]+)",
        "build",
    ],
    "eat": [
        "eat a ([a-zA-Z0-9\\s]+)",
        "eat the ([a-zA-Z0-9\\s]+)",
        "eat ([a-zA-Z0-9\\s]+)",
        "eat",
    ],
    "help": [
        "help me",
        "help",
    ],
    "exit": [
        "exit",
        "quit",
        "goodbye",
        "good bye",
        "bye",
        "farewell",
    ],
    "time": [
        "what time",
        "current time",
        "time"
    ],
    "clear": [
        "clear terminal",
        "clear console"
    ],
    "state": [
        "state ([a-zA-Z0-9]+)"
    ]
};

function doCommand (text) {
    if (text === "") {
        commands.noinput();
    }

    let lastY = y;

    for (const key in tMatches) {
        const matches = tMatches[key];
        for (let i = 0; i < matches.length; i++) {
            let captures = new RegExp(`^${matches[i]}$`, "gi").exec(text);
            if (captures instanceof Array) {
                if (captures.length === 1 && captures[0] === matches[i]) {
                    commands[key]();
                } else {
                    commands[key].apply(null, captures.slice(1, captures.length));
                }
                return null;
            }
        }
    }
    commands.badinput();

    if ((lastY < y && y === 0) || (lastY === 0 && y < lastY)) {
        if (playingAmbientTrack) {
            playingAmbientTrack.fade(1, 0, 250);
        }
    }
};

commands.state = function (which) {
    if (which === "save") {
        save();
        print("Saved progress.");
    } else if (which === "load") {
        load();
        doCommand("inspect");
    } else {
        print("What?");
    }
};

commands.time = function () {
    print(time());
};

commands.clear = function () {
    clear();
};

commands.exit = function () {
    window.location.replace("https://www.google.com/");
};

commands.noinput = function () {
    print(choose(
        "Speak up.",
        "Enunciate.",
        "Project your voice.",
        "Don't be shy.",
        "Use your words."
    ));
};

commands.badinput = function () {
    print(choose(
        "I don't understand.",
        "I don't understand you.",
        "You can't do that.",
        "Nope.",
        "Huh?",
        "Say again?",
        "That's crazy talk.",
        "Speak clearly.",
        "I'll think about it.",
        "Let me get back to you on that one.",
        "That doesn't make any sense.",
        "What?"
    ));
};

commands.inventory = function () {
    print(`§wYou are carrying §0${itemize(inventory)}§w.`);
};

commands.wait = function () {
    print("§wTime passes.");
};

// §

commands.look = function (target) {
    var room = getRoom(x, y, z);
    if (room.dark) {
        print("§0It's pitch black.");
        return null;
    } else if (y === 0 && isNil(room.items["a torch"]) && !isSunny()) {
        print("§0You can barely see a thing.");
        return null;
    }

    if (isNil(target)) {
        if (y === 0) {
            print(`§wYou are standing ${tBiomes[room.biome-1]}, ${time()}`);
        } else {
            var descr = "You are underground.";
            if (Object.keys(room.exits).length > 0) {
                descr += "You can travel " + itemize(room.exits) + ".";
            }
            print(descr);
        }

        if (Object.keys(room.items).length > 0) {
            print(`There is ${itemize(room.items)} here.`);
        }

        if (room.trees) {
            print("There are trees here.");
        }
    } else {
        if (room.trees && (/tree/gi.test(target))) {
            print("The trees look very easy to break.");
        } else if (/self/gi.test(target)) {
            print("Very handsome.");
        } else {
            var tItem = null, sItem = findItem(room.items, target);
            if (!isNil(sItem)) {
                tItem = room.items[sItem];
            } else {
                sItem = findItem(inventory, target)
                if (!isNil(sItem)) {
                    tItem = inventory[sItem]
                }
            }
            if (!isNil(tItem)) {
                print(tItem.desc || `You see nothing special about ${sItem}.`);
            } else {
                print(`You don't see any ${target} here.`);
            }
        }
    }
};

commands.go = function (dir) {
    var room = getRoom(x, y, z);
    if (isNil(dir)) {
        print("Go where?");
        return;
    }

    if (!isNil(nGoWest)) {
        if (dir === "west") {
            nGoWest++;
            if (nGoWest >= tGoWest.length) {
                nGoWest = 0;
            }
            print(tGoWest[nGoWest]);
        }
    }

    if (isNil(room.exits[dir])) {
        print("You can't go that way");
        return;
    }
    
    switch (dir) {
        case "north":
            z--;
            break;
        case "south":
            z++;
            break;
        case "east":
            x++;
            break;
        case "west":
            x--;
            break;
        case "up":
            y++;
            break;
        case "down":
            y--;
            break;
        default:
            commands.badinput();
            return;
    }

    nTimeInRoom = 0;
    doCommand("look");
};

commands.dig = function (dir, tool) {
    var room = getRoom(x, y, z);
    if (isNil(dir)) {
        print("Dig where?");
        return null;
    }

    var sTool, tTool;
    if (!isNil(sTool)) {
        sTool = findItem(inventory, tool);
        if (!sTool) {
            print(`You're not carrying a ${tool}.`);
            return null;
        }
        tTool = inventory[sTool];
    }

    var isActuallyDigging = (room.exits[dir] != true);
    if (isActuallyDigging) {
        if ((!isNil(sTool)) && tTool.toolType == "pick") {
            print("You need to use a pickaxe to dig through stone.");
            return null;
        }
    }

    switch (dir) {
        case "north":
            room.exits.north = true;
            z--;
            getRoom(x, y, z).exits.south = true;
            break;
        case "south":
            room.exits.south = true;
            z++;
            getRoom(x, y, z).exits.north = true;
            break;
        case "east":
            room.exits.east = true;
            x++;
            getRoom(x, y, z).exits.west = true;
            break;
        case "west":
            room.exits.west = true;
            x--;
            getRoom(x, y, z).exits.east = true;
            break;
        case "up":
            if (y === 0) {
                print("You good? You're trying to dig air.");
                return null;
            }

            room.exits.up = true;
            if (y === -1) {
                room.items["an exit to the surface"] = items["an exit to the surface"];
            }
            y++;

            room = getRoom(x, y, z);
            room.exits.down = true;
            if (y == 0) {
                room.items["a cave entrance"] = items["a cave entrance"];
            }
            break;
        case "down":
            if (y <= -3) {
                print("You hit bedrock.");
                return null;
            }

            room.exits.down = true;
            if (y === 0) {
                room.items["a cave entrance"] = items["a cave entrance"];
            }
            y--;

            room = getRoom(x, y, z);
            room.exits.up = true;
            if (y == -1) {
                room.items["a exit to the surface"] = items["an exit to the surface"];
            }
            break;
        default:
            commands.badinput();
            return null;
    }

    if (isActuallyDigging) {
        if ((dir === "down" && y === - 1) || (dir === "up" && y === 0)) {
            inventory["some dirt"] = items["some dirt"];
            inventory["some stone"] = items["some stone"];
            print("You dig " + dir + " using " + sTool + " and collect some dirt and stone.");
        } else {
            inventory["some stone"] = items["some stone"];
            print("You dig " + dir + " using " + sTool + " and collect some stone.");
        }
    }

    nTimeInRoom = 0;
    doCommand("look");
};

commands.drop = function (qItem) {
    if (isNil(qItem)) {
        print("Drop §5what§w?");
        return null;
    }

    var room = getRoom(x, y, z);
    var sItem = findItem(inventory, qItem);
    if (!isNil(sItem)) {
        var tItem = inventory[sItem];
        if (!tItem.droppable) {
            print(`You can't drop that${irand(1, 10) === 1 ? ", you §5moron§w" : ""}.`);
        } else {
            room.items[sItem] = tItem;
            delete inventory[sItem];
            print("Dropped.");
        }
    } else {
        print("You don't have a " + qItem + ".");
    }
};

commands.place = function (qItem) {
    if (isNil(qItem)) {
        print("Place §5what§w?");
        return null;
    }

    if (/[torch]+/gi.test(qItem)) {
        var room = getRoom(x, y, z);
        if (inventory["some torches"] || inventory["a torch"]) {
            delete inventory["a torch"];
            room.items["a torch"] = items["a torch"];
            if (room.dark) {
                print("The room lights up under the torchflame.");
                room.dark = false;
            } else if (y === 0 && !isSunny()) {
                print("The night gets a little brighter under the light.")
            } else {
                print("Placed torch.");
            }
        } else {
            print("You don't have any torches.");
        }
    }

    var room = getRoom(x, y, z);
    var sItem = findItem(inventory, qItem);
    if (!isNil(sItem)) {
        var tItem = inventory[sItem];
        if ((!tItem.droppable) || (!tItem.material)) {
            print(`You can't place that${irand(1, 10) === 1 ? ", you §5moron§w" : ""}.`);
        } else {
            room.items[sItem] = tItem;
            delete inventory[sItem];
            print("Placed.");
        }
    } else {
        print("You don't have a " + qItem + ".");
    }
};

commands.take = function (qItem) {
    if (isNil(qItem)) {
        print("Take §5what§w?");
        return null;
    }

    var room = getRoom(x, y, z);
    var sItem = findItem(inventory, qItem);
    if (!isNil(sItem)) {
        var tItem = inventory[sItem];
        if (tItem.heavy) {
            print("You can't carry " + sItem + ", because it's too heavy.");
        } else if (tItem.ore) {
            print("You can't just take an ore without mining it!");
        } else {
            if (!tItem.infinite) {
                delete room.items[sItem];
            }
            inventory[sItem] = tItem;

            if (inventory["some torches"] && inventory["a torch"]) {
                delete inventory["a torch"];
            }
            if (sItem == "a torch" && y < 0) {
                room.dark = true;
                print("The cave plunges into darkness.");
            } else {
                print("Taken.");
            }
        }
    } else {
        print("You don't see a " + qItem + ".");
    }
};

commands.mine = function (qItem, sTool) {
    if (isNil(qItem)) {
        print("Mine what?");
        return null;
    }
    if (isNil(sTool)) {
        print("Mine " + qItem + " with what?");
        return null;
    }
    commands.cbreak(qItem, sTool);
};

commands.attack = function (qItem, sTool) {
    if (isNil(qItem)) {
        print("Attack what?");
        return null;
    }
    commands.cbreak(qItem, sTool);
};

commands.cbreak = function (thing, tool) {
    if (isNil(thing)) {
        print("Break what?");
        return null;
    }

    var sTool = null;
    if (!isNil(tool)) {
        sTool = findItem(inventory, tool);
        if (isNil(sTool)) {
            print("You're not carrying a " + tool + ".");
            return null;
        }
    }

    var room = getRoom(x, y, z);
    if (/(tree)+/gi.test(thing)) {
        print("The tree breaks into blocks of wood, which you pick up.");
        inventory["some wood"] = items["some wood"];
        return null;
    } else if (/(self)+/gi.test(thing)) {
        print("§r§5You have died.");
        print("§r§5Score: &e0");
        bRunning = false;
        return null;
    }

    var sItem = findItem(room.items, thing);
    if (!isNil(sItem)) {
        var tItem = room.items[sItem];
        if (tItem.ore === true) {
            if (!sTool) {
                print("You need a tool to break this ore.");
                return null;
            }
            var tTool = inventory[sTool];
            if (tTool.tool) {
                if (tTool.toolLevel < tItem.toolLevel) {
                    print(`${sTool} is not strong enough to break this ore.`);
                } else if (tTool.toolLevel !== tItem.toolLevel) {
                    print("You need a different kind of tool to break this ore.");
                } else {
                    print("The ore breaks, dropping " + sItem + ", which you pick up.");
                    inventory[sItem] = items[sItem];
                    if (tItem.infinite !== true) {
                        delete room.items[sItem];
                    }
                }
            } else {
                print("You can't break "+ sItem + " with " + sTool + ".")
            }
        } else if (tItem.creature === true) {
            var toolLevel = 0, tTool = null;
            if (sTool) {
                tTool = inventory[sTool];
                if (tTool.toolType === "sword") {
                    toolLevel = tTool.toolLevel;
                }
            }

            var tChances = [ 0.2, 0.4, 0.55, 0.8, 1 ];
            if (Math.random() <= tChances[toolLevel-1]) {
                print(irand(1, 10) === 1 ? `The ${tItem.aliases[0]} dies slowly, knowing it could of had a great life.` : `The ${tItem.aliases[0]} dies.`);

                for (let i = 0; i < tItem.drops.length; i++) {
                    const drop = tItem.drops[i];
                    if (!(room.items[drop])) {
                        print(`The ${tItem.aliases[0]} dropped ${drop}`);
                        room.items[drop] = items[drop];
                    }
                }

                if (tItem.monster) {
                    room.nMonsters--;
                }
            } else {
                print(`The ${tItem.aliases[0]} became injured.`);
            }

            if (irand(1, 5) <= 3 && tItem.hitDrops) {
                for (let i = 0; i < tItem.hitDrops.length; i++) {
                    const drop = tItem.hitDrops[i];
                    if (!(room.items[drop])) {
                        print(`The ${tItem.aliases[0]} dropped ${drop}`);
                        room.items[drop] = items[drop];
                    }
                }
            }
        } else {
            print(`You can't break ${sItem}.`);
        }
    } else {
        print(`You don't see a ${thing} here.`);
    }
};

commands.help = function () {
    print("Welcome to §yadventure.lua§w, the §5greatest§w text adventure game on CraftOS.");
    print("To get around the world, type actions, and your adventure will")
    print("be read back to you. The actions available to you are go, look, inspect, inventory,");
    print("take, drop, place, punch, attack, mine, dig, craft, build, eat and exit.");
}

commands.craft = function (qItem) {
    if (isNil(qItem)) {
        print("Craft what?");
        return null;
    }

    if (/(computer)+/gi.test(qItem)) {
        print("By creating a computer in a computer, you tear a hole in the spacetime continuum from which no mortal being can escape.");
        print("§r§5You have died.");
        print("§r§5Score: &e0");
        bRunning = false;
        return null;
    }

    var sItem = findItem(items, qItem);
    var tRecipe = (sItem ? (tRecipes[sItem] || null) : null);
    if (tRecipe) {
        for (let i = 0; i < tRecipe.length; i++) {
            const req = tRecipe[i];
            if (!inventory[req]) {
                print("You don't have the items you need to craft " + sItem + ".");
                return null;
            }
        }

        for (let i = 0; i < tRecipe.length; i++) {
            const req = tRecipe[i];
            delete inventory[req];
        }
        inventory[sItem] = items[sItem];
        if (inventory["some torches"] && inventory["a torch"]) {
            inventory["a torch"] = null;
        }

        print("Crafted " + sItem + ".");
    } else {
        print("You don't know how to make " + (sItem || qItem) + ".");
    }
};

commands.eat = function (what) {
    if (isNil(what)) {
        print("Eat what?");
        return null;
    }

    var sItem = findItem(inventory, what);
    if (isNil(sItem)) {
        print("You don't have any " + what + " on you.");
        return null;
    }

    var tItem = inventory[sItem];
    if (tItem.food) {
        print(choose(
            "That was delicious!",
            "Who made this?",
            "Taste like dogshit."
        ));
        delete inventory[sItem];

        hitPoints++;
        hitPoints = Math.min(hitPoints, 5);
        if (hitPoints === 5) {
            print("You are no longer injured.");
        } else {
            print("You've gained some strength.");
        }
    } else {
        print(`You cannot eat ${sItem}.`);
    }
};

// save & load:

function save () {
    var state = {};

    state.turn = nTurn;
    state.timeInRoom = nTimeInRoom;

    var player = {};
    player.hitPoints = hitPoints;
    player.x = x;
    player.y = y;
    player.z = z;
    player.inventory = inventory;

    state.player = player;

    state.map = tMap;
    state.seed = seed;

    localStorage.setItem("save-data", JSON.stringify(state));
}

function load () {
    var state = JSON.parse(localStorage.getItem("save-data"));

    nTurn = state.turn;
    nTimeInRoom = state.timeInRoom;

    x = state.player.x;
    y = state.player.y;
    z = state.player.z;
    hitPoints = state.player.hitPoints;
    inventory = state.player.inventory;

    tMap = state.map;

    Math.seedrandom(state.seed);

    doCommand("clear terminal");
}

// simulating world:

function simulate () {
    var newMonstersThisRoom = false;

    for (let sx = -2; sx < 2; sx++) {
        for (let sy = -1; sy < 1; sy++) {
            for (let sz = -2; sz < 2; sz++) {
                let h = y + sy;
                if (h >= -3 && h <= 0) {
                    var room = getRoom(x + sx, h, z + sz);

                    if (room.nMonsters < 2 && ((h == 0 && (!isSunny()) && (!room.items["a torch"])) || room.dark)) {
                        var sMonster = tMonsters[irand(0, tMonsters.length - 1)];
                        if (isNil(room.items[sMonster])) {
                            room.items[sMonster] = items[sMonster];
                            room.nMonsters++;
                            if ((sx === 0 && sy === 0 && sz === 0) && !room.dark) {
                                print("From the shadows, " + sMonster + " appears.");
                                newMonstersThisRoom = true;
                            }
                        }
                    }

                    if (h === 0 && isSunny()) {
                        for (const key in tMonsters) {
                            if (room.items[key] && !room.items[key].nocturnal) {
                                delete room.items[key];
                                if (sx === 0 && sy === 0 && sz === 0 && !room.dark) {
                                    print("With the sun high in the sky, the " + items[sMonster].aliases[1] + " bursts into flame and dies.");
                                }
                                room.nMonsters--;
                            }
                        }
                    }
                }
            }
        }
    }

    var room = getRoom(x, y, z);
    if (nTimeInRoom >= 2 && !newMonstersThisRoom) {
        for (const key in tMonsters) {
            if (room.items[key]) {
                if (irand(1, 4) === 1 && !(y === 0 && isSunny && key === "a spider")) {
                    if (sMonster === "creeper") {
                        print(`${room.dark ? "A" : "The"} creeper explodes.`);
                        delete room.items[sMonster];
                        room.nMonsters--;
                    } else {
                        print(`${room.dark ? "A" : "The"} ${items[sMonster].aliases[0]} attacks you.`);
                    }

                    if (hitPoints <= 0) {
                        print("§r§5You have died.");
                        print("§r§5Score: &e0");
                        bRunning = false;
                    }

                    hitPoints--;
                }
            }
        }
    }

    if (hitPoints < 4) {
        print("§rYou are injured.");
    }

    nTurn++;
    nTimeInRoom++;
}

var playingAmbientTrack = null;

function play (anAudio) {
    anAudio.once("ended", () => {
        playingAmbientTrack = null;
    })
    anAudio.volume(1);
    playingAmbientTrack = anAudio;
    anAudio.currentTime = 0;
    anAudio.play();
}

function howl (source) {
    return new Howl({ src: [source] });
}

var ambTracks = {
    spoop: howl("spoop.ogg")
};

function randomAmbientTrack () {
    if (y < 0 && room.dark && (irand(1, 6) == 1) && playingAmbientTrack) {
        ambTracks.spoop.play();
    }
};

// console stuff:

var eConsole = document.getElementById("console");

function parseString (str) {
    var fonts = [], ptr = document.createElement("font");
    fonts.push(ptr);
    ptr.style.color = "white";
    var lastColor = "white";
    for (let i = 0; i < str.length; i++) {
        const last = str.charAt(i-1);
        const char = str.charAt(i);
        
        if (last === "§") {
            switch (char) {
                case "r":
                    ptr = document.createElement("font");
                    ptr.style.color = "red";
                    fonts.push(ptr);
                    break;
                case "g":
                    ptr = document.createElement("font");
                    ptr.style.color = "green";
                    fonts.push(ptr);
                    break;
                case "b":
                    ptr = document.createElement("font");
                    ptr.style.color = "rgb(0,68,255)";
                    fonts.push(ptr);
                    break;
                case "y":
                    ptr = document.createElement("font");
                    ptr.style.color = "rgb(248,235,119)";
                    fonts.push(ptr);
                    break;
                case "w":
                    ptr = document.createElement("font");
                    ptr.style.color = "white";
                    fonts.push(ptr);
                    break;
                case "0":
                    ptr = document.createElement("font");
                    ptr.style.color = "rgb(128,128,128)";
                    fonts.push(ptr);
                    break;
                case "j":
                    ptr = document.createElement("font");
                    ptr.style.color = "black";
                    fonts.push(ptr);
                case "5":
                    var it = document.createElement("i");
                    ptr.appendChild(it);
                    ptr = it;
                    break;
                default:
                    break;
            }
            lastColor = ptr.style.color;
        } else if (char === " ") {
            var spacer = document.createElement("font");
            spacer.style.color = "black";
            spacer.textContent = "_";
            fonts.push(spacer);

            ptr = document.createElement("font");
            ptr.style.color = lastColor;
            fonts.push(ptr);
        } else if (char !== "§") {
            ptr.textContent += char;
        }
    }
    return fonts;
};

function print (text) {
    var lst = [];
    while (text.length > 0) {
        lst.push(text.substring(0, 102));
        text = text.substring(103, text.length);
    }

    for (let i = 0; i < lst.length; i++) {
        const p = document.createElement("p");
        
        const parsed = parseString(lst[i]);
        for (let k = 0; k < parsed.length; k++) {
            const font = parsed[k];
            p.appendChild(font);
        }

        p.classList.add("term-item", "printed");
        eConsole.appendChild(p);
        p.scrollIntoView();
    }
};

function clear () {
    while (eConsole.firstChild) {
        eConsole.removeChild(eConsole.firstChild);
    }
};

var tickEvents = [];

var inputArea = document.createElement("textarea");
inputArea.focus();
inputArea.style.position = "fixed";
inputArea.style.cursor = "default";
inputArea.style.top = "0";
inputArea.onblur = function () {
    inputArea.focus();
};
inputArea.style.zIndex = -2;
document.body.appendChild(inputArea);

window.onclick = function () {
    inputArea.focus();
};

function requestInput () {
    const p = document.createElement("p");
    p.classList.add("term-item");

    var input = "", isThereUnderscore = false;

    function redraw () {
        while (p.firstChild) {
            p.firstChild.remove();
        }
        const parsed = parseString(`§y? §w${input}${isThereUnderscore ? "_" : ""}`);
        for (let k = 0; k < parsed.length; k++) {
            const font = parsed[k];
            p.appendChild(font);
        }
    }

    var thing = setInterval(() => {
        isThereUnderscore = !isThereUnderscore;
        redraw();
        if (p.parentElement === null) {
            eConsole.appendChild(p);
        }
    }, 250);

    p.id = "cursor";

    eConsole.appendChild(p);

    redraw();

    inputArea.focus();

    p.scrollIntoView();
    p.scrollIntoView();
    p.scrollIntoView();
    p.scrollIntoView();
    window.scrollBy(0, 10000);
    
    return new Promise((resolve, reject) => {
        inputArea.onkeydown = function (ev) {
            let cKey = ev.key.toLowerCase();
            if (cKey === "enter") {
                p.id = null;
                input.onkeydown = nop;
                clearInterval(thing);
                isThereUnderscore = false;
                redraw();
                resolve(input);
            } else if (cKey === "backspace") {
                input = input.substring(0, input.length - 1);
                redraw();
            } else if (cKey.length < 2) {
                input += ev.key;
                redraw();
            }
        };
    });
}

tickEvents.push(function(){
    if (irand(1, 50) <= 15 && bRunning === true) {
        randomAmbientTrack();
    }
});

doCommand("look");
simulate();

function inputLoop () {
    requestInput().then(val => {
        doCommand(val);
        if (bRunning === true) {
            simulate();
            setTimeout(inputLoop, 1);
        } else if (bRunning === false) {
            bRunning = "0";
            setTimeout(() => {
                window.location.replace("https://www.google.com");
            }, 5000);
        }
    });
}

inputLoop();

function update () {
    for (let i = 0; i < tickEvents.length; i++) {
        const func = tickEvents[i];
        func();
    }
}

setInterval(update, (1/24));