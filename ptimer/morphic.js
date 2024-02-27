/*

    morphic.js

    a lively Web-GUI
    inspired by Squeak

    written by Jens Mönig
    jens@moenig.org

    Copyright (C) 2010-2023 by Jens Mönig

    This file is part of Snap!.

    Snap! is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of
    the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.


    documentation contents
    ----------------------
    I. inheritance hierarchy
    II. object definition toc
    III. yet to implement
    IV. open issues
    V. browser compatibility
    VI. the big picture
    VII. programming guide
        (1) setting up a web page
            (a) single world
            (b) multiple worlds
            (c) an application
        (2) manipulating morphs
        (3) events
            (a) mouse events
            (b) context menu
            (c) dragging
            (d) dropping
            (e) keyboard events
            (f) resize event
            (g) combined mouse-keyboard events
            (h) text editing events
        (4) stepping
        (5) creating new kinds of morphs
            (a) drawing the shape
            (b) determining extent and arranging submorphs
            (c) pixel-perfect pointing events
            (d) caching the shape
            (e) holes
            (f) updating
            (g) duplicating
        (6) development and user modes
        (7) turtle graphics
        (8) supporting high-resolution "retina" screens
        (9 animations
        (10) minifying morphic.js
    VIII. acknowledgements
    IX. contributors


    I. hierarchy
    -------------
    the following tree lists all constructors hierarchically,
    indentation indicating inheritance. Refer to this list to get a
    contextual overview:

    Animation
    Color
    Node
        Morph
            BlinkerMorph
                CursorMorph
            BouncerMorph*
            BoxMorph
                InspectorMorph
                MenuMorph
                MouseSensorMorph*
                SpeechBubbleMorph
            CircleBoxMorph
                SliderButtonMorph
                SliderMorph
            ColorPaletteMorph
                GrayPaletteMorph
            ColorPickerMorph
            DialMorph
            FrameMorph
                ScrollFrameMorph
                    ListMorph
                StringFieldMorph
                WorldMorph
            HandleMorph
            HandMorph
            PenMorph
            ShadowMorph
            StringMorph
            TextMorph
            TriggerMorph
                MenuItemMorph
    Point
    Rectangle


    II. toc
    -------
    the following list shows the order in which all constructors are
    defined. Use this list to locate code in this document:

    Global settings
    Global functions

    Animation
    Color
    Point
    Rectangle
    Node
    Morph
    ShadowMorph
    HandleMorph
    PenMorph
    ColorPaletteMorph
    GrayPaletteMorph
    ColorPickerMorph
    BlinkerMorph
    CursorMorph
    BoxMorph
    SpeechBubbleMorph
    DialMorph
    CircleBoxMorph
    SliderButtonMorph
    SliderMorph
    MouseSensorMorph*
    InspectorMorph
    MenuMorph
    StringMorph
    TextMorph
    TriggerMorph
    MenuItemMorph
    FrameMorph
    ScrollFrameMorph
    ListMorph
    StringFieldMorph
    BouncerMorph*
    HandMorph
    WorldMorph

    * included only for demo purposes


    III. yet to implement
    ---------------------
    - keyboard support for scroll frames and lists
    - virtual keyboard support for Android


    IV. open issues
    ----------------
    - clipboard support (copy & paste) for non-textual data


    V. browser compatibility
    ------------------------
    I have taken great care and considerable effort to make morphic.js
    runnable and appearing exactly the same on all current browsers
    available to me:

    - Firefox for Windows
    - Firefox for Mac
    - Firefox for Android
    - Chrome for Windows
    - Chrome for Mac
    - Chrome for Android
    - Safari for Windows (deprecated)
    - safari for Mac
    - Safari for iOS (mobile)
    - IE for Windows (partial support)
    - Edge for Windows
    - Opera for Windows
    - Opera for Mac


    VI. the big picture
    -------------------
    Morphic.js is completely based on Canvas and JavaScript, it is just
    Morphic, nothing else. Morphic.js is very basic and covers only the
    bare essentials:

        * a stepping mechanism (a time-sharing multiplexer for lively
          user interaction ontop of a single OS/browser thread)
        * progressive display updates (only dirty rectangles are
          redrawn at each display cycle)
        * a tree structure
        * a single World per Canvas element (although you can have
          multiple worlds in multiple Canvas elements on the same web
          page)
        * a single Hand per World (but you can support multi-touch
          events)
        * a single text entry focus per World

    In its current state morphic.js doesn't support transforms (you
    cannot rotate Morphs), but with PenMorph there already is a simple
    LOGO-like turtle that you can use to draw onto any Morph it is
    attached to. I'm planning to add special Morphs that support these
    operations later on, but not for every Morph in the system.
    Therefore these additions ("sprites" etc.) are likely to be part of
    other libraries ("microworld.js") in separate files.

    the purpose of morphic.js is to provide a malleable framework that
    will let me experiment with lively GUIs for my hobby horse, which
    is drag-and-drop, blocks based programming languages. Those things
    (BYOB4 - http://byob.berkeley.edu) will be written using morphic.js
    as a library.


    VII. programming guide
    ----------------------
    Morphic.js provides a library for lively GUIs inside single HTML
    Canvas elements. Each such canvas element functions as a "world" in
    which other visible shapes ("morphs") can be positioned and
    manipulated, often directly and interactively by the user. Morphs
    are tree nodes and may contain any number of submorphs ("children").

    All things visible in a morphic World are morphs themselves, i.e.
    all text rendering, blinking cursors, entry fields, menus, buttons,
    sliders, windows and dialog boxes etc. are created with morphic.js
    rather than using HTML DOM elements, and as a consequence can be
    changed and adjusted by the programmer regardless of proprietary
    browser behavior.

    Each World has an - invisible - "Hand" resembling the mouse cursor
    (or the user's finger on touch screens) which handles mouse events,
    and may also have a keyboard focus to handle key events.

    The basic idea of Morphic is to continuously run display cycles and
    to incrementally update the screen by only redrawing those  World
    regions which have been "dirtied" since the last redraw. Before
    each shape is processed for redisplay it gets the chance to perform
    a "step" procedure, thus allowing for an illusion of concurrency.


    (1) setting up a web page
    -------------------------
    Setting up a web page for Morphic always involves three steps:
    adding one or more Canvas elements, defining one or more worlds,
    initializing and starting the main loop.


    (a) single world
    -----------------
    Most commonly you will want your World to fill the browsers's whole
    client area. This default situation is easiest and most straight
    forward.

    example html file:

    <!DOCTYPE html>
    <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Morphic!</title>
            <script type="text/javascript" src="morphic.js"></script>
            <script type="text/javascript">
                var world;

                window.onload = function () {
                    world = new WorldMorph(document.getElementById('world'));
                    world.isDevMode = true;
                    loop();
                };

                function loop() {
                    requestAnimationFrame(loop);
                    world.doOneCycle();
                }
            </script>
        </head>
        <body style="margin: 0;">
            <canvas id="world" tabindex="1" width="800" height="600"
                style="position: absolute;"></canvas>
        </body>
    </html>

    if you use ScrollFrames or otherwise plan to support mouse wheel
    scrolling events, make sure to add the following inline-CSS
    attribute to the Canvas element:

        style="position: absolute;"

    which will prevent the World to be scrolled around instead of the
    elements inside of it in some browsers.


    (b) multiple worlds
    -------------------
    If you wish to create a web page with more than one world, make
    sure to prevent each world from auto-filling the whole page and
    include it in the main loop. It's also a good idea to give each
    world its own tabindex:

    example html file:

    <!DOCTYPE html>
    <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Morphic!</title>
            <script type="text/javascript" src="morphic.js"></script>
            <script type="text/javascript">
                var	world1, world2;

                window.onload = function () {
                    world1 = new WorldMorph(
                        document.getElementById('world1'), false);
                    world2 = new WorldMorph(
                        document.getElementById('world2'), false);
                    loop();
                };

                function loop() {
                    requestAnimationFrame(loop);
                    world1.doOneCycle();
                    world2.doOneCycle();
                }
            </script>
        </head>
        <body>
            <p>first world:</p>
            <canvas id="world1" tabindex="1" width="600" height="400"></canvas>
            <p>second world:</p>
            <canvas id="world2" tabindex="2" width="400" height="600"></canvas>
        </body>
    </html>


    (c) an application
    -------------------
    Of course, most of the time you don't want to just plain use the
    standard Morphic World "as is" out of the box, but write your own
    application (something like Scratch!) in it. For such an
    application you'll create your own morph prototypes, perhaps
    assemble your own "window frame" and bring it all to life in a
    customized World state. the following example creates a simple
    snake-like mouse drawing game.

    example html file:

    <!DOCTYPE html>
    <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>touch me!</title>
            <script type="text/javascript" src="morphic.js"></script>
            <script type="text/javascript">
                var worldCanvas, sensor;

                window.onload = function () {
                    var x, y, w, h;

                    worldCanvas = document.getElementById('world');
                    world = new WorldMorph(worldCanvas);
                    world.isDevMode = false;
                    world.setColor(new Color());

                    w = 100;
                    h = 100;

                    x = 0;
                    y = 0;

                    while ((y * h) < world.height()) {
                        while ((x * w) < world.width()) {
                            sensor = new MouseSensorMorph();
                            sensor.setPosition(new Point(x * w, y * h));
                            sensor.alpha = 0;
                            sensor.setExtent(new Point(w, h));
                            world.add(sensor);
                            x += 1;
                        }
                        x = 0;
                        y += 1;
                    }
                    loop();
                };

                function loop() {
                    requestAnimationFrame(loop);
                    world.doOneCycle();
                }
            </script>
        </head>
        <body bgcolor='black' style="margin: 0;">
            <canvas id="world" width="800" height="600"
                style="position: absolute;"></canvas>
        </body>
    </html>

    To get an idea how you can craft your own custom morph prototypes
    I've included two examples which should give you an idea how to add
    properties, override inherited methods and use the stepping
    mechanism for "livelyness":

        BouncerMorph
        MouseSensorMorph

    For the sake of sharing a single file I've included those examples
    in morphic.js itself. Usually you'll define your additions in a
    separate file and keep morphic.js untouched.


    (2) manipulating morphs
    -----------------------
    There are many methods to programmatically manipulate morphs. Among
    the most important and common ones among all morphs are the
    following nine:

    * hide()
    * show()

    * setPosition(aPoint)
    * setExtent(aPoint)
    * setColor(aColor)

    * add(submorph)            - attaches submorph ontop
    * addBack(submorph)        - attaches submorph underneath

    * fullCopy()               - duplication
    * destroy()                - deletion


    (3) events
    ----------
    All user (and system) interaction is triggered by events, which are
    passed on from the root element - the World - to its submorphs. The
    World contains a list of system (browser) events it reacts to in its

        initEventListeners()

    method. Currently there are

        - mouse
        - drop
        - keyboard
        - (window) resize

    events.

    These system events are dispatched within the morphic World by the
    World's Hand and its keyboardFocus (usually the active text
    cursor).


    (a) mouse events:
    -----------------
    The Hand dispatches the following mouse events to relevant morphs:

        mouseDownLeft
        mouseDownRight
        mouseClickLeft
        mouseClickRight
        mouseDoubleClick
        mouseEnter
        mouseLeave
        mouseEnterDragging
        mouseLeaveDragging
        mouseEnterBounds
        mouseLeaveBounds
        mouseMove
        mouseScroll

    If you wish your morph to react to any such event, simply add a
    method of the same name as the event, e.g:

        MyMorph.prototype.mouseMove = function(pos) {};

    Most of these methods have as optional parameter a Point object
    indicating the current position of the Hand inside the World's
    coordinate system. The

        mouseMove(pos, button)

    event method has an additional optional parameter indicating the
    currently pressed mouse button, which is either 'left' or 'right'.
    You can use this to let users interact with 3D environments.

    The

        mouseEnterDragging(morph)
        mouseLeaveDragging(morph)
        mouseEnterBounds(morph)
        mouseLeaveBounds(morph)

    event methods have as optional parameter the morph currently dragged by
    the Hand, if any.

    Events may be "bubbled" up a morph's owner chain by calling

        this.escalateEvent(functionName, arg)

    in the event handler method's code.

    Likewise, removing the event handler method will render your morph
    passive to the event in question.


    (b) context menu:
    -----------------
    By default right-clicking (or single-finger tap-and-hold) on a morph
    also invokes its context menu (in addition to firing the
    mouseClickRight event). A morph's context menu can be customized by
    assigning a Menu instance to its

        customContextMenu

    property, or altogether suppressed by overriding its inherited

        contextMenu()

    method.


    (c) dragging:
    -------------
    Dragging a morph is initiated when the left mouse button is pressed,
    held and the mouse is moved.

    You can control whether a morph is draggable by setting its

        isDraggable

    property either to false or true. If a morph isn't draggable itself
    it will pass the pick-up request up its owner chain. This lets you
    create draggable composite morphs like Windows, DialogBoxes,
    Sliders etc.

    Sometimes it is desireable to make "template" shapes which cannot be
    moved themselves, but from which instead duplicates can be peeled
    off. This is especially useful for building blocks in construction
    kits, e.g. the MIT-Scratch palette. Morphic.js lets you control this
    functionality by setting the

        isTemplate

    property flag to true for any morph whose "isDraggable" property is
    turned off. When dragging such a Morph the hand will instead grab
    a duplicate of the template whose "isDraggable" flag is true and
    whose "isTemplate" flag is false, in other words: a non-template.

    When creating a copy from a template, the copy's

        reactToTemplateCopy

    is invoked, if it is present.

    Dragging is indicated by adding a drop shadow to the morph in hand.
    If a morph follows the hand without displaying a drop shadow it is
    merely being moved about without changing its parent (owner morph),
    e.g. when "dragging" a morph handle to resize its owner, or when
    "dragging" a slider button.

    Right before a morph is picked up its

        selectForEdit

    and

        prepareToBeGrabbed(handMorph)

    methods are invoked, each if it is present. the optional

        selectForEdit

    if implemented, must return the object that is to be picked up.
    In addition to just returning the original object chosen by the user
    your method can also modify the target's environment and instead return
    a copy of the selected morph if, for example, you would like to implement
    a copy-on-write mechanism such as in Snap.

    Immediately after the pick-up the former parent's

        reactToGrabOf(grabbedMorph)

    method is called, again only if it exists.

    Similar to events, these  methods are optional and don't exist by
    default. For a simple example of how they can be used to adjust
    scroll bars in a scroll frame please have a look at their
    implementation in FrameMorph.


    (d) dropping:
    -------------
    Dropping is triggered when the left mouse button is either pressed
    or released while the Hand is dragging a morph.

    Dropping a morph causes it to become embedded in a new owner morph.
    You can control this embedding behavior by setting the prospective
    drop target's

        acceptsDrops

    property to either true or false, or by overriding its inherited

        wantsDropOf(aMorph)

    method.

    Right before dropping a morph the designated new parent's optional

        selectForEdit

    method is invoked if it is present. Again, if implemented this method
    must return the new parent for the morph that is about to be dropped.
    Again, in addition to just returning the designeted drop-target
    your method can also modify its environment and instead return
    a copy of the new parent if, for example, you would like to implement
    a copy-on-write mechanism such as in Snap.

    Right after a morph has been dropped its

        justDropped(handMorph)

    method is called, and its new parent's

        reactToDropOf(droppedMorph, handMorph)

    method is invoked, again only if each method exists.

    Similar to events, these  methods are optional and by default are
    not present in morphs by default (watch out for inheritance,
    though!). For a simple example of how they can be used to adjust
    scroll bars in a scroll frame please have a look at their
    implementation in FrameMorph.

    Drops of image elements from outside the world canvas are dispatched as

        droppedImage(aCanvas, name, embeddedData)
        droppedSVG(anImage, name)

    events to interested Morphs at the mouse pointer. If you want your Morph
    to e.g. import outside images you can add the droppedImage() and / or the
    droppedSVG() methods to it. The parameter passed to the event handles is
    a new offscreen canvas element representing a copy of the original image
    element which can be directly used, e.g. by assigning it to another
    Morph's cachedImage property. In the case of a dropped SVG it is an image
    element (not a canvas), which has to be rasterized onto a canvas before
    it can be used. The benefit of handling SVGs as image elements is that
    rasterization can be deferred until the destination scale is known, taking
    advantage of SVG's ability for smooth scaling. If instead SVGs are to be
    rasterized right away, you can set the

        MorphicPreferences.rasterizeSVGs

    preference to <true>. In this case dropped SVGs also trigger the
    droppedImage() event with a canvas containing a rasterized version of the
    SVG.

    Note that PNG images provide for embedded text comments, which can be used
    to include code or arbitrary data such as a CSV, JSON or XML file inside
    the image. Such a payload has to be identified by an agreed-upon marker.
    The default tag is stored in MorphicPreferences and can be overriden by
    apps wishing to make use of this feature. If such an embedded text-payload
    is found inside a PNG it is passed as the optional third "embeddedData"
    parameter to the "droppedImage()" event. embedded text only applies to PNGs.
    You can embed a string into the PNG metadata of a PNG by  calling

        embedMetadataPNG(aCanvas, aString)

    with a raster image represented by a canvas and a string that is to be
    embedded into the PNG's metadata.

    The same event mechanism applies to drops of audio or text files from
    outside the world canvas.

    Those are dispatched as

        droppedAudio(anAudio, name)
        droppedText(aString, name, type)

    events to interested Morphs at the mouse pointer.

    if none of the above content types can be determined, the file contents
    is dispatched as an ArrayBuffer to interested Morphs:

        droppedBinary(anArrayBuffer, name)

    In case multiple files are dropped simulateneously the events

        beginBulkDrop()
        endBulkDrop()

    are dispatched to to Morphs interested in bracketing the bulk operation,
    and the endBulkDrop() event is only signalled after the contents last file
    has been asynchronously made available.


    (e) keyboard events
    -------------------
    The World dispatches the following key events to its active
    keyboard focus:

        keypress
        keydown
        keyup

    Currently the only morphs which acts as keyboard focus are
    CursorMorph - the basic text editing widget - and MenuMorph elements.
    If you wish to add keyboard support to your morph you need to add event
    handling methods for

        processKeyPress(event)
        processKeyDown(event)
        processKeyUp(event)

    and activate them by assigning your morph to the World's

        keyboardFocus

    property.

    Note that processKeyUp() is optional and doesn't have to be present
    if your morph doesn't require it.


    (f) resize event
    ----------------
    The Window resize event is handled by the World and allows the
    World's extent to be adjusted so that it always completely fills
    the browser's visible page. You can turn off this default behavior
    by setting the World's

        useFillPage

    property to false.

    Alternatively you can also initialize the World with the
    useFillPage switch turned off from the beginning by passing the
    false value as second parameter to the World's constructor:

        world = new World(aCanvas, false);

    Use this when creating a web page with multiple Worlds.

    if "useFillPage" is turned on the World dispatches an

        reactToWorldResize(newBounds)

    events to all of its children (toplevel only), allowing each to
    adjust to the new World bounds by implementing a corresponding
    method, the passed argument being the World's new dimensions after
    completing the resize. By default, the "reactToWorldResize" Method
    does not exist.

    Example:

    Add the following method to your Morph to let it automatically
    fill the whole World, but leave a 10 pixel border uncovered:

        MyMorph.prototype.reactToWorldResize = function (rect) {
            this.changed();
            this.bounds = rect.insetBy(10);
            this.rerender();
        };


    (g) combined mouse-keyboard events
    ----------------------------------
    Occasionally you'll want an object to react differently to a mouse
    click or to some other mouse event while the user holds down a key
    on the keyboard. Such "shift-click", "ctl-click", or "alt-click"
    events can be implemented by querying the World's

        currentKey

    property inside the function that reacts to the mouse event. This
    property stores the keyCode of the key that's currently pressed.
    Once the key is released by the user it reverts to null.


    (h) text editing events
    -----------------------
    Much of Morphic's "liveliness" comes out of allowing text elements
    (instances of either single-lined StringMorph or multi-lined TextMorph)
    to be directly manipulated and edited by users. This requires other
    objects which may have an interest in the text element's state to react
    appropriately. Therefore text elements and their manipulators emit
    a stream of events, mostly by "bubbling" them up the text element's
    owner chain. Text elements' parents are notified about the following
    events:

    Whenever the user presses a key on the keyboard while a text element
    is being edited, first a

        reactToKeystroke(event)

    is escalated up its parent chain, the "event" parameter being the
    original one received by the World.

    Whenever the input changes, by adding or removing one or more characters,
    an additional

        reactToInput(event)

    is escalated up its parent chain, the "event" parameter again being the
    original one received by the World or by the IME element.

    Note that the "reactToKeystroke" event gets triggered before the input
    changes, and thus befgore the "reactToInput" event fires.

    Once the user has completed the edit, the following events are
    dispatched:

        accept() - <enter> was pressed on a single line of text
        cancel() - <esc> was pressed on any text element

    Note that "accept" only gets triggered by single-line texte elements,
    as the <enter> key is used to insert line breaks in multi-line
    elements. Therefore, whenever a text edit is terminated by the user
    (accepted, cancelled or otherwise),

        reactToEdit(StringOrTextMorph)

    is triggered.

    If the MorphicPreference's

        useSliderForInput

    setting is turned on, a slider is popped up underneath the currently
    edited text element letting the user insert numbers out of the given
    slider range. Whenever this happens, i.e. whenever the slider is moved
    or while the slider button is pressed, a stream of

        reactToSliderEdit(StringOrTextMorph)

    events is dispatched, allowing for "Bret-Victor" style "scrubbing"
    applications.

    In addition to user-initiated events text elements also emit
    change notifications to their direct parents whenever their contents
    changes. That way complex Morphs containing text elements
    get a chance to react if something about the embedded text has been
    modified programmatically. These events are:

        layoutChanged() - sent only from instances of TextMorph
        fixLayout() - sent from instances of all Morphs, including StringMorphs

    they are different so that Morphs which contain both multi-line and
    single-line text elements can hold them apart.


    (4) stepping
    ------------
    Stepping is what makes Morphic "magical". Two properties control
    a morph's stepping behavior: the fps attribute and the step()
    method.

    By default the

        step()

    method does nothing. As you can see in the examples of BouncerMorph
    and MouseSensorMorph you can easily override this inherited method
    to suit your needs.

    By default the step() method is called once per display cycle.
    Depending on the number of actively stepping morphs and the
    complexity of your step() methods this can cause quite a strain on
    your CPU, and also result in your application behaving differently
    on slower computers than on fast ones.

    setting

        myMorph.fps

    to a number lower than the interval for the main loop lets you free
    system resources (albeit at the cost of a less responsive or slower
    behavior for this particular morph).


    (5) creating new kinds of morphs
    --------------------------------
    The real fun begins when you start to create new kinds of morphs
    with customized shapes. Imagine, e.g. jigsaw puzzle pieces or
    musical notes.

    When you create your own morphs, you'll want to think about how to
    graphically render it, how to determine its size and whether it needs
    to arrange any other parts ("submorphs). There are also ways to specify
    its collision detection behavior and define "untouchable" regions
    ("holes").


    (a) drawing the shape
    ---------------------
    For this you have to override the default

        render(ctx)

    method.

    This method draws the morph's shape using a given 2d graphics context.
    Note that any coordinates used in the render() method must be relative
    to the morph's own position, i.e. you don't need to worry about
    translating the shape yourself.

    You can use the following template for a start:

        MyMorph.prototype.render = function(ctx) {
            ctx.fillStyle = this.color.toString();
            ctx.fillRect(0, 0, this.width(), this.height());
        };

    it renders the morph as a solid rectangle completely filling its
    area with its current color.
    
    Notice how the coordinates for the fillRect() call are relative
    to the morph's own position: The rendered rectangle's origin is always
    located at (0, 0) regardless of the morph's actual position in the World.


    (b) determining extent and arranging submorphs
    ----------------------------------------------
    If your new morph also needs to determine its extent and, e.g. to
    encompass one or several other morphs, or arrange the layout of its
    submorphs, make sure to also override the default
    
        fixLayout()
    
    method.
    
    NOTE: If you need to set the morph's extent inside, in order to avoid
    infinite recursion instead of calling morph.setExtent() - which will
    in turn call morph.fixLayout() again - directly modify the morph's
    
        bounds

    property. Bounds is a rectable on which you can also use the same
    size-setters, e.g. by calling:
    
        this.bounds.setExtent()


    (c) pixel-perfect pointing events
    ---------------------------------
    In case your new morph needs to support pixel-perfect collision detection
    with other morphs or pointing devices such as the mouse or a stylus you
    can set the inherited attribute
    
        isFreeForm = bool
    
    to "true" (default is "false"). This makes sense the more your morph's
    visual shape diverges from a rectangle. For example, if you create a
    circular filled morph the default setting will register mouse-events
    anywhere within its bounding box, e.g. also in the transparent parts
    between the bounding box's corners outside of the circle's bounds.
    Instead you can specify your irregulary shaped morph to only register
    pointing events (mouse and touch) on solid, non-transparent parts.

    Notice, however, that such pixel-perfect collision detection might
    strain processing resources, especially if applied liberally.

    In order to mitigate unfavorable processor loads for pixel-perfect
    collision deteciton of irregularly shaped morphs there are two strategies
    to consider: Caching the shape and specifying "untouchable" regions.


    (d) caching the shape
    ---------------------
    In case of pixel-perfect free-form collision detection it makes sense to
    cache your morph's current shape, so it doesn't have to be re-drawn onto a
    new Canvas element every time the mouse moves over its bounding box.
    For this you can set then inherited
    
        isCachingImage = bool
        
    attribute to "true" instead of the default "false" value. This will
    significantly speed up collision detection and smoothen animations that
    continuously perform collision detection. However, it will also consume
    more memory. Therefore it's best to use this setting with caution.
    
    Snap! caches the shapes of sprites but not those of blocks. Instead it
    manages the insides of C- and E-shaped blocks through the morphic "holes"
    mechanism.


    (e) holes
    ---------
    An alternative albeit not as precise and general way for handling
    irregularly shaped morphs with "untouchable" regions is to specify a set
    of rectangular areas in which pointing events (mouse or touch) are not
    registered.

    By default the inherited
    
        holes = []

    property is an empty array. You can add one or more morphic Rectangle
    objects to this list, representing regions, in which occurring events will
    instead be passed on to the morph underneath.
    
    Note that, same with the render() method, the coordinates of these
    rectangular holes must be specified relative to your morph's position.

    If you specify holes you might find the need to adjust their layout
    depending on the layout of your morph. To accomplish this you can override
    the inherited
    
        fixHolesLayout()

    method.


    (f) updating
    ------------
    One way for morphs to become alive is form them to literally "morph" their
    shape depending on whicher contest you wish them to react to. For example,
    you might want the user to interactively draw a shape using their fingers
    on a touch screen device, or you want the user to be able to "pinch" or
    otherwise distort a shape interactively. In all of these situations you'll
    want your morph to frequently rerender its shape.
    
    You can accomplish this, by calling

        rerender()

    after every change to your morph's appearance that requires rerendering.
    
    Such changes are usually only happening when the morph's dimensions or
    other visual properties - such as its color - changes.


    (g) duplicating
    ---------------
    If your new morph stores or references to other morphs outside of
    the submorph tree in other properties, be sure to also override the
    default

        updateReferences()

    method if you want it to support duplication.


    (6) development and user modes
    ------------------------------
    When working with Squeak on Scratch or BYOB among the features I
    like the best and use the most is inspecting what's going on in
    the World while it is up and running. That's what development mode
    is for (you could also call it debug mode). In essence development
    mode controls which context menu shows up. In user mode right
    clicking (or double finger tapping) a morph invokes its

        customContextMenu

    property, whereas in development mode only the general

        developersMenu()

    method is called and the resulting menu invoked. The developers'
    menu features Gui-Builder-wise functionality to directly inspect,
    take apart, reassamble and otherwise manipulate morphs and their
    contents.

    Instead of using the "customContextMenu" property you can also
    assign a more dynamic contextMenu by overriding the general

        userMenu()

    method with a customized menu constructor. The difference between
    the customContextMenu property and the userMenu() method is that
    the former is also present in development mode and overrides the
    developersMenu() result. For an example of how to use the
    customContextMenu property have a look at TextMorph's evaluation
    menu, which is used for the Inspector's evaluation pane.

    When in development mode you can inspect every Morph's properties
    with the inspector, including all of its methods. The inspector
    also lets you add, remove and rename properties, and even edit
    their values at runtime. Like in a Smalltalk environment the inspect
    features an evaluation pane into which you can type in arbitrary
    JavaScript code and evaluate it in the context of the inspectee.

    Use switching between user and development modes while you are
    developing an application and disable switching to development once
    you're done and deploying, because generally you don't want to
    confuse end-users with inspectors and meta-level stuff.


    (7) turtle graphics
    -------------------

    The basic Morphic kernel features a simple LOGO turtle constructor
    called

        PenMorph

    which you can use to draw onto its parent Morph. By default every
    Morph in the system (including the World) is able to act as turtle
    canvas and can display pen trails. Pen trails will be lost whenever
    the trails morph (the pen's parent) performs a "render()"
    operation. If you want to create your own pen trails canvas, you
    may wish to modify its

        penTrails()

    property, so that it keeps a separate offscreen canvas for pen
    trails (and doesn't loose these on redraw).

    the following properties of PenMorph are relevant for turtle
    graphics:

        color       - a Color
        size        - line width of pen trails
        heading     - degrees
        isDown      - drawing state

    the following commands can be used to actually draw something:

        up()        - lift the pen up, further movements leave no trails
        down()      - set down, further movements leave trails
        clear()     - remove all trails from the current parent
        forward(n)  - move n steps in the current direction (heading)
        turn(n)     - turn right n degrees

    Turtle graphics can best be explored interactively by creating a
    new PenMorph object and by manipulating it with the inspector
    widget.

    NOTE: PenMorph has a special optimization for recursive operations
    called

        warp(function)

    You can significantly speed up recursive ops and increase the depth
    of recursion that's displayable by wrapping WARP around your
    recursive function call:

    example:

        myPen.warp(function () {
            myPen.tree(12, 120, 20);
        })

    will be much faster than just invoking the tree function, because it
    prevents the parent's parent from keeping track of every single line
    segment and instead redraws the outcome in a single pass.


    (8) supporting high-resolution "retina" screens
    -----------------------------------------------
    By default retina support gets installed when Morphic.js loads. There
    are two global functions that let you test for retina availability:

        isRetinaSupported() - Bool, answers if retina support is available
        isRetinaEnabled()   - Bool, answers if currently in retina mode

    and two more functions that let you control retina support if it is
    available:

        enableRetinaSupport()
        disableRetinaSupport()

    Both of these internally test whether retina is available, so they are
    safe to call directly. For an example how to make retina support
    user-specifiable refer to

        Snap! >> guis.js >> toggleRetina()

    Even when in retina mode it often makes sense to use normal-resolution
    canvasses for simple shapes in order to save system resources and
    optimize performance. Examples are costumes and backgrounds in Snap.
    In Morphic you can create new canvas elements using

        newCanvas(extentPoint [, nonRetinaFlag])

    If retina support is enabled such new canvasses will automatically be
    high-resolution canvasses, unless the newCanvas() function is given an
    otherwise optional second Boolean <true> argument that explicitly makes
    it a non-retina canvas.

    Not the whole canvas API is supported by Morphic's retina utilities.
    Especially if your code uses putImageData() you will want to "downgrade"
    a target high-resolution canvas to a normal-resolution ("non-retina")
    one before using

        normalizeCanvas(aCanvas [, copyFlag])

    This will change the target canvas' resolution in place (!). If you
    pass in the optional second Boolean <true> flag the function returns
    a non-retina copy and leaves the target canvas unchanged. An example
    of this normalize mechanism is converting the penTrails layer of Snap's
    stage (high-resolution) into a sprite-costume (normal resolution).


    (9) animations
    ---------------
    Animations handle gradual transitions between one state and another over a
    period of time. Transition effects can be specified using easing functions.
    An easing function maps a fraction of the transition time to a fraction of
    the state delta. This way accelerating / decelerating and bouncing sliding
    effects can be accomplished.

    Animations are generic and not limited to motion, i.e. they can also handle
    other transitions such as color changes, transparency fadings, growing,
    shrinking, turning etc.

    Animations need to be stepped by a scheduler, e. g. an interval function.
    In Morphic the preferred way to run an animation is to register it with
    the World by adding it to the World's animation queue. The World steps each
    registered animation once per display cycle independently of the Morphic
    stepping mechanism.

    For an example how to use animations look at how the Morph's methods

        glideTo()
        fadeTo()

    and

        slideBackTo()

    are implemented.


    (10) minifying morphic.js
    -------------------------
    Coming from Smalltalk and being a Squeaker at heart I am a huge fan
    of browsing the code itself to make sense of it. Therefore I have
    included this documentation and (too little) inline comments so all
    you need to get going is this very file.

    Nowadays with live streaming HD video even on mobile phones 250 KB
    shouldn't be a big strain on bandwith, still minifying and even
    compressing morphic.js down do about 100 KB may sometimes improve
    performance in production use.

    Being an attorney-at-law myself you programmer folk keep harassing
    me with rabulistic nitpickings about free software licenses. I'm
    releasing morphic.js under an AGPL license. Therefore please make
    sure to adhere to that license in any minified or compressed version.


    VIII. acknowledgements
    ----------------------
    The original Morphic was designed and written by Randy Smith and
    John Maloney for the SELF programming language, and later ported to
    Squeak (Smalltalk) by John Maloney and Dan Ingalls, who has also
    ported it to JavaScript (the Lively Kernel), once again setting
    a "Gold Standard" for self sustaining systems which morphic.js
    cannot and does not aspire to meet.

    This Morphic implementation for JavaScript is not a direct port of
    Squeak's Morphic, but still many individual functions have been
    ported almost literally from Squeak, sometimes even including their
    comments, e.g. the morph duplication mechanism fullCopy(). Squeak
    has been a treasure trove, and if morphic.js looks, feels and
    smells a lot like Squeak, I'll take it as a compliment.

    Evelyn Eastmond has inspired and encouraged me with her wonderful
    implementation of DesignBlocksJS. Thanks for sharing code, ideas
    and enthusiasm for programming.

    John Maloney has been my mentor and my source of inspiration for
    these Morphic experiments. Thanks for the critique, the suggestions
    and explanations for all things Morphic and for being my all time
    programming hero.

    I have originally written morphic.js in Florian Balmer's Notepad2
    editor for Windows, later switched to Apple's Dashcode and later
    still to Apple's Xcode. I've also come to depend on both Douglas
    Crockford's JSLint and later the JSHint project, as well as on
    Mozilla's Firebug and Google's Chrome to get it right.


    IX. contributors
    ----------------------
    Joe Otto found and fixed many early bugs and taught me some tricks.
    Nathan Dinsmore contributed mouse wheel scrolling, cached
    background texture handling, countless bug fixes and optimizations.
    Ian Reynolds contributed backspace key handling for Chrome.
    Davide Della Casa contributed performance optimizations for Firefox.
    Jason N (@cyderize) contributed native copy & paste for text editing.
    Bartosz Leper contributed retina display support.
    Zhenlei Jia and Dariusz Dorożalski pioneered IME text editing.
    Dariusz Dorożalski and Jesus Villalobos contributed embedding blocks
    into image metadata.
    Bernat Romagosa contributed to text editing and to the core design.
    Michael Ball found and fixed a longstanding scrolling bug.
    Brian Harvey contributed to the design and implementation of submenus.
    Ken Kahn contributed to Chinese keboard entry and Android support.
    Brian Broll contributed clickable URLs in text elements and many bugfixes.

    - Jens Mönig
*/

// Global settings /////////////////////////////////////////////////////

/*global window, HTMLCanvasElement, FileReader, Audio, FileList, Map*/

/*jshint esversion: 11, bitwise: false*/

var morphicVersion = '2023-March-16';
var modules = {}; // keep track of additional loaded modules
var useBlurredShadows = true;



var standardSettings = {
    minimumFontHeight: getMinimumFontHeight(), // browser settings
    globalFontFamily: '',
    menuFontName: 'sans-serif',
    menuFontSize: 12,
    bubbleHelpFontSize: 10,
    prompterFontName: 'sans-serif',
    prompterFontSize: 12,
    prompterSliderSize: 10,
    handleSize: 15,
    scrollBarSize: 9, // was 12,
    mouseScrollAmount: 40,
    useSliderForInput: false,
    isTouchDevice: false, // turned on by touch events, don't set
    pngPayloadMarker: 'Data\tPayload\tEmbedded',
    rasterizeSVGs: false,
    isFlat: false,
    grabThreshold: 5,
    showHoles: false
};

var touchScreenSettings = {
    minimumFontHeight: standardSettings.minimumFontHeight,
    globalFontFamily: '',
    menuFontName: 'sans-serif',
    menuFontSize: 24,
    bubbleHelpFontSize: 18,
    prompterFontName: 'sans-serif',
    prompterFontSize: 24,
    prompterSliderSize: 20,
    handleSize: 26,
    scrollBarSize: 24,
    mouseScrollAmount: 40,
    useSliderForInput: false,
    isTouchDevice: true,
    pngPayloadMarker: 'Data\tPayload\tEmbedded',
    rasterizeSVGs: false,
    isFlat: false,
    grabThreshold: 5,
    showHoles: false
};

var MorphicPreferences = standardSettings;

// first, try enabling support for retina displays - can be turned off later

/*
    Support for retina displays has been pioneered and contributed by
    Bartosz Leper.

    NOTE: this will make changes to the HTMLCanvasElement that - mostly -
    make Morphic usable on retina displays in very high resolution mode
    with crisp fonts and clear fine lines without you (the programmer)
    needing to know any specifics, provided both the display and the browser
    support these (Safari currently doesn't), otherwise these utilities will
    not be installed.
    If you don't want your Morphic application to support retina resolutions
    you don't have to edit this morphic.js file to comment out the next line
    of code, instead you can simply call

        disableRetinaSupport();

    before you create your World(s) in the html page. Disabling retina
    support also will simply do nothing if retina support is not possible
    or already disabled, so it's equally safe to call.

    For an example how to make retina support user-specifiable refer to
    Snap! >> guis.js >> toggleRetina()
*/

enableRetinaSupport();

// Global Functions ////////////////////////////////////////////////////

function nop() {
    // do explicitly nothing
    return null;
}

function localize(string) {
    // override this function with custom localizations
    return string;
}

function isNil(thing) {
    return thing === undefined || thing === null;
}

function contains(list, element) {
    // answer true if element is a member of list
    return list.indexOf(element) !== -1;
}

function detect(list, predicate) {
    // answer the first element of list for which predicate evaluates
    // true, otherwise answer null
    var i, size = list.length;
    for (i = 0; i < size; i += 1) {
        if (predicate.call(null, list[i])) {
            return list[i];
        }
    }
    return null;
}

function sizeOf(object) {
    // answer the number of own properties
    var size = 0, key;
    for (key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            size += 1;
        }
    }
    return size;
}

function isString(target) {
    return typeof target === 'string' || target instanceof String;
}

function isObject(target) {
    return target !== null &&
        (typeof target === 'object' || target instanceof Object);
}

function radians(degrees) {
    return degrees * Math.PI / 180;
}

function degrees(radians) {
    return radians * 180 / Math.PI;
}

function fontHeight(height) {
    var minHeight = Math.max(height, MorphicPreferences.minimumFontHeight);
    return minHeight * 1.2; // assuming 1/5 font size for ascenders
}

function isWordChar(aCharacter) {
    // can't use \b or \w because they ignore diacritics
    return aCharacter.match(/[A-zÀ-ÿ0-9]/);
}

function isURLChar(aCharacter) {
    return aCharacter.match(/[A-z0-9./:?&_+%-]/);
}

function isURL(text) {
    return /^https?:\/\//.test(text);
}

function newCanvas(extentPoint, nonRetina, recycleMe) {
    // answer a new empty instance of Canvas, don't display anywhere
    // nonRetina - optional Boolean "false"
    // by default retina support is automatic
    // optional existing canvas to be used again, unless it is marked as
    // being shared among Morphs (dataset property "morphicShare")
    var canvas, ext;
    nonRetina = nonRetina || false;
    ext = (extentPoint ||
            (recycleMe ? new Point(recycleMe.width, recycleMe.height)
                : new Point(0, 0))).ceil();
    if (recycleMe &&
            !recycleMe.dataset.morphicShare &&
            (recycleMe.isRetinaEnabled || false) !== nonRetina &&
            ext.x === recycleMe.width && ext.y === recycleMe.height
    ) {
        canvas = recycleMe;
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        return canvas;
    } else {
        canvas = document.createElement('canvas');
        canvas.width = ext.x;
        canvas.height = ext.y;
    }
    if (nonRetina && canvas.isRetinaEnabled) {
        canvas.isRetinaEnabled = false;
    }
    return canvas;
}

function copyCanvas(aCanvas) {
    // answer a deep copy of a canvas element respecting its retina status
    var c;
    if (aCanvas && aCanvas.width && aCanvas.height) {
        c = newCanvas(
            new Point(aCanvas.width, aCanvas.height),
            !aCanvas.isRetinaEnabled
        );
        c.getContext("2d").drawImage(aCanvas, 0, 0);
        return c;
    }
    return aCanvas;
}

function getMinimumFontHeight() {
    // answer the height of the smallest font renderable in pixels
    var str = 'I',
        size = 50,
        canvas = document.createElement('canvas'),
        ctx,
        maxX,
        data,
        x,
        y;
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext('2d');
    ctx.font = '1px serif';
    maxX = ctx.measureText(str).width;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'bottom';
    ctx.fillText(str, 0, size);
    for (y = 0; y < size; y += 1) {
        for (x = 0; x < maxX; x += 1) {
            data = ctx.getImageData(x, y, 1, 1);
            if (data.data[3] !== 0) {
                return size - y + 1;
            }
        }
    }
    return 0;
}

function getDocumentPositionOf(aDOMelement) {
    // answer the relative coordinates of a DOM element in the viewport
    var rect = aDOMelement.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {x: rect.left + scrollLeft, y:rect.top + scrollTop};
}

function copy(target) {
    // answer a shallow copy of target
    var value, c, property, keys, l, i;
    if (typeof target !== 'object') {
        return target;
    }
    value = target.valueOf();
    if (target !== value) {
        return new target.constructor(value);
    }
    if (target instanceof target.constructor &&
            target.constructor !== Object) {
        c = Object.create(target.constructor.prototype);
        keys = Object.keys(target);
        for (l = keys.length, i = 0; i < l; i += 1) {
            property = keys[i];
            if (target[property] instanceof HTMLCanvasElement) {
                // tag canvas elements as being shared,
                // so the next time when rerendering a Morph
                // instead of recycling the shared canvas a
                // new unshared one get created
                // see newCanvas() function
                target[property].dataset.morphicShare = 'true';
            }
            c[property] = target[property];
        }
    } else {
        c = {};
        for (property in target) {
            c[property] = target[property];
        }
    }
    return c;
}

function embedMetadataPNG(aCanvas, aString) {
    var embedTag = MorphicPreferences.pngPayloadMarker,
        crc32 = (str, crc) => {
            let table = [...Array(256).keys()].map(it =>
                [...Array(8)].reduce((cc) =>
                (cc & 1) ? (0xedb88320 ^ (cc >>> 1)) : (cc >>> 1), it)
                );
            crc = [...str].reduce(
                (crc, ch) => (crc >>> 8) ^ table[(crc ^ ch.charCodeAt(0)) & 0xff],
                (crc ? crc = 0 : crc) ^ (-1) // (crc ||= 0) ^ (-1)
            );
            return ( crc ^ (-1) ) >>> 0;
        },
        arr2Str = (arr) =>
            arr.reduce((res, byte) => res + String.fromCharCode(byte), ''),
        int2BStr = (val) =>
            arr2Str(Array.from(new Uint8Array(new Uint32Array( [val] ).buffer)).reverse()),
        buildChunk = (data) => {
            let res = "iTXt" + data;
            return int2BStr(data.length) + res + int2BStr(crc32(res));
        },
        parts = aCanvas.toDataURL("image/png").split(","),
        bPart = atob(parts[1]).split(""),
        newChunk = buildChunk(
            "Snap!_SRC\0\0\0\0\0" +
            embedTag +
            encodeURIComponent(aString) +
            embedTag
        );
    try {
        bPart.splice(-12, 0, ...newChunk);
        parts[1] = btoa(bPart.join(""));
    } catch (err) {
        console.log(err);
    }
    return parts.join(',');
}


// Retina Display Support //////////////////////////////////////////////

/*
    By default retina support gets installed when Morphic.js loads. There
    are two global functions that let you test for retina availability:

        isRetinaSupported() - Boolean, whether retina support is available
        isRetinaEnabled()   - Boolean, whether currently in retina mode

    and two more functions that let you control retina support if it is
    available:

        enableRetinaSupport()
        disableRetinaSupport()

    Both of these internally test whether retina is available, so they are
    safe to call directly.

    Even when in retina mode it often makes sense to use non-high-resolution
    canvasses for simple shapes in order to save system resources and
    optimize performance. Examples are costumes and backgrounds in Snap.
    In Morphic you can create new canvas elements using

        newCanvas(extentPoint [, nonRetinaFlag])

    If retina support is enabled such new canvasses will automatically be
    high-resolution canvasses, unless the newCanvas() function is given an
    otherwise optional second Boolean <true> argument that explicitly makes
    it a non-retina canvas.

    Not the whole canvas API is supported by Morphic's retina utilities.
    Especially if your code uses putImageData() you will want to "downgrade"
    a target high-resolution canvas to a normal-resolution ("non-retina")
    one before using

        normalizeCanvas(aCanvas [, copyFlag])

    This will change the target canvas' resolution in place (!). If you
    pass in the optional second Boolean <true> flag the function returns
    a non-retina copy and leaves the target canvas unchanged. An example
    of this normalize mechanism is converting the penTrails layer of Snap's
    stage (high-resolution) into a sprite-costume (normal resolution).
*/

function enableRetinaSupport() {
/*
    === contributed by Bartosz Leper ===

    This installs a series of utilities that allow using Canvas the same way
    on retina and non-retina displays. If the display is a retina one, the
    underlying dimensions of the Canvas elements are doubled, but this will
    be transparent to the code that uses Canvas. All dimensions read or
    written to the Canvas element will be scaled appropriately.

    NOTE: This implementation is not exhaustive; it only implements what is
    needed by the Snap! UI.

    [Jens]: like all other retina screen support implementations I've seen
    Bartosz's patch also does not address putImageData() compatibility when
    mixing retina-enabled and non-retina canvasses. If you need to manipulate
    pixels in such mixed canvasses, make sure to "downgrade" them all using
    normalizeCanvas() below.
*/

    // Get the window's pixel ratio for canvas elements.
    // See: http://www.html5rocks.com/en/tutorials/canvas/hidpi/
    var ctx = document.createElement("canvas").getContext("2d"),
        backingStorePixelRatio = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1,

    // Unfortunately, it's really hard to make this work well when changing
    // zoom level, so let's leave it like this right now, and stick to
    // whatever the ratio was in the beginning.

        // originalDevicePixelRatio = window.devicePixelRatio,

    // [Jens]: As of summer 2016 non-integer devicePixelRatios lead to
    // artifacts when blitting images onto canvas elements in all browsers
    // except Chrome, especially Firefox, Edge, IE (Safari doesn't even
    // support retina mode as implemented here).
    // therefore - to ensure crisp fonts - use the ceiling of whatever
    // the devicePixelRatio is. This needs more memory, but looks nicer.

        originalDevicePixelRatio = Math.ceil(window.devicePixelRatio),

        canvasProto = HTMLCanvasElement.prototype,
        contextProto = CanvasRenderingContext2D.prototype,

    // [Jens]: keep track of original properties in a dictionary
    // so they can be iterated over and restored
        uber = {
            drawImage: contextProto.drawImage,
            getImageData: contextProto.getImageData,

            width: Object.getOwnPropertyDescriptor(
                canvasProto,
                'width'
            ),
            height: Object.getOwnPropertyDescriptor(
                canvasProto,
                'height'
            ),
            shadowOffsetX: Object.getOwnPropertyDescriptor(
                contextProto,
                'shadowOffsetX'
            ),
            shadowOffsetY: Object.getOwnPropertyDescriptor(
                contextProto,
                'shadowOffsetY'
            ),
            shadowBlur: Object.getOwnPropertyDescriptor(
                contextProto,
                'shadowBlur'
            )
        };

    // [Jens]: only install retina utilities if the display supports them
    if (backingStorePixelRatio === originalDevicePixelRatio) {return; }
    // [Jens]: check whether properties can be overridden, needed for Safari
    if (Object.keys(uber).some(any => {
        var prop = uber[any];
        return prop.hasOwnProperty('configurable') && (!prop.configurable);
    })) {return; }

    function getPixelRatio(imageSource) {
        return imageSource.isRetinaEnabled ?
            (originalDevicePixelRatio || 1) / backingStorePixelRatio : 1;
    }

    canvasProto._isRetinaEnabled = true;
    // [Jens]: remember the original non-retina properties,
    // so they can be restored again
    canvasProto._bak = uber;

    Object.defineProperty(canvasProto, 'isRetinaEnabled', {
        get: function() {
            return this._isRetinaEnabled;
        },
        set: function(enabled) {
            var prevPixelRatio = getPixelRatio(this),
                prevWidth = this.width,
                prevHeight = this.height;

            this._isRetinaEnabled = enabled;
            if (getPixelRatio(this) != prevPixelRatio) {
                this.width = prevWidth;
                this.height = prevHeight;
            }
        },
        configurable: true // [Jens]: allow to be deleted and reconfigured
    });

    Object.defineProperty(canvasProto, 'width', {
        get: function() {
            return uber.width.get.call(this) / getPixelRatio(this);
        },
        set: function(width) {
            try { // workaround one of FF's dreaded NS_ERROR_FAILURE bugs
                // this should be taken out as soon as FF gets fixed again
                var pixelRatio = getPixelRatio(this),
                    context;
                uber.width.set.call(this, width * pixelRatio);
                context = this.getContext('2d');
                /*
                context.restore();
                context.save();
                */
                context?.scale(pixelRatio, pixelRatio);
            } catch (err) {
                console.log('Retina Display Support Problem', err);
                uber.width.set.call(this, width);
            }
        }
    });

    Object.defineProperty(canvasProto, 'height', {
        get: function() {
            return uber.height.get.call(this) / getPixelRatio(this);
        },
        set: function(height) {
            var pixelRatio = getPixelRatio(this),
                context;
            uber.height.set.call(this, height * pixelRatio);
            context = this.getContext('2d');
            /*
            context.restore();
            context.save();
            */
            context?.scale(pixelRatio, pixelRatio);
        }
    });

    contextProto.drawImage = function(image) {
        var pixelRatio = getPixelRatio(image),
            sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight;

        // Different signatures of drawImage() method have different
        // parameter assignments.
        switch (arguments.length) {
            case 9:
                sx = arguments[1];
                sy = arguments[2];
                sWidth = arguments[3];
                sHeight = arguments[4];
                dx = arguments[5];
                dy = arguments[6];
                dWidth = arguments[7];
                dHeight = arguments[8];
                break;

            case 5:
                sx = 0;
                sy = 0;
                sWidth = image.width;
                sHeight = image.height;
                dx = arguments[1];
                dy = arguments[2];
                dWidth = arguments[3];
                dHeight = arguments[4];
                break;

            case 3:
                sx = 0;
                sy = 0;
                sWidth = image.width;
                sHeight = image.height;
                dx = arguments[1];
                dy = arguments[2];
                dWidth = image.width;
                dHeight = image.height;
                break;

            default:
                throw Error('Called drawImage() with ' + arguments.length +
                        ' arguments');
        }
        uber.drawImage.call(
                this, image,
                sx * pixelRatio, sy * pixelRatio,
                sWidth * pixelRatio, sHeight * pixelRatio,
                dx, dy,
                dWidth, dHeight);
    };

    contextProto.getImageData = function(sx, sy, sw, sh) {
        var pixelRatio = getPixelRatio(this.canvas);
        return uber.getImageData.call(
                this,
                sx * pixelRatio, sy * pixelRatio,
                sw * pixelRatio, sh * pixelRatio);
    };

    Object.defineProperty(contextProto, 'shadowOffsetX', {
        get: function() {
            return uber.shadowOffsetX.get.call(this) /
                getPixelRatio(this.canvas);
        },
        set: function(offset) {
            var pixelRatio = getPixelRatio(this.canvas);
            uber.shadowOffsetX.set.call(this, offset * pixelRatio);
        }
    });

    Object.defineProperty(contextProto, 'shadowOffsetY', {
        get: function() {
            return uber.shadowOffsetY.get.call(this) /
                getPixelRatio(this.canvas);
        },
        set: function(offset) {
            var pixelRatio = getPixelRatio(this.canvas);
            uber.shadowOffsetY.set.call(this, offset * pixelRatio);
        }
    });

    Object.defineProperty(contextProto, 'shadowBlur', {
        get: function() {
            return uber.shadowBlur.get.call(this) /
                getPixelRatio(this.canvas);
        },
        set: function(blur) {
            var pixelRatio = getPixelRatio(this.canvas);
            uber.shadowBlur.set.call(this, blur * pixelRatio);
        }
    });
}

function isRetinaSupported () {
    var ctx = document.createElement("canvas").getContext("2d"),
        backingStorePixelRatio = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1,
        canvasProto = HTMLCanvasElement.prototype,
        contextProto = CanvasRenderingContext2D.prototype,
        uber = {
            drawImage: contextProto.drawImage,
            getImageData: contextProto.getImageData,

            width: Object.getOwnPropertyDescriptor(
                canvasProto,
                'width'
            ),
            height: Object.getOwnPropertyDescriptor(
                canvasProto,
                'height'
            ),
            shadowOffsetX: Object.getOwnPropertyDescriptor(
                contextProto,
                'shadowOffsetX'
            ),
            shadowOffsetY: Object.getOwnPropertyDescriptor(
                contextProto,
                'shadowOffsetY'
            ),
            shadowBlur: Object.getOwnPropertyDescriptor(
                contextProto,
                'shadowBlur'
            )
        };
    return backingStorePixelRatio !== window.devicePixelRatio &&
        !(Object.keys(uber).some(any => {
            var prop = uber[any];
            return prop.hasOwnProperty('configurable') && (!prop.configurable);
        })
    );
}

function isRetinaEnabled () {
    return HTMLCanvasElement.prototype.hasOwnProperty('_isRetinaEnabled');
}

function disableRetinaSupport() {
    // uninstalls Retina utilities. Make sure to re-create every Canvas
    // element afterwards
    var canvasProto, contextProto, uber;
    if (!isRetinaEnabled()) {return; }
    canvasProto = HTMLCanvasElement.prototype;
    contextProto = CanvasRenderingContext2D.prototype;
    uber = canvasProto._bak;
    Object.defineProperty(canvasProto, 'width', uber.width);
    Object.defineProperty(canvasProto, 'height', uber.height);
    contextProto.drawImage = uber.drawImage;
    contextProto.getImageData = uber.getImageData;
    Object.defineProperty(contextProto, 'shadowOffsetX', uber.shadowOffsetX);
    Object.defineProperty(contextProto, 'shadowOffsetY', uber.shadowOffsetY);
    Object.defineProperty(contextProto, 'shadowBlur', uber.shadowBlur);
    delete canvasProto._isRetinaEnabled;
    delete canvasProto.isRetinaEnabled;
    delete canvasProto._bak;
}

function normalizeCanvas(aCanvas, getCopy) {
    // make sure aCanvas is non-retina, otherwise convert it in place (!)
    // or answer a normalized copy if the "getCopy" flag is <true>
    var cpy;
    if (!aCanvas.isRetinaEnabled) {return aCanvas; }
    cpy = newCanvas(new Point(aCanvas.width, aCanvas.height), true);
    cpy.getContext('2d').drawImage(aCanvas, 0, 0);
    if (getCopy) {return cpy; }
    aCanvas.isRetinaEnabled = false;
    aCanvas.width = cpy.width;
    aCanvas.height = cpy.height;
    aCanvas.getContext('2d').drawImage(cpy, 0, 0);
    return aCanvas;
}

// Animations //////////////////////////////////////////////////////////////

/*
    Animations handle gradual transitions between one state and another over a
    period of time. Transition effects can be specified using easing functions.
    An easing function maps a fraction of the transition time to a fraction of
    the state delta. This way accelerating / decelerating and bouncing sliding
    effects can be accomplished.

    Animations are generic and not limited to motion, i.e. they can also handle
    other transitions such as color changes, transparency fadings, growing,
    shrinking, turning etc.

    Animations need to be stepped by a scheduler, e. g. an interval function.
    In Morphic the preferred way to run an animation is to register it with
    the World by adding it to the World's animation queue. The World steps each
    registered animation once per display cycle independently of the Morphic
    stepping mechanism.

    For an example how to use animations look at how the Morph's methods

        glideTo()
        fadeTo()

    and

        slideBackTo()

    are implemented.
*/

class Animation {
    easings = {
        // dictionary of a few pre-defined easing functions used to transition
        // two states
    
        // ease both in and out:
        linear: t => t,
        sinusoidal: t => 1 - Math.cos(radians(t * 90)),
        quadratic: t => t < 0.5 ? 2 * t * t : ((4 - (2 * t)) * t) - 1,
        cubic: t => {
            return t < 0.5 ?
                4 * t * t * t
                    : ((t - 1) * ((2 * t) - 2) * ((2 * t) - 2)) + 1;
        },
        elastic: t => {
            return (t -= 0.5) < 0 ?
                (0.01 + 0.01 / t) * Math.sin(50 * t)
                    : (0.02 - 0.01 / t) * Math.sin(50 * t) + 1;
        },
    
        // ease in only:
        sine_in: t => 1 - Math.sin(radians(90 + (t * 90))),
        quad_in: t => t * t,
        cubic_in: t => t * t * t,
        elastic_in: t => (0.04 - 0.04 / t) * Math.sin(25 * t) + 1,
    
        // ease out only:
        sine_out: t => Math.sin(radians(t * 90)),
        quad_out: t => t * (2 - t),
        elastic_out: t => 0.04 * t / (--t) * Math.sin(25 * t)
    };

    // Animation instance creation:

    constructor (setter, getter, delta, duration, easing, onComplete) {
        this.setter = setter; // function
        this.getter = getter; // function
        this.delta = delta || 0; // number
        this.duration = duration || 0; // milliseconds
        this.easing = isString(easing) ? // string or function
            this.easings[easing] || this.easings.sinusoidal
            : easing || this.easings.sinusoidal;
        this.onComplete = onComplete || null; // optional callback
        this.endTime = null;
        this.destination = null;
        this.isActive = false;
        this.start();
    }

    start () {
        // (re-) activate the animation, e.g. if is has previously completed,
        // make sure to plug it into something that repeatedly triggers step(),
        // e.g. the World's animations queue
        this.endTime = Date.now() + this.duration;
        this.destination = this.getter.call(this) + this.delta;
        this.isActive = true;
    }

    step () {
        if (!this.isActive) { return; }
        var now = Date.now();
        if (now > this.endTime) {
            this.setter(this.destination);
            this.isActive = false;
            if (this.onComplete) { this.onComplete(); }
        } else {
            this.setter(
                this.destination -
                (this.delta * this.easing((this.endTime - now) / this.duration))
            );
        }
    }
}

(this.delta)

// Colors //////////////////////////////////////////////////////////////

// Color instance creation:

class Color {
    constructor (r = 0, g = 0, b = 0, a) {
        // all values are optional, just (r, g, b) is fine
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a || ((a === 0) ? 0 : 1);
    }

    static fromString (aString) {
        // I parse rgb/rgba strings into a Color object
        var components = aString.split(/[\(),]/).slice(1, 5);
        return new Color(components[0], components[1], components[2], components[3]);
    }
    
    // Color string representation: e.g. 'rgba(255,165,0,1)'

    toString () {
        return 'rgba(' +
            Math.round(this.r) + ',' +
            Math.round(this.g) + ',' +
            Math.round(this.b) + ',' +
            this.a + ')';
    }

    toRGBstring () {
        return 'rgb(' +
            Math.round(this.r) + ',' +
            Math.round(this.g) + ',' +
            Math.round(this.b) + ')';
    }

    // Color copying:

    copy () {
        return new Color(
            this.r,
            this.g,
            this.b,
            this.a
        );
    }
    
    // Color comparison:
    
    eq (aColor, observeAlpha) {
        // ==
        return aColor &&
            this.r === aColor.r &&
            this.g === aColor.g &&
            this.b === aColor.b &&
            (observeAlpha ? this.a === aColor.a : true);
    }

    isCloseTo (aColor, observeAlpha, tolerance = 10) {
        // experimental - answer whether a color is "close" to another one by
        // a given percentage. tolerance is the percentage by which each color
        // channel may diverge, alpha needs to be the exact same unless ignored
        var thres = 2.55 * (tolerance || 10);

        function dist(a, b) {
            var diff = a - b;
            return diff < 0 ? 255 + diff : diff;
        }

        return aColor &&
            dist(this.r, aColor.r) < thres &&
            dist(this.g, aColor.g) < thres &&
            dist(this.b, aColor.b) < thres &&
            (observeAlpha ? this.a === aColor.a : true);
    }

    // Color conversion (hsv):

    hsv () {
        // ignore alpha
        var max, min, h, s, v, d, rr = this.r / 255, gg = this.g / 255, bb = this.b / 255;
        max = Math.max(rr, gg, bb);
        min = Math.min(rr, gg, bb);
        h = max;
        s = max;
        v = max;
        d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case rr:
                    h = (gg - bb) / d + (gg < bb ? 6 : 0);
                    break;
                case gg:
                    h = (bb - rr) / d + 2;
                    break;
                case bb:
                    h = (rr - gg) / d + 4;
                    break;
            }
            h /= 6;
        }
        return [h, s, v];
    }

    set_hsv (h, s, v) {
        // ignore alpha, h, s and v are to be within [0, 1]
        var i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                this.r = v;
                this.g = t;
                this.b = p;
                break;
            case 1:
                this.r = q;
                this.g = v;
                this.b = p;
                break;
            case 2:
                this.r = p;
                this.g = v;
                this.b = t;
                break;
            case 3:
                this.r = p;
                this.g = q;
                this.b = v;
                break;
            case 4:
                this.r = t;
                this.g = p;
                this.b = v;
                break;
            case 5:
                this.r = v;
                this.g = p;
                this.b = q;
                break;
        }

        this.r *= 255;
        this.g *= 255;
        this.b *= 255;
    }

    // Color conversion (hsl):

    hsl () {
        // ignore alpha
        var rr = this.r / 255, gg = this.g / 255, bb = this.b / 255, max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb), h, s, l = (max + min) / 2, d;
        if (max === min) { // achromatic
            h = 0;
            s = 0;
        } else {
            d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case rr:
                    h = (gg - bb) / d + (gg < bb ? 6 : 0);
                    break;
                case gg:
                    h = (bb - rr) / d + 2;
                    break;
                case bb:
                    h = (rr - gg) / d + 4;
                    break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    set_hsl (h, s, l) {
        // ignore alpha, h, s and l are to be within [0, 1]
        var q, p;

        function hue2rgb (p, q, t) {
            if (t < 0) {
                t += 1;
            }
            if (t > 1) {
                t -= 1;
            }
            if (t < 1 / 6) {
                return p + (q - p) * 6 * t;
            }
            if (t < 1 / 2) {
                return q;
            }
            if (t < 2 / 3) {
                return p + (q - p) * (2 / 3 - t) * 6;
            }
            return p;
        }

        if (s == 0) { // achromatic
            this.r = l;
            this.g = l;
            this.b = l;
        } else {
            q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            p = 2 * l - q;
            this.r = hue2rgb(p, q, h + 1 / 3);
            this.g = hue2rgb(p, q, h);
            this.b = hue2rgb(p, q, h - 1 / 3);
        }

        this.r *= 255;
        this.g *= 255;
        this.b *= 255;
    }

    // Color mixing:

    mixed (proportion, otherColor) {
        // answer a copy of this color mixed with another color, ignore alpha
        var frac1 = Math.min(Math.max(proportion, 0), 1), frac2 = 1 - frac1;
        return new Color(
            this.r * frac1 + otherColor.r * frac2,
            this.g * frac1 + otherColor.g * frac2,
            this.b * frac1 + otherColor.b * frac2
        );
    }

    darker (percent) {
        // return an rgb-interpolated darker copy of me, ignore alpha
        var fract = 0.8333;
        if (percent) {
            fract = (100 - percent) / 100;
        }
        return this.mixed(fract, new Color(0, 0, 0));
    }

    lighter (percent) {
        // return an rgb-interpolated lighter copy of me, ignore alpha
        var fract = 0.8333;
        if (percent) {
            fract = (100 - percent) / 100;
        }
        return this.mixed(fract, WHITE);
    }

    dansDarker () {
        // return an hsv-interpolated darker copy of me, ignore alpha
        var hsv = this.hsv(), result = new Color(), vv = Math.max(hsv[2] - 0.16, 0);
        result.set_hsv(hsv[0], hsv[1], vv);
        return result;
    }

    inverted () {
        return new Color(
            255 - this.r,
            255 - this.g,
            255 - this.b
        );
    }

    solid () {
        return new Color(
            this.r,
            this.g,
            this.b
        );
    }
}

// Points //////////////////////////////////////////////////////////////

// Point instance creation:

class Point {
    constructor (x = 0, y = 0) {
        this.x = x || 0;
        this.y = y || 0;
    }

    // Point string representation: e.g. '12@68'

    toString () {
        return Math.round(this.x.toString()) +
            '@' + Math.round(this.y.toString());
    }

    // Point copying:

    copy () {
        return new Point(this.x, this.y);
    }

    // Point comparison:

    eq (aPoint) {
        // ==
        return this.x === aPoint.x && this.y === aPoint.y;
    }

    lt (aPoint) {
        // <
        return this.x < aPoint.x && this.y < aPoint.y;
    }

    gt (aPoint) {
        // >
        return this.x > aPoint.x && this.y > aPoint.y;
    }

    ge (aPoint) {
        // >=
        return this.x >= aPoint.x && this.y >= aPoint.y;
    }

    le (aPoint) {
        // <=
        return this.x <= aPoint.x && this.y <= aPoint.y;
    }

    max (aPoint) {
        return new Point(Math.max(this.x, aPoint.x),
            Math.max(this.y, aPoint.y));
    }

    min (aPoint) {
        return new Point(Math.min(this.x, aPoint.x),
            Math.min(this.y, aPoint.y));
    }

    // Point conversion:

    round () {
        return new Point(Math.round(this.x), Math.round(this.y));
    }

    abs () {
        return new Point(Math.abs(this.x), Math.abs(this.y));
    }

    neg () {
        return new Point(-this.x, -this.y);
    }

    mirror () {
        return new Point(this.y, this.x);
    }

    floor () {
        return new Point(
            Math.max(Math.floor(this.x), 0),
            Math.max(Math.floor(this.y), 0)
        );
    }

    ceil () {
        return new Point(Math.ceil(this.x), Math.ceil(this.y));
    }

    // Point arithmetic:

    add (other) {
        if (other instanceof Point) {
            return new Point(this.x + other.x, this.y + other.y);
        }
        return new Point(this.x + other, this.y + other);
    }

    subtract (other) {
        if (other instanceof Point) {
            return new Point(this.x - other.x, this.y - other.y);
        }
        return new Point(this.x - other, this.y - other);
    }

    multiplyBy (other) {
        if (other instanceof Point) {
            return new Point(this.x * other.x, this.y * other.y);
        }
        return new Point(this.x * other, this.y * other);
    }

    divideBy (other) {
        if (other instanceof Point) {
            return new Point(this.x / other.x, this.y / other.y);
        }
        return new Point(this.x / other, this.y / other);
    }

    floorDivideBy (other) {
        if (other instanceof Point) {
            return new Point(Math.floor(this.x / other.x),
                Math.floor(this.y / other.y));
        }
        return new Point(Math.floor(this.x / other),
            Math.floor(this.y / other));
    }

    // Point polar coordinates:

    r () {
        var t = (this.multiplyBy(this));
        return Math.sqrt(t.x + t.y);
    }

    degrees () {
        /*
            answer the angle I make with origin in degrees.
            Right is 0, down is 90
        */
        var tan, theta;

        if (this.x === 0) {
            if (this.y >= 0) {
                return 90;
            }
            return 270;
        }
        tan = this.y / this.x;
        theta = Math.atan(tan);
        if (this.x >= 0) {
            if (this.y >= 0) {
                return degrees(theta);
            }
            return 360 + (degrees(theta));
        }
        return 180 + degrees(theta);
    }

    theta () {
        /*
            answer the angle I make with origin in radians.
            Right is 0, down is 90
        */
        var tan, theta;

        if (this.x === 0) {
            if (this.y >= 0) {
                return radians(90);
            }
            return radians(270);
        }
        tan = this.y / this.x;
        theta = Math.atan(tan);
        if (this.x >= 0) {
            if (this.y >= 0) {
                return theta;
            }
            return radians(360) + theta;
        }
        return radians(180) + theta;
    }

    // Point functions:

    crossProduct (aPoint) {
        return this.multiplyBy(aPoint.mirror());
    }

    distanceTo (aPoint) {
        return (aPoint.subtract(this)).r();
    }

    rotate (direction, center) {
        // direction must be 'right', 'left' or 'pi'
        var offset = this.subtract(center);
        if (direction === 'right') {
            return new Point(-offset.y, offset.y).add(center);
        }
        if (direction === 'left') {
            return new Point(offset.y, -offset.y).add(center);
        }
        // direction === 'pi'
        return center.subtract(offset);
    }

    flip (direction, center) {
        // direction must be 'vertical' or 'horizontal'
        if (direction === 'vertical') {
            return new Point(this.x, center.y * 2 - this.y);
        }
        // direction === 'horizontal'
        return new Point(center.x * 2 - this.x, this.y);
    }

    distanceAngle (dist, angle) {
        var deg = angle, x, y;
        if (deg > 270) {
            deg = deg - 360;
        } else if (deg < -270) {
            deg = deg + 360;
        }
        if (-90 <= deg && deg <= 90) {
            x = Math.sin(radians(deg)) * dist;
            y = Math.sqrt((dist * dist) - (x * x));
            return new Point(x + this.x, this.y - y);
        }
        x = Math.sin(radians(180 - deg)) * dist;
        y = Math.sqrt((dist * dist) - (x * x));
        return new Point(x + this.x, this.y + y);
    }

    // Point transforming:

    scaleBy (scalePoint) {
        return this.multiplyBy(scalePoint);
    }

    translateBy (deltaPoint) {
        return this.add(deltaPoint);
    }

    rotateBy (angle, centerPoint) {
        var center = centerPoint || ZERO, p = this.subtract(center), r = p.r(), theta = angle - p.theta();
        return new Point(
            center.x + (r * Math.cos(theta)),
            center.y - (r * Math.sin(theta))
        );
    }

    // Point conversion:

    asArray () {
        return [this.x, this.y];
    }

    // creating Rectangle instances from Points:

    corner (cornerPoint) {
        // answer a new Rectangle
        return new Rectangle(
            this.x,
            this.y,
            cornerPoint.x,
            cornerPoint.y
        );
    }

    rectangle (aPoint) {
        // answer a new Rectangle
        var org, crn;
        org = this.min(aPoint);
        crn = this.max(aPoint);
        return new Rectangle(org.x, org.y, crn.x, crn.y);
    }

    extent (aPoint) {
        //answer a new Rectangle
        var crn = this.add(aPoint);
        return new Rectangle(this.x, this.y, crn.x, crn.y);
    }
}

// Rectangles //////////////////////////////////////////////////////////

// Rectangle instance creation:

class Rectangle {
    constructor (left, top, right, bottom) {
        this.origin = new Point(left || 0, top || 0);
        this.corner = new Point(right || 0, bottom || 0);
    }

    // Rectangle string representation: e.g. '[0@0 | 160@80]'

    toString () {
        return '[' + this.origin.toString() + ' | ' + this.extent.toString() + ']';
    }

    // Rectangle copying:

    copy () {
        return new Rectangle(
            this.left,
            this.top,
            this.right,
            this.bottom
        );
    }

    // Rectangle accessing - setting:

    setTo (left, top, right, bottom) {
        // note: all inputs are optional and can be omitted
        this.origin = new Point(
            left || ((left === 0) ? 0 : this.left),
            top || ((top === 0) ? 0 : this.top)
        );

        this.corner = new Point(
            right || ((right === 0) ? 0 : this.right),
            bottom || ((bottom === 0) ? 0 : this.bottom)
        );
    }

    // Rectangle mutating:

    setExtent (aPoint) {
        this.extent = aPoint;
    }

    set extent (aPoint) {
        this.width = aPoint.x;
        this.height = aPoint.y;
    }

    setWidth (width) {
        this.width = width;
    }

    set width (width) {
        this.corner.x = this.origin.x + width;
    }

    setHeight (height) {
        this.height = height;
    }

    set height (height) {
        this.corner.y = this.origin.y + height;
    }

    // Rectangle accessing - getting:

    get area () {
        //requires width() and height() to be defined
        var w = this.width;
        if (w < 0) {
            return 0;
        }
        return Math.max(w * this.height, 0);
    }

    get bottom () {
        return this.corner.y;
    }

    get bottomCenter () {
        return new Point(this.center.x, this.bottom);
    }

    get bottomLeft () {
        return new Point(this.origin.x, this.corner.y);
    }

    get bottomRight () {
        return this.corner.copy();
    }

    get boundingBox () {
        return this;
    }

    get center () {
        return this.origin.add(
            this.corner.subtract(this.origin).floorDivideBy(2)
        );
    }

    get corners () {
        return [
            this.origin,
            this.bottomLeft,
            this.corner,
            this.topRight
        ];
    }

    get extent () {
        return this.corner.subtract(this.origin);
    }

    get height () {
        return this.corner.y - this.origin.y;
    }

    get left () {
        return this.origin.x;
    }

    get leftCenter () {
        return new Point(this.left, this.center.y);
    }

    get right () {
        return this.corner.x;
    }

    get rightCenter () {
        return new Point(this.right, this.center.y);
    }

    get top () {
        return this.origin.y;
    }

    get topCenter () {
        return new Point(this.center.x, this.top);
    }

    get topLeft () {
        return this.origin;
    }

    get topRight () {
        return new Point(this.corner.x, this.origin.y);
    }

    get width () {
        return this.corner.x - this.origin.x;
    }

    get position () {
        return this.origin;
    }

    // Rectangle comparison:

    eq (aRect) {
        return this.origin.eq(aRect.origin) &&
            this.corner.eq(aRect.corner);
    }

    abs () {
        var newOrigin, newCorner;

        newOrigin = this.origin.abs();
        newCorner = this.corner.max(newOrigin);
        return newOrigin.corner(newCorner);
    }

    // Rectangle functions:

    insetBy (delta) {
        // delta can be either a Point or a Number
        var result = new Rectangle();
        result.origin = this.origin.add(delta);
        result.corner = this.corner.subtract(delta);
        return result;
    }
    
    expandBy (delta) {
        // delta can be either a Point or a Number
        var result = new Rectangle();
        result.origin = this.origin.subtract(delta);
        result.corner = this.corner.add(delta);
        return result;
    }

    growBy (delta) {
        // delta can be either a Point or a Number
        var result = new Rectangle();
        result.origin = this.origin.copy();
        result.corner = this.corner.add(delta);
        return result;
    }

    intersect (aRect) {
        var result = new Rectangle();
        result.origin = this.origin.max(aRect.origin);
        result.corner = this.corner.min(aRect.corner);
        return result;
    }

    merge (aRect) {
        var result = new Rectangle();
        result.origin = this.origin.min(aRect.origin);
        result.corner = this.corner.max(aRect.corner);
        return result;
    }

    mergeWith (aRect) {
        // mutates myself
        this.origin = this.origin.min(aRect.origin);
        this.corner = this.corner.max(aRect.corner);
    }

    round () {
        return this.origin.round().corner(this.corner.round());
    }

    spread () {
        // round me by applying floor() to my origin and ceil() to my corner
        // avoids artefacts on retina displays
        return this.origin.floor().corner(this.corner.ceil());
    }

    amountToTranslateWithin (aRect) {
        /*
            Answer a Point, delta, such that self + delta is forced within
            aRectangle. when all of me cannot be made to fit, prefer to keep
            my topLeft inside. Taken from Squeak.
        */
        var dx = 0, dy = 0;

        if (this.right > aRect.right) {
            dx = aRect.right - this.right;
        }
        if (this.bottom > aRect.bottom) {
            dy = aRect.bottom - this.bottom;
        }
        if ((this.left + dx) < aRect.left) {
            dx = aRect.left - this.left;
        }
        if ((this.top + dy) < aRect.top) {
            dy = aRect.top - this.top;
        }
        return new Point(dx, dy);
    }

    regionsAround (aRect) {
        // answer a list of rectangles surrounding another one,
        // use this to clip "holes"
        var regions = [];
        if (!this.intersects(aRect)) {
            return regions;
        }

        // left:

        if (aRect.left > this.left) {
            regions.push(
                new Rectangle(
                    this.left,
                    this.top,
                    aRect.left,
                    this.bottom
                )
            );
        }

        // above:

        if (aRect.top > this.top) {
            regions.push(
                new Rectangle(
                    this.left,
                    this.top,
                    this.right,
                    aRect.top
                )
            );
        }

        // right:

        if (aRect.right < this.right) {
            regions.push(
                new Rectangle(
                    aRect.right,
                    this.top,
                    this.right,
                    this.bottom
                )
            );
        }

        // below:

        if (aRect.bottom < this.bottom) {
            regions.push(
                new Rectangle(
                    this.left,
                    aRect.bottom,
                    this.right,
                    this.bottom
                )
            );
        }
        return regions;
    }
    // Rectangle testing:

    containsPoint (aPoint) {
        return this.origin.le(aPoint) && aPoint.lt(this.corner);
    }

    containsRectangle (aRect) {
        return aRect.origin.gt(this.origin) &&
            aRect.corner.lt(this.corner);
    }

    intersects (aRect) {
        var ro = aRect.origin, rc = aRect.corner;
        return (rc.x >= this.origin.x) &&
            (rc.y >= this.origin.y) &&
            (ro.x <= this.corner.x) &&
            (ro.y <= this.corner.y);
    }

    isNearTo (aRect, threshold) {
        var ro = aRect.origin, rc = aRect.corner, border = threshold || 0;
        return (rc.x + border >= this.origin.x) &&
            (rc.y + border >= this.origin.y) &&
            (ro.x - border <= this.corner.x) &&
            (ro.y - border <= this.corner.y);
    }

    // Rectangle transforming:

    scaleBy (scale) {
        // scale can be either a Point or a scalar
        var o = this.origin.multiplyBy(scale), c = this.corner.multiplyBy(scale);
        return new Rectangle(o.x, o.y, c.x, c.y);
    }

    translateBy (delta) {
        // delta can be either a Point or a number
        var o = this.origin.add(delta), c = this.corner.add(delta);
        return new Rectangle(o.x, o.y, c.x, c.y);
    }

    translate (delta) {
        if (delta instanceof Point) {
            this.origin.x += delta.x;
            this.origin.y += delta.y;
            this.corner.y += delta.y;
            this.corner.x += delta.x;
            return null;
        }
        this.origin.x += delta;
        this.origin.y += delta;
        this.corner.x += delta;
        this.corner.y += delta;
    }

    // Rectangle converting:

    asArray () {
        return [this.left, this.top, this.right, this.bottom];
    }

    asArray_xywh () {
        return [this.left, this.top, this.width, this.height];
    }
}

const ZERO = new Point();
const BLACK = new Color();
const WHITE = new Color(255, 255, 255);
const CLEAR = new Color(0, 0, 0, 0);

Object.freeze(ZERO);
Object.freeze(BLACK);
Object.freeze(WHITE);
Object.freeze(CLEAR);

// Nodes ///////////////////////////////////////////////////////////////

// Node instance creation:

class BaseNode {
    constructor(parent = null, childrenArray = []) {
        this.parent = parent || null;
        this.children = childrenArray || [];
    }
    
    // Node string representation: e.g. 'a Node[3]'

    toString () {
        return 'a Node' + '[' + this.children.length.toString() + ']';
    }

    // Node accessing:
    
    addChild (aNode) {
        this.children.push(aNode);
        aNode.parent = this;
    }
    
    addChildFirst (aNode) {
        this.children.splice(0, null, aNode);
        aNode.parent = this;
    }
    
    removeChild (aNode) {
        var idx = this.children.indexOf(aNode);
        if (idx !== -1) {
            this.children.splice(idx, 1);
        }
    }
    
    // Node functions:
    
    get root () {
        if (this.parent === null) {
            return this;
        }
        return this.parent.root;
    }

    get depth () {
        if (this.parent === null) {
            return 0;
        }
        return this.parent.depth + 1;
    }

    get allChildren () {
        // includes myself
        var result = [this];
        this.children.forEach(child => {
            result = result.concat(child.allChildren);
        });
        return result;
    }

    forAllChildren (aFunction) {
        if (this.children.length > 0) {
            this.children.forEach(child => child.forAllChildren(aFunction));
        }
        aFunction.call(null, this);
    }

    anyChild (aPredicate) {
        // includes myself
        var i;
        if (aPredicate.call(null, this)) {
            return true;
        }
        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i].anyChild(aPredicate)) {
                return true;
            }
        }
        return false;
    }

    get allLeafs () {
        var result = [];
        this.allChildren.forEach(element => {
            if (element.children.length === 0) {
                result.push(element);
            }
        });
        return result;
    }

    get allParents () {
        // includes myself
        var result = [this];
        if (this.parent !== null) {
            result = result.concat(this.parent.allParents);
        }
        return result;
    }

    get siblings () {
        if (this.parent === null) {
            return [];
        }
        return this.parent.children.filter(child => child !== this);
    }

    parentThatIsA () {
        // including myself
        // Note: you can pass in multiple constructors to test for
        var i;
        for (i = 0; i < arguments.length; i += 1) {
            if (this instanceof arguments[i]) {
                return this;
            }
        }
        if (!this.parent) {
            return null;
        }
        return this.parentThatIsA.apply(this.parent, arguments);
    }

    parentThatIsAnyOf (constructors) {
        // deprecated, use parentThatIsA instead
        return this.parentThatIsA.apply(this, constructors);
    }

    childThatIsA () {
        // including myself
        // Note: you can pass in multiple constructors to test for
        var i, hit;
        for (i = 0; i < arguments.length; i += 1) {
            if (this instanceof arguments[i]) {
                return this;
            }
        }
        if (!this.children.length) {
            return null;
        }
        for (i = 0; i < this.children.length; i += 1) {
            hit = this.childThatIsA.apply(this.children[i], arguments);
            if (hit) {
                return hit;
            }
        }
        return null;
    }
}

// Morphs //////////////////////////////////////////////////////////////

// Morph: referenced constructors

// Morph inherits from BaseNode:

class Morph extends BaseNode {
    // Morph settings:

    shadowBlur = 4;

    // Morph instance creation:

    constructor () {
        super();
        this.isMorph = true; // used to optimize deep copying
        this.cachedImage = null;
        this.isCachingImage = false;
        this.shouldRerender = false;
        this.bounds = new Rectangle(0, 0, 50, 40);
        this.holes = []; // list of "untouchable" regions (rectangles)
        this.color = new Color(80, 80, 80);
        this.texture = null; // optional url of a fill-image
        this.cachedTexture = null; // internal cache of actual bg image
        this.alpha = 1;
        this.isVisible = true;
        this.isDraggable = false;
        this.isTemplate = false;
        this.acceptsDrops = false;
        this.isFreeForm = false;
        this.noDropShadow = false;
        this.fullShadowSource = true;
        this.fps = 0;
        this.customContextMenu = null;
        this.lastTime = Date.now();
        this.onNextStep = null; // optional function to be run once
    }

    // Morph string representation: e.g. 'a Morph 2 [20@45 | 130@250]'

    toString () {
        return 'a ' +
            (this.constructor.name ||
                this.constructor.toString().split(' ')[1].split('(')[0]) +
            ' ' +
            this.children.length.toString() + ' ' +
            this.bounds;
    }

    // Morph deleting:

    destroy () {
        if (this.parent !== null) {
            this.fullChanged();
            this.parent.removeChild(this);
        }
    }

    // Morph stepping:

    stepFrame () {
        if (!this.step) {
            return null;
        }
        var current, elapsed, leftover, nxt;
        current = Date.now();
        elapsed = current - this.lastTime;
        if (this.fps > 0) {
            leftover = (1000 / this.fps) - elapsed;
        } else {
            leftover = 0;
        }
        if (leftover < 1) {
            this.lastTime = current;
            if (this.onNextStep) {
                nxt = this.onNextStep;
                this.onNextStep = null;
                nxt.call(this);
            }
            this.step();
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].stepFrame();
            }
        }
    }

    nextSteps (arrayOfFunctions) {
        var lst = arrayOfFunctions || [], nxt = lst.shift();
        if (nxt) {
            this.onNextStep = () => {
                nxt.call(this);
                this.nextSteps(lst);
            };
        }
    }

    // Morph accessing - geometry getting:

    get left () {
        return this.bounds.left;
    }

    get right () {
        return this.bounds.right;
    }

    get top () {
        return this.bounds.top;
    }

    get bottom () {
        return this.bounds.bottom;
    }

    get center () {
        return this.bounds.center;
    }

    get bottomCenter () {
        return this.bounds.bottomCenter;
    }

    get bottomLeft () {
        return this.bounds.bottomLeft;
    }

    get bottomRight () {
        return this.bounds.bottomRight;
    }

    get boundingBox () {
        return this.bounds;
    }

    get corners () {
        return this.bounds.corners;
    }

    get leftCenter () {
        return this.bounds.leftCenter;
    }

    get rightCenter () {
        return this.bounds.rightCenter;
    }

    get topCenter () {
        return this.bounds.topCenter;
    }

    get topLeft () {
        return this.bounds.topLeft;
    }

    get topRight () {
        return this.bounds.topRight;
    }

    get position () {
        return this.bounds.origin;
    }

    get extent () {
        return this.bounds.extent;
    }

    get width () {
        return this.bounds.width;
    }

    get height () {
        return this.bounds.height;
    }

    fullBounds () {
        var result = this.bounds;
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child.isVisible) {
                result = result.merge(child.fullBounds());
            }
        }
        return result;
    }

    fullBoundsNoShadow () {
        // answer my full bounds but ignore any shadow
        var result = this.bounds;
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (!(child instanceof ShadowMorph) && (child.isVisible)) {
                result = result.merge(child.fullBounds());
            }
        }
        return result;
    }

    get visibleBounds () {
        // answer which part of me is not clipped by a Frame
        var visible = this.bounds,
            frames = this.allParents.filter(p => p instanceof FrameMorph);
        frames.forEach(f => visible = visible.intersect(f.bounds));
        return visible;
    }

    // Morph accessing - simple changes:
    
    moveBy (delta) {
        var children = this.children, i = children.length;
        this.changed();
        this.bounds.translate(delta);
        this.changed();
        for (i; i > 0; i -= 1) {
            children[i - 1].moveBy(delta);
        }
    }

    set position (aPoint) {
        var delta = aPoint.subtract(this.topLeft);
        if (!(delta.eq(ZERO))) {
            this.moveBy(delta);
        }
    }

    /** @deprecated */
    setPosition (aPoint) {
        this.position = aPoint;
    }

    set left (x) {
        this.position = new Point(
            x,
            this.top
        );
    }

    /** @deprecated */
    setLeft (x) {
        this.left = x;
    }

    set right (x) {
        this.position = new Point(
            x - this.width,
            this.top
        );
    }

    /** @deprecated */
    setRight (x) {
        this.right = x;
    }

    set top (y) {
        this.position = new Point(
            this.left,
            y
        );
    }

    /** @deprecated */
    setTop (y) {
        this.top = y;
    }

    set bottom (y) {
        this.position = new Point(
            this.left,
            y - this.height
        );
    }

    /** @deprecated */
    setBottom (y) {
        this.bottom = y;
    }

    set center (aPoint) {
        this.position = aPoint.subtract(
            this.extent.floorDivideBy(2)
        );
    }

    /** @deprecated */
    setCenter (aPoint) {
        this.center = aPoint;
    }

    setFullCenter (aPoint) {
        this.position = aPoint.subtract(
            this.fullBounds().extent.floorDivideBy(2)
        );
    }

    keepWithin (aMorph) {
        // make sure I am completely within another Morph's bounds
        var leftOff, rightOff, topOff, bottomOff;
        rightOff = this.fullBounds().right - aMorph.right;
        if (rightOff > 0) {
            this.moveBy(new Point(-rightOff, 0));
        }
        leftOff = this.fullBounds().left - aMorph.left;
        if (leftOff < 0) {
            this.moveBy(new Point(-leftOff, 0));
        }
        bottomOff = this.fullBounds().bottom - aMorph.bottom;
        if (bottomOff > 0) {
            this.moveBy(new Point(0, -bottomOff));
        }
        topOff = this.fullBounds().top - aMorph.top;
        if (topOff < 0) {
            this.moveBy(new Point(0, -topOff));
        }
    }

    scrollIntoView () {
        var leftOff, rightOff, 
            topOff, bottomOff, 
            sf = this.parentThatIsA(ScrollFrameMorph);
        
        if (!sf) return;
        rightOff = Math.min(
            this.fullBounds().right - sf.right,
            sf.contents.right - sf.right
        );
        if (rightOff > 0) {
            sf.contents.moveBy(new Point(-rightOff, 0));
        }
        leftOff = this.fullBounds().left - sf.left;
        if (leftOff < 0) {
            sf.contents.moveBy(new Point(-leftOff, 0));
        }
        topOff = this.fullBounds().top - sf.top;
        if (topOff < 0) {
            sf.contents.moveBy(new Point(0, -topOff));
        }
        bottomOff = this.fullBounds().bottom - sf.bottom;
        if (bottomOff > 0) {
            sf.contents.moveBy(new Point(0, -bottomOff));
        }
        sf.adjustScrollBars();
    }

    // Morph accessing - dimensional changes requiring a complete redraw

    set extent (aPoint) {
        if (aPoint.eq(this.extent)) return;
        this.changed();
        this.bounds.width = aPoint.x;
        this.bounds.height = aPoint.y;
        this.fixLayout();
        this.rerender();
    }
    
    /** @deprecated */
    setExtent (aPoint) {
        this.extent = aPoint;
    }

    set width (width) {
        this.extent = new Point(width || 0, this.height);
    }

    /** @deprecated */
    setWidth (width) {
        this.width = width;
    }

    set height (height) {
        this.extent = new Point(this.width, height || 0);
    }

    /** @deprecated */
    setHeight (height) {
        this.height = height;
    }

    setColor(aColor) {
        if (aColor) {
            if (!this.color.eq(aColor)) {
                this.color = aColor;
                this.rerender();
            }
        }
    }

    // Morph rendering:

    getImage () {
        if (this.cachedImage && !this.shouldRerender) {
            return this.cachedImage;
        }
        var img = newCanvas(this.extent, false, this.cachedImage);
        if (this.isCachingImage) {
            this.cachedImage = img;
        }
        this.render(img.getContext('2d'));
        this.shouldRerender = false;
        return img;
    }

    render (aContext) {
        aContext.fillStyle = this.getRenderColor().toString();
        aContext.fillRect(0, 0, this.width, this.height);
        if (this.cachedTexture) {
            this.renderCachedTexture(aContext);
        } else if (this.texture) {
            this.renderTexture(this.texture, aContext);
        }
    }

    getRenderColor () {
        // can be overriden by my heirs or instances
        return this.color;
    }

    fixLayout () {
        // implemented by my heirs
        // determine my extent and arrange my submorphs, if any
        // default is to do nothing
        // NOTE: If you need to set the extent, in order to avoid
        // infinite recursion instead of calling setExtent() (which will
        // in turn call fixLayout() again) directly modify the bounds
        // property, e.g. like this: this.bounds.setExtent()
        return;
    }

    fixHolesLayout () {
        // implemented by my heirs
        // arrange my untouchable areas, if any
        // default is to do nothing
        return;
    }

    // Morph displaying:

    renderTexture (url, ctx) {
        this.cachedTexture = new Image();
        this.cachedTexture.onload = () => this.changed();
        this.cachedTexture.src = this.texture = url;
    }

    renderCachedTexture (ctx) {
        var bg = this.cachedTexture,
            cols = Math.floor(this.width / bg.width),
            lines = Math.floor(this.height / bg.height),
            x, y;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.clip();
        for (y = 0; y <= lines; y += 1) {
            for (x = 0; x <= cols; x += 1) {
                ctx.drawImage(bg, x * bg.width, y * bg.height);
            }
        }
        ctx.restore();
    }

    drawOn (ctx, rect) {
        var clipped = rect.intersect(this.bounds),
            pos = this.position, 
            pic, src, 
            w, h, 
            sl, st;

        if (!clipped.extent.gt(ZERO)) { return; }
        ctx.save();
        ctx.globalAlpha = this.alpha;
        if (this.isCachingImage) {
            pic = this.getImage();
            src = clipped.translateBy(pos.neg());
            sl = src.left;
            st = src.top;
            w = Math.min(src.width, pic.width - sl);
            h = Math.min(src.height, pic.height - st);
            if (w < 1 || h < 1) { return; }
            ctx.drawImage(
                pic,
                sl,
                st,
                w,
                h,
                clipped.left,
                clipped.top,
                w,
                h
            );
        } else { // render directly on target canvas
            ctx.beginPath();
            ctx.rect(clipped.left, clipped.top, clipped.width, clipped.height);
            ctx.clip();
            ctx.translate(pos.x, pos.y);
            this.render(ctx);
            if (MorphicPreferences.showHoles) { // debug hole rendering
                ctx.translate(-pos.x, -pos.y);
                ctx.globalAlpha = 0.25;
                ctx.fillStyle = 'white';
                this.holes.forEach(hole => {
                    var sect = hole.translateBy(pos).intersect(clipped);
                    ctx.fillRect(
                        sect.left,
                        sect.top,
                        sect.width,
                        sect.height
                    );
                });
            }
        }
        ctx.restore();
    }

    fullDrawOn (aContext, aRect) {
        if (!this.isVisible) return;
        this.drawOn(aContext, aRect);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            child.fullDrawOn(aContext, aRect);
        }
    }

    hide () {
        this.isVisible = false;
        this.changed();
    }

    show () {
        this.isVisible = true;
        this.changed();
    }

    toggleVisibility () {
        this.isVisible = !this.isVisible;
        this.changed();
    }

    // Morph full image:

    fullImage () {
        var fb = this.fullBounds(),
            img = newCanvas(fb.extent),
            ctx = img.getContext('2d');
        ctx.translate(-fb.origin.x, -fb.origin.y);
        this.fullDrawOn(ctx, fb);
        return img;
    }

    // Morph shadow:

    shadowImage (off, color) {
        // for flat design mode
        var fb, img, outline, 
            sha, ctx, 
            offset = off || new Point(7, 7), 
            clr = color || new Color(0, 0, 0);
        if (this.fullShadowSource) {
            fb = this.fullBounds().extent;
            img = this.fullImage();
        } else { // optimization when all submorphs are contained inside
            fb = this.extent;
            img = this.getImage();
        }
        outline = newCanvas(fb);
        ctx = outline.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(
            img,
            -offset.x,
            -offset.y
        );
        sha = newCanvas(fb);
        ctx = sha.getContext('2d');
        ctx.drawImage(outline, 0, 0);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = clr.toString();
        ctx.fillRect(0, 0, fb.x, fb.y);
        return sha;
    }

    shadowImageBlurred (off, color) {
        var fb, img, sha, ctx,
            offset = off || new Point(7, 7), 
            blur = this.shadowBlur, 
            clr = color || new Color(0, 0, 0);
        
        if (this.fullShadowSource) {
            fb = this.fullBounds().extent.add(blur * 2);
            img = this.fullImage();
        } else { // optimization when all submorphs are contained inside
            fb = this.extent.add(blur * 2);
            img = this.getImage();
        }
        sha = newCanvas(fb);
        ctx = sha.getContext('2d');
        ctx.shadowOffsetX = offset.x;
        ctx.shadowOffsetY = offset.y;
        ctx.shadowBlur = blur;
        ctx.shadowColor = clr.toString();
        ctx.drawImage(
            img,
            blur - offset.x,
            blur - offset.y
        );
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(
            img,
            blur - offset.x,
            blur - offset.y
        );
        return sha;
    }

    shadow (off, a, color) {
        var shadow = new ShadowMorph(), 
            offset = off || new Point(7, 7),
            alpha = a || ((a === 0) ? 0 : 0.2),
            fb = this.fullBounds();
        shadow.extent = fb.extent.add(this.shadowBlur * 2);
        if (useBlurredShadows /*&& !MorphicPreferences.isFlat*/) {
            shadow.cachedImage = this.shadowImageBlurred(offset, color);
            shadow.alpha = alpha;
            shadow.position = fb.origin.add(offset).subtract(this.shadowBlur);
        } else {
            shadow.cachedImage = this.shadowImage(offset, color);
            shadow.alpha = alpha;
            shadow.position = fb.origin.add(offset);
        }
        shadow.shouldRerender = false;
        return shadow;
    }

    addShadow (off, a, color) {
        var shadow,
            offset = off || new Point(7, 7),
            alpha = a || ((a === 0) ? 0 : 0.2);
        shadow = this.shadow(offset, alpha, color);
        this.addBack(shadow);
        this.fullChanged();
        return shadow;
    }

    getShadow () {
        var shadows = this.children.slice(0).reverse().filter(
            child => child instanceof ShadowMorph
        );
        if (shadows.length !== 0) {
            return shadows[0];
        }
        return null;
    }

    removeShadow () {
        var shadow = this.getShadow();
        if (shadow !== null) {
            this.fullChanged();
            this.removeChild(shadow);
        }
    }

    // Morph pen trails:

    penTrails () {
        // answer my pen trails canvas. default is to answer my image
        // NOTE: clients calling this also want to make sure the
        // obtained canvas will be around at the next display cycle,
        // so they might also wish to set the receiver's "isCachingImage"
        // property to "true".
        return this.getImage();
    }

    // Morph updating:

    rerender () {
        this.shouldRerender = true;
        this.changed();
    }

    changed () {
        var w = this.root;
        if (w instanceof WorldMorph) {
            w.broken.push(this.visibleBounds.spread().expandBy(3));
        }
        if (this.parent) {
            this.parent.childChanged(this);
        }
    }

    fullChanged () {
        var w = this.root;
        if (w instanceof WorldMorph) {
            w.broken.push(
                this.fullBounds().spread()
            );
        }
    }

    childChanged () {
        // react to a change in one of my children,
        // default is to just pass this message on upwards
        // override this method for Morphs that need to adjust accordingly
        if (this.parent) {
            this.parent.childChanged(this);
        }
    }

    // Morph accessing - structure:

    get world () {
        var root = this.root;
        if (root instanceof WorldMorph) {
            return root;
        }
        if (root instanceof HandMorph) {
            return root.world;
        }
        return null;
    }

    add (aMorph) {
        var owner = aMorph.parent;
        if (owner !== null) {
            owner.removeChild(aMorph);
        }
        this.addChild(aMorph);
    }

    addBack (aMorph) {
        var owner = aMorph.parent;
        if (owner !== null) {
            owner.removeChild(aMorph);
        }
        this.addChildFirst(aMorph);
    }

    topMorphAt (point) {
        var i, result;
        if (!this.isVisible) { return null; }
        for (i = this.children.length - 1; i >= 0; i -= 1) {
            result = this.children[i].topMorphAt(point);
            if (result) { return result; }
        }
        if (this.bounds.containsPoint(point)) {
            if (this.holes.some(
                any => any.translateBy(this.position).containsPoint(point))) {
                return null;
            }
            if (this.isFreeForm) {
                if (!this.isTransparentAt(point)) {
                    return this;
                }
            } else {
                return this;
            }
        }
        return null;
    }

    topMorphSuchThat (predicate) {
        var next;
        if (predicate.call(null, this)) {
            next = detect(
                this.children.slice(0).reverse(),
                predicate
            );
            if (next) {
                return next.topMorphSuchThat(predicate);
            }
            return this;
        }
        return null;
    }

    overlappedMorphs () {
        //exclude the World
        var world = this.world,
            fb = this.fullBounds(),
            allParents = this.allParents,
            allChildren = this.allChildren,
            morphs;

        morphs = world.allChildren;
        return morphs.filter(m => {
            return m.isVisible &&
                m !== this &&
                m !== world &&
                !contains(allParents, m) &&
                !contains(allChildren, m) &&
                m.fullBounds().intersects(fb);
        });
    }

    // Morph pixel access:

    getPixelColor (aPoint) {
        var point, context, data;
        point = aPoint.subtract(this.bounds.origin);
        context = this.getImage().getContext('2d');
        data = context.getImageData(point.x, point.y, 1, 1);
        return new Color(
            data.data[0],
            data.data[1],
            data.data[2],
            data.data[3] / 255
        );
    }

    isTransparentAt (aPoint) {
        var point, context, data;
        if (this.bounds.containsPoint(aPoint)) {
            if (this.texture) {
                return false;
            }
            point = aPoint.subtract(this.bounds.origin);
            context = this.getImage().getContext('2d');
            data = context.getImageData(
                Math.floor(point.x),
                Math.floor(point.y),
                1,
                1
            );
            return data.data[3] === 0;
        }
        return false;
    }

    // Morph duplicating:

    copy () {
        var c = copy(this);
        c.parent = null;
        c.children = [];
        c.bounds = this.bounds.copy();
        return c;
    }

    fullCopy () {
        /*
            Produce a copy of me with my entire tree of submorphs. Morphs
            mentioned more than once are all directed to a single new copy.
            Other properties are also *shallow* copied, so you must override
            to deep copy Arrays and (complex) Objects
        */
        var map = new Map(), c;
        c = this.copyRecordingReferences(map);
        c.forAllChildren(m => m.updateReferences(map));
        return c;
    }

    copyRecordingReferences (map) {
        /*
            Recursively copy this entire composite morph, recording the
            correspondence between old and new morphs in the given dictionary.
            This dictionary will be used to update intra-composite references
            in the copy. See updateReferences().
        
            Note: This default implementation copies ONLY morphs. If a morph
            stores morphs in other properties that it wants to copy, then it
            should override this method to do so. The same goes for morphs that
            contain other complex data that should be copied when the morph is
            duplicated.
        */
        var c = this.copy();
        map.set(this, c);
        this.children.forEach(m => c.add(m.copyRecordingReferences(map)));
        return c;
    }

    updateReferences(map) {
        /*
        Update intra-morph references within a composite morph that has
        been copied. For example, if a button refers to morph X in the
        orginal composite then the copy of that button in the new composite
        should refer to the copy of X in new composite, not the original X.
        */
        var properties = Object.keys(this),
            l = properties.length,
            property, value, reference, i;
        for (i = 0; i < l; i += 1) {
            property = properties[i];
            value = this[property];
            if (value && value.isMorph) {
                reference = map.get(value);
                if (reference) { this[property] = reference; }
            }
        }
    }

    // Morph dragging and dropping:

    rootForGrab () {
        if (this instanceof ShadowMorph) {
            return this.parent.rootForGrab();
        }
        if (this.parent instanceof ScrollFrameMorph) {
            return this.parent;
        }
        if (this.parent === null ||
            this.parent instanceof WorldMorph ||
            this.parent instanceof FrameMorph ||
            this.isDraggable === true) {
            return this;
        }
        return this.parent.rootForGrab();
    }

    isCorrectingOutsideDrag () {
        // make sure I don't "trail behind" the hand when dragged
        // override for morphs that you want to be dragged outside
        // their full bounds
        return true;
    }

    wantsDropOf (aMorph) {
        // default is to answer the general flag - change for my heirs
        if ((aMorph instanceof HandleMorph) ||
            (aMorph instanceof MenuMorph) ||
            (aMorph instanceof InspectorMorph)) {
            return false;
        }
        return this.acceptsDrops;
    }

    pickUp (wrrld) {
        var world = wrrld || this.world;
        this.position = world.hand.position.subtract(
            this.extent.floorDivideBy(2)
        );  
        world.hand.grab(this);
    }

    isPickedUp () {
        return this.parentThatIsA(HandMorph) !== null;
    }

    situation () {
        // answer a dictionary specifying where I am right now, so
        // I can slide back to it if I'm dropped somewhere else
        if (this.parent) {
            return {
                origin: this.parent,
                position: this.position.subtract(this.parent.position)
            };
        }
        return null;
    }

    slideBackTo (
        situation,
        msecs,
        onBeforeDrop,
        onComplete
    ) {
        var pos = situation.origin.position.add(situation.position);
        this.glideTo(
            pos,
            msecs,
            null,
            () => {
                situation.origin.add(this);
                if (onBeforeDrop) { onBeforeDrop(); }
                if (this.justDropped) { this.justDropped(); }
                if (situation.origin.reactToDropOf) {
                    situation.origin.reactToDropOf(this);
                }
                if (onComplete) { onComplete(); }
            }
        );
    }
    // Morph animating:

    glideTo (endPoint, msecs, easing, onComplete) {
        var world = this.world, horizontal = new Animation(
            x => this.left = (x),
            () => { return this.left; },
            -(this.left - endPoint.x),
            msecs === 0 ? 0 : msecs || 100,
            easing
        );
        world.animations.push(horizontal);
        world.animations.push(new Animation(
            y => this.top = (y),
            () => { return this.top; },
            -(this.top - endPoint.y),
            msecs === 0 ? 0 : msecs || 100,
            easing,
            () => {
                horizontal.setter(horizontal.destination);
                horizontal.isActive = false;
                onComplete();
            }
        ));
    }

    fadeTo (endAlpha, msecs, easing, onComplete) {
        // include all my children, restore all original transparencies
        // on completion, so I can be recovered
        var world = this.world, oldAlpha = this.alpha;
        this.children.forEach(child => child.fadeTo(endAlpha, msecs, easing));
        world.animations.push(new Animation(
            n => {
                this.alpha = n;
                this.changed();
            },
            () => this.alpha,
            endAlpha - this.alpha,
            msecs === 0 ? 0 : msecs || 200,
            easing,
            () => {
                this.alpha = oldAlpha;
                if (onComplete) { onComplete(); }
            }
        ));
    }

    perish (msecs, onComplete) {
        this.fadeTo(
            0,
            msecs === 0 ? 0 : msecs || 100,
            null,
            () => {
                this.destroy();
                if (onComplete) { onComplete(); }
            }
        );
    }

    resize () {
        this.world.activeHandle = new HandleMorph(this);
    }

    move () {
        this.world.activeHandle = new HandleMorph(
            this,
            null,
            null,
            null,
            null,
            'move'
        );
    }

    moveCenter () {
        this.world.activeHandle = new HandleMorph(
            this,
            null,
            null,
            null,
            null,
            'moveCenter'
        );
    }

    hint (msg) {
        var m, text;
        text = msg;
        if (msg) {
            if (msg.toString) {
                text = msg.toString();
            }
        } else {
            text = 'NULL';
        }
        m = new MenuMorph(this, text);
        m.isDraggable = true;
        m.popUpCenteredAtHand(this.world);
    }

    inform (msg) {
        var m, text;
        text = msg;
        if (msg) {
            if (msg.toString) {
                text = msg.toString();
            }
        } else {
            text = 'NULL';
        }
        m = new MenuMorph(this, text);
        m.addItem("Ok");
        m.isDraggable = true;
        m.popUpCenteredAtHand(this.world);
    }

    prompt (
        msg,
        callback,
        environment,
        defaultContents,
        width,
        floorNum,
        ceilingNum,
        isRounded,
        action = nop
    ) {
        var menu, entryField, slider, isNumeric;
        if (ceilingNum) {
            isNumeric = true;
        }
        menu = new MenuMorph(
            callback || null,
            msg || '',
            environment || null
        );
        entryField = new StringFieldMorph(
            defaultContents || '',
            width || 100,
            MorphicPreferences.prompterFontSize,
            MorphicPreferences.prompterFontName,
            false,
            false,
            isNumeric
        );
        menu.items.push(entryField);
        if (ceilingNum || MorphicPreferences.useSliderForInput) {
            slider = new SliderMorph(
                floorNum || 0,
                ceilingNum,
                parseFloat(defaultContents),
                Math.floor((ceilingNum - floorNum) / 4),
                'horizontal'
            );
            slider.alpha = 1;
            slider.color = new Color(225, 225, 225);
            slider.button.color = menu.borderColor;
            slider.button.highlightColor = slider.button.color.copy();
            slider.button.highlightColor.b += 100;
            slider.button.pressColor = slider.button.color.copy();
            slider.button.pressColor.b += 150;
            slider.height = (MorphicPreferences.prompterSliderSize);
            if (isRounded) {
                slider.action = (num) => {
                    entryField.changed();
                    entryField.text.text = Math.round(num).toString();
                    entryField.text.fixLayout();
                    entryField.text.changed();
                    entryField.text.edit();
                    action(Math.round(num));
                };
            } else {
                slider.action = (num) => {
                    entryField.changed();
                    entryField.text.text = num.toString();
                    entryField.text.fixLayout();
                    entryField.text.changed();
                    action(num);
                };
            }
            menu.items.push(slider);
        }

        menu.addLine(2);
        menu.addItem('Ok', () => entryField.string());
        menu.addItem(
            'Cancel',
            () => {
                action(defaultContents);
                return null;
            }
        );
        menu.isDraggable = true;
        menu.popUpAtHand(this.world);
        entryField.text.edit();
    }

    pickColor (
        msg = '',
        callback = null,
        environment = null,
        defaultContents
    ) {
        var menu, colorPicker;
        menu = new MenuMorph(
            callback || null,
            msg || '',
            environment || null
        );
        colorPicker = new ColorPickerMorph(defaultContents);
        menu.items.push(colorPicker);
        menu.addLine(2);
        menu.addItem('Ok', () => colorPicker.getChoice());
        menu.addItem('Cancel', () => null);
        menu.isDraggable = true;
        menu.popUpAtHand(this.world);
    }

    inspect (anotherObject) {
        var world = this.world instanceof Function ?
            this.world : this.root || this.world, inspector, inspectee = this;

        if (anotherObject) {
            inspectee = anotherObject;
        }
        inspector = new InspectorMorph(inspectee);
        inspector.position = world.hand.position;
        inspector.keepWithin(world);
        world.add(inspector);
        inspector.changed();
    }

    inspectKeyEvent (event) {
        this.inform(
            'Key pressed: ' +
            String.fromCharCode(event.charCode) +
            '\n------------------------' +
            '\ncharCode: ' +
            event.charCode.toString() +
            '\nkeyCode: ' +
            event.keyCode.toString() +
            '\nkey: ' +
            event.key.toString() +
            '\nshiftKey: ' +
            event.shiftKey.toString() +
            '\naltKey: ' +
            event.altKey.toString() +
            '\nctrlKey: ' +
            event.ctrlKey.toString() +
            '\ncmdKey: ' +
            event.metaKey.toString()
        );
    }

    // Morph menus:

    contextMenu () {
        var world;

        if (this.customContextMenu) {
            return this.customContextMenu;
        }
        world = this.world instanceof Function ? this.world : this.world;
        if (world && world.isDevMode) {
            if (this.parent === world) {
                return this.developersMenu();
            }
            return this.hierarchyMenu();
        }
        return this.userMenu() ||
            (this.parent && this.parent.userMenu());
    }

    hierarchyMenu () {
        var parents = this.allParents,
            world = this.world instanceof Function ? this.world : this.world,
            menu = new MenuMorph(this, null);

        parents.forEach(each => {
            if (each.developersMenu && (each !== world)) {
                menu.addMenu(
                    each.toString().slice(0, 50),
                    each.developersMenu()
                );
            }
        });
        return menu;
    }

    developersMenu () {
        // 'name' is not an official property of a function, hence:
        var world = this.world instanceof Function ? this.world : this.world, userMenu = this.userMenu() ||
            (this.parent && this.parent.userMenu()), menu = new MenuMorph(this, this.constructor.name ||
                this.constructor.toString().split(' ')[1].split('(')[0]);
        if (userMenu) {
            menu.addMenu('user features', userMenu);
            menu.addLine();
        }
        menu.addItem(
            "color...",
            () => {
                this.pickColor(
                    menu.title + localize('\ncolor:'),
                    this.setColor,
                    this,
                    this.color
                );
            },
            'choose another color \nfor this morph'
        );
        menu.addItem(
            "transparency...",
            () => {
                this.prompt(
                    menu.title + localize('\nalpha\nvalue:'),
                    this.setAlphaScaled,
                    this,
                    (this.alpha * 100).toString(),
                    null,
                    1,
                    100,
                    true
                );
            },
            'set this morph\'s\nalpha value'
        );
        menu.addItem(
            "resize...",
            'resize',
            'show a handle\nwhich can be dragged\nto change this morph\'s' +
            ' extent'
        );
        menu.addLine();
        menu.addItem(
            "duplicate",
            () => this.fullCopy().pickUp(this.world),
            'make a copy\nand pick it up'
        );
        menu.addItem(
            "pick up",
            'pickUp',
            'detach and put \ninto the hand'
        );
        menu.addItem(
            "attach...",
            'attach',
            'stick this morph\nto another one'
        );
        menu.addItem(
            "move...",
            'move',
            'show a handle\nwhich can be dragged\nto move this morph'
        );
        menu.addItem(
            "inspect...",
            'inspect',
            'open a window\non all properties'
        );
        menu.addItem(
            "pic...",
            () => {
                var imgURL = this.fullImage().toDataURL(), doc, body, tag, str;
                try {
                    doc = window.open('', '_blank', 'popup').document;
                    body = doc.getElementsByTagName('body')[0];
                    str = '' + this;
                    doc.title = str;
                    tag = doc.createElement('h1');
                    tag.textContent = str;
                    body.appendChild(tag);
                    tag = doc.createElement('img');
                    tag.alt = str;
                    tag.src = imgURL;
                    body.appendChild(tag);
                } catch (error) {
                    console.warn(
                        'failed to popup pic, morph:%O, error:%O, image URL:%O',
                        this, error, [imgURL]
                    );
                }
            },
            'open a new window\nwith a picture of this morph'
        );
        menu.addLine();
        if (this.isDraggable) {
            menu.addItem(
                "lock",
                'toggleIsDraggable',
                'make this morph\nunmovable'
            );
        } else {
            menu.addItem(
                "unlock",
                'toggleIsDraggable',
                'make this morph\nmovable'
            );
        }
        menu.addItem("hide", 'hide');
        menu.addItem("delete", 'destroy');
        if (!(this instanceof WorldMorph)) {
            menu.addLine();
            menu.addItem(
                "World...",
                () => world.contextMenu().popUpAtHand(world),
                'show the\nWorld\'s menu'
            );
        }
        return menu;
    }

    userMenu () {
        return null;
    }

    addToDemoMenu (aMorphOrMenuArray) {
        // register a Morph or a Menu with Morphs with the World's demos menu
        // a menu can be added in the form of a two-item array: [name, [morphs]]
        WorldMorph.prototype.customMorphs.push(aMorphOrMenuArray);
    }

    // Morph menu actions

    setAlphaScaled (alpha) {
        // for context menu demo purposes
        var newAlpha, unscaled;
        if (typeof alpha === 'number') {
            unscaled = alpha / 100;
            this.alpha = Math.min(Math.max(unscaled, 0), 1);
        } else {
            newAlpha = parseFloat(alpha);
            if (!isNaN(newAlpha)) {
                unscaled = newAlpha / 100;
                this.alpha = Math.min(Math.max(unscaled, 0), 1);
            }
        }
        this.changed();
    }

    attach () {
        var choices = this.overlappedMorphs(),
            menu = new MenuMorph(this, 'choose new parent:');

        choices.forEach(each => {
            menu.addItem(each.toString().slice(0, 50), () => {
                each.add(this);
                this.isDraggable = false;
            });
        });
        if (choices.length > 0) {
            menu.popUpAtHand(this.world);
        }
    }

    toggleIsDraggable () {
        // for context menu demo purposes
        this.isDraggable = !this.isDraggable;
    }

    colorSetters () {
        // for context menu demo purposes
        return ['color'];
    }

    numericalSetters () {
        // for context menu demo purposes
        return [
            'setLeft',
            'setTop',
            'setWidth',
            'setHeight',
            'setAlphaScaled'
        ];
    }

    // Morph entry field tabbing:

    allEntryFields () {
        return this.allChildren.filter(each => {
            return each.isEditable &&
                (each instanceof StringMorph ||
                    each instanceof TextMorph);
        });
    }

    nextEntryField (current) {
        var fields = this.allEntryFields(),
            idx = fields.indexOf(current);
        if (idx !== -1) {
            if (fields.length > idx + 1) {
                return fields[idx + 1];
            }
        }
        return fields[0];
    }

    previousEntryField (current) {
        var fields = this.allEntryFields(),
            idx = fields.indexOf(current);
        if (idx !== -1) {
            if (idx > 0) {
                return fields[idx - 1];
            }
            return fields[fields.length - 1];
        }
        return fields[0];
    }

    tab (editField) {
        /*
            the <tab> key was pressed in one of my edit fields.
            invoke my "nextTab()" function if it exists, else
            propagate it up my owner chain.
        */
        if (this.nextTab) {
            this.nextTab(editField);
        } else if (this.parent) {
            this.parent.tab(editField);
        }
    }

    backTab (editField) {
        /*
            the <back tab> key was pressed in one of my edit fields.
            invoke my "previousTab()" function if it exists, else
            propagate it up my owner chain.
        */
        if (this.previousTab) {
            this.previousTab(editField);
        } else if (this.parent) {
            this.parent.backTab(editField);
        }
    }
    /*
        the following are examples of what the navigation methods should
        look like. Insert these at the World level for fallback, and at lower
        levels in the Morphic tree (e.g. dialog boxes) for a more fine-grained
        control over the tabbing cycle.
    
    Morph.prototype.nextTab = function (editField) {
        var next = this.nextEntryField(editField);
        editField.clearSelection();
        next.selectAll();
        next.edit();
    };
    
    Morph.prototype.previousTab = function (editField) {
        var prev = this.previousEntryField(editField);
        editField.clearSelection();
        prev.selectAll();
        prev.edit();
    };
    
    */

    // Morph events:

    escalateEvent(functionName, arg) {
        var handler = this.parent;
        while (!handler[functionName] && handler.parent !== null) {
            handler = handler.parent;
        }
        if (handler[functionName]) {
            handler[functionName](arg);
        }
    }

    // Morph eval:

    evaluateString(code) {
        var result;

        try {
            result = eval(code);
            this.changed();
        } catch (err) {
            this.inform(err);
        }
        return result;
    }

    // Morph collision detection:

    isTouching(otherMorph) {
        var data = this.overlappingPixels(otherMorph),
            len,
            i;

        if (!data) return false;
        len = data[0].length;
        for (i = 3; i < len; i += 4) {
            if (data[0][i] && data[1][i]) { return true; }
        }
        return false;
    }

    overlappingPixels(otherMorph) {
        var fb = this.fullBounds(),
            otherFb = otherMorph.fullBounds(),
            oRect = fb.intersect(otherFb),
            thisImg, thatImg;

        if (oRect.width < 1 || oRect.height < 1) {
            return false;
        }
        thisImg = this.fullImage();
        thatImg = otherMorph.fullImage();
        if (thisImg.isRetinaEnabled !== thatImg.isRetinaEnabled) {
            thisImg = normalizeCanvas(thisImg, true);
            thatImg = normalizeCanvas(thatImg, true);
        }
        return [
            thisImg.getContext("2d").getImageData(
                oRect.left - this.left,
                oRect.top - this.top,
                oRect.width,
                oRect.height
            ).data,
            thatImg.getContext("2d").getImageData(
                oRect.left - otherMorph.left,
                oRect.top - otherMorph.top,
                oRect.width,
                oRect.height
            ).data
        ];
    }

    step () {};

    // Morph utilities:
    
    nop = nop;
}

// ShadowMorph /////////////////////////////////////////////////////////

// ShadowMorph inherits from Morph:

class ShadowMorph extends Morph {
    // ShadowMorph instance creation:
    
    constructor () {
        super();
        this.isCachingImage = true;
    }

    topMorphAt () {
        return null;
    }
}

// HandleMorph ////////////////////////////////////////////////////////

// I am a resize / move handle that can be attached to any Morph

// HandleMorph inherits from Morph:

class HandleMorph extends Morph {
    // HandleMorph instance creation:
    
    constructor (
        target,
        minX,
        minY,
        insetX,
        insetY,
        type
    ) {
        super();
        var size = MorphicPreferences.handleSize;
        this.target = target || null;
        this.minExtent = new Point(minX || 0, minY || 0);
        this.inset = new Point(insetX || 0, insetY || insetX || 0);
        this.type = type || 'resize'; // also: 'move', 'moveCenter', 'movePivot'
        this.isHighlighted = false;
        this.color = WHITE;
        this.isDraggable = false;
        if (this.type === 'movePivot') {
            size *= 2;
        }
        this.extent = new Point(size, size);
        this.fixLayout();
    }
    
    // HandleMorph drawing:

    fixLayout () {
        if (this.target) {
            if (this.type === 'moveCenter') {
                this.center = this.target.center;
            } else if (this.type === 'movePivot') {
                this.center = this.target.rotationCenter();
            } else { // 'resize', 'move'
                this.position = this.target.bottomRight.subtract(
                    this.extent.add(this.inset)
                );
            }
            this.target.add(this);
            this.target.changed();
        }
    }
    
    render (ctx) {
        if (this.type === 'movePivot') {
            if (this.isHighlighted) {
                this.renderCrosshairsOn(ctx, 0.5);
            } else {
                this.renderCrosshairsOn(ctx, 0.6);
            }
        } else {
            if (this.isHighlighted) {
                this.renderHandleOn(
                    ctx,
                    new Color(100, 100, 255),
                    WHITE
                );
            } else {
                this.renderHandleOn(
                    ctx,
                    this.color,
                    new Color(100, 100, 100)
                );
            }
        }
    }

    renderCrosshairsOn (ctx, fract) {
        var r = this.width / 2;

        // semi-transparent white background blob
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(
            r,
            r,
            r * 0.9,
            radians(0),
            radians(360),
            false
        );
        ctx.fill();

        // solid black ring
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            r,
            r,
            r * fract,
            radians(0),
            radians(360),
            false
        );
        ctx.stroke();

        // vertically centered horizontal line
        ctx.moveTo(0, r);
        ctx.lineTo(this.width, r);
        ctx.stroke();

        // horizontally centered vertical line
        ctx.moveTo(r, 0);
        ctx.lineTo(r, this.height);
        ctx.stroke();
    }

    renderHandleOn (
        ctx,
        color,
        shadowColor
    ) {
        var isSquare = (this.type.indexOf('move') === 0), p1 = new Point(0, this.height), // bottom left
            p2 = new Point(this.width, 0), // top right
            p11, p22, i;

        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color.toString();

        if (isSquare) {
            p11 = p1.copy();
            p22 = p2.copy();
            for (i = 0; i <= this.height; i = i + 6) {
                p11.y = p1.y - i;
                p22.y = p2.y - i;

                ctx.beginPath();
                ctx.moveTo(p11.x, p11.y);
                ctx.lineTo(p22.x, p22.y);
                ctx.closePath();
                ctx.stroke();
            }
        }

        p11 = p1.copy();
        p22 = p2.copy();
        for (i = 0; i <= this.width; i = i + 6) {
            p11.x = p1.x + i;
            p22.x = p2.x + i;

            ctx.beginPath();
            ctx.moveTo(p11.x, p11.y);
            ctx.lineTo(p22.x, p22.y);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.strokeStyle = shadowColor.toString();

        if (isSquare) {
            p11 = p1.copy();
            p22 = p2.copy();
            for (i = -2; i <= this.height; i = i + 6) {
                p11.y = p1.y - i;
                p22.y = p2.y - i;

                ctx.beginPath();
                ctx.moveTo(p11.x, p11.y);
                ctx.lineTo(p22.x, p22.y);
                ctx.closePath();
                ctx.stroke();
            }
        }

        p11 = p1.copy();
        p22 = p2.copy();
        for (i = 2; i <= this.width; i = i + 6) {
            p11.x = p1.x + i;
            p22.x = p2.x + i;

            ctx.beginPath();
            ctx.moveTo(p11.x, p11.y);
            ctx.lineTo(p22.x, p22.y);
            ctx.closePath();
            ctx.stroke();
        }
    }

    mouseDownLeft (pos) {
        var world = this.root, offset;

        if (!this.target) {
            return null;
        }
        if (this.type.indexOf('move') === 0) {
            offset = pos.subtract(this.center);
        } else {
            offset = pos.subtract(this.bounds.origin);
        }

        this.step = () => {
            var newPos, newExt;
            if (world.hand.mouseButton) {
                newPos = world.hand.bounds.origin.copy().subtract(offset);
                if (this.type === 'resize') {
                    newExt = newPos.add(
                        this.extent.add(this.inset)
                    ).subtract(this.target.bounds.origin);
                    newExt = newExt.max(this.minExtent);
                    this.target.extent = newExt;

                    this.position = this.target.bottomRight.subtract(
                        this.extent.add(this.inset)
                    );
                } else if (this.type === 'moveCenter') {
                    this.target.setCenter(newPos);
                } else if (this.type === 'movePivot') {
                    this.target.setPivot(newPos);
                    this.setCenter(this.target.rotationCenter());
                } else { // type === 'move'
                    this.target.position = (
                        newPos.subtract(this.target.extent)
                            .add(this.extent)
                    );
                }
            } else {
                this.step = null;
            }
        };

        if (!this.target.step) {
            this.target.step = nop;
        }
    }

    // HandleMorph dragging and dropping:

    rootForGrab () {
        return this;
    }

    // HandleMorph events:

    mouseEnter () {
        this.isHighlighted = true;
        this.changed();
    }

    mouseLeave () {
        this.isHighlighted = false;
        this.changed();
    }

    // HandleMorph menu:

    attach () {
        var choices = this.overlappedMorphs(),
            menu = new MenuMorph(this, 'choose target:');

        choices.forEach(each => {
            menu.addItem(each.toString().slice(0, 50), () => {
                this.isDraggable = false;
                this.target = each;
                this.fixLayout();
            });
        });
        if (choices.length > 0) {
            menu.popUpAtHand(this.world);
        }
    }

    step = null;
}

// PenMorph ////////////////////////////////////////////////////////////

// I am a simple LOGO-wise turtle.

// PenMorph inherits from Morph:

class PenMorph extends Morph {
    // PenMorph instance creation:
    
    constructor () {
        super();
        var size = MorphicPreferences.handleSize * 4;

        // additional properties:
        this.isWarped = false; // internal optimization
        this.heading = 0;
        this.isDown = true;
        this.size = 1;
        this.penPoint = 'tip'; // or 'center"
        this.penBounds = null; // rect around the visible arrow shape

        this.extent = new Point(size, size);
    }

    // PenMorph updating - optimized for warping, i.e atomic recursion

    changed () {
        if (this.isWarped) return;
        super.changed();
    }

    // PenMorph display:
    
    render (ctx, facing) {
        // my orientation can be overridden with the "facing" parameter to
        // implement Scratch-style rotation styles
        var start, dest, left,
            right, len,
            direction = facing || this.heading;

        len = this.width / 2;
        start = this.center.subtract(this.bounds.origin);

        if (this.penPoint === 'tip') {
            dest = start.distanceAngle(len * 0.75, direction - 180);
            left = start.distanceAngle(len, direction + 195);
            right = start.distanceAngle(len, direction - 195);
        } else { // 'middle'
            dest = start.distanceAngle(len * 0.75, direction);
            left = start.distanceAngle(len * 0.33, direction + 230);
            right = start.distanceAngle(len * 0.33, direction - 230);
        }

        // cache penBounds
        this.penBounds = new Rectangle(
            Math.min(start.x, dest.x, left.x, right.x),
            Math.min(start.y, dest.y, left.y, right.y),
            Math.max(start.x, dest.x, left.x, right.x),
            Math.max(start.y, dest.y, left.y, right.y)
        );

        // draw arrow shape
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();

        ctx.moveTo(start.x, start.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(dest.x, dest.y);
        ctx.lineTo(right.x, right.y);

        ctx.closePath();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fill();
    }

    // PenMorph access:

    setHeading (degrees) {
        this.heading = ((+degrees % 360) + 360) % 360;
        this.fixLayout();
        this.rerender();
    }

    numericalSetters () {
        // for context menu demo purposes
        return [
            'setLeft',
            'setTop',
            'setWidth',
            'setHeight',
            'setAlphaScaled',
            'setHeading'
        ];
    }

    // PenMorph menu:

    developersMenu () {
        var menu = super.developersMenu();
        menu.addLine();
        menu.addItem(
            'set rotation',
            "setRotation",
            'interactively turn this morph\nusing a dial widget'
        );
        return menu;
    }

    setRotation () {
        var menu, dial, name = this.name || this.constructor.name;
        if (name.length > 10) {
            name = name.slice(0, 9) + '...';
        }
        menu = new MenuMorph(this, name);
        dial = new DialMorph(null, null, this.heading);
        dial.rootForGrab = () => dial;
        dial.target = this;
        dial.action = 'setHeading';
        menu.items.push(dial);
        menu.addLine();
        menu.addItem('(90) right', () => this.setHeading(90));
        menu.addItem('(-90) left', () => this.setHeading(-90));
        menu.addItem('(0) up', () => this.setHeading(0));
        menu.addItem('(180) down', () => this.setHeading(180));
        menu.isDraggable = true;
        menu.popUpAtHand(this.world);
    }

    // PenMorph drawing:

    drawLine (start, dest) {
        var context = this.parent.penTrails().getContext('2d'),
            from = start.subtract(this.parent.bounds.origin),
            to = dest.subtract(this.parent.bounds.origin);
        
        if (this.isDown) {
            context.lineWidth = this.size;
            context.strokeStyle = this.color.toString();
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.beginPath();
            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);
            context.stroke();
            if (this.isWarped === false) {
                this.world.broken.push(
                    start.rectangle(dest).expandBy(
                        Math.max(this.size / 2, 1)
                    ).intersect(this.parent.visibleBounds).spread()
                );
            }
        }
    }

    // PenMorph turtle ops:

    turn (degrees) {
        this.setHeading(this.heading + parseFloat(degrees));
    }

    forward (steps) {
        var start = this.center,
            dest,
            dist = parseFloat(steps);
        if (dist >= 0) {
            dest = this.position.distanceAngle(dist, this.heading);
        } else {
            dest = this.position.distanceAngle(
                Math.abs(dist),
                (this.heading - 180)
            );
        }
        this.setPosition(dest);
        this.drawLine(start, this.center);
    }

    down () {
        this.isDown = true;
    }

    up () {
        this.isDown = false;
    }

    clear () {
        this.parent.rerender();
    }

    // PenMorph optimization for atomic recursion:

    startWarp () {
        this.isWarped = true;
    }

    endWarp () {
        this.isWarped = false;
        this.parent.changed();
    }

    warp (fun) {
        this.startWarp();
        fun.call(this);
        this.endWarp();
    }

    warpOp (selector, argsArray) {
        this.startWarp();
        this[selector].apply(this, argsArray);
        this.endWarp();
    }

    // PenMorph demo ops:
    // try these with WARP eg.: this.warp(function () {tree(12, 120, 20)})

    warpSierpinski (length, min) {
        this.warpOp('sierpinski', [length, min]);
    }

    sierpinski (length, min) {
        var i;
        if (length > min) {
            for (i = 0; i < 3; i += 1) {
                this.sierpinski(length * 0.5, min);
                this.turn(120);
                this.forward(length);
            }
        }
    }

    warpTree (level, length, angle) {
        this.warpOp('tree', [level, length, angle]);
    }

    tree (level, length, angle) {
        if (level > 0) {
            this.size = level;
            this.forward(length);
            this.turn(angle);
            this.tree(level - 1, length * 0.75, angle);
            this.turn(angle * -2);
            this.tree(level - 1, length * 0.75, angle);
            this.turn(angle);
            this.forward(-length);
        }
    }
}

// ColorPaletteMorph ///////////////////////////////////////////////////

// ColorPaletteMorph inherits from Morph:

class ColorPaletteMorph extends Morph {
    // ColorPaletteMorph instance creation:
    
    constructor (target = null, sizePoint = new Point(80, 50)) {
        super();
        this.isCachingImage = true;
        this.target = target;
        this.targetSetter = 'color';
        this.extent = sizePoint;
        this.choice = null;
    }

    render (ctx) {
        var ext = this.extent, x, y, h, l;

        this.choice = BLACK;
        for (x = 0; x <= ext.x; x += 1) {
            h = 360 * x / ext.x;
            for (y = 0; y <= ext.y; y += 1) {
                l = 100 - (y / ext.y * 100);
                ctx.fillStyle = 'hsl(' + h + ',100%,' + l + '%)';
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    mouseMove (pos) {
        this.choice = this.getPixelColor(pos);
        this.updateTarget();
    }

    mouseDownLeft (pos) {
        this.choice = this.getPixelColor(pos);
        this.updateTarget();
    }

    updateTarget () {
        if (this.target instanceof Morph && this.choice !== null) {
            if (this.target[this.targetSetter] instanceof Function) {
                this.target[this.targetSetter](this.choice);
            } else {
                this.target[this.targetSetter] = this.choice;
                this.target.rerender();
            }
        }
    }

    // ColorPaletteMorph menu:

    developersMenu () {
        var menu = super.developersMenu();
        menu.addLine();
        menu.addItem(
            'set target',
            "setTarget",
            'choose another morph\nwhose color property\n will be' +
            ' controlled by this one'
        );
        return menu;
    }

    setTarget () {
        var choices = this.overlappedMorphs(),
            menu = new MenuMorph(this, 'choose target:');

        choices.push(this.world);
        choices.forEach(each => {
            menu.addItem(each.toString().slice(0, 50), () => {
                this.target = each;
                this.setTargetSetter();
            });
        });
        if (choices.length === 1) {
            this.target = choices[0];
            this.setTargetSetter();
        } else if (choices.length > 0) {
            menu.popUpAtHand(this.world);
        }
    }

    setTargetSetter () {
        var choices = this.target.colorSetters(),
            menu = new MenuMorph(this, 'choose target property:');

        choices.forEach(each => {
            menu.addItem(each, () => this.targetSetter = each);
        });
        if (choices.length === 1) {
            this.targetSetter = choices[0];
        } else if (choices.length > 0) {
            menu.popUpAtHand(this.world);
        }
    }
}

// GrayPaletteMorph ///////////////////////////////////////////////////

// GrayPaletteMorph inherits from ColorPaletteMorph:

class GrayPaletteMorph extends ColorPaletteMorph {
    // GrayPaletteMorph instance creation:
    
    constructor (target = null, sizePoint = new Point(80, 10)) {
        super(target, sizePoint);
    }

    render (ctx) {
        var ext = this.extent, gradient;

        this.choice = BLACK;
        gradient = ctx.createLinearGradient(0, 0, ext.x, ext.y);
        gradient.addColorStop(0, 'black');
        gradient.addColorStop(1, 'white');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ext.x, ext.y);
    }
}

// ColorPickerMorph ///////////////////////////////////////////////////

// ColorPickerMorph inherits from Morph:

class ColorPickerMorph extends Morph {
    // ColorPickerMorph instance creation:

    constructor (defaultColor = WHITE) {
        super();
        this.choice = defaultColor;
        this.color = WHITE;
        this.extent = new Point(80, 80);
    }

    fixLayout () {
        var cpal, gpal, x, y;

        this.children.forEach(child => child.destroy());
        this.children = [];
        this.feedback = new Morph();
        this.feedback.color = this.choice;
        this.feedback.extent = new Point(20, 20);
        cpal = new ColorPaletteMorph(
            this.feedback,
            new Point(this.width, 50)
        );
        gpal = new GrayPaletteMorph(
            this.feedback,
            new Point(this.width, 5)
        );
        cpal.position = this.bounds.origin;
        this.add(cpal);
        gpal.position = cpal.bottomLeft;
        this.add(gpal);
        x = (gpal.left +
            Math.floor((gpal.width - this.feedback.width) / 2));
        y = gpal.bottom + Math.floor((this.bottom -
            gpal.bottom - this.feedback.height) / 2);
        this.feedback.position = new Point(x, y);
        this.add(this.feedback);
    }

    getChoice () {
        return this.feedback.color;
    }
    
    rootForGrab () {
        return this;
    }
}

// BlinkerMorph ////////////////////////////////////////////////////////

// can be used for text cursors

// BlinkerMorph inherits from Morph:

class BlinkerMorph extends Morph {
    // BlinkerMorph instance creation:
    
    constructor (rate = 2) {
        super();
        this.color = new Color(0, 0, 0);
        this.fps = rate || 2;
    }
    
    // BlinkerMorph stepping:
    
    step () {
        this.toggleVisibility();
    }
}

// CursorMorph /////////////////////////////////////////////////////////

// I am a String/Text editing widget

// CursorMorph inherits from BlinkerMorph:

class CursorMorph extends BlinkerMorph {
    // CursorMorph preferences settings:
    viewPadding = 1;

    // CursorMorph instance creation:
    
    constructor (aStringOrTextMorph, aTextarea) {
        super();
        var ls;

        // additional properties:
        this.keyDownEventUsed = false;
        this.target = aStringOrTextMorph;
        this.originalContents = this.target.text;
        this.originalAlignment = this.target.alignment;
        this.slot = this.target.text.length;
        this.textarea = aTextarea;

        // override inherited defaults
        ls = fontHeight(this.target.fontSize);
        this.extent = new Point(Math.max(Math.floor(ls / 20), 1), ls);

        if (this.target instanceof TextMorph &&
            (this.target.alignment !== 'left')) {
            this.target.setAlignmentToLeft();
        }
        this.textarea.value = this.target.text;
        this.textarea.style.fontSize = this.target.fontSize + 'px';
        this.gotoSlot(this.slot);
        this.updateTextAreaPosition();
        this.syncTextareaSelectionWith(this.target);
    }

    // CursorMorph event handling
    /*
         There are three cases when the textarea gets inputs:
    
         1. Inputs that represent special shortcuts of Snap!, so we
         don't want the textarea to handle it. These events are captured in
         "keydown" event handler.
    
         2. inputs that change the content of the textarea, we need to update
         the content of its target morph accordingly. This is handled in
         the "input" event handler.
    
         3. input that change the textarea without triggering an "input" event,
         e.g. selection change, cursor movements. These are handled in the
         "keyup" event handler.
    
         Note that some changes in case 2 are not caused by keyboards (for
         example, select a word by clicking in IME window), so there are overlaps
         between case 2 and case 3. but no one can replace the other.
    */

    processKeyDown (event) {
        /* Special shortcuts
            - ctrl-d, ctrl-i and ctrl-p: doit, inspect it and print it
            - tab: goto next text field
            - esc: discard the editing
            - enter / shift+enter: accept the editing
        */
        var keyName = event.key,
            shift = event.shiftKey,
            singleLineText = this.target instanceof StringMorph,
            dest;

        if (!isNil(this.target.receiver) && (event.ctrlKey || event.metaKey)) {
            if (keyName === 'd') {
                event.preventDefault();
                this.target.doIt();
                return;
            } else if (keyName === 'i') {
                event.preventDefault();
                this.target.inspectIt();
                return;
            } else if (keyName === 'p') {
                event.preventDefault();
                this.target.showIt();
                return;
            }
        }

        if (keyName === 'Tab' || keyName === 'U+0009') {
            if (shift) {
                this.target.backTab(this.target);
            } else {
                this.target.tab(this.target);
            }
            event.preventDefault();
            this.target.escalateEvent('reactToEdit', this.target);
        } else if (keyName === 'Escape') {
            this.cancel();
        } else if (keyName === "Enter" && (singleLineText || shift)) {
            this.accept();
        } else {
            // catch "up arrow" and "down arrow" keys
            if (keyName === 'ArrowDown') {
                dest = this.target.downFrom(this.slot);
                this.textarea.setSelectionRange(dest, dest);
                // to do: allow holding shift to select
                event.preventDefault();
            }
            if (keyName === 'ArrowUp') {
                dest = this.target.upFrom(this.slot);
                this.textarea.setSelectionRange(dest, dest);
                // to do: allow holding shift to select
                event.preventDefault();
            }
            this.target.escalateEvent('reactToKeystroke', event);
        }
    }

    processKeyUp (event) {
        // handle selection change and cursor position change.
        var textarea = this.textarea,
            target = this.target;

        if (textarea.selectionStart === textarea.selectionEnd) {
            target.startMark = null;
            target.endMark = null;
        } else {
            if (textarea.selectionDirection === 'backward') {
                target.startMark = textarea.selectionEnd;
                target.endMark = textarea.selectionStart;
            } else {
                target.startMark = textarea.selectionStart;
                target.endMark = textarea.selectionEnd;
            }
        }
        target.fixLayout();
        target.rerender();
        this.gotoSlot(textarea.selectionEnd);
    }

    processInput (event) {
        // handle content change.
        var target = this.target,
            textarea = this.textarea,
            filteredContent, caret;

        // filter invalid chars for numeric fields
        function filterText (content) {
            var points = 0, hasE = false, result = '', i, ch, valid;
            for (i = 0; i < content.length; i += 1) {
                ch = content.charAt(i);
                valid = (
                    ('0' <= ch && ch <= '9') || // digits
                    (ch.toLowerCase() === 'e') || // scientific notation
                    ((i === 0 || hasE) && ch === '-') || // leading '-' or sc. not.
                    (ch === '.' && points === 0) // at most '.'
                );
                if (valid) {
                    result += ch;
                    if (ch === '.') {
                        points += 1;
                    }
                    if (ch.toLowerCase() === 'e') {
                        hasE = true;
                    }
                }
            }
            return result;
        }

        if (target.isNumeric) {
            filteredContent = filterText(textarea.value);
        } else {
            filteredContent = textarea.value;
        }

        if (filteredContent.length < textarea.value.length) {
            textarea.value = filteredContent;
            caret = Math.min(textarea.selectionStart, filteredContent.length);
            textarea.selectionEnd = caret;
            textarea.selectionStart = caret;
        }

        // target morph: copy the content and selection status to the target.
        target.text = filteredContent;

        if (textarea.selectionStart === textarea.selectionEnd) {
            target.startMark = null;
            target.endMark = null;
        } else {
            if (textarea.selectionDirection === 'backward') {
                target.startMark = textarea.selectionEnd;
                target.endMark = textarea.selectionStart;
            } else {
                target.startMark = textarea.selectionStart;
                target.endMark = textarea.selectionEnd;
            }
        }
        target.changed();
        target.fixLayout();
        target.rerender();

        // cursor morph: copy the caret position to cursor morph.
        this.gotoSlot(textarea.selectionStart);

        this.updateTextAreaPosition();

        // the "reactToInput" event gets triggered AFTER "reactToKeystroke"
        this.target.escalateEvent('reactToInput', event);
    }

    // CursorMorph syncing:

    updateTextAreaPosition () {
        var pos = getDocumentPositionOf(this.target.world.worldCanvas),
            origin = this.target.bounds.origin.add(new Point(pos.x, pos.y));

        function number2px(n) {
            return Math.ceil(n) + 'px';
        }

        this.textarea.style.top = number2px(origin.y);
        this.textarea.style.left = number2px(origin.x);
    }

    syncTextareaSelectionWith (targetMorph) {
        var start = targetMorph.startMark,
            end = targetMorph.endMark;

        if (start === end) {
            this.textarea.setSelectionRange(this.slot, this.slot, 'none');
        } else if (start < end) {
            this.textarea.setSelectionRange(start, end, 'forward');
        } else {
            this.textarea.setSelectionRange(end, start, 'backward');
        }
        this.textarea.focus();
    }

    // CursorMorph navigation:

    gotoSlot (slot) {
        var length = this.target.text.length,
            pos = this.target.slotPosition(slot),
            right, left;
        this.slot = slot < 0 ? 0 : slot > length ? length : slot;
        if (this.parent && this.target.isScrollable) {
            right = this.parent.right - this.viewPadding;
            left = this.parent.left + this.viewPadding;
            if (pos.x > right) {
                this.target.left = (this.target.left + right - pos.x);
                pos.x = right;
            }
            if (pos.x < left) {
                left = Math.min(this.parent.left, left);
                this.target.left = (this.target.left + left - pos.x);
                pos.x = left;
            }
            if (this.target.right < right &&
                right - this.target.width < left) {
                pos.x += right - this.target.right;
                this.target.right = right;
            }
        }
        this.show();
        this.position = pos;
        if (this.parent
            && this.parent.parent instanceof ScrollFrameMorph
            && this.target.isScrollable) {
            this.parent.parent.scrollCursorIntoView(this);
        }
    }

    gotoPos (aPoint) {
        this.gotoSlot(this.target.slotAt(aPoint));
        this.show();
    }

    // CursorMorph selecting:

    updateSelection (shift) {
        if (shift) {
            if (isNil(this.target.endMark) && isNil(this.target.startMark)) {
                this.target.startMark = this.slot;
                this.target.endMark = this.slot;
            } else if (this.target.endMark !== this.slot) {
                this.target.endMark = this.slot;
                this.target.changed();
            }
        } else {
            this.target.clearSelection();
        }
    }
    
    // CursorMorph editing:

    accept () {
        var world = this.root;
        if (world) {
            world.stopEditing();
        }
        this.escalateEvent('accept', this);
    }

    cancel () {
        var world = this.root;
        this.undo();
        if (world) {
            world.stopEditing();
        }
        this.escalateEvent('cancel', this);
    }

    undo () {
        this.target.text = this.originalContents;
        this.target.changed();
        this.target.fixLayout();
        this.target.changed();
        this.gotoSlot(0);
    }

    // CursorMorph destroying:

    destroy () {
        if (this.target.alignment !== this.originalAlignment) {
            this.target.alignment = this.originalAlignment;
            this.target.changed();
        }
        super.destroy();
        this.target.world.resetKeyboardHandler();
    }
}

// BoxMorph ////////////////////////////////////////////////////////////

// I can have an optionally rounded border

// BoxMorph inherits from Morph:

class BoxMorph extends Morph {
    // BoxMorph instance creation:
    
    constructor(edge = 4, border = null, borderColor = BLACK) {
        super();
        this.edge = edge;
        this.border = border || ((border === 0) ? 0 : 2);
        this.borderColor = borderColor;
    }

    // BoxMorph drawing:
    
    render (ctx) {
        if ((this.edge === 0) && (this.border === 0)) {
            super.render(ctx);
            return;
        }
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        this.outlinePath(
            ctx,
            Math.max(this.edge - this.border, 0),
            this.border
        );
        ctx.closePath();
        ctx.fill();
        if (this.border > 0) {
            ctx.lineWidth = this.border;
            ctx.strokeStyle = this.borderColor.toString();
            ctx.beginPath();
            this.outlinePath(ctx, this.edge, this.border / 2);
            ctx.closePath();
            ctx.stroke();
        }
    }

    outlinePath (ctx, corner, inset) {
        var w = this.width, h = this.height,
            radius = Math.min(corner, (Math.min(w, h) - inset) / 2),
            offset = radius + inset;

        // top left:
        ctx.arc(
            offset,
            offset,
            radius,
            radians(-180),
            radians(-90),
            false
        );
        // top right:
        ctx.arc(
            w - offset,
            offset,
            radius,
            radians(-90),
            radians(-0),
            false
        );
        // bottom right:
        ctx.arc(
            w - offset,
            h - offset,
            radius,
            radians(0),
            radians(90),
            false
        );
        // bottom left:
        ctx.arc(
            offset,
            h - offset,
            radius,
            radians(90),
            radians(180),
            false
        );
    }

    // BoxMorph menus:

    developersMenu () {
        var menu = super.developersMenu();
        menu.addLine();
        menu.addItem(
            "border width...",
            () => {
                this.prompt(
                    menu.title + '\nborder\nwidth:',
                    this.setBorderWidth,
                    this,
                    this.border.toString(),
                    null,
                    0,
                    100,
                    true
                );
            },
            'set the border\'s\nline size'
        );
        menu.addItem(
            "border color...",
            () => {
                this.pickColor(
                    menu.title + '\nborder color:',
                    this.setBorderColor,
                    this,
                    this.borderColor
                );
            },
            'set the border\'s\nline color'
        );
        menu.addItem(
            "corner size...",
            () => {
                this.prompt(
                    menu.title + '\ncorner\nsize:',
                    this.setCornerSize,
                    this,
                    this.edge.toString(),
                    null,
                    0,
                    100,
                    true
                );
            },
            'set the corner\'s\nradius'
        );
        return menu;
    }

    setBorderWidth (size) {
        // for context menu demo purposes
        var newSize;
        if (typeof size === 'number') {
            this.border = Math.max(size, 0);
        } else {
            newSize = parseFloat(size);
            if (!isNaN(newSize)) {
                this.border = Math.max(newSize, 0);
            }
        }
        this.changed();
    }

    setBorderColor (color) {
        // for context menu demo purposes
        if (color) {
            this.borderColor = color;
            this.changed();
        }
    }

    setCornerSize (size) {
        // for context menu demo purposes
        var newSize;
        if (typeof size === 'number') {
            this.edge = Math.max(size, 0);
        } else {
            newSize = parseFloat(size);
            if (!isNaN(newSize)) {
                this.edge = Math.max(newSize, 0);
            }
        }
        this.changed();
    }

    colorSetters () {
        // for context menu demo purposes
        return ['color', 'borderColor'];
    }

    numericalSetters () {
        // for context menu demo purposes
        var list = super.numericalSetters();
        list.push('setBorderWidth', 'setCornerSize');
        return list;
    }
}

// SpeechBubbleMorph ///////////////////////////////////////////////////

/*
    I am a comic-style speech bubble that can display either a string,
    a Morph, a Canvas or a toString() representation of anything else.
    If I am invoked using popUp() I behave like a tool tip.
*/

// SpeechBubbleMorph inherits from BoxMorph:

class SpeechBubbleMorph extends BoxMorph {
    // SpeechBubbleMorph instance creation:
    
    constructor (
        contents = '',
        color = new Color(230, 230, 230),
        edge = 6,
        border = 1,
        borderColor = new Color(140, 140, 140),
        padding = 0,
        isThought = false, // bool or anything but "true" to draw no hook at all
        noShadow = null // explicit TRUE to suppress
    ) {
        super(edge || 6, border || 1, borderColor || new Color(140, 140, 140));
        this.isPointingRight = true; // orientation of text
        this.contents = contents || '';
        this.padding = padding || 0; // additional vertical pixels
        this.isThought = isThought || false; // draw "think" bubble
        this.isClickable = false;
        this.hasShadow = noShadow !== true;
        this.noDropShadow = true;
        this.fullShadowSource = false;
        this.color = color || new Color(230, 230, 230);
        this.fixLayout();
    }

    // SpeechBubbleMorph invoking:
    
    popUp (world, pos, isClickable) {
        this.fixLayout();
        this.position = pos.subtract(new Point(0, this.height));
        this.keepWithin(world);
        world.add(this);
        this.fullChanged();
        world.hand.destroyTemporaries();
        world.hand.temporaries.push(this);

        if (!isClickable) {
            this.mouseEnter = this.destroy;
        } else {
            this.isClickable = true;
        }
    }

    // SpeechBubbleMorph drawing:
    
    fixLayout () {
        // determine my extent and arrange my contents
        if (this.contentsMorph) {
            this.contentsMorph.destroy();
        }
        if (this.contents instanceof Morph) {
            this.contentsMorph = this.contents;
        } else if (isString(this.contents)) {
            this.contentsMorph = new TextMorph(
                this.contents,
                MorphicPreferences.bubbleHelpFontSize,
                null,
                false,
                true,
                'center'
            );
        } else if (this.contents instanceof HTMLCanvasElement) {
            this.contentsMorph = new Morph();
            this.contentsMorph.extent = new Point(
                this.contents.width,
                this.contents.height
            );
            this.contentsMorph.cachedImage = this.contents;
        } else {
            this.contentsMorph = new TextMorph(
                this.contents.toString(),
                MorphicPreferences.bubbleHelpFontSize,
                null,
                false,
                true,
                'center'
            );
        }
        this.add(this.contentsMorph);

        // adjust my layout
        this.bounds.extent = new Point(
            this.contentsMorph.width +
            (this.padding ? this.padding * 2 : this.edge * 2),
            this.contentsMorph.height +
            this.edge +
            this.border * 2 +
            this.padding * 2 +
            2
        );

        // position my contents
        this.contentsMorph.position = this.position.add(
            new Point(
                this.padding || this.edge,
                this.border + this.padding + 1
            )
        );

        // refresh a shallow shadow
        if (this.hasShadow) {
            this.removeShadow();
            this.addShadow(new Point(2, 2), 80);
        }
    }

    outlinePath (ctx, radius, inset) {
        var offset = radius + inset,
            w = this.width, h = this.height,
            rad;

        function circle(x, y, r) {
            ctx.moveTo(x + r, y);
            ctx.arc(x, y, r, radians(0), radians(360));
        }

        // top left:
        ctx.arc(
            offset,
            offset,
            radius,
            radians(-180),
            radians(-90),
            false
        );
        // top right:
        ctx.arc(
            w - offset,
            offset,
            radius,
            radians(-90),
            radians(-0),
            false
        );
        // bottom right:
        ctx.arc(
            w - offset,
            h - offset - radius,
            radius,
            radians(0),
            radians(90),
            false
        );
        if (!this.isThought) { // draw speech bubble hook
            if (this.isPointingRight) {
                ctx.lineTo(
                    offset + radius,
                    h - offset
                );
                ctx.lineTo(
                    radius / 2 + inset,
                    h - inset
                );
            } else { // pointing left
                ctx.lineTo(
                    w - (radius / 2 + inset),
                    h - inset
                );
                ctx.lineTo(
                    w - (offset + radius),
                    h - offset
                );
            }
        }
        // bottom left:
        ctx.arc(
            offset,
            h - offset - radius,
            radius,
            radians(90),
            radians(180),
            false
        );
        if (this.isThought === true) { // use anything but "true" to draw nothing
            // close large bubble:
            ctx.lineTo(
                inset,
                offset
            );
            // draw thought bubbles:
            if (this.isPointingRight) {
                // tip bubble:
                rad = radius / 4;
                circle(
                    rad + inset,
                    h - rad - inset,
                    rad
                );
                // middle bubble:
                rad = radius / 3.2;
                circle(
                    (rad * 2) + inset,
                    h - rad - (inset * 2),
                    rad
                );
                // top bubble:
                rad = radius / 2.8;
                circle(
                    (rad * 3) + inset * 2,
                    h - rad - (inset * 4),
                    rad
                );
            } else { // pointing left
                // tip bubble:
                rad = radius / 4;
                circle(
                    w - (rad + inset),
                    h - rad - inset,
                    rad
                );
                // middle bubble:
                rad = radius / 3.2;
                circle(
                    w - (rad * 2 + inset),
                    h - rad - inset * 2,
                    rad
                );
                // top bubble:
                rad = radius / 2.8;
                circle(
                    w - (rad * 3 + inset * 2),
                    h - rad - inset * 4,
                    rad
                );
            }
        }
    }

    // SpeechBubbleMorph shadow
    /*
        only take the 'plain' image, so the box rounding and the
        shadow doesn't become conflicted by embedded scrolling panes
    */
    
    shadowImage (off, color) {
        // for "flat" design mode
        var fb, img, outline, sha, ctx,
            offset = off || new Point(7, 7),
            clr = color || new Color(0, 0, 0);
        fb = this.extent;
        img = this.getImage();
        outline = newCanvas(fb);
        ctx = outline.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(
            img,
            -offset.x,
            -offset.y
        );
        sha = newCanvas(fb);
        ctx = sha.getContext('2d');
        ctx.drawImage(outline, 0, 0);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = clr.toString();
        ctx.fillRect(0, 0, fb.x, fb.y);
        return sha;
    }

    shadowImageBlurred (off, color) {
        var fb, img, sha, ctx,
            offset = off || new Point(7, 7),
            blur = this.shadowBlur,
            clr = color || new Color(0, 0, 0);
        fb = this.extent.add(blur * 2);
        img = this.getImage();
        sha = newCanvas(fb);
        ctx = sha.getContext('2d');
        ctx.shadowOffsetX = offset.x;
        ctx.shadowOffsetY = offset.y;
        ctx.shadowBlur = blur;
        ctx.shadowColor = clr.toString();
        ctx.drawImage(
            img,
            blur - offset.x,
            blur - offset.y
        );
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(
            img,
            blur - offset.x,
            blur - offset.y
        );
        return sha;
    }
}

// DialMorph //////////////////////////////////////////////////////

// I am a knob than can be turned to select a number

// DialMorph inherits from Morph:

class DialMorph extends Morph {
    constructor (min, max, value, tick, radius) {
        super();
        this.target = null;
        this.action = null;
        this.min = min || 0;
        this.max = max || 360;
        this.value = Math.max(this.min, (value || 0) % this.max);
        this.tick = tick || 15;
        this.fillColor = null;

        // DialMorph stepping:
        this.step = null;

        this.color = new Color(230, 230, 230);
        this.setRadius(radius || MorphicPreferences.menuFontSize * 4);
    }

    setRadius (radius) {
        this.radius = radius;
        this.extent = new Point(this.radius * 2, this.radius * 2);
    }
    
    setValue (value, snapToTick, noUpdate) {
        var range = this.max - this.min;
        value = value || 0;
        this.value = this.min + (((+value % range) + range) % range);
        if (snapToTick) {
            if (this.value < this.tick) {
                this.value = this.min;
            } else {
                this.value -= this.value % this.tick % this.value;
            }
        }
        this.changed();
        if (noUpdate) { return; }
        this.updateTarget();
    }

    getValueOf (point) {
        var range = this.max - this.min, 
            center = this.center,
            deltaX = point.x - center.x,
            deltaY = center.y - point.y,
            angle = Math.abs(deltaX) < 0.001 ? (deltaY < 0 ? 90 : 270)
                : Math.round(
                    (deltaX >= 0 ? 0 : 180)
                    - (Math.atan(deltaY / deltaX) * 57.2957795131)
                ), value = angle + 90 % 360, ratio = value / 360;
        return range * ratio + this.min;
    }

    get extent () {
        return super.extent;
    }

    set extent (aPoint) {
        var size = Math.min(aPoint.x, aPoint.y);
        this.radius = size / 2;
        super.extent = new Point(size, size);
    }
    
    render (ctx) {
        var i, angle, x1, y1, x2, y2,
            light = this.color.lighter().toString(),
            range = this.max - this.min,
            ticks = range / this.tick,
            face = this.radius * 0.75,
            inner = face * 0.85,
            outer = face * 0.95;

        // draw a light border:
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face + Math.min(1, this.radius - face),
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();

        // fill circle:
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();

        // fill value
        angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
        ctx.fillStyle = (this.fillColor || this.color.darker()).toString();
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face,
            Math.PI / -2,
            angle,
            false
        );
        ctx.lineTo(this.radius, this.radius);
        ctx.closePath();
        ctx.fill();

        // draw ticks:
        ctx.strokeStyle = new Color(35, 35, 35).toString();
        ctx.lineWidth = 1;
        for (i = 0; i < ticks; i += 1) {
            angle = (i - 3) * (Math.PI * 2) / ticks - Math.PI / 2;
            ctx.beginPath();
            x1 = this.radius + Math.cos(angle) * inner;
            y1 = this.radius + Math.sin(angle) * inner;
            x2 = this.radius + Math.cos(angle) * outer;
            y2 = this.radius + Math.sin(angle) * outer;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // draw a filled center:
        inner = face * 0.05;
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            inner,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();

        // draw the inner hand:
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
        outer = face * 0.8;
        x1 = this.radius + Math.cos(angle) * inner;
        y1 = this.radius + Math.sin(angle) * inner;
        x2 = this.radius + Math.cos(angle) * outer;
        y2 = this.radius + Math.sin(angle) * outer;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // draw a read-out circle:
        inner = inner * 2;
        x2 = this.radius + Math.cos(angle) * (outer + inner);
        y2 = this.radius + Math.sin(angle) * (outer + inner);
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            x2,
            y2,
            inner,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.stroke();

        // draw the outer hand:
        angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
        x1 = this.radius + Math.cos(angle) * face;
        y1 = this.radius + Math.sin(angle) * face;
        x2 = this.radius + Math.cos(angle) * (this.radius - 1);
        y2 = this.radius + Math.sin(angle) * (this.radius - 1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = light;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // draw arrow tip:
        angle = radians(degrees(angle) - 4);
        x1 = this.radius + Math.cos(angle) * this.radius * 0.9;
        y1 = this.radius + Math.sin(angle) * this.radius * 0.9;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        angle = radians(degrees(angle) + 8);
        x1 = this.radius + Math.cos(angle) * this.radius * 0.9;
        y1 = this.radius + Math.sin(angle) * this.radius * 0.9;
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = light;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.fill();
    }

    mouseDownLeft (pos) {
        var world = this.root;

        this.step = () => {
            if (world.hand.mouseButton) {
                this.setValue(
                    this.getValueOf(world.hand.bounds.origin),
                    world.currentKey !== 16 // snap to tick
                );
            } else {
                this.step = null;
            }
        };
    }

    // DialMorph menu:
    
    developersMenu () {
        var menu = super.developersMenu();
        menu.addLine();
        menu.addItem(
            'set target',
            "setTarget",
            'select another morph\nwhose numerical property\nwill be ' +
            'controlled by this one'
        );
        return menu;
    }

    setTarget () {
        var choices = this.overlappedMorphs(),
            menu = new MenuMorph(this, 'choose target:');

        choices.push(this.world);
        choices.forEach(each => {
            menu.addItem(each.toString().slice(0, 50), () => {
                this.target = each;
                this.setTargetSetter();
            });
        });
        if (choices.length === 1) {
            this.target = choices[0];
            this.setTargetSetter();
        } else if (choices.length > 0) {
            menu.popUpAtHand(this.world);
        }
    }

    setTargetSetter () {
        var choices = this.target.numericalSetters(),
            menu = new MenuMorph(this, 'choose target property:');

        choices.forEach(each => {
            menu.addItem(each, () => this.action = each);
        });
        if (choices.length === 1) {
            this.action = choices[0];
        } else if (choices.length > 0) {
            menu.popUpAtHand(this.world);
        }
    }

    updateTarget () {
        if (this.action) {
            if (typeof this.action === 'function') {
                this.action.call(this.target, this.value);
            } else { // assume it's a String
                this.target[this.action](this.value);
            }
        }
    }
}

// CircleBoxMorph //////////////////////////////////////////////////////

// I can be used for sliders

// CircleBoxMorph inherits from Morph:

class CircleBoxMorph extends Morph {
    constructor(orientation = "vertical") {
        super();
        this.orientation = orientation;
        this.autoOrient = true;
        this.setExtent(new Point(20, 100));
    }

    autoOrientation () {
        if (this.height > this.width) {
            this.orientation = 'vertical';
        } else {
            this.orientation = 'horizontal';
        }
    }

    render (ctx) {
        var w = this.width,
            h = this.height,
            radius;

        if (this.autoOrient) {
            this.autoOrientation();
        }

        if (this.orientation === 'vertical') {
            radius = w / 2;
            ctx.beginPath();

            // top semi-circle
            ctx.arc(
                radius,
                radius,
                radius,
                radians(180),
                radians(0),
                false
            );

            // right line
            ctx.lineTo(
                w,
                h - radius
            );

            // bottom semi-circle
            ctx.arc(
                radius,
                h - radius,
                radius,
                radians(0),
                radians(180),
                false
            );

        } else {
            radius = h / 2;
            ctx.beginPath();

            // left semi-circle
            ctx.arc(
                radius,
                radius,
                radius,
                radians(90),
                radians(-90),
                false
            );

            // top line
            ctx.lineTo(
                w - radius,
                0
            );

            // right semi-circle
            ctx.arc(
                w - radius,
                radius,
                radius,
                radians(-90),
                radians(90),
                false
            );
        }
        ctx.closePath();
        ctx.fillStyle = this.color.toString();
        ctx.fill();
    }

    // CircleBoxMorph menu:
    
    developersMenu () {
        var menu = super.developersMenu();
        menu.addLine();
        if (this.orientation === 'vertical') {
            menu.addItem(
                "horizontal...",
                'toggleOrientation',
                'toggle the\norientation'
            );
        } else {
            menu.addItem(
                "vertical...",
                'toggleOrientation',
                'toggle the\norientation'
            );
        }
        return menu;
    }

    toggleOrientation () {
        var center = this.center;
        this.changed();
        if (this.orientation === 'vertical') {
            this.orientation = 'horizontal';
        } else {
            this.orientation = 'vertical';
        }
        this.setExtent(new Point(this.height, this.width));
        this.setCenter(center);
    }
}

// SliderButtonMorph ///////////////////////////////////////////////////

// SliderButtonMorph inherits from CircleBoxMorph:

class SliderButtonMorph extends CircleBoxMorph {
    constructor (orientation) {
        super(orientation);
        this.color = new Color(80, 80, 80);
        this.highlightColor = new Color(90, 90, 140);
        this.pressColor = new Color(80, 80, 160);
        this.userState = 'normal'; // 'highlight', 'pressed'
        this.is3D = false;
        this.hasMiddleDip = true;
    }

    render (ctx) {
        var colorBak = this.color;
        if (this.userState === 'highlight') {
            this.color = this.highlightColor;
        } else if (this.userState === 'pressed') {
            this.color = this.pressColor;
        }
        super.render(ctx);
        if (this.is3D || !MorphicPreferences.isFlat) {
            this.renderEdges(ctx);
        }
        this.color = colorBak;
    }

    renderEdges (ctx) {
        var gradient, radius,
            w = this.width,
            h = this.height;

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (this.orientation === 'vertical') {
            ctx.lineWidth = w / 3;
            gradient = ctx.createLinearGradient(
                0,
                0,
                ctx.lineWidth,
                0
            );
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, this.color.toString());

            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(ctx.lineWidth * 0.5, w / 2);
            ctx.lineTo(ctx.lineWidth * 0.5, h - w / 2);
            ctx.stroke();

            gradient = ctx.createLinearGradient(
                w - ctx.lineWidth,
                0,
                w,
                0
            );
            gradient.addColorStop(0, this.color.toString());
            gradient.addColorStop(1, 'black');

            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(w - ctx.lineWidth * 0.5, w / 2);
            ctx.lineTo(w - ctx.lineWidth * 0.5, h - w / 2);
            ctx.stroke();

            if (this.hasMiddleDip) {
                gradient = ctx.createLinearGradient(
                    ctx.lineWidth,
                    0,
                    w - ctx.lineWidth,
                    0
                );

                radius = w / 4;
                gradient.addColorStop(0, 'black');
                gradient.addColorStop(0.35, this.color.toString());
                gradient.addColorStop(0.65, this.color.toString());
                gradient.addColorStop(1, 'white');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(
                    w / 2,
                    h / 2,
                    radius,
                    radians(0),
                    radians(360),
                    false
                );
                ctx.closePath();
                ctx.fill();
            }
        } else if (this.orientation === 'horizontal') {
            ctx.lineWidth = h / 3;
            gradient = ctx.createLinearGradient(
                0,
                0,
                0,
                ctx.lineWidth
            );
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, this.color.toString());

            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(h / 2, ctx.lineWidth * 0.5);
            ctx.lineTo(w - h / 2, ctx.lineWidth * 0.5);
            ctx.stroke();

            gradient = ctx.createLinearGradient(
                0,
                h - ctx.lineWidth,
                0,
                h
            );
            gradient.addColorStop(0, this.color.toString());
            gradient.addColorStop(1, 'black');

            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(h / 2, h - ctx.lineWidth * 0.5);
            ctx.lineTo(w - h / 2, h - ctx.lineWidth * 0.5);
            ctx.stroke();

            if (this.hasMiddleDip) {
                gradient = ctx.createLinearGradient(
                    0,
                    ctx.lineWidth,
                    0,
                    h - ctx.lineWidth
                );

                radius = h / 4;
                gradient.addColorStop(0, 'black');
                gradient.addColorStop(0.35, this.color.toString());
                gradient.addColorStop(0.65, this.color.toString());
                gradient.addColorStop(1, 'white');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(
                    this.width / 2,
                    this.height / 2,
                    radius,
                    radians(0),
                    radians(360),
                    false
                );
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    //SliderButtonMorph events:
    
    mouseEnter () {
        this.userState = 'highlight';
        this.rerender();
    }

    mouseLeave () {
        this.userState = 'normal';
        this.rerender();
    }

    mouseDownLeft (pos) {
        this.userState = 'pressed';
        this.rerender();
        this.escalateEvent('mouseDownLeft', pos);
    }

    mouseClickLeft () {
        this.userState = 'highlight';
        this.rerender();
    }

    mouseMove () {
        // prevent my parent from getting picked up
        nop();
    }

    autoOrientation () {};
}

// SliderMorph ///////////////////////////////////////////////////

// SliderMorph inherits from CircleBoxMorph:

class SliderMorph extends CircleBoxMorph {
    constructor (
        start = 0 ,
        stop = 100,
        value = 0,
        size = 10,
        orientation = 'vertical',
        color
    ) {
        super(orientation);
        this.target = null;
        this.action = null;
        this.start = start;
        this.stop = stop;
        this.value = value;
        this.size = size;
        this.offset = null;
        this.button = new SliderButtonMorph();
        this.button.isDraggable = false;
        this.button.alpha = MorphicPreferences.isFlat ? 0.7 : 1;
        this.button.color = new Color(200, 200, 200);
        this.button.highlightColor = new Color(210, 210, 255);
        this.button.pressColor = new Color(180, 180, 255);
        this.add(this.button);
        this.alpha = MorphicPreferences.isFlat ? 0 : 0.3;
        this.color = color || new Color(0, 0, 0);
        this.extent = new Point(20, 100);
        this.fixLayout();
    }

    rangeSize () {
        return this.stop - this.start;
    }

    ratio () {
        return this.size / (this.rangeSize() + 1);
    }

    unitSize () {
        if (this.orientation === 'vertical') {
            return (this.height - this.button.height) /
                this.rangeSize();
        }
        return (this.width - this.button.width) /
            this.rangeSize();
    }

    fixLayout () {
        var bw, bh, posX, posY;

        if (!this.button) return;

        this.button.orientation = this.orientation;
        if (this.orientation === 'vertical') {
            bw = this.width - 2;
            bh = Math.max(bw, Math.round(this.height * this.ratio()));
            this.button.extent = new Point(bw, bh);
            posX = 1;
            posY = Math.max(
                Math.min(
                    Math.round((this.value - this.start) * this.unitSize()),
                    this.height - this.button.height
                ),
                0
            );
        } else {
            bh = this.height - 2;
            bw = Math.max(bh, Math.round(this.width * this.ratio()));
            this.button.extent = new Point(bw, bh);
            posY = 1;
            posX = Math.max(
                Math.min(
                    Math.round((this.value - this.start) * this.unitSize()),
                    this.width - this.button.width
                ),
                0
            );
        }
        this.button.position = (
            new Point(posX, posY).add(this.bounds.origin)
        );
    }
    
    updateValue () {
        var relPos;
        if (this.orientation === 'vertical') {
            relPos = this.button.top - this.top;
        } else {
            relPos = this.button.left - this.left;
        }
        this.value = Math.round(relPos / this.unitSize() + this.start);
        this.updateTarget();
    }
    
    updateTarget () {
        if (this.action) {
            if (typeof this.action === 'function') {
                this.action.call(this.target, this.value);
            } else { // assume it's a String
                this.target[this.action](this.value);
            }
        }
    }
    
    // SliderMorph menu:

    developersMenu () {
        var menu = super.developersMenu();
        menu.addItem(
            "show value...",
            'showValue',
            'display a dialog box\nshowing the selected number'
        );
        menu.addItem(
            "floor...",
            () => {
                this.prompt(
                    menu.title + '\nfloor:',
                    this.setStart,
                    this,
                    this.start.toString(),
                    null,
                    0,
                    this.stop - this.size,
                    true
                );
            },
            'set the minimum value\nwhich can be selected'
        );
        menu.addItem(
            "ceiling...",
            () => {
                this.prompt(
                    menu.title + '\nceiling:',
                    this.setStop,
                    this,
                    this.stop.toString(),
                    null,
                    this.start + this.size,
                    this.size * 100,
                    true
                );
            },
            'set the maximum value\nwhich can be selected'
        );
        menu.addItem(
            "button size...",
            () => {
                this.prompt(
                    menu.title + '\nbutton size:',
                    this.setSize,
                    this,
                    this.size.toString(),
                    null,
                    1,
                    this.stop - this.start,
                    true
                );
            },
            'set the range\ncovered by\nthe slider button'
        );
        menu.addLine();
        menu.addItem(
            'set target',
            "setTarget",
            'select another morph\nwhose numerical property\nwill be ' +
            'controlled by this one'
        );
        return menu;
    }

    showValue () {
        this.inform(this.value);
    }

    userSetStart (num) {
        // for context menu demo purposes
        this.start = Math.max(num, this.stop);
    }

    setStart (num, noUpdate) {
        // for context menu demo purposes
        var newStart;
        if (typeof num === 'number') {
            this.start = Math.min(
                num,
                this.stop - this.size
            );
        } else {
            newStart = parseFloat(num);
            if (!isNaN(newStart)) {
                this.start = Math.min(
                    newStart,
                    this.stop - this.size
                );
            }
        }
        this.value = Math.max(this.value, this.start);
        if (!noUpdate) { this.updateTarget(); }
        this.fixLayout();
        this.rerender();
    }

    setStop (num, noUpdate) {
        // for context menu demo purposes
        var newStop;
        if (typeof num === 'number') {
            this.stop = Math.max(num, this.start + this.size);
        } else {
            newStop = parseFloat(num);
            if (!isNaN(newStop)) {
                this.stop = Math.max(newStop, this.start + this.size);
            }
        }
        this.value = Math.min(this.value, this.stop);
        if (!noUpdate) { this.updateTarget(); }
        this.fixLayout();
        this.rerender();
    }

    setSize (num, noUpdate) {
        // for context menu demo purposes
        var newSize;
        if (typeof num === 'number') {
            this.size = Math.min(
                Math.max(num, 1),
                this.stop - this.start
            );
        } else {
            newSize = parseFloat(num);
            if (!isNaN(newSize)) {
                this.size = Math.min(
                    Math.max(newSize, 1),
                    this.stop - this.start
                );
            }
        }
        this.value = Math.min(this.value, this.stop - this.size);
        if (!noUpdate) { this.updateTarget(); }
        this.fixLayout();
        this.rerender();
    }

    setTarget () {
        var choices = this.overlappedMorphs(),
            menu = new MenuMorph(this, 'choose target:');

        choices.push(this.world);
        choices.forEach(each => {
            menu.addItem(each.toString().slice(0, 50), () => {
                this.target = each;
                this.setTargetSetter();
            });
        });
        if (choices.length === 1) {
            this.target = choices[0];
            this.setTargetSetter();
        } else if (choices.length > 0) {
            menu.popUpAtHand(this.world);
        }
    }

    setTargetSetter () {
        var choices = this.target.numericalSetters(),
            menu = new MenuMorph(this, 'choose target property:');

        choices.forEach(each => {
            menu.addItem(each, () => this.action = each);
        });
        if (choices.length === 1) {
            this.action = choices[0];
        } else if (choices.length > 0) {
            menu.popUpAtHand(this.world);
        }
    }

    numericalSetters () {
        // for context menu demo purposes
        var list = super.numericalSetters();
        list.push('setStart', 'setStop', 'setSize');
        return list;
    }

    mouseDownLeft (pos) {
        var world;

        if (!this.button.bounds.containsPoint(pos)) {
            this.offset = new Point(); // return null;
        } else {
            this.offset = pos.subtract(this.button.bounds.origin);
        }
        world = this.root;

        this.step = () => {
            var mousePos, newX, newY;
            if (world.hand.mouseButton) {
                mousePos = world.hand.bounds.origin;
                if (this.orientation === 'vertical') {
                    newX = this.button.bounds.origin.x;
                    newY = Math.max(
                        Math.min(
                            mousePos.y - this.offset.y,
                            this.bottom - this.button.height
                        ),
                        this.top
                    );
                } else {
                    newY = this.button.bounds.origin.y;
                    newX = Math.max(
                        Math.min(
                            mousePos.x - this.offset.x,
                            this.right - this.button.width
                        ),
                        this.left
                    );
                }
                this.button.position = new Point(newX, newY);
                this.updateValue();
            } else {
                this.step = null;
            }
        };
    }

    autoOrientation = nop;
}

// SliderMorph stepping:

SliderMorph.prototype.step = null;

// MouseSensorMorph ////////////////////////////////////////////////////

// for demo and debuggin purposes only, to be removed later

// MouseSensorMorph inherits from BoxMorph:

class MouseSensorMorph extends BoxMorph {
    // MouseSensorMorph instance creation:

    constructor(edge, border, borderColor) {
        super();
        this.edge = edge || 4;
        this.border = border || 2;
        this.color = WHITE;
        this.borderColor = borderColor || BLACK;
        this.isTouched = false;
        this.upStep = 0.05;
        this.downStep = 0.02;
    }

    touch () {
        if (!this.isTouched) {
            this.isTouched = true;
            this.alpha = 0.6;

            this.step = () => {
                if (this.isTouched) {
                    if (this.alpha < 1) {
                        this.alpha += this.upStep;
                    }
                } else if (this.alpha > this.downStep) {
                    this.alpha -= this.downStep;
                } else {
                    this.alpha = 0;
                    this.step = null;
                }
                this.changed();
            };
        }
    }

    unTouch () {
        this.isTouched = false;
    }
    
    mouseEnter () {
        this.touch();
    }

    mouseLeave () {
        this.unTouch();
    }

    mouseDownLeft () {
        this.touch();
    }

    mouseClickLeft () {
        this.unTouch();
    }
}

// InspectorMorph //////////////////////////////////////////////////////

// InspectorMorph inherits from BoxMorph:

class InspectorMorph extends BoxMorph {
    // InspectorMorph instance creation:
    
    constructor (target) {
        // initialize inherited properties:
        super();

        // additional properties:
        this.target = target;
        this.currentProperty = null;
        this.showing = 'attributes';
        this.markOwnProperties = false;
        this.markGettersOrSetters = false;
        this.hasUserEditedDetails = false;

        // override inherited properties:
        this.isDraggable = true;
        this.border = 1;
        this.edge = MorphicPreferences.isFlat ? 1 : 5;
        this.color = new Color(60, 60, 60);
        this.borderColor = new Color(95, 95, 95);
        this.fps = 25;

        // panes:
        this.label = null;
        this.list = null;
        this.detail = null;
        this.work = null;
        this.buttonInspect = null;
        this.buttonClose = null;
        this.buttonSubset = null;
        this.buttonEdit = null;
        this.resizer = null;

        if (this.target) {
            this.buildPanes();
        }

        this.extent = new Point(
            MorphicPreferences.handleSize * 20,
            MorphicPreferences.handleSize * 20 * 2 / 3
        );
    }

    setTarget (target) {
        this.target = target;
        this.currentProperty = null;
        this.buildPanes();
    }

    updateCurrentSelection () {
        var val, txt, cnts,
            sel = this.list.selected,
            currentTxt = this.detail.contents.children[0],
            root = this.root;

        if (root &&
            (root.keyboardFocus instanceof CursorMorph) &&
            (root.keyboardFocus.target === currentTxt)) {
            this.hasUserEditedDetails = true;
            return;
        }
        if (isNil(sel) || this.hasUserEditedDetails) { return; }
        val = this.target[sel];
        this.currentProperty = val;
        if (isNil(val)) {
            txt = 'NULL';
        } else if (isString(val)) {
            txt = val;
        } else {
            if (val instanceof Function) {
                txt = this.functionOf(val.toString());
            } else {
                txt = val.toString();
            }
        }
        if (currentTxt.text === txt) { return; }
        cnts = new TextMorph(txt);
        cnts.isEditable = true;
        cnts.enableSelecting();
        cnts.setReceiver(this.target);
        this.detail.setContents(cnts);
    }

    getPropertiesOf (anObject) {
        var props = [];
        for (const prop in this.target) {
            if (prop) {
                props.push(prop);
            }
        }
        var proto = anObject;
        while (Reflect.getPrototypeOf(proto)) {
            proto = Reflect.getPrototypeOf(proto);
            props = props.concat(Array.from(Reflect.ownKeys(proto).map(v=>v.toString())).filter(v => props.indexOf(v) === -1));
        }
        return props.filter(v => !v.startsWith("_"));
    }

    functionOf (thing) {
        var oldThing = [];
        oldThing.push("function " + thing.substring(thing.indexOf(" ") + 1, thing.indexOf("\n")));
        var real = thing.split("\n");
        for (let i = 1; i < real.length; i++) {
            const element = real[i];
            if (element.substring(0, 4) === "    ") {
                oldThing.push(element.substring(4, element.length));
            } else {
                oldThing.push(element);
            }
        }
        var result = oldThing.join("\n");
        if (result.startsWith("function function") || thing.startsWith("class")) {
            return thing;
        }
        return result
    }

    descriptorsOf (anObject) {
        var result = new Map(), proto = anObject, descriptors;
        descriptors = Object.getOwnPropertyDescriptors(proto);
        for (const descriptor in descriptors) {
            result.set(descriptor, descriptors[descriptor]);
        }
        while (Reflect.getPrototypeOf(proto)) {
            proto = Reflect.getPrototypeOf(proto);
            descriptors = Object.getOwnPropertyDescriptors(proto);
            for (const descriptor in descriptors) {
                result.set(descriptor, descriptors[descriptor]);
            }
        }
        return result;
    }

    buildPanes () {
        var attribs = [], ctrl, ev, doubleClickAction, descriptors;

        // remove existing panes
        this.children.forEach((m) => {
            if (m !== this.work) { // keep work pane around
                m.destroy();
            }
        });
        this.children = [];

        // label
        this.label = new TextMorph(this.target.toString());
        this.label.fontSize = MorphicPreferences.menuFontSize;
        this.label.isBold = true;
        this.label.color = WHITE;
        this.add(this.label);

        // properties list

        attribs = (this.getPropertiesOf(this.target));
        descriptors = this.descriptorsOf(this.target);

        if (this.showing === 'attributes') {
            attribs = attribs.filter(
                prop => typeof this.target[prop] !== 'function'
            );
        } else if (this.showing === 'methods') {
            attribs = attribs.filter(
                prop => typeof this.target[prop] === 'function'
            );
        } // otherwise show all properties

        doubleClickAction = () => {
            var world, inspector;
            if (!isObject(this.currentProperty)) { return; }
            world = this.world;
            inspector = new InspectorMorph(
                this.currentProperty
            );
            inspector.position = world.hand.position;
            inspector.keepWithin(world);
            world.add(inspector);
            inspector.changed();
        };

        var format = [];
        if (this.markGettersOrSetters) {
            format.push([
                new Color(245, 165, 0),
                element => {
                    return descriptors.get(element.toString()).set && !descriptors.get(element.toString()).get
                }
            ], [
                new Color(0, 82, 173),
                element => {
                    return descriptors.get(element.toString()).get && !descriptors.get(element.toString()).set
                }
            ], [
                new Color(12, 245, 0).darker(15),
                element => {
                    return descriptors.get(element.toString()).set && descriptors.get(element.toString()).get
                }
            ])
        }
        if (this.markOwnProperties) {
            format.push([
                new Color(0, 0, 180),
                element => {
                    return Object.prototype.hasOwnProperty.call(
                        this.target,
                        element
                    );
                }
            ]);
        }

        this.list = new ListMorph(
            this.target instanceof Array ? attribs : attribs.sort(),
            null,
            format.length > 0 ? format : null,
            doubleClickAction
        );

        this.list.action = () => {
            this.hasUserEditedDetails = false;
            this.updateCurrentSelection();
        };

        this.list.hBar.alpha = 0.6;
        this.list.vBar.alpha = 0.6;
        this.list.contents.step = null;
        this.add(this.list);

        // details pane
        this.detail = new ScrollFrameMorph();
        this.detail.acceptsDrops = false;
        this.detail.contents.acceptsDrops = false;
        this.detail.isTextLineWrapping = true;
        this.detail.color = WHITE;
        this.detail.hBar.alpha = 0.6;
        this.detail.vBar.alpha = 0.6;
        ctrl = new TextMorph('');
        ctrl.isEditable = true;
        ctrl.enableSelecting();
        ctrl.setReceiver(this.target);
        this.detail.setContents(ctrl);
        this.add(this.detail);

        // work ('evaluation') pane
        // don't refresh the work pane if it already exists
        if (this.work === null) {
            this.work = new ScrollFrameMorph();
            this.work.acceptsDrops = false;
            this.work.contents.acceptsDrops = false;
            this.work.isTextLineWrapping = true;
            this.work.color = WHITE;
            this.work.hBar.alpha = 0.6;
            this.work.vBar.alpha = 0.6;
            ev = new TextMorph('');
            ev.isEditable = true;
            ev.enableSelecting();
            ev.setReceiver(this.target);
            this.work.setContents(ev);
        }
        this.add(this.work);

        // properties button
        this.buttonSubset = new TriggerMorph();
        this.buttonSubset.labelString = 'show...';
        this.buttonSubset.createLabel();
        this.buttonSubset.action = () => {
            var menu;
            menu = new MenuMorph();
            menu.addItem(
                'attributes',
                () => {
                    this.showing = 'attributes';
                    this.buildPanes();
                }
            );
            menu.addItem(
                'methods',
                () => {
                    this.showing = 'methods';
                    this.buildPanes();
                }
            );
            menu.addItem(
                'all',
                () => {
                    this.showing = 'all';
                    this.buildPanes();
                }
            );
            menu.addLine();
            menu.addItem(
                (this.markOwnProperties ?
                    'un-mark own' : 'mark own'),
                () => {
                    this.markOwnProperties = !this.markOwnProperties;
                    this.buildPanes();
                },
                'highlight\n\'own\' properties'
            );
            menu.addItem(
                (this.markGettersOrSetters ? 
                    'un-mark getters & setters' : 'mark getters & setters'),
                () => {
                    this.markGettersOrSetters = !this.markGettersOrSetters;
                    this.buildPanes();
                },
                'highlight\n\'getters\' and \'setters\'\n' +
                'green: getter and setter\n' +
                'blue: getter\ngold: setter'
            );
            menu.popUpAtHand(this.world);
        };

        this.add(this.buttonSubset);

        // inspect button
        this.buttonInspect = new TriggerMorph();
        this.buttonInspect.labelString = 'inspect...';
        this.buttonInspect.createLabel();
        this.buttonInspect.action = () => {
            var menu, world, inspector;
            if (isObject(this.currentProperty)) {
                menu = new MenuMorph();
                menu.addItem(
                    'in new inspector...',
                    () => {
                        world = this.world;
                        inspector = new InspectorMorph(
                            this.currentProperty
                        );
                        inspector.position = world.hand.position;
                        inspector.keepWithin(world);
                        world.add(inspector);
                        inspector.changed();
                    }
                );
                menu.addItem(
                    'here...',
                    () => this.setTarget(this.currentProperty)
                );
                menu.popUpAtHand(this.world);
            } else {
                this.inform(
                    (this.currentProperty === null ?
                        'null' : typeof this.currentProperty) +
                    '\nis not inspectable'
                );
            }
        };
        this.add(this.buttonInspect);

        // edit button
        this.buttonEdit = new TriggerMorph();
        this.buttonEdit.labelString = 'edit...';
        this.buttonEdit.createLabel();
        this.buttonEdit.action = () => {
            var menu = new MenuMorph(this);
            menu.addItem("save", 'save', 'accept changes');
            menu.addLine();
            menu.addItem("add property...", 'addProperty');
            menu.addItem("rename...", 'renameProperty');
            menu.addItem("remove...", 'removeProperty');
            menu.popUpAtHand(this.world);
        };
        this.add(this.buttonEdit);

        // close button
        this.buttonClose = new TriggerMorph();
        this.buttonClose.labelString = 'close';
        this.buttonClose.createLabel();
        this.buttonClose.action = () => this.destroy();
        this.add(this.buttonClose);

        // resizer
        this.resizer = new HandleMorph(
            this,
            150,
            100,
            this.edge,
            this.edge
        );

        // update layout
        this.fixLayout();
    }

    fixLayout () {
        var x, y, r, b, w, h;

        // label
        x = this.left + this.edge;
        y = this.top + this.edge;
        r = this.right - this.edge;
        w = r - x;
        this.label.position = new Point(x, y);
        this.label.width = w;
        if (this.label.height > (this.height - 50)) {
            this.bounds.height = (this.label.height + 50);
        }

        // list
        y = this.label.bottom + 2;
        w = Math.min(
            Math.floor(this.width / 3),
            this.list.listContents.width
        );

        w -= this.edge;
        b = this.bottom - (2 * this.edge) -
            MorphicPreferences.handleSize;
        h = b - y;
        this.list.position = new Point(x, y);
        this.list.extent = new Point(w, h);

        // detail
        x = this.list.right + this.edge;
        r = this.right - this.edge;
        w = r - x;
        this.detail.position = new Point(x, y);
        this.detail.extent = new Point(w, (h * 2 / 3) - this.edge);

        // work
        y = this.detail.bottom + this.edge;
        this.work.position = new Point(x, y);
        this.work.extent = new Point(w, h / 3);

        // properties button
        x = this.list.left;
        y = this.list.bottom + this.edge;
        w = this.list.width;
        h = MorphicPreferences.handleSize;
        this.buttonSubset.position = new Point(x, y);
        this.buttonSubset.extent = new Point(w, h);

        // inspect button
        x = this.detail.left;
        w = this.detail.width - this.edge -
            MorphicPreferences.handleSize;
        w = w / 3 - this.edge / 3;
        this.buttonInspect.position = new Point(x, y);
        this.buttonInspect.extent = new Point(w, h);

        // edit button
        x = this.buttonInspect.right + this.edge;
        this.buttonEdit.position = new Point(x, y);
        this.buttonEdit.extent = new Point(w, h);

        // close button
        x = this.buttonEdit.right + this.edge;
        r = this.detail.right - this.edge -
            MorphicPreferences.handleSize;
        w = r - x;
        this.buttonClose.position = new Point(x, y);
        this.buttonClose.extent = new Point(w, h);

        // resizer
        this.resizer.fixLayout();
    }

    // InspectorMorph editing ops:

    save () {
        var txt = this.detail.contents.children[0].text.toString(),
            prop = this.list.selected;
        try {
            this.target.evaluateString('this.' + prop + ' = ' + txt);
            this.hasUserEditedDetails = false;
            this.target.changed();
        } catch (err) {
            this.inform(err);
        }
    }

    addProperty () {
        this.prompt(
            'new property name:',
            prop => {
                if (prop) {
                    this.target[prop] = null;
                    this.buildPanes();
                    this.target.changed();
                }
            },
            this,
            'property'
        );
    }

    renameProperty () {
        var propertyName = this.list.selected;
        this.prompt(
            'property name:',
            prop => {
                try {
                    delete (this.target[propertyName]);
                    this.target[prop] = this.currentProperty;
                } catch (err) {
                    this.inform(err);
                }
                this.buildPanes();
                this.target.changed();
            },
            this,
            propertyName
        );
    }

    removeProperty () {
        var prop = this.list.selected;
        try {
            delete (this.target[prop]);
            this.currentProperty = null;
            this.buildPanes();
            this.target.changed();
        } catch (err) {
            this.inform(err);
        }
    }

    // InspectorMorph stepping

    step () {
        this.updateCurrentSelection();
        var lbl = this.target.toString();
        if (this.label.text === lbl) { return; }
        this.label.text = lbl;
        this.fixLayout();
    }

    // InspectorMorph duplicating:

    updateReferences (map) {
        var active = this.list.activeIndex();
        super.updateReferences(map);
        this.buildPanes();
        this.list.activateIndex(active);
    }
}

// MenuMorph ///////////////////////////////////////////////////////////

// MenuMorph inherits from BoxMorph:

class MenuMorph extends BoxMorph {
    // MenuMorph instance creation:
    
    constructor (target, title, environment, fontSize) {
        /*
        if target is a function, use it as callback:
        execute target as callback function with the action property
        of the triggered MenuItem as argument.
        Use the environment, if it is specified.
        Note: if action is also a function, instead of becoming
        the argument itself it will be called to answer the argument.
        For selections, Yes/No Choices etc.
    
        else (if target is not a function):
    
            if action is a function:
            execute the action with target as environment (can be null)
            for lambdafied (inline) actions
    
            else if action is a String:
            treat it as function property of target and execute it
            for selector-like actions
        */

        // initialize inherited properties:
        super();

        // additional properties:
        this.target = target;
        this.title = title || null;
        this.environment = environment || null;
        this.fontSize = fontSize || null;
        this.items = [];
        this.label = null;
        this.isListContents = false;
        this.hasFocus = false;
        this.selection = null;
        this.submenu = null;

        // override inherited properties:
        this.isDraggable = false;
        this.noDropShadow = true;
        this.fullShadowSource = false;

        // immutable properties:
        this.border = null;
        this.edge = null;
    }

    addItem (
        labelString,
        action,
        hint,
        color,
        bold,
        italic,
        doubleClickAction,
        shortcut,
        verbatim // optional bool, don't translate if true
    ) {
        /*
        labelString is normally a single-line string. But it can also be one
        of the following:
    
            * a multi-line string (containing line breaks)
            * an icon (either a Morph or a Canvas)
            * a tuple of format: [icon, string]
        */
        this.items.push([
            verbatim ? labelString || 'close' : localize(labelString || 'close'),
            action === 0 ? 0 : action || nop,
            hint,
            color,
            bold || false,
            italic || false,
            doubleClickAction,
            shortcut,
            verbatim
        ]);
    }

    addMenu (label, aMenu, indicator, verbatim) {
        this.addPair(
            label,
            aMenu,
            isNil(indicator) ? '\u25ba' : indicator,
            null,
            verbatim // don't translate
        );
    }

    addPair (
        label,
        action,
        shortcut,
        hint,
        verbatim // don't translate
    ) {
        this.addItem(
            label,
            action,
            hint,
            null,
            null,
            null,
            null,
            shortcut,
            verbatim
        );
    }

    addLine (width) {
        this.items.push([0, width || 1]);
    }

    createLabel () {
        var text;
        if (this.label !== null) {
            this.label.destroy();
        }
        text = new TextMorph(
            localize(this.title),
            this.fontSize || MorphicPreferences.menuFontSize,
            MorphicPreferences.menuFontName,
            true,
            false,
            'center'
        );
        text.alignment = 'center';
        text.color = WHITE;
        text.backgroundColor = this.borderColor;
        text.fixLayout();
        this.label = new BoxMorph(3, 0);
        if (MorphicPreferences.isFlat) {
            this.label.edge = 0;
        }
        this.label.color = this.borderColor;
        this.label.borderColor = this.borderColor;
        this.label.extent = text.extent.add(4);
        this.label.add(text);
        this.label.text = text;
    }

    createItems () {
        var item, fb, x, y, isLine = false;

        this.children.forEach(m => m.destroy());
        this.children = [];
        if (!this.isListContents) {
            this.edge = MorphicPreferences.isFlat ? 0 : 5;
            this.border = MorphicPreferences.isFlat ? 1 : 2;
        }
        this.color = WHITE;
        this.borderColor = new Color(60, 60, 60);
        this.extent = new Point(0, 0);

        y = 2;
        x = this.left + 4;
        if (!this.isListContents) {
            if (this.title) {
                this.createLabel();
                this.label.position = this.bounds.origin.add(4);
                this.add(this.label);
                y = this.label.bottom;
            } else {
                y = this.top + 4;
            }
        }
        y += 1;
        this.items.forEach(tuple => {
            isLine = false;
            if (tuple instanceof StringFieldMorph ||
                tuple instanceof ColorPickerMorph ||
                tuple instanceof SliderMorph ||
                tuple instanceof DialMorph) {
                item = tuple;
            } else if (tuple[0] === 0) {
                isLine = true;
                item = new Morph();
                item.color = this.borderColor;
                item.height = tuple[1];
            } else {
                item = new MenuItemMorph(
                    this.target,
                    tuple[1],
                    tuple[0],
                    this.fontSize || MorphicPreferences.menuFontSize,
                    MorphicPreferences.menuFontName,
                    this.environment,
                    tuple[2],
                    tuple[3],
                    tuple[4],
                    tuple[5],
                    tuple[6],
                    tuple[7] // shortcut
                );
            }
            if (isLine) {
                y += 1;
            }
            item.position = new Point(x, y);
            this.add(item);
            y = y + item.height;
            if (isLine) {
                y += 1;
            }
        });

        fb = this.fullBounds();
        this.extent = fb.extent.add(4);
        this.adjustWidths();
    }

    maxWidth () {
        var w = 0;

        if (this.parent instanceof FrameMorph) {
            if (this.parent.scrollFrame instanceof ScrollFrameMorph) {
                w = this.parent.scrollFrame.width;
            }
        }
        this.children.forEach(item => {
            if (item instanceof MenuItemMorph) {
                w = Math.max(
                    w,
                    item.label.width + 8 +
                    (item.shortcut ? item.shortcut.width + 4 : 0)
                );
            } else if ((item instanceof StringFieldMorph) ||
                (item instanceof ColorPickerMorph) ||
                (item instanceof SliderMorph) ||
                (item instanceof DialMorph)) {
                w = Math.max(w, item.width);
            }
        });
        if (this.label) {
            w = Math.max(w, this.label.width);
        }
        return w;
    }

    adjustWidths () {
        var w = this.maxWidth();
        this.children.forEach(item => {
            if (!(item instanceof DialMorph)) {
                item.setWidth(w);
            }
            item.fixLayout();
            if (item === this.label) {
                item.text.setPosition(
                    item.center.subtract(
                        item.text.extent.floorDivideBy(2)
                    )
                );
            }
        });
    }

    unselectAllItems () {
        this.children.forEach(item => {
            if (item instanceof MenuItemMorph) {
                if (item.userState !== 'normal') {
                    item.userState = 'normal';
                    item.rerender();
                }
            } else if (item instanceof ScrollFrameMorph) {
                item.contents.children.forEach(morph => {
                    if (morph instanceof MenuItemMorph &&
                        morph.userState !== 'normal') {
                        morph.userState = 'normal';
                        morph.rerender();
                    }
                });
            }
        });
    }

    // MenuMorph popping up
    
    popup (world, pos) {
        var scroller;

        this.createItems();
        this.position = pos;
        this.addShadow(new Point(2, 2), 80);
        this.keepWithin(world);

        if (this.bottom > world.bottom) {
            // scroll menu items if the menu is taller than the world
            this.removeShadow();
            scroller = this.scroll();
            this.bounds.corner.y = world.bottom - 2;
            this.addShadow(new Point(2, 2), 80);
            scroller.height = (world.bottom - scroller.top - 6);
            scroller.adjustScrollBars(); // ?
        }

        if (world.activeMenu) {
            world.activeMenu.destroy();
        }
        if (this.items.length < 1 && !this.title) { // don't show empty menus
            return;
        }
        world.add(this);
        world.activeMenu = this;
        this.fullChanged();
    }

    scroll () {
        // private - move all items into a scroll frame
        var scroller = new ScrollFrameMorph(), start = this.label ? 1 : 0, first = this.children[start];

        scroller.position = first.position();
        this.children.slice(start).forEach(morph => scroller.addContents(morph));
        this.add(scroller);
        scroller.width = first.width;
        return scroller;
    }

    popUpAtHand (world) {
        var wrrld = world || this.world;
        this.popup(wrrld, wrrld.hand.position);
    }

    popUpCenteredAtHand (world) {
        var wrrld = world || this.world;
        this.fixLayout();
        this.createItems();
        this.popup(
            wrrld,
            wrrld.hand.position.subtract(
                this.extent.floorDivideBy(2)
            )
        );
    }

    popUpCenteredInWorld (world) {
        var wrrld = world || this.world;
        this.fixLayout();
        this.createItems();
        this.popup(
            wrrld,
            wrrld.center.subtract(
                this.extent.floorDivideBy(2)
            )
        );
    }

    // MenuMorph submenus
    
    closeRootMenu () {
        if (this.parent instanceof MenuMorph) {
            this.parent.closeRootMenu();
        } else {
            this.destroy();
        }
    }

    closeSubmenu () {
        if (this.submenu) {
            this.submenu.destroy();
            this.submenu = null;
            this.unselectAllItems();
            this.world.activeMenu = this;
        }
    }

    // MenuMorph keyboard accessibility
    
    getFocus () {
        this.world.keyboardFocus = this;
        this.selection = null;
        this.selectFirst();
        this.hasFocus = true;
    }

    processKeyDown (event) {
        // console.log(event.keyCode);
        switch (event.keyCode) {
            case 13: // 'enter'
            case 32: // 'space'
                if (this.selection) {
                    this.selection.mouseClickLeft();
                    if (this.submenu) {
                        this.submenu.getFocus();
                    }
                }
                return;
            case 27: // 'esc'
                return this.destroy();
            case 37: // 'left arrow'
                return this.leaveSubmenu();
            case 38: // 'up arrow'
                return this.selectUp();
            case 39: // 'right arrow'
                return this.enterSubmenu();
            case 40: // 'down arrow'
                return this.selectDown();
            default:
                nop();
        }
    }

    processKeyUp (event) {
        nop(event);
    }

    processKeyPress (event) {
        nop(event);
    }

    selectFirst () {
        var scroller, items, i;

        scroller = detect(
            this.children,
            morph => morph instanceof ScrollFrameMorph
        );
        items = scroller ? scroller.contents.children : this.children;
        for (i = 0; i < items.length; i += 1) {
            if (items[i] instanceof MenuItemMorph) {
                this.select(items[i]);
                return;
            }
        }
    }

    selectUp () {
        var scroller, triggers, idx;

        scroller = detect(
            this.children,
            morph => morph instanceof ScrollFrameMorph
        );
        triggers = (scroller ? scroller.contents.children : this.children).filter(
            each => each instanceof MenuItemMorph
        );
        if (!this.selection) {
            if (triggers.length) {
                this.select(triggers[0]);
            }
            return;
        }
        idx = triggers.indexOf(this.selection) - 1;
        if (idx < 0) {
            idx = triggers.length - 1;
        }
        this.select(triggers[idx]);
    }

    selectDown () {
        var scroller, triggers, idx;

        scroller = detect(
            this.children,
            morph => morph instanceof ScrollFrameMorph
        );
        triggers = (scroller ? scroller.contents.children : this.children).filter(
            each => each instanceof MenuItemMorph
        );
        if (!this.selection) {
            if (triggers.length) {
                this.select(triggers[0]);
            }
            return;
        }
        idx = triggers.indexOf(this.selection) + 1;
        if (idx >= triggers.length) {
            idx = 0;
        }
        this.select(triggers[idx]);
    }

    enterSubmenu () {
        if (this.selection && this.selection.action instanceof MenuMorph) {
            this.selection.popUpSubmenu();
            if (this.submenu) {
                this.submenu.getFocus();
            }
        }
    }

    leaveSubmenu () {
        var menu = this.parent;
        if (this.parent instanceof MenuMorph) {
            menu.submenu = null;
            menu.hasFocus = true;
            this.destroy();
            menu.world.keyboardFocus = menu;
            menu.world.activeMenu = menu;
        }
    }

    select (aMenuItem) {
        this.unselectAllItems();
        aMenuItem.userState = 'highlight';
        aMenuItem.rerender();
        aMenuItem.scrollIntoView();
        this.selection = aMenuItem;
    }

    destroy () {
        if (this.hasFocus) {
            this.world.keyboardFocus = null;
        }
        if (!this.isListContents && (this.world.activeMenu === this)) {
            this.world.activeMenu = null;
        }
        super.destroy();
    }
};

// StringMorph /////////////////////////////////////////////////////////

// I am a single line of text

// StringMorph inherits from Morph:

class StringMorph extends Morph {
    // StringMorph shared properties:
    
    // context for measuring text dimensions, used by StringMorphs and TextMorphs
    measureCtx = newCanvas().getContext("2d");

    // StringMorph instance creation:
    
    constructor (
        text,
        fontSize,
        fontStyle,
        bold,
        italic,
        isNumeric,
        shadowOffset,
        shadowColor,
        color,
        fontName
    ) {
        // initialize inherited properties:
        super();
        
        // additional properties:
        this.text = text || ((text === '') ? '' : 'StringMorph');
        this.fontSize = fontSize || 12;
        this.fontName = fontName || MorphicPreferences.globalFontFamily;
        this.fontStyle = fontStyle || 'sans-serif';
        this.isBold = bold || false;
        this.isItalic = italic || false;
        this.isEditable = false;
        this.enableLinks = false; // set to "true" if I can contain clickable URLs
        this.isNumeric = isNumeric || false;
        this.isPassword = false;
        this.shadowOffset = shadowOffset || ZERO;
        this.shadowColor = shadowColor || null;
        this.isShowingBlanks = false;
        this.blanksColor = new Color(180, 140, 140);

        // additional properties for text-editing:
        this.isScrollable = true; // scrolls into view when edited
        this.currentlySelecting = false;
        this.startMark = 0;
        this.endMark = 0;
        this.markedTextColor = WHITE;
        this.markedBackgoundColor = new Color(60, 60, 120);


        // override inherited properites:
        this.color = color || new Color(0, 0, 0);
        this.fixLayout(); // determine my extent
    }

    toString () {
        // e.g. 'a StringMorph("Hello World")'
        return 'a ' +
            (this.constructor.name ||
                this.constructor.toString().split(' ')[1].split('(')[0]) +
            '("' + this.text.slice(0, 30) + '...")';
    }

    password (letter, length) {
        var ans = '', i;
        for (i = 0; i < length; i += 1) {
            ans += letter;
        }
        return ans;
    }

    font () {
        // answer a font string, e.g. 'bold italic 12px sans-serif'
        var font = '';
        if (this.isBold) {
            font = font + 'bold ';
        }
        if (this.isItalic) {
            font = font + 'italic ';
        }
        return font +
            this.fontSize + 'px ' +
            (this.fontName ? this.fontName + ', ' : '') +
            this.fontStyle;
    }

    getShadowRenderColor () {
        // answer the shadow rendering color, can be overridden for my children
        return this.shadowColor;
    }

    fixLayout (justMe) {
        // determine my extent depending on my current settings
        var width, shadowOffset = this.shadowOffset || ZERO, txt = this.isPassword ?
            this.password('*', this.text.length) : this.text;

        this.measureCtx.font = this.font();
        width = Math.max(
            this.measureCtx.measureText(txt).width + Math.abs(shadowOffset.x),
            1
        );
        this.bounds.corner = this.bounds.origin.add(
            new Point(
                width,
                fontHeight(this.fontSize) + Math.abs(shadowOffset.y)
            )
        );

        // notify my parent of layout change
        if (!justMe && this.parent) {
            if (this.parent.fixLayout) {
                this.parent.fixLayout();
            }
        }
    }

    render (ctx) {
        var start, stop, i, p, 
            c, x, y,
            shadowOffset = this.shadowOffset || ZERO,
            shadowColor = this.getShadowRenderColor(),
            txt = this.isPassword ?
                this.password('*', this.text.length) : this.text;

        // prepare context for drawing text
        ctx.font = this.font();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        // first draw the shadow, if any
        if (shadowColor) {
            x = Math.max(shadowOffset.x, 0);
            y = Math.max(shadowOffset.y, 0);
            ctx.fillStyle = shadowColor.toString();
            ctx.fillText(txt, x, fontHeight(this.fontSize) + y);
        }

        // now draw the actual text
        x = Math.abs(Math.min(shadowOffset.x, 0));
        y = Math.abs(Math.min(shadowOffset.y, 0));
        ctx.fillStyle = this.getRenderColor().toString();

        if (this.isShowingBlanks) {
            this.renderWithBlanks(
                ctx,
                x,
                fontHeight(this.fontSize) + y
            );
        } else {
            ctx.fillText(
                txt,
                x,
                fontHeight(this.fontSize) + y
            );
        }

        // draw the selection
        start = Math.min(this.startMark, this.endMark);
        stop = Math.max(this.startMark, this.endMark);
        for (i = start; i < stop; i += 1) {
            p = this.slotPosition(i).subtract(this.position);
            c = txt.charAt(i);
            ctx.fillStyle = this.markedBackgoundColor.toString();
            ctx.fillRect(p.x, p.y, ctx.measureText(c).width + 1 + x,
                fontHeight(this.fontSize) + y);
            ctx.fillStyle = this.markedTextColor.toString();
            ctx.fillText(c, p.x, fontHeight(this.fontSize) + p.y);
        }
    }

    renderWithBlanks (ctx, startX, y) {
        var space = ctx.measureText(' ').width,
            blanksColor = this.blanksColor.toString(),
            top = y - this.height / 2,
            words = this.text.split(' '), x = startX || 0,
            isFirst = true;

        function drawBlank() {
            ctx.fillStyle = blanksColor;
            ctx.beginPath();
            ctx.arc(
                x + space / 2,
                top,
                space / 2,
                radians(0),
                radians(360)
            );
            ctx.fill();
            x += space;
        }

        // render my text inserting blanks
        words.forEach(word => {
            if (!isFirst) {
                drawBlank();
            }
            isFirst = false;
            if (word !== '') {
                ctx.fillStyle = this.getRenderColor().toString();
                ctx.fillText(word, x, y);
                x += ctx.measureText(word).width;
            }
        });
    }

    // StringMorph measuring:
    
    slotPosition (slot) {
        // answer the position point of the given index ("slot")
        // where the cursor should be placed
        var txt = this.isPassword ?
            this.password('*', this.text.length) : this.text, dest = Math.min(Math.max(slot, 0), txt.length);

        this.measureCtx.font = this.font();
        this.pos = dest;
        return new Point(
            this.left + this.measureCtx.measureText(txt.slice(0, dest)).width,
            this.top
        );
    }

    slotAt (aPoint) {
        // answer the slot (index) closest to the given point taking
        // in account how far from the middle of the character it is,
        // so the cursor can be moved accordingly
        var txt = this.isPassword ?
            this.password('*', this.text.length) : this.text,
            idx = 0, charX = 0;

        this.measureCtx.font = this.font();
        while (aPoint.x - this.left > charX) {
            charX += this.measureCtx.measureText(txt[idx]).width;
            idx += 1;
            if (idx === txt.length) {
                if ((this.measureCtx.measureText(txt).width -
                    (this.measureCtx.measureText(txt[idx - 1]).width / 2)) <
                    (aPoint.x - this.left)) {
                    return idx;
                }
            }
        }

        // see where our click fell with respect to the middle of the char
        if (aPoint.x - this.left >
            charX - this.measureCtx.measureText(txt[idx - 1]).width / 2) {
            return idx;
        } else {
            return idx - 1;
        }
    }

    upFrom (slot) {
        // answer the slot above the given one
        return slot;
    }

    downFrom (slot) {
        // answer the slot below the given one
        return slot;
    }

    startOfLine () {
        // answer the first slot (index) of the line for the given slot
        return 0;
    }

    endOfLine () {
        // answer the slot (index) indicating the EOL for the given slot
        return this.text.length;
    }

    previousWordFrom (aSlot) {
        // answer the slot (index) slots indicating the position of the
        // previous word to the left of aSlot
        var index = aSlot - 1;

        // while the current character is non-word one, we skip it, so that
        // if we are in the middle of a non-alphanumeric sequence, we'll get
        // right to the beginning of the previous word
        while (index > 0 && !isWordChar(this.text[index])) {
            index -= 1;
        }

        // while the current character is a word one, we skip it until we
        // find the beginning of the current word
        while (index > 0 && isWordChar(this.text[index - 1])) {
            index -= 1;
        }

        return index;
    }

    nextWordFrom (aSlot) {
        var index = aSlot;

        while (index < this.endOfLine() && !isWordChar(this.text[index])) {
            index += 1;
        }

        while (index < this.endOfLine() && isWordChar(this.text[index])) {
            index += 1;
        }

        return index;
    }

    rawHeight () {
        // answer my corrected fontSize
        return this.height / 1.2;
    }
    
    // StringMorph menus:
    
    developersMenu () {
        var menu = super.developersMenu();

        menu.addLine();
        menu.addItem("edit", 'edit');
        menu.addItem(
            "font size...",
            () => {
                this.prompt(
                    menu.title + '\nfont\nsize:',
                    this.setFontSize,
                    this,
                    this.fontSize.toString(),
                    null,
                    6,
                    500,
                    true
                );
            },
            'set this String\'s\nfont point size'
        );
        if (this.fontStyle !== 'serif') {
            menu.addItem("serif", 'setSerif');
        }
        if (this.fontStyle !== 'sans-serif') {
            menu.addItem("sans-serif", 'setSansSerif');
        }
        if (this.isBold) {
            menu.addItem("normal weight", 'toggleWeight');
        } else {
            menu.addItem("bold", 'toggleWeight');
        }
        if (this.isItalic) {
            menu.addItem("normal style", 'toggleItalic');
        } else {
            menu.addItem("italic", 'toggleItalic');
        }
        if (this.isShowingBlanks) {
            menu.addItem("hide blanks", 'toggleShowBlanks');
        } else {
            menu.addItem("show blanks", 'toggleShowBlanks');
        }
        if (this.isPassword) {
            menu.addItem("show characters", 'toggleIsPassword');
        } else {
            menu.addItem("hide characters", 'toggleIsPassword');
        }
        return menu;
    }

    toggleIsDraggable () {
        // for context menu demo purposes
        this.isDraggable = !this.isDraggable;
        if (this.isDraggable) {
            this.disableSelecting();
        } else {
            this.enableSelecting();
        }
    }

    toggleShowBlanks () {
        this.isShowingBlanks = !this.isShowingBlanks;
        this.changed();
        this.fixLayout();
        this.rerender();
    }
    
    toggleWeight () {
        this.isBold = !this.isBold;
        this.changed();
        this.fixLayout();
        this.rerender();
    }
    
    toggleItalic () {
        this.isItalic = !this.isItalic;
        this.changed();
        this.fixLayout();
        this.rerender();
    }
    
    toggleIsPassword () {
        this.isPassword = !this.isPassword;
        this.changed();
        this.fixLayout();
        this.rerender();
    }
    
    setSerif () {
        this.fontStyle = 'serif';
        this.changed();
        this.fixLayout();
        this.rerender();
    }
    
    setSansSerif () {
        this.fontStyle = 'sans-serif';
        this.changed();
        this.fixLayout();
        this.rerender();
    }

    setFontSize (size) {
        // for context menu demo purposes
        var newSize;
        if (typeof size === 'number') {
            this.fontSize = Math.round(Math.min(Math.max(size, 4), 500));
        } else {
            newSize = parseFloat(size);
            if (!isNaN(newSize)) {
                this.fontSize = Math.round(
                    Math.min(Math.max(newSize, 4), 500)
                );
            }
        }
        this.changed();
        this.fixLayout();
        this.rerender();
    }
    
    setText (size) {
        // for context menu demo purposes
        this.text = Math.round(size).toString();
        this.changed();
        this.fixLayout();
        this.rerender();
    }

    numericalSetters () {
        // for context menu demo purposes
        return [
            'setLeft',
            'setTop',
            'setAlphaScaled',
            'setFontSize',
            'setText'
        ];
    }
    
    // StringMorph editing:

    edit () {
        this.root.edit(this);
    }

    selection () {
        var start, stop;
        start = Math.min(this.startMark, this.endMark);
        stop = Math.max(this.startMark, this.endMark);
        return this.text.slice(start, stop);
    }

    selectionStartSlot () {
        return Math.min(this.startMark, this.endMark);
    }

    clearSelection () {
        if (!this.currentlySelecting &&
            isNil(this.startMark) &&
            isNil(this.endMark)) {
            return;
        }
        this.currentlySelecting = false;
        this.startMark = null;
        this.endMark = null;
        this.changed();
    }

    deleteSelection () {
        var start, stop, text;
        text = this.text;
        start = Math.min(this.startMark, this.endMark);
        stop = Math.max(this.startMark, this.endMark);
        this.text = text.slice(0, start) + text.slice(stop);
        this.changed();
        this.clearSelection();
    }

    selectAll () {
        var cursor;
        if (this.isEditable) {
            this.startMark = 0;
            cursor = this.root.cursor;
            this.endMark = this.text.length;
            if (cursor) {
                cursor.gotoSlot(this.text.length);
                cursor.syncTextareaSelectionWith(this);
            }
            this.fixLayout();
            this.rerender();
        }
    }

    mouseDownLeft (pos) {
        if (this.world.currentKey === 16) {
            this.shiftClick(pos);
        } else if (this.isEditable) {
            this.clearSelection();
        } else {
            this.escalateEvent('mouseDownLeft', pos);
        }
    }

    shiftClick (pos) {
        var cursor = this.root.cursor;

        if (cursor) {
            if (!this.startMark) {
                this.startMark = cursor.slot;
            }
            cursor.gotoPos(pos);
            this.endMark = cursor.slot;
            cursor.syncTextareaSelectionWith(this);
            this.changed();
        }
        this.currentlySelecting = false;
        this.escalateEvent('mouseDownLeft', pos);
    }

    mouseClickLeft (pos) {
        var cursor, slot, clickedText, startMark, endMark;

        if (this.world) {
            this.world.keyboardHandler.focus();
        }

        if (this.isEditable) {
            if (!this.currentlySelecting) {
                this.edit(); // creates a new cursor
            }
            cursor = this.root.cursor;
            if (cursor) {
                cursor.gotoPos(pos);
            }
            this.currentlySelecting = true;
        } else if (this.enableLinks) {
            slot = this.slotAt(pos);
            if (slot === this.text.length) {
                slot -= 1;
            }
            startMark = slot;
            while (startMark > 1 && isURLChar(this.text[startMark - 1])) {
                startMark -= 1;
            }
            endMark = slot;
            while (endMark < this.text.length - 1 &&
                isURLChar(this.text[endMark + 1])) {
                endMark += 1;
            }
            clickedText = this.text.substring(startMark, endMark + 1);
            if (isURL(clickedText)) {
                window.open(clickedText, '_blank');
            } else {
                this.escalateEvent('mouseClickLeft', pos);
            }
        } else {
            this.escalateEvent('mouseClickLeft', pos);
        }
    }

    mouseDoubleClick (pos) {
        // selects the word at pos
        // if there is no word, we select whatever is between
        // the previous and next words
        var slot = this.slotAt(pos);

        if (this.isEditable) {
            this.edit();

            if (slot === this.text.length) {
                slot -= 1;
            }

            if (this.text[slot] && isWordChar(this.text[slot])) {
                this.selectWordAt(slot);
            } else if (this.text[slot]) {
                this.selectBetweenWordsAt(slot);
            } else {
                // special case for when we click right after the
                // last slot in multi line TextMorphs
                this.selectAll();
            }
            this.root.cursor.syncTextareaSelectionWith(this);
        } else {
            this.escalateEvent('mouseDoubleClick', pos);
        }
    }
    
    selectWordAt (slot) {
        var cursor = this.root.cursor;

        if (slot === 0 || isWordChar(this.text[slot - 1])) {
            cursor.gotoSlot(this.previousWordFrom(slot));
            this.startMark = cursor.slot;
            this.endMark = this.nextWordFrom(cursor.slot);
        } else {
            cursor.gotoSlot(slot);
            this.startMark = slot;
            this.endMark = this.nextWordFrom(slot);
        }
        this.changed();
    }

    selectBetweenWordsAt (slot) {
        var cursor = this.root.cursor;

        cursor.gotoSlot(this.nextWordFrom(this.previousWordFrom(slot)));
        this.startMark = cursor.slot;
        this.endMark = cursor.slot;

        while (this.endMark < this.text.length
            && !isWordChar(this.text[this.endMark])) {
            this.endMark += 1;
        }
        this.changed();
    }

    enableSelecting () {
        this.mouseDownLeft = function (pos) {
            var crs = this.root.cursor,
                already = crs ? crs.target === this : false;
            if (this.world.currentKey === 16) {
                this.shiftClick(pos);
            } else {
                this.clearSelection();
                if (this.isEditable && (!this.isDraggable)) {
                    this.edit();
                    this.root.cursor.gotoPos(pos);
                    this.startMark = this.slotAt(pos);
                    this.endMark = this.startMark;
                    this.currentlySelecting = true;
                    this.root.cursor.syncTextareaSelectionWith(this);
                    if (!already) { this.escalateEvent('mouseDownLeft', pos); }
                }
            }
        };
        this.mouseMove = function (pos) {
            if (this.isEditable &&
                this.currentlySelecting &&
                (!this.isDraggable)) {
                var newMark = this.slotAt(pos);
                if (newMark !== this.endMark) {
                    this.endMark = newMark;
                    this.root.cursor.syncTextareaSelectionWith(this);
                    this.changed();
                }
            }
        };
    }

    disableSelecting () {
        this.mouseDownLeft = StringMorph.prototype.mouseDownLeft;
        this.mouseMove = nop;
    }
}

// TextMorph ////////////////////////////////////////////////////////////////

// I am a multi-line, word-wrapping String, quasi-inheriting from StringMorph

// TextMorph inherits from Morph:

class TextMorph extends Morph {
    // TextMorph shared properties:
    
    // context for measuring text dimensions, shared with StringMorph prototype
    measureCtx = document.createElement("canvas").getContext("2d");

    // TextMorph instance creation:
    
    constructor (
        text,
        fontSize,
        fontStyle,
        bold,
        italic,
        alignment,
        width,
        fontName,
        shadowOffset,
        shadowColor
    ) {
        // initialize inherited properties:
        super();

        // additional properties:
        this.text = text || (text === '' ? text : 'TextMorph');
        this.words = [];
        this.lines = [];
        this.lineSlots = [];
        this.fontSize = fontSize || 12;
        this.fontName = fontName || MorphicPreferences.globalFontFamily;
        this.fontStyle = fontStyle || 'sans-serif';
        this.isBold = bold || false;
        this.isItalic = italic || false;
        this.alignment = alignment || 'left';
        this.shadowOffset = shadowOffset || ZERO;
        this.shadowColor = shadowColor || null;
        this.maxWidth = width || 0;
        this.maxLineWidth = 0;
        this.backgroundColor = null;
        this.isEditable = false;
        this.enableLinks = false; // set to "true" if I can contain clickable URLs

        // additional properties for ad-hoc evaluation:
        this.receiver = null;

        // additional properties for text-editing:
        this.isScrollable = true; // scrolls into view when edited
        this.currentlySelecting = false;
        this.startMark = 0;
        this.endMark = 0;
        this.markedTextColor = WHITE;
        this.markedBackgoundColor = new Color(60, 60, 120);

        // override inherited properites:
        this.color = new Color(0, 0, 0);
        this.fixLayout(); // determine my extent
    }

    toString () {
        // e.g. 'a TextMorph("Hello World")'
        return 'a TextMorph' + '("' + this.text.slice(0, 30) + '...")';
    }

    parse () {
        var paragraphs = this.text.split('\n'), 
            context = this.measureCtx,
            oldline = '',
            newline, w, slot = 0;

        context.font = this.font();
        this.maxLineWidth = 0;
        this.lines = [];
        this.lineSlots = [0];
        this.words = [];

        paragraphs.forEach(p => {
            this.words = this.words.concat(p.split(' '));
            this.words.push('\n');
        });

        this.words.forEach(word => {
            if (word === '\n') {
                this.lines.push(oldline);
                this.lineSlots.push(slot);
                this.maxLineWidth = Math.max(
                    this.maxLineWidth,
                    context.measureText(oldline).width
                );
                oldline = '';
            } else {
                if (this.maxWidth > 0) {
                    newline = oldline + word + ' ';
                    w = context.measureText(newline).width;
                    if (w > this.maxWidth) {
                        this.lines.push(oldline);
                        this.lineSlots.push(slot);
                        this.maxLineWidth = Math.max(
                            this.maxLineWidth,
                            context.measureText(oldline).width
                        );
                        w = context.measureText(word).width;
                        if (w > this.maxWidth) {
                            oldline = '';
                            word.split('').forEach((letter, idx) => {
                                w = context.measureText(oldline + letter).width;
                                if (w > this.maxWidth && oldline.length) {
                                    this.lines.push(oldline);
                                    this.lineSlots.push(slot + idx);
                                    this.maxLineWidth = Math.max(
                                        this.maxLineWidth,
                                        context.measureText(oldline).width
                                    );
                                    oldline = '';
                                }
                                oldline += letter;
                            });
                        } else {
                            oldline = word + ' ';
                        }
                    } else {
                        oldline = newline;
                    }
                } else {
                    oldline = oldline + word + ' ';
                }
                slot += word.length + 1;
            }
        });
    }

    fixLayout () {
        // determine my extent depending on my current settings
        var height, shadowHeight, shadowWidth;

        this.parse();

        // set my extent
        shadowWidth = Math.abs(this.shadowOffset.x);
        shadowHeight = Math.abs(this.shadowOffset.y);
        height = this.lines.length * (fontHeight(this.fontSize) + shadowHeight);
        if (this.maxWidth === 0) {
            this.bounds = this.bounds.origin.extent(
                new Point(this.maxLineWidth + shadowWidth, height)
            );
        } else {
            this.bounds = this.bounds.origin.extent(
                new Point(this.maxWidth + shadowWidth, height)
            );
        }

        // notify my parent of layout change
        if (this.parent) {
            if (this.parent.layoutChanged) {
                this.parent.layoutChanged();
            }
        }
    }

    render (ctx) {
        var shadowWidth = Math.abs(this.shadowOffset.x),
            shadowHeight = Math.abs(this.shadowOffset.y),
            shadowColor = this.getShadowRenderColor(),
            i, line,
            width, offx,
            offy, x, y,
            start, stop,
            p, c;

        // prepare context for drawing text
        ctx.font = this.font();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        // fill the background, if desired
        if (this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor.toString();
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // draw the shadow, if any
        if (shadowColor) {
            offx = Math.max(this.shadowOffset.x, 0);
            offy = Math.max(this.shadowOffset.y, 0);
            ctx.fillStyle = shadowColor.toString();

            for (i = 0; i < this.lines.length; i = i + 1) {
                line = this.lines[i];
                width = ctx.measureText(line).width + shadowWidth;
                if (this.alignment === 'right') {
                    x = this.width - width;
                } else if (this.alignment === 'center') {
                    x = (this.width - width) / 2;
                } else { // 'left'
                    x = 0;
                }
                y = (i + 1) * (fontHeight(this.fontSize) + shadowHeight)
                    - shadowHeight;
                ctx.fillText(line, x + offx, y + offy);
            }
        }

        // now draw the actual text
        offx = Math.abs(Math.min(this.shadowOffset.x, 0));
        offy = Math.abs(Math.min(this.shadowOffset.y, 0));
        ctx.fillStyle = this.getRenderColor().toString();

        for (i = 0; i < this.lines.length; i = i + 1) {
            line = this.lines[i];
            width = ctx.measureText(line).width + shadowWidth;
            if (this.alignment === 'right') {
                x = this.width - width;
            } else if (this.alignment === 'center') {
                x = (this.width - width) / 2;
            } else { // 'left'
                x = 0;
            }
            y = (i + 1) * (fontHeight(this.fontSize) + shadowHeight) - shadowHeight;
            ctx.fillText(line, x + offx, y + offy);
        }

        // draw the selection
        start = Math.min(this.startMark, this.endMark);
        stop = Math.max(this.startMark, this.endMark);
        for (i = start; i < stop; i += 1) {
            p = this.slotPosition(i).subtract(this.position);
            c = this.text.charAt(i);
            ctx.fillStyle = this.markedBackgoundColor.toString();
            ctx.fillRect(p.x, p.y, ctx.measureText(c).width + 1,
                fontHeight(this.fontSize));
            ctx.fillStyle = this.markedTextColor.toString();
            ctx.fillText(c, p.x, p.y + fontHeight(this.fontSize));
        }
    }

    get extent () {
        return super.extent;
    }

    set extent (aPoint) {
        this.maxWidth = Math.max(aPoint.x, 0);
        this.changed();
        this.fixLayout();
        this.rerender();
    }

    // TextMorph mesuring:

    columnRow (slot) {
        // answer the logical position point of the given index ("slot")
        var row, col, idx = 0;

        for (row = 0; row < this.lines.length; row += 1) {
            idx = this.lineSlots[row];
            for (col = 0; col < this.lines[row].length; col += 1) {
                if (idx === slot) {
                    return new Point(col, row);
                }
                idx += 1;
            }
        }
        // return new Point(0, 0);
        return new Point(
            this.lines[this.lines.length - 1].length - 1,
            this.lines.length - 1
        );
    }

    slotPosition (slot) {
        // answer the physical position point of the given index ("slot")
        // where the cursor should be placed
        var colRow = this.columnRow(slot),
            ctx = this.measureCtx,
            shadowHeight = Math.abs(this.shadowOffset.y),
            xOffset = 0, yOffset;

        ctx.font = this.font();
        yOffset = colRow.y * (fontHeight(this.fontSize) + shadowHeight);
        xOffset = ctx.measureText(this.lines[colRow.y].slice(0, colRow.x)).width;
        return new Point(this.left + xOffset, this.top + yOffset);
    }

    slotAt (aPoint) {
        // answer the slot (index) closest to the given point taking
        // in account how far from the middle of the character it is,
        // so the cursor can be moved accordingly
        var charX, row = 0,
            col = 0, columnLength,
            shadowHeight = Math.abs(this.shadowOffset.y),
            ctx = this.measureCtx,
            textWidth;

        while (aPoint.y - this.top >
            ((fontHeight(this.fontSize) + shadowHeight) * row)) {
            row += 1;
        }
        row = Math.max(row, 1);

        ctx.font = this.font();
        textWidth = ctx.measureText(this.lines[row - 1]).width;
        if (this.alignment === 'right') {
            charX = this.width - textWidth;
        } else if (this.alignment === 'center') {
            charX = (this.width - textWidth) / 2;
        } else { // 'left'
            charX = 0;
        }
        columnLength = this.lines[row - 1].length;
        while (col < columnLength - 1 && aPoint.x - this.left > charX) {
            charX += ctx.measureText(this.lines[row - 1][col]).width;
            col += 1;
        }

        // see where our click fell with respect to the middle of the char
        if (aPoint.x - this.left >
            charX - ctx.measureText(this.lines[row - 1][col]).width / 2) {
            return this.lineSlots[Math.max(row - 1, 0)] + col;
        } else {
            return this.lineSlots[Math.max(row - 1, 0)] + col - 1;
        }
    }

    upFrom (slot) {
        // answer the slot above the given one
        var above, colRow = this.columnRow(slot);
        if (colRow.y < 1) {
            return slot;
        }
        above = this.lines[colRow.y - 1];
        if (above.length < colRow.x - 1) {
            return this.lineSlots[colRow.y - 1] + above.length;
        }
        return this.lineSlots[colRow.y - 1] + colRow.x;
    }

    downFrom (slot) {
        // answer the slot below the given one
        var below, colRow = this.columnRow(slot);
        if (colRow.y > this.lines.length - 2) {
            return slot;
        }
        below = this.lines[colRow.y + 1];
        if (below.length < colRow.x - 1) {
            return this.lineSlots[colRow.y + 1] + below.length;
        }
        return this.lineSlots[colRow.y + 1] + colRow.x;
    }

    startOfLine (slot) {
        // answer the first slot (index) of the line for the given slot
        return this.lineSlots[this.columnRow(slot).y];
    }
    
    endOfLine (slot) {
        // answer the slot (index) indicating the EOL for the given slot
        return this.startOfLine(slot) +
            this.lines[this.columnRow(slot).y].length - 1;
    }

    selectAllAndEdit () {
        this.edit();
        this.selectAll();
    }

    // TextMorph menus:

    developersMenu () {
        var menu = super.developersMenu();
        menu.addLine();
        menu.addItem("edit", 'edit');
        menu.addItem(
            "font size...",
            () => {
                this.prompt(
                    menu.title + '\nfont\nsize:',
                    this.setFontSize,
                    this,
                    this.fontSize.toString(),
                    null,
                    6,
                    100,
                    true
                );
            },
            'set this Text\'s\nfont point size'
        );
        if (this.alignment !== 'left') {
            menu.addItem("align left", 'setAlignmentToLeft');
        }
        if (this.alignment !== 'right') {
            menu.addItem("align right", 'setAlignmentToRight');
        }
        if (this.alignment !== 'center') {
            menu.addItem("align center", 'setAlignmentToCenter');
        }
        menu.addLine();
        if (this.fontStyle !== 'serif') {
            menu.addItem("serif", 'setSerif');
        }
        if (this.fontStyle !== 'sans-serif') {
            menu.addItem("sans-serif", 'setSansSerif');
        }
        if (this.isBold) {
            menu.addItem("normal weight", 'toggleWeight');
        } else {
            menu.addItem("bold", 'toggleWeight');
        }
        if (this.isItalic) {
            menu.addItem("normal style", 'toggleItalic');
        } else {
            menu.addItem("italic", 'toggleItalic');
        }
        return menu;
    }

    setAlignmentToLeft () {
        this.alignment = 'left';
        this.rerender();
    }

    setAlignmentToRight () {
        this.alignment = 'right';
        this.rerender();
    }

    setAlignmentToCenter () {
        this.alignment = 'center';
        this.rerender();
    }

    // TextMorph evaluation:

    evaluationMenu () {
        var menu = new MenuMorph(this, null);
        menu.addItem(
            "do it",
            'doIt',
            'evaluate the\nselected expression'
        );
        menu.addItem(
            "show it",
            'showIt',
            'evaluate the\nselected expression\nand show the result'
        );
        menu.addItem(
            "inspect it",
            'inspectIt',
            'evaluate the\nselected expression\nand inspect the result'
        );
        menu.addLine();
        menu.addItem("select all", 'selectAllAndEdit');
        return menu;
    }

    setReceiver (obj) {
        this.receiver = obj;
        this.customContextMenu = this.evaluationMenu();
    }

    doIt () {
        this.receiver.evaluateString(this.selection());
        this.edit();
    }

    showIt () {
        var result = this.receiver.evaluateString(this.selection());
        if (result !== null) {
            this.inform(result);
        }
    }

    inspectIt () {
        var result = this.receiver.evaluateString(this.selection()),
            world = this.world, inspector;
        if (isObject(result)) {
            inspector = new InspectorMorph(result);
            inspector.position = world.hand.position;
            inspector.keepWithin(world);
            world.add(inspector);
            inspector.changed();
        }
    }

    font = StringMorph.prototype.font;
    getShadowRenderColor = StringMorph.prototype.getShadowRenderColor;
    previousWordFrom = StringMorph.prototype.previousWordFrom;
    nextWordFrom = StringMorph.prototype.nextWordFrom;

    // TextMorph editing:
    edit = StringMorph.prototype.edit;
    selection = StringMorph.prototype.selection;
    selectionStartSlot = StringMorph.prototype.selectionStartSlot;
    clearSelection = StringMorph.prototype.clearSelection;
    deleteSelection = StringMorph.prototype.deleteSelection;
    selectAll = StringMorph.prototype.selectAll;
    mouseDownLeft = StringMorph.prototype.mouseDownLeft;
    shiftClick = StringMorph.prototype.shiftClick;
    mouseClickLeft = StringMorph.prototype.mouseClickLeft;
    mouseDoubleClick = StringMorph.prototype.mouseDoubleClick;
    selectWordAt = StringMorph.prototype.selectWordAt;
    selectBetweenWordsAt = StringMorph.prototype.selectBetweenWordsAt;
    enableSelecting = StringMorph.prototype.enableSelecting;
    disableSelecting = StringMorph.prototype.disableSelecting;
    toggleIsDraggable
        = StringMorph.prototype.toggleIsDraggable;
    toggleWeight = StringMorph.prototype.toggleWeight;
    toggleItalic = StringMorph.prototype.toggleItalic;
    setSerif = StringMorph.prototype.setSerif;
    setSansSerif = StringMorph.prototype.setSansSerif;
    setText = StringMorph.prototype.setText;
    setFontSize = StringMorph.prototype.setFontSize;
    numericalSetters = StringMorph.prototype.numericalSetters;
}

// TriggerMorph ////////////////////////////////////////////////////////

// I provide basic button functionality

// TriggerMorph inherits from Morph:

class TriggerMorph extends Morph {
    // TriggerMorph instance creation:
    
    constructor (
        target,
        action,
        labelString,
        fontSize,
        fontStyle,
        environment,
        hint,
        labelColor,
        labelBold,
        labelItalic,
        doubleClickAction
    ) {
        // initialize inherited properties:
        super();
        
        // additional properties:
        this.target = target || null;
        this.action = action === 0 ? 0 : action || null;
        this.doubleClickAction = doubleClickAction || null;
        this.environment = environment || null;
        this.labelString = labelString || ' ';
        this.label = null;
        this.hint = hint || null; // null, String, or Function
        this.schedule = null; // animation slot for displaying hints
        this.fontSize = fontSize || MorphicPreferences.menuFontSize;
        this.fontStyle = fontStyle || 'sans-serif';
        this.highlightColor = new Color(192, 192, 192);
        this.pressColor = new Color(128, 128, 128);
        this.labelColor = labelColor || new Color(0, 0, 0);
        this.labelBold = labelBold || false;
        this.labelItalic = labelItalic || false;
        this.userState = 'normal'; // 'highlight', 'pressed'

        // override inherited properites:
        this.color = WHITE;
        this.createLabel();
    }

    // TriggerMorph drawing:
    
    render (ctx) {
        var colorBak = this.color;
        if (this.userState === 'highlight') {
            this.color = this.highlightColor;
        } else if (this.userState === 'pressed') {
            this.color = this.pressColor;
        }
        super.render(ctx);
        this.color = colorBak;
    }

    createLabel () {
        if (this.label !== null) {
            this.label.destroy();
        }
        this.label = new StringMorph(
            this.labelString,
            this.fontSize,
            this.fontStyle,
            this.labelBold,
            this.labelItalic,
            false,
            null,
            null,
            this.labelColor
        );
        this.fixLayout();
        this.add(this.label);
    }

    fixLayout () {
        this.label.position = this.center.subtract(
            this.label.extent.floorDivideBy(2)
        );
    }

    // TriggerMorph action:
    
    trigger () {
        /*
        if target is a function, use it as callback:
        execute target as callback function with action as argument
        in the environment as optionally specified.
        Note: if action is also a function, instead of becoming
        the argument itself it will be called to answer the argument.
        for selections, Yes/No Choices etc. As second argument pass
        myself, so I can be modified to reflect status changes, e.g.
        inside a list box:
    
        else (if target is not a function):
    
            if action is a function:
            execute the action with target as environment (can be null)
            for lambdafied (inline) actions
    
            else if action is a String:
            treat it as function property of target and execute it
            for selector-like actions
        */
        if (this.schedule) {
            this.schedule.isActive = false;
        }
        if (typeof this.target === 'function') {
            if (typeof this.action === 'function') {
                this.target.call(this.environment, this.action.call(), this);
            } else {
                this.target.call(this.environment, this.action, this);
            }
        } else {
            if (typeof this.action === 'function') {
                this.action.call(this.target);
            } else { // assume it's a String
                this.target[this.action]();
            }
        }
    }

    triggerDoubleClick () {
        // same as trigger() but use doubleClickAction instead of action property
        // note that specifying a doubleClickAction is optional
        if (!this.doubleClickAction) { return; }
        if (this.schedule) {
            this.schedule.isActive = false;
        }
        if (typeof this.target === 'function') {
            if (typeof this.doubleClickAction === 'function') {
                this.target.call(
                    this.environment,
                    this.doubleClickAction.call(),
                    this
                );
            } else {
                this.target.call(this.environment, this.doubleClickAction, this);
            }
        } else {
            if (typeof this.doubleClickAction === 'function') {
                this.doubleClickAction.call(this.target);
            } else { // assume it's a String
                this.target[this.doubleClickAction]();
            }
        }
    }

    // TriggerMorph events:

    mouseEnter () {
        var contents = this.hint instanceof Function ? this.hint() : this.hint;
        this.userState = 'highlight';
        this.rerender();
        if (contents) {
            this.bubbleHelp(contents);
        }
    }

    mouseLeave () {
        this.userState = 'normal';
        this.rerender();
        if (this.schedule) {
            this.schedule.isActive = false;
        }
        if (this.hint) {
            this.world.hand.destroyTemporaries();
        }
    }

    mouseDownLeft () {
        this.userState = 'pressed';
        this.rerender();
    }

    mouseClickLeft () {
        this.userState = 'highlight';
        this.rerender();
        this.trigger();
    }

    mouseDoubleClick () {
        this.triggerDoubleClick();
    }
    
    rootForGrab () {
        return this.isDraggable ? super.rootForGrab() : null;
    }

    // TriggerMorph bubble help:

    bubbleHelp (contents) {
        var world = this.world;
        this.schedule = new Animation(
            nop,
            nop,
            0,
            500,
            nop,
            () => this.popUpbubbleHelp(contents)
        );
        world.animations.push(this.schedule);
    }

    popUpbubbleHelp(contents) {
        new SpeechBubbleMorph(
            localize(contents),
            null,
            null,
            1
        ).popUp(this.world, this.rightCenter.add(new Point(-8, 0)));
    }
}

// MenuItemMorph ///////////////////////////////////////////////////////

// I automatically determine my bounds

// MenuItemMorph inherits from TriggerMorph:

class MenuItemMorph extends TriggerMorph {
    // MenuItemMorph instance creation:
    
    constructor (
        target,
        action,
        labelString, // can also be a Morph or a Canvas or a tuple: [icon, string]
        fontSize,
        fontStyle,
        environment,
        hint,
        color,
        bold,
        italic,
        doubleClickAction, // optional when used as list morph item
        shortcut // optional string, Morph, Canvas or tuple: [icon, string]
    ) {
        // initialize inherited properties:
        super(
            target,
            action,
            labelString,
            fontSize,
            fontStyle,
            environment,
            hint,
            color,
            bold,
            italic,
            doubleClickAction
        );
        
        // additional properties:
        this.shortcutString = shortcut || null;
        this.shortcut = null;

        this.createLabel();
    }

    createLabel () {
        var w, h;
        if (this.label) {
            this.label.destroy();
        }
        this.label = this.createLabelPart(this.labelString);
        this.add(this.label);
        w = this.label.width;
        h = this.label.height;
        if (this.shortcut) {
            this.shortcut.destroy();
        }
        if (this.shortcutString) {
            this.shortcut = this.createLabelPart(this.shortcutString);
            w += this.shortcut.width + 4;
            h = Math.max(h, this.shortcut.height);
            this.add(this.shortcut);
        }
        this.extent = new Point(w + 8, h);
    }

    fixLayout () {
        var cntr = this.center;
        this.label.center = cntr;
        this.label.left = (this.left + 4);
        if (this.shortcut) {
            this.shortcut.center = cntr;
            this.shortcut.right = (this.right - 4);
        }
    }

    createLabelPart (source) {
        var part, icon, lbl;
        if (isString(source)) {
            return this.createLabelString(source);
        }
        if (source instanceof Array) {
            // assume its pattern is: [icon, string]
            part = new Morph();
            part.alpha = 0; // transparent
            icon = this.createIcon(source[0]);
            part.add(icon);
            lbl = this.createLabelString(source[1]);
            part.add(lbl);
            lbl.center = icon.center;
            lbl.left = (icon.right + 4);
            part.bounds = (icon.bounds.merge(lbl.bounds));
            part.rerender();
            return part;
        }
        // assume it's either a Morph or a Canvas
        return this.createIcon(source);
    }

    createIcon (source) {
        // source can be either a Morph or an HTMLCanvasElement
        var icon;

        if (source instanceof Morph) {
            return source.fullCopy();
        }
        // assume a Canvas
        icon = new Morph();
        icon.isCachingImage = true;
        icon.cachedImage = source; // should we copy the canvas?
        icon.bounds.width = source.width;
        icon.bounds.height = source.height;
        return icon;
    }

    createLabelString (string) {
        var lbl = new TextMorph(
            string,
            this.fontSize,
            this.fontStyle,
            this.labelBold,
            this.labelItalic
        );
        lbl.setColor(this.labelColor);
        return lbl;
    }

    // MenuItemMorph events:
    
    mouseEnter () {
        var menu = this.parentThatIsA(MenuMorph);
        if (this.isShowingSubmenu()) {
            return;
        }
        if (menu) {
            menu.closeSubmenu();
        }
        if (!this.isListItem()) {
            this.userState = 'highlight';
            this.rerender();
        }
        if (this.action instanceof MenuMorph) {
            this.delaySubmenu();
        } else if (this.hint) {
            this.bubbleHelp(this.hint);
        }
    }

    mouseLeave () {
        if (!this.isListItem()) {
            if (this.isShowingSubmenu()) {
                this.userState = 'highlight';
            } else {
                this.userState = 'normal';
            }
            this.rerender();
        }
        if (this.schedule) {
            this.schedule.isActive = false;
        }
        if (this.hint) {
            this.world.hand.destroyTemporaries();
        }
    }

    mouseDownLeft (pos) {
        if (this.isListItem()) {
            this.parentThatIsA(MenuMorph).unselectAllItems();
            this.escalateEvent('mouseDownLeft', pos);
        }
        this.userState = 'pressed';
        this.rerender();
    }

    mouseMove () {
        if (this.isListItem()) {
            this.escalateEvent('mouseMove');
        }
    }

    mouseClickLeft () {
        if (this.action instanceof MenuMorph) {
            this.popUpSubmenu();
        } else {
            if (!this.isListItem()) {
                this.parentThatIsA(MenuMorph).closeRootMenu();
                this.world.activeMenu = null;
            }
            this.trigger();
        }
    }

    isListItem () {
        var menu = this.parentThatIsA(MenuMorph);
        if (menu) {
            return menu.isListContents;
        }
        return false;
    }

    isSelectedListItem () {
        if (this.isListItem()) {
            return this.userState === 'pressed';
        }
        return false;
    }

    isShowingSubmenu () {
        var menu = this.parentThatIsA(MenuMorph);
        if (menu && (this.action instanceof MenuMorph)) {
            return menu.submenu === this.action;
        }
        return false;
    }

    // MenuItemMorph submenus:

    delaySubmenu () {
        var world = this.world;
        this.schedule = new Animation(
            nop,
            nop,
            0,
            500,
            nop,
            () => this.popUpSubmenu()
        );
        world.animations.push(this.schedule);
    }

    popUpSubmenu () {
        var menu = this.parentThatIsA(MenuMorph),
            world = this.world,
            scroller;

        if (!(this.action instanceof MenuMorph)) { return; }
        this.action.createItems();
        this.action.position = this.topRight.subtract(new Point(0, 5));
        this.action.addShadow(new Point(2, 2), 80);
        this.action.keepWithin(this.world);
        if (this.action.items.length < 1 && !this.action.title) { return; }

        if (this.action.bottom > world.bottom) {
            // scroll menu items if the menu is taller than the world
            this.action.removeShadow();
            scroller = this.action.scroll();
            this.action.bounds.corner.y = world.bottom - 2;
            this.action.addShadow(new Point(2, 2), 80);
            scroller.height = (world.bottom - scroller.top - 6);
            scroller.adjustScrollBars(); // ?
        }

        menu.add(this.action);
        menu.submenu = this.action;
        this.action.fullChanged();
    }
}

// FrameMorph //////////////////////////////////////////////////////////

// I clip my submorphs at my bounds

// Frames inherit from Morph:

class FrameMorph extends Morph {
    constructor(aScrollFrame) {
        super();

        this.scrollFrame = aScrollFrame || null;

        this.color = new Color(255, 250, 245);
        this.acceptsDrops = true;

        if (this.scrollFrame) {
            this.isDraggable = false;
            this.alpha = 0;
        }
    }

    fullBounds () {
        var shadow = this.getShadow();
        if (shadow !== null) {
            return this.bounds.merge(shadow.bounds);
        }
        return this.bounds;
    }

    fullDrawOn (ctx, aRect) {
        var shadow, clipped;
        if (!this.isVisible) { return; }
        clipped = this.bounds.intersect(aRect);
        if (!clipped.extent.gt(ZERO)) { return; }
        this.drawOn(ctx, clipped);

        this.children.forEach((child) => {
            if (child instanceof ShadowMorph) {
                shadow = child;
            } else {
                child.fullDrawOn(ctx, clipped);
            }
        });

        if (shadow) {
            shadow.drawOn(ctx, aRect);
        }
    }

    // FrameMorph navigation:

    topMorphAt (point) {
        var i, result;
        if (!(this.isVisible && this.bounds.containsPoint(point))) {
            return null;
        }
        for (i = this.children.length - 1; i >= 0; i -= 1) {
            result = this.children[i].topMorphAt(point);
            if (result) { return result; }
        }
        if (this.isFreeForm) {
            return this.isTransparentAt(point) ? null : this;
        }
        return this;
    }

    // FrameMorph scrolling support:

    submorphBounds () {
        var result = null;

        if (this.children.length > 0) {
            result = this.children[0].bounds;
            this.children.forEach(child => {
                result = result.merge(child.fullBounds());
            });
        }
        return result;
    }

    keepInScrollFrame () {
        if (this.scrollFrame === null) {
            return null;
        }
        if (this.left > this.scrollFrame.left) {
            this.moveBy(
                new Point(this.scrollFrame.left - this.left, 0)
            );
        }
        if (this.right < this.scrollFrame.right) {
            this.moveBy(
                new Point(this.scrollFrame.right - this.right, 0)
            );
        }
        if (this.top > this.scrollFrame.top) {
            this.moveBy(
                new Point(0, this.scrollFrame.top - this.top)
            );
        }
        if (this.bottom < this.scrollFrame.bottom) {
            this.moveBy(
                0,
                new Point(this.scrollFrame.bottom - this.bottom, 0)
            );
        }
    }

    adjustBounds () {
        var subBounds, newBounds;

        if (this.scrollFrame === null) { return; }
        subBounds = this.submorphBounds();
        if (subBounds && (!this.scrollFrame.isTextLineWrapping)) {
            newBounds = subBounds
                .expandBy(this.scrollFrame.padding)
                .growBy(this.scrollFrame.growth)
                .merge(this.scrollFrame.bounds);
        } else {
            newBounds = this.scrollFrame.bounds.copy();
        }
        if (!this.bounds.eq(newBounds)) {
            this.bounds = newBounds;
            this.keepInScrollFrame();
        }
        if (this.scrollFrame.isTextLineWrapping) {
            this.children.forEach(morph => {
                if (morph instanceof TextMorph) {
                    morph.width = this.width;
                    this.height = (
                        Math.max(morph.height, this.scrollFrame.height)
                    );
                }
            });
        }
        this.scrollFrame.adjustScrollBars();
    }

    // FrameMorph dragging & dropping of contents:

    reactToDropOf () {
        this.adjustBounds();
    }

    reactToGrabOf () {
        this.adjustBounds();
    }

    // FrameMorph menus:

    developersMenu () {
        var menu = super.developersMenu();
        if (this.children.length > 0) {
            menu.addLine();
            menu.addItem(
                "move all inside...",
                'keepAllSubmorphsWithin',
                'keep all submorphs\nwithin and visible'
            );
        }
        return menu;
    }

    keepAllSubmorphsWithin () {
        this.children.forEach(m => m.keepWithin(this));
    }
}

// ScrollFrameMorph ////////////////////////////////////////////////////

class ScrollFrameMorph extends FrameMorph {
    constructor (scroller, size, sliderColor) {
        super();
        this.scrollBarSize = size || MorphicPreferences.scrollBarSize;
        this.autoScrollTrigger = null;
        this.enableAutoScrolling = true; // change to suppress
        this.isScrollingByDragging = true; // change to suppress
        this.hasVelocity = true; // dto.
        this.padding = 0; // around the scrollable area
        this.growth = 0; // pixels or Point to grow right/left when near edge
        this.isTextLineWrapping = false;
        this.contents = scroller || new FrameMorph(this);
        this.add(this.contents);
        this.hBar = new SliderMorph(
            null,
            null,
            null,
            null,
            'horizontal',
            sliderColor
        );
        this.hBar.height = this.scrollBarSize;
        this.hBar.action = (num) => {
            this.contents.position = new Point(
                this.left - num,
                this.contents.position.y
            );
        };
        this.hBar.isDraggable = false;
        this.add(this.hBar);
        this.vBar = new SliderMorph(
            null,
            null,
            null,
            null,
            'vertical',
            sliderColor
        );
        this.vBar.width = this.scrollBarSize;
        this.vBar.action = (num) => {
            this.contents.position = new Point(
                this.contents.position.x,
                this.top - num
            );
        };
        this.vBar.isDraggable = false;
        this.add(this.vBar);
        this.toolBar = null; // optional slot
    }

    adjustScrollBars () {
        var hWidth = this.width - this.scrollBarSize,
            vHeight = this.height - this.scrollBarSize;

        this.changed();
        if (this.contents.width > this.width) {
            this.hBar.show();
            if (this.hBar.width !== hWidth) {
                this.hBar.width = hWidth;
            }

            this.hBar.position = new Point(
                this.left,
                this.bottom - this.hBar.height
            );
            this.hBar.start = 0;
            this.hBar.stop = this.contents.width -
                this.width +
                this.scrollBarSize;
            this.hBar.size =
                this.width / this.contents.width * this.hBar.stop;
            this.hBar.value = this.left - this.contents.left;
            this.hBar.fixLayout();
        } else {
            this.hBar.hide();
        }

        if (this.contents.height > this.height) {
            this.vBar.show();
            if (this.vBar.height !== vHeight) {
                this.vBar.height = vHeight;
            }

            this.vBar.position = new Point(
                this.right - this.vBar.width,
                this.top
            );
            this.vBar.start = 0;
            this.vBar.stop = this.contents.height -
                this.height +
                this.scrollBarSize;
            this.vBar.size =
                this.height / this.contents.height * this.vBar.stop;
            this.vBar.value = this.top - this.contents.top;
            this.vBar.fixLayout();
        } else {
            this.vBar.hide();
        }
        this.adjustToolBar();
    }

    adjustToolBar () {
        var padding = 3;
        if (this.toolBar) {
            this.toolBar.top = (this.top + padding);
            this.toolBar.right = (
                (this.vBar.isVisible ? this.vBar.left : this.right) - padding
            );
        }
    }
    
    addContents (aMorph) {
        this.contents.add(aMorph);
        this.contents.adjustBounds();
    }

    setContents (aMorph) {
        this.contents.children.forEach(m => m.destroy());
        this.contents.children = [];
        aMorph.position = (this.position.add(this.padding + 2));
        this.addContents(aMorph);
    }

    get extent () {
        return super.extent;
    }

    set extent (aPoint) {
        if (this.isTextLineWrapping) {
            this.contents.position = this.position.copy();
        }
        super.extent = aPoint;
        this.contents.adjustBounds();
    }

    // ScrollFrameMorph scrolling by dragging:

    scrollX (steps) {
        var cl = this.contents.left,
            l = this.left, cw = this.contents.width,
            r = this.right, newX;

        if (this.vBar.isVisible) {
            r -= this.scrollBarSize;
        }

        newX = cl + steps;
        if (newX + cw < r) {
            newX = r - cw;
        }
        if (newX > l) {
            newX = l;
        }
        if (newX !== cl) {
            this.contents.left = newX;
        }
    }

    scrollY (steps) {
        var ct = this.contents.top,
            t = this.top,
            ch = this.contents.height,
            b = this.bottom,
            newY;

        if (this.hBar.isVisible) {
            b -= this.scrollBarSize;
        }

        newY = ct + steps;
        if (newY + ch < b) {
            newY = b - ch;
        }
        if (newY > t) {
            newY = t;
        }
        if (newY !== ct) {
            this.contents.top = newY;
        }
    }

    mouseDownLeft (pos) {
        if (!this.isScrollingByDragging) {
            return null;
        }
        var world = this.root,
            hand = world.hand,
            oldPos = pos,
            deltaX = 0,
            deltaY = 0,
            friction = 0.8;

        this.step = () => {
            var newPos;
            if (hand.mouseButton &&
                (hand.children.length === 0) &&
                (this.bounds.containsPoint(hand.bounds.origin))) {

                if (hand.grabPosition &&
                    (hand.grabPosition.distanceTo(hand.position) <=
                        MorphicPreferences.grabThreshold)) {
                    // still within the grab threshold
                    return null;
                }

                newPos = hand.bounds.origin;
                deltaX = newPos.x - oldPos.x;
                if (deltaX !== 0) {
                    this.scrollX(deltaX);
                }
                deltaY = newPos.y - oldPos.y;
                if (deltaY !== 0) {
                    this.scrollY(deltaY);
                }
                oldPos = newPos;
            } else {
                if (!this.hasVelocity) {
                    this.step = nop;
                } else {
                    if ((Math.abs(deltaX) < 0.5) &&
                        (Math.abs(deltaY) < 0.5)) {
                        this.step = nop;
                    } else {
                        deltaX = deltaX * friction;
                        this.scrollX(Math.round(deltaX));
                        deltaY = deltaY * friction;
                        this.scrollY(Math.round(deltaY));
                    }
                }
            }
            this.adjustScrollBars();
        };
    }

    startAutoScrolling () {
        var inset = MorphicPreferences.scrollBarSize * 3,
            world = this.world,
            hand, inner, pos;

        if (!world) {
            return null;
        }
        hand = world.hand;
        if (!this.autoScrollTrigger) {
            this.autoScrollTrigger = Date.now();
        }
        this.step = () => {
            pos = hand.bounds.origin;
            inner = this.bounds.insetBy(inset);
            if ((this.bounds.containsPoint(pos)) &&
                (!(inner.containsPoint(pos))) &&
                (hand.children.length > 0)) {
                this.autoScroll(pos);
            } else {
                this.step = nop;
                this.autoScrollTrigger = null;
            }
        };
    }

    autoScroll (pos) {
        var inset, area;

        if (Date.now() - this.autoScrollTrigger < 500) {
            return null;
        }

        inset = MorphicPreferences.scrollBarSize * 3;
        area = this.topLeft.extent(new Point(this.width, inset));
        if (area.containsPoint(pos)) {
            this.scrollY(inset - (pos.y - this.top));
        }
        area = this.topLeft.extent(new Point(inset, this.height));
        if (area.containsPoint(pos)) {
            this.scrollX(inset - (pos.x - this.left));
        }
        area = (new Point(this.right - inset, this.top))
            .extent(new Point(inset, this.height));
        if (area.containsPoint(pos)) {
            this.scrollX(-(inset - (this.right - pos.x)));
        }
        area = (new Point(this.left, this.bottom - inset))
            .extent(new Point(this.width, inset));
        if (area.containsPoint(pos)) {
            this.scrollY(-(inset - (this.bottom - pos.y)));
        }
        this.adjustScrollBars();
    }

    // ScrollFrameMorph scrolling by editing text:

    scrollCursorIntoView (morph) {
        var txt = morph.target,
            offset = txt.position.subtract(this.contents.position),
            ft = this.top + this.padding,
            fb = this.bottom - this.padding;
        this.contents.extent = txt.extent.add(offset).add(this.padding);
        if (morph.top < ft) {
            this.contents.top = (this.contents.top + ft - morph.top);
            morph.top = ft;
        } else if (morph.bottom > fb) {
            this.contents.bottom = (this.contents.bottom + fb - morph.bottom);
            morph.botom = fb;
        }
        this.adjustScrollBars();
    }

    // ScrollFrameMorph events:

    mouseScroll (y, x) {
        if (y) {
            this.scrollY(y * MorphicPreferences.mouseScrollAmount);
        }
        if (x) {
            this.scrollX(x * MorphicPreferences.mouseScrollAmount);
        }
        this.adjustScrollBars();
    }

    // ScrollFrameMorph duplicating:

    updateReferences (map) {
        super.updateReferences(map);
        if (this.hBar) {
            this.hBar.action = (num) => {
                this.contents.position = new Point(this.left - num, this.contents.position.y);
            };
        }
        if (this.vBar) {
            this.vBar.action = (num) => {
                this.contents.position = new Point(this.contents.position.x, this.top - num);
            };
        }
    }

    // ScrollFrameMorph menu:
    
    developersMenu () {
        var menu = super.developersMenu();
        if (this.isTextLineWrapping) {
            menu.addItem(
                "auto line wrap off...",
                'toggleTextLineWrapping',
                'turn automatic\nline wrapping\noff'
            );
        } else {
            menu.addItem(
                "auto line wrap on...",
                'toggleTextLineWrapping',
                'enable automatic\nline wrapping'
            );
        }
        return menu;
    }

    toggleTextLineWrapping () {
        this.isTextLineWrapping = !this.isTextLineWrapping;
    }

    step () {};
}

// ListMorph ///////////////////////////////////////////////////////////

class ListMorph extends ScrollFrameMorph {
    constructor (
        elements = [],
        labelGetter = function (element) {
            if (isString(element)) {
                return element;
            }
            if (element.toSource) {
                return element.toSource();
            }
            return element.toString();
        },
        format = [],
        onDoubleClick,
        separator,
        verbatim
    ) {
        /*
            passing a format is optional. If the format parameter is specified
            it has to be of the following pattern:
        
                [
                    [<color>, <single-argument predicate>],
                    ['bold', <single-argument predicate>],
                    ['italic', <single-argument predicate>],
                    ...
                ]
        
            multiple conditions can be passed in such a format list, the
            last predicate to evaluate true when given the list element sets
            the given format category (color, bold, italic).
            If no condition is met, the default format (color black, non-bold,
            non-italic) will be assigned.
        
            An example of how to use fomats can be found in the InspectorMorph's
            "markOwnProperties" mechanism.
        */
        super();

        this.contents.acceptsDrops = false;
        this.color = WHITE;
        this.hBar.alpha = 0.6;
        this.vBar.alpha = 0.6;
        this.elements = elements || [];
        this.labelGetter = labelGetter || function (element) {
            if (isString(element)) {
                return element;
            }
            if (element.toSource) {
                return element.toSource();
            }
            return element.toString();
        };
        this.format = format || [];
        this.listContents = null;
        this.selected = null; // actual element currently selected
        this.active = null; // menu item representing the selected element
        this.action = null;
        this.doubleClickAction = onDoubleClick || null;
        this.separator = separator || '';
        this.verbatim = isNil(verbatim) ? true : verbatim;
        this.acceptsDrops = false;
        this.buildListContents();
    }

    buildListContents () {
        if (this.listContents) {
            this.listContents.destroy();
        }
        this.listContents = new MenuMorph(
            this.select,
            null,
            this
        );
        if (this.elements.length === 0) {
            this.elements = ['(empty)'];
        }
        this.elements.forEach(element => {
            var color = null, bold = false, italic = false, label;

            this.format.forEach(pair => {
                if (pair[1].call(null, element)) {
                    if (pair[0] === 'bold') {
                        bold = true;
                    } else if (pair[0] === 'italic') {
                        italic = true;
                    } else { // assume it's a color
                        color = pair[0];
                    }
                }
            });

            label = this.labelGetter(element);
            if (label === this.separator) {
                this.listContents.addLine();
            } else {
                this.listContents.addItem(
                    label,
                    element,
                    null,
                    color,
                    bold,
                    italic,
                    this.doubleClickAction,
                    null,
                    this.verbatim // don't translate
                );
            }
        });
        this.listContents.isListContents = true;
        this.listContents.createItems();
        this.listContents.position = this.contents.position;
        this.addContents(this.listContents);
    }

    select (item, trigger) {
        if (isNil(item)) { return; }
        this.selected = item;
        this.active = trigger;
        if (this.action) {
            this.action.call(null, item);
        }
    }

    get extent () {
        return super.extent;
    }

    set extent (aPoint) {
        var lb = this.listContents.bounds, nb = this.bounds.origin.copy().corner(
            this.bounds.origin.add(aPoint)
        );

        if (nb.right > lb.right && nb.width <= lb.width) {
            this.listContents.right = nb.right;
        }
        if (nb.bottom > lb.bottom && nb.height <= lb.height) {
            this.listContents.bottom = nb.bottom;
        }
        super.extent = aPoint;
    }

    activeIndex () {
        return this.listContents.children.indexOf(this.active);
    }

    activateIndex (idx) {
        var item = this.listContents.children[idx];
        if (!item) { return; }
        item.userState = 'pressed';
        item.rerender();
        item.trigger();
    }
}

// StringFieldMorph ////////////////////////////////////////////////////

// StringFieldMorph inherit from FrameMorph:

class StringFieldMorph extends FrameMorph {
    constructor (
        defaultContents = '',
        minWidth = 100,
        fontSize = 12,
        fontStyle = 'sans-serif',
        bold = false,
        italic = false,
        isNumeric
    ) {
        super();
        this.defaultContents = defaultContents;
        this.minWidth = minWidth;
        this.fontSize = fontSize;
        this.fontStyle = fontStyle;
        this.isBold = bold;
        this.isItalic = italic;
        this.isNumeric = isNumeric || false;
        this.text = null;
        this.color = WHITE;
        this.isEditable = true;
        this.acceptsDrops = false;
        this.createText();
    }

    createText () {
        var txt;
        txt = this.text ? this.string() : this.defaultContents;
        this.text = null;
        this.children.forEach(child => child.destroy());
        this.children = [];
        this.text = new StringMorph(
            txt,
            this.fontSize,
            this.fontStyle,
            this.isBold,
            this.isItalic,
            this.isNumeric
        );

        this.text.isNumeric = this.isNumeric; // for whichever reason...
        this.text.position = this.bounds.origin.copy();
        this.text.isEditable = this.isEditable;
        this.text.isDraggable = false;
        this.text.enableSelecting();
        this.extent = new Point(
            Math.max(this.width, this.minWidth),
            this.text.height
        );
        this.add(this.text);
    }

    string () {
        return this.text.text;
    }

    mouseClickLeft (pos) {
        if (this.isEditable) {
            this.text.edit();
        } else {
            this.escalateEvent('mouseClickLeft', pos);
        }
    }
}

// BouncerMorph ////////////////////////////////////////////////////////

// I am a Demo of a stepping custom Morph

// Bouncers inherit from Morph:

class BouncerMorph extends Morph {
    // BouncerMorph instance creation:
    
    constructor (type = 'vertical', speed = 1) {
        // BouncerMorph initialization:
        super();

        this.fps = 50;

        // additional properties:
        this.isStopped = false;
        this.type = type || 'vertical';
        if (this.type === 'vertical') {
            this.direction = 'down';
        } else {
            this.direction = 'right';
        }
        this.speed = speed || 1;
    }

    // BouncerMorph moving:

    moveUp () {
        this.moveBy(new Point(0, -this.speed));
    }

    moveDown () {
        this.moveBy(new Point(0, this.speed));
    }

    moveRight () {
        this.moveBy(new Point(this.speed, 0));
    }

    moveLeft () {
        this.moveBy(new Point(-this.speed, 0));
    }

    // BouncerMorph stepping:

    step () {
        if (!this.isStopped) {
            if (this.type === 'vertical') {
                if (this.direction === 'down') {
                    this.moveDown();
                } else {
                    this.moveUp();
                }
                if (this.fullBounds().top < this.parent.top &&
                    this.direction === 'up') {
                    this.direction = 'down';
                }
                if (this.fullBounds().bottom > this.parent.bottom &&
                    this.direction === 'down') {
                    this.direction = 'up';
                }
            } else if (this.type === 'horizontal') {
                if (this.direction === 'right') {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
                if (this.fullBounds().left < this.parent.left &&
                    this.direction === 'left') {
                    this.direction = 'right';
                }
                if (this.fullBounds().right > this.parent.right &&
                    this.direction === 'right') {
                    this.direction = 'left';
                }
            }
        }
    }
}

// ClockMorph ///////////////////////////////////////////////////////////

// I am a clock, that displays the time.

// ClockMorph inherits from Morph:

class ClockMorph extends Morph {
    // ClockMorph instance creation:
    
    constructor () {
        super();

        this.min = 0;
        this.max = 360;
        this.value = 0;
        this.tick = 30;
        this.fillColor = null;
        this.stopped = false;
        this.time = new Date();

        this.lineWidth = 2;
        this.handWidth = 5;

        this.startMultiplier = this.time.getMinutes();

        this.hour = 0;
        this.minute = 0;
        this.second = 0;

        this.color = new Color(230, 230, 230);

        this.setRadius(MorphicPreferences.menuFontSize * 4);
    }

    get currentTime () {
        return Date.now();
    }

    developersMenu () {
        var menu = super.developersMenu();
        menu.addLine();
        menu.addItem(
            "stop clock",
            () => {
                this.stopped = true;
            },
            "halts the clock at it's current time"
        );
        menu.addItem(
            "resume clock",
            () => {
                this.stopped = false;
            },
            "the clock continues."
        );
        return menu;
    }

    step () {
        if (this.stopped) return;
        this.time = new Date();
        this.changed();
    }

    setRadius (radius) {
        this.radius = radius;
        this.extent = new Point(this.radius * 2, this.radius * 2);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    render (ctx) {
        var i, angle, x1, y1, x2, y2,
            light = this.color.lighter().toString(),
            range = this.max - this.min,
            ticks = range / this.tick,
            face = this.radius * 0.75,
            inner = face * 0.85,
            outer = face * 0.95;

        ctx.lineJoin = ctx.lineCap = "round";

        // draw a light border:
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face + Math.min(1, this.radius - face),
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();

        // fill circle:
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();

        // fill value
        angle = (this.value - this.min) * (Math.PI * 2) / range - Math.PI / 2;
        ctx.fillStyle = (this.fillColor || this.color.darker()).toString();
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            face,
            Math.PI / -2,
            angle,
            false
        );
        ctx.lineTo(this.radius, this.radius);
        ctx.closePath();
        ctx.fill();

        // draw ticks:
        var quarterHourTickColor = new Color(35, 35, 35);
        var hourTickColor = quarterHourTickColor.lighter(20);
        ctx.strokeStyle = hourTickColor.toString();
        ctx.lineWidth = 1;
        inner = face * 0.8;
        outer = face * 0.9;
        for (i = 0; i < ticks; i += 1) {
            angle = (i - 3) * (Math.PI * 2) / ticks - Math.PI / 2;

            ctx.lineWidth = this.lineWidth;
            if ((i % 3) === 0) {
                ctx.lineWidth = this.lineWidth * 2;
                ctx.strokeStyle = quarterHourTickColor.toString();
            } else {
                ctx.strokeStyle = hourTickColor.toString();
            }

            ctx.beginPath();
            x1 = this.radius + Math.cos(angle) * inner;
            y1 = this.radius + Math.sin(angle) * inner;
            x2 = this.radius + Math.cos(angle) * outer;
            y2 = this.radius + Math.sin(angle) * outer;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // draw a filled center:
        inner = face * 0.05;
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            inner / 2,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();

        var time = this.currentTime,
            seconds = (((time / 1000) % 60)),
            minutes = (((time / 60000) % 60)),
            hour = (((time / 3600000) % 12));

        // draw the hour hand:
        ctx.strokeStyle = "rgb(38,38,38)";
        ctx.lineWidth = this.handWidth;
        angle = (hour) * (Math.PI * 2) / 12 - Math.PI / 2;
        outer = face * 0.5;
        x1 = this.radius + Math.cos(angle) * inner;
        y1 = this.radius + Math.sin(angle) * inner;
        x2 = this.radius + Math.cos(angle) * outer;
        y2 = this.radius + Math.sin(angle) * outer;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();

        // draw the minute hand:
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = this.handWidth / 2;
        angle = (minutes) * (Math.PI * 2) / 60 - Math.PI / 2;
        outer = face * 0.9;
        x1 = this.radius + Math.cos(angle) * inner;
        y1 = this.radius + Math.sin(angle) * inner;
        x2 = this.radius + Math.cos(angle) * outer;
        y2 = this.radius + Math.sin(angle) * outer;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();

        // draw the second hand:
        ctx.strokeStyle = 'red';
        ctx.lineWidth = this.handWidth / 1.5;
        angle = (seconds) * (Math.PI * 2) / 60 - Math.PI / 2;
        outer = face * 0.8;
        x1 = this.radius + Math.cos(angle) * inner;
        y1 = this.radius + Math.sin(angle) * inner;
        x2 = this.radius + Math.cos(angle) * outer;
        y2 = this.radius + Math.sin(angle) * outer;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();

        // draw a filled center:
        inner = face * 0.05;
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            this.radius,
            this.radius,
            inner,
            0,
            2 * Math.PI,
            false
        );
        ctx.closePath();
        ctx.fill();
    }

    get extent () {
        return super.extent;
    }

    set extent (aPoint) {
        var size = Math.min(aPoint.x, aPoint.y);
        this.radius = size / 2;
        super.extent = new Point(size, size);
    }
}

// HandMorph ///////////////////////////////////////////////////////////

// I represent the Mouse cursor

// HandMorph inherits from Morph:

class HandMorph extends Morph {
    // HandMorph instance creation:
    
    constructor (aWorld) {
        super();
        this.bounds = new Rectangle();

        // additional properties:
        this.handWorld = aWorld;
        this.mouseButton = null;
        this.mouseOverList = [];
        this.mouseOverBounds = [];
        this.morphToGrab = null;
        this.grabPosition = null;
        this.grabOrigin = null;
        this.temporaries = [];
        this.touchHoldTimeout = null;
        this.contextMenuEnabled = false;
        this.touchStartPosition = null;

        // properties for caching dragged objects:
        this.cachedFullImage = null;
        this.cachedFullBounds = null;
    }

    get world () {
        return this.handWorld;
    }

    // HandMorph dragging optimizations:

    changed () {
        var b;
        if (this.world !== null) {
            b = this.cachedFullBounds || this.fullBounds();
            if (!b.extent.eq(ZERO)) {
                this.world.broken.push(b.spread());
            }
        }
    }

    moveBy (delta) {
        var children = this.children, i = children.length;
        this.changed();
        this.bounds.translate(delta);
        if (this.cachedFullBounds) {
            this.cachedFullBounds.translate(delta);
        }
        this.changed();
        for (i; i > 0; i -= 1) {
            children[i - 1].moveBy(delta);
        }
    }

    // HandMorph display:

    fullDrawOn (ctx, rect) {
        if (!this.cachedFullBounds) {
            super.fullDrawOn(ctx, rect);
            return;
        }

        var clipped = rect.intersect(this.cachedFullBounds),
            pos = this.cachedFullBounds.origin,
            pic, src, w, h, sl, st;

        if (!clipped.extent.gt(ZERO)) { return; }
        ctx.save();
        ctx.globalAlpha = this.alpha;
        pic = this.cachedFullImage;
        src = clipped.translateBy(pos.neg());
        sl = src.left;
        st = src.top;
        w = Math.min(src.width, pic.width - sl);
        h = Math.min(src.height, pic.height - st);
        if (w < 1 || h < 1) { return; }
        ctx.drawImage(
            pic,
            sl,
            st,
            w,
            h,
            clipped.left,
            clipped.top,
            w,
            h
        );
        ctx.restore();
    }

    // HandMorph navigation:

    morphAtPointer () {
        return this.world.topMorphAt(this.bounds.origin) || this.world;
    }

    allMorphsAtPointer () {
        return this.world.allChildren.filter(m => m.isVisible &&
            m.visibleBounds.containsPoint(this.bounds.origin) &&
            !m.holes.some(any => any.translateBy(m.position).containsPoint(this.bounds.origin))
        );
    }

    // HandMorph dragging and dropping:
    /*
        drag 'n' drop events, method(arg) -> receiver:
    
            prepareToBeGrabbed(handMorph) -> grabTarget
            reactToGrabOf(grabbedMorph) -> oldParent
            wantsDropOf(morphToDrop) ->  newParent
            justDropped(handMorph) -> droppedMorph
            reactToDropOf(droppedMorph, handMorph) -> newParent
    */

    dropTargetFor (aMorph) {
        var target = this.morphAtPointer();
        while (!target.wantsDropOf(aMorph)) {
            target = target.parent;
        }
        return target;
    }

    grab (aMorph) {
        var oldParent;
        if (!aMorph) {
            return null;
        }
        oldParent = aMorph.parent;
        if (aMorph instanceof WorldMorph) {
            return null;
        }
        if (this.children.length === 0) {
            this.world.stopEditing();
            this.grabOrigin = aMorph.situation();
            if (aMorph.prepareToBeGrabbed) {
                aMorph.prepareToBeGrabbed(this);
            }
            if (!aMorph.noDropShadow) {
                aMorph.addShadow();
            }

            // cache the dragged object's display resources
            this.cachedFullImage = aMorph.fullImage();
            this.cachedFullBounds = aMorph.fullBounds();

            this.add(aMorph);
            this.changed();
            if (oldParent && oldParent.reactToGrabOf) {
                oldParent.reactToGrabOf(aMorph);
            }
        }
    }

    drop () {
        var target, morphToDrop;
        this.alpha = 1;
        if (this.children.length !== 0) {
            morphToDrop = this.children[0];
            target = this.dropTargetFor(morphToDrop);
            target = target.selectForEdit ? target.selectForEdit() : target;
            this.changed();
            target.add(morphToDrop);
            morphToDrop.changed();

            // invalidate dragging-cache
            this.cachedFullImage = null;
            this.cachedFullBounds = null;

            if (!morphToDrop.noDropShadow) {
                morphToDrop.removeShadow();
            }
            this.children = [];
            this.extent = new Point();
            if (morphToDrop.justDropped) {
                morphToDrop.justDropped(this);
            }
            if (target.reactToDropOf) {
                target.reactToDropOf(morphToDrop, this);
            }
        }
    }

    // HandMorph event dispatching:
    /*
        mouse events:
    
            mouseDownLeft
            mouseDownRight
            mouseClickLeft
            mouseClickRight
            mouseDoubleClick
            mouseEnter
            mouseLeave
            mouseEnterDragging
            mouseLeaveDragging
            mouseEnterBounds
            mouseLeaveBounds
            mouseMove
            mouseScroll
    */
    
    processMouseDown (event) {
        var morph, actualClick,
            posInDocument = getDocumentPositionOf(this.world.worldCanvas);

        // update my position, in case I've just been initialized
        if (event.pageX) {
            this.position = new Point(
                event.pageX - posInDocument.x,
                event.pageY - posInDocument.y
            );
        }

        // process the actual event
        this.destroyTemporaries();
        this.contextMenuEnabled = true;
        this.morphToGrab = null;
        this.grabPosition = null;
        if (this.children.length !== 0) {
            this.drop();
            this.mouseButton = null;
        } else {
            morph = this.morphAtPointer();
            if (this.world.activeMenu) {
                if (!contains(
                    morph.allParents,
                    this.world.activeMenu
                )) {
                    this.world.activeMenu.destroy();
                } else {
                    clearInterval(this.touchHoldTimeout);
                }
            }
            if (this.world.activeHandle) {
                if (morph !== this.world.activeHandle) {
                    this.world.activeHandle.destroy();
                }
            }
            if (this.world.cursor) {
                if (morph !== this.world.cursor.target) {
                    this.world.stopEditing();
                }
            }
            if (!morph.mouseMove) {
                this.morphToGrab = morph.rootForGrab();
                this.grabPosition = this.bounds.origin.copy();
            }
            if (event.button === 2 || event.ctrlKey) {
                this.mouseButton = 'right';
                actualClick = 'mouseDownRight';
            } else {
                this.mouseButton = 'left';
                actualClick = 'mouseDownLeft';
            }
            while (!morph[actualClick]) {
                morph = morph.parent;
            }
            morph[actualClick](this.bounds.origin);
        }
    }

    processTouchStart (event) {
        MorphicPreferences.isTouchDevice = true;
        clearInterval(this.touchHoldTimeout);
        if (event.touches.length === 1) {
            this.touchStartPosition = new Point(
                event.touches[0].pageX,
                event.touches[0].pageY
            );
            this.touchHoldTimeout = setInterval(
                () => {
                    this.processMouseDown({ button: 2 });
                    this.processMouseUp({ button: 2 });
                    event.preventDefault();
                    clearInterval(this.touchHoldTimeout);
                },
                400
            );
            this.processMouseMove(event.touches[0]); // update my position
            this.processMouseDown({ button: 0 });
            event.preventDefault();
        }
    }

    processTouchMove (event) {
        var pos = new Point(event.touches[0].pageX, event.touches[0].pageY);
        MorphicPreferences.isTouchDevice = true;
        if (this.touchStartPosition.distanceTo(pos) <
            MorphicPreferences.grabThreshold) {
            return;
        }
        if (event.touches.length === 1) {
            var touch = event.touches[0];
            this.processMouseMove(touch);
            clearInterval(this.touchHoldTimeout);
        }
    }

    processTouchEnd (event) {
        MorphicPreferences.isTouchDevice = true;
        clearInterval(this.touchHoldTimeout);
        nop(event);
        this.processMouseUp({ button: 0 });
    }

    processMouseUp () {
        var morph = this.morphAtPointer(),
            context, contextMenu, expectedClick;

        this.destroyTemporaries();
        if (this.children.length !== 0) {
            this.drop();
        } else {
            if (this.mouseButton === 'left') {
                expectedClick = 'mouseClickLeft';
            } else {
                expectedClick = 'mouseClickRight';
                if (this.mouseButton && this.contextMenuEnabled) {
                    context = morph;
                    contextMenu = context.contextMenu();
                    while ((!contextMenu) &&
                        context.parent) {
                        context = context.parent;
                        contextMenu = context.contextMenu();
                    }
                    if (contextMenu) {
                        contextMenu.popUpAtHand(this.world);
                    }
                }
            }
            while (!morph[expectedClick]) {
                morph = morph.parent;
            }
            morph[expectedClick](this.bounds.origin);
        }
        this.mouseButton = null;
    }

    processDoubleClick () {
        var morph = this.morphAtPointer();

        this.destroyTemporaries();
        if (this.children.length !== 0) {
            this.drop();
        } else {
            while (morph && !morph.mouseDoubleClick) {
                morph = morph.parent;
            }
            if (morph) {
                morph.mouseDoubleClick(this.bounds.origin);
            }
        }
        this.mouseButton = null;
    }

    processMouseMove (event) {
        var pos,
            posInDocument = getDocumentPositionOf(this.world.worldCanvas),
            mouseOverNew, mouseOverBoundsNew,
            morph, topMorph;

        pos = new Point(
            event.pageX - posInDocument.x,
            event.pageY - posInDocument.y
        );

        this.position = pos;

        // determine the new mouse-over-list:
        mouseOverNew = this.morphAtPointer().allParents;
        mouseOverBoundsNew = mouseOverNew.filter(m => m.isVisible &&
            m.visibleBounds.containsPoint(this.bounds.origin) &&
            !m.holes.some(any => any.translateBy(m.position).containsPoint(this.bounds.origin))
        );

        if (!this.children.length && this.mouseButton) {
            topMorph = this.morphAtPointer();
            morph = topMorph.rootForGrab();
            if (topMorph.mouseMove) {
                topMorph.mouseMove(pos, this.mouseButton);
                if (this.mouseButton === 'right') {
                    this.contextMenuEnabled = false;
                }
            }

            // if a morph is marked for grabbing, just grab it
            if (this.mouseButton === 'left' &&
                this.morphToGrab &&
                (this.grabPosition.distanceTo(this.bounds.origin) >
                    MorphicPreferences.grabThreshold)) {
                this.position = this.grabPosition;
                if (this.morphToGrab.isDraggable) {
                    morph = this.morphToGrab.selectForEdit ?
                        this.morphToGrab.selectForEdit() : this.morphToGrab;
                    this.grab(morph);
                } else if (this.morphToGrab.isTemplate) {
                    this.world.stopEditing();
                    morph = this.morphToGrab.fullCopy();
                    morph.isTemplate = false;
                    morph.isDraggable = true;
                    if (morph.reactToTemplateCopy) {
                        morph.reactToTemplateCopy();
                    }
                    this.grab(morph);
                    this.grabOrigin = this.morphToGrab.situation();
                }
                this.position = pos;
            }
        }

        for (let idx = 0; idx < this.mouseOverBounds.length; idx++) {
            const old = this.mouseOverBounds[idx];
            if (!contains(mouseOverBoundsNew, old)) {
                if (old.mouseLeaveBounds) {
                    old.mouseLeaveBounds(this.children[0]);
                }
            }
        }

        for (let j = 0; j < mouseOverBoundsNew.length; j++) {
            const newMorph = mouseOverBoundsNew[j];
            if (!contains(this.mouseOverBounds, newMorph)) {
                if (newMorph.mouseEnterBounds) {
                    newMorph.mouseEnterBounds(this.children[0]);
                }
            }
        }

        for (let k = 0; k < this.mouseOverList.length; k++) {
            const old = this.mouseOverList[k];
            if (!contains(mouseOverNew, old)) {
                if (old.mouseLeave) {
                    old.mouseLeave();
                }
                if (old.mouseLeaveDragging && this.mouseButton) {
                    old.mouseLeaveDragging(this.children[0]);
                }
            }
        }

        for (let o = 0; o < mouseOverNew.length; o++) {
            const newMorph = mouseOverNew[o];
            if (!contains(this.mouseOverList, newMorph)) {
                if (newMorph.mouseEnter) {
                    newMorph.mouseEnter();
                }
                if (newMorph.mouseEnterDragging && this.mouseButton) {
                    newMorph.mouseEnterDragging(this.children[0]);
                }
            }

            // autoScrolling support:
            if (this.children.length > 0) {
                if (newMorph instanceof ScrollFrameMorph &&
                    newMorph.enableAutoScrolling &&
                    newMorph.contents.allChildren.some(any => {
                        return any.wantsDropOf(this.children[0]);
                    })) {
                    if (!newMorph.bounds.insetBy(
                        MorphicPreferences.scrollBarSize * 3
                    ).containsPoint(this.bounds.origin)) {
                        newMorph.startAutoScrolling();
                    }
                }
            }
        }

        this.mouseOverList = mouseOverNew;
        this.mouseOverBounds = mouseOverBoundsNew;
    }

    processMouseScroll (event) {
        var morph = this.morphAtPointer();
        while (morph && !morph.mouseScroll) {
            morph = morph.parent;
        }
        if (morph) {
            morph.mouseScroll(
                (event.detail / -3) || (
                    Object.prototype.hasOwnProperty.call(
                        event,
                        'wheelDeltaY'
                    ) ?
                        event.wheelDeltaY / 120 :
                        event.wheelDelta / 120
                ),
                event.wheelDeltaX / 120 || 0
            );
        }
    }

    /*
        drop event:
    
            droppedImage
            droppedSVG
            droppedAudio
            droppedText
    
            beginBulkDrop
            endBulkDrop
    */

    processDrop (event) {
        /*
            find out whether an external image or audio file was dropped
            onto the world canvas, turn it into an offscreen canvas or audio
            element and dispatch the
        
                droppedImage(canvas, name, embeddedData)
                droppedSVG(image, name)
                droppedAudio(audio, name)
                droppedText(text, name, type)
        
            events to interested Morphs at the mouse pointer.
        
            In case multiple files are dropped simulateneously also displatch
            the events
        
                beginBulkDrop()
                endBulkDrop()
        
            to Morphs interested in bracketing the bulk operation
        */
        var files = event instanceof FileList ? event
            : event.target.files || event.dataTransfer.files, file, fileCount, url = event.dataTransfer ?
                event.dataTransfer.getData('URL') : null, txt = event.dataTransfer ?
                    event.dataTransfer.getData('Text/HTML') : null, suffix, src, target = this.morphAtPointer(), img = new Image(), canvas, i;

        function readSVG(aFile) {
            var pic = new Image(), frd = new FileReader(), trg = target;
            while (!trg.droppedSVG) {
                trg = trg.parent;
            }
            pic.onload = () => {
                trg.droppedSVG(pic, aFile.name);
                bulkDrop();
            };
            frd = new FileReader();
            frd.onloadend = (e) => pic.src = e.target.result;
            frd.readAsDataURL(aFile);
        }

        function readImage(aFile) {
            var pic = new Image(),
                frd = new FileReader(),
                trg = target,
                embedTag = MorphicPreferences.pngPayloadMarker;

            while (!trg.droppedImage) {
                trg = trg.parent;
            }

            pic.onload = () => {
                (async () => {
                    // extract embedded data (e.g. blocks)
                    // from the image's metadata if present
                    var buff = new Uint8Array(await aFile?.arrayBuffer()),
                        strBuff = buff.reduce((acc, b) => acc + String.fromCharCode(b), ""), embedded;

                    if (strBuff.includes(embedTag)) {
                        try {
                            embedded = decodeURIComponent(
                                (strBuff)?.split(embedTag)[1]
                            );
                        } catch (err) {
                            console.log(err);
                        }
                    }
                    canvas = newCanvas(new Point(pic.width, pic.height), true);
                    canvas.getContext('2d').drawImage(pic, 0, 0);
                    trg.droppedImage(canvas, aFile.name, embedded);
                    bulkDrop();
                })();
            };

            frd = new FileReader();
            frd.onloadend = (e) => pic.src = e.target.result;
            frd.readAsDataURL(aFile);
        }

        function readAudio (aFile) {
            var snd = new Audio(), frd = new FileReader(), trg = target;
            while (!trg.droppedAudio) {
                trg = trg.parent;
            }
            frd.onloadend = (e) => {
                snd.src = e.target.result;
                trg.droppedAudio(snd, aFile.name);
                bulkDrop();
            };
            frd.readAsDataURL(aFile);
        }

        function readText (aFile) {
            var frd = new FileReader(), trg = target;
            while (!trg.droppedText) {
                trg = trg.parent;
            }
            frd.onloadend = (e) => {
                trg.droppedText(e.target.result, aFile.name, aFile.type);
                bulkDrop();
            };
            frd.readAsText(aFile);
        }

        function readBinary (aFile) {
            var frd = new FileReader(), trg = target;
            while (!trg.droppedBinary) {
                trg = trg.parent;
            }
            frd.onloadend = (e) => {
                trg.droppedBinary(e.target.result, aFile.name);
                bulkDrop();
            };
            frd.readAsArrayBuffer(aFile);
        }

        function beginBulkDrop () {
            var trg = target;
            while (!trg.beginBulkDrop) {
                trg = trg.parent;
            }
            trg.beginBulkDrop();
        }

        function bulkDrop () {
            var trg = target;
            fileCount -= 1;
            if (files.length > 1 && fileCount === 0) {
                while (!trg.endBulkDrop) {
                    trg = trg.parent;
                }
                trg.endBulkDrop();
            }
        }

        function readURL (url, callback) {
            var request = new XMLHttpRequest();
            request.open('GET', url);
            request.onreadystatechange = () => {
                if (request.readyState === 4) {
                    if (request.responseText) {
                        callback(request.responseText);
                    } else {
                        throw new Error('unable to retrieve ' + url);
                    }
                }
            };
            request.send();
        }

        function parseImgURL (html) {
            var iurl = '', idx, c, start = html.indexOf('<img src="');
            if (start === -1) { return null; }
            start += 10;
            for (idx = start; idx < html.length; idx += 1) {
                c = html[idx];
                if (c === '"') {
                    return iurl;
                }
                iurl = iurl.concat(c);
            }
            return null;
        }

        if (files.length > 0) {
            fileCount = files.length;
            if (fileCount > 1) {
                beginBulkDrop();
            }
            for (i = 0; i < files.length; i += 1) {
                file = files[i];
                suffix = file.name.slice(
                    file.name.lastIndexOf('.') + 1
                ).toLowerCase();
                if (file.type.indexOf("svg") !== -1
                    && !MorphicPreferences.rasterizeSVGs) {
                    readSVG(file);
                } else if (file.type.indexOf("image") === 0) {
                    readImage(file);
                } else if (file.type.indexOf("audio") === 0 ||
                    file.type.indexOf("ogg") > -1) {
                    // check the file-extension because Firefox
                    // thinks OGGs are videos
                    readAudio(file);
                } else if ((file.type.indexOf("text") === 0) ||
                    contains(['txt', 'csv', 'json'], suffix)) {
                    // check the file-extension because Windows
                    // doesn't specify CSVs to be text/csv, sigh
                    readText(file);
                } else { // assume it's meant to be binary
                    readBinary(file);
                }
            }
        } else if (url) {
            suffix = url.slice(url.lastIndexOf('.') + 1).toLowerCase();
            if (contains(
                ['gif', 'png', 'jpg', 'jpeg', 'bmp'],
                suffix
            )) {
                while (!target.droppedImage) {
                    target = target.parent;
                }
                img = new Image();
                img.onload = () => {
                    canvas = newCanvas(new Point(img.width, img.height), true);
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    target.droppedImage(canvas);
                };
                img.src = url;
            } else if (suffix === 'svg' && !MorphicPreferences.rasterizeSVGs) {
                while (!target.droppedSVG) {
                    target = target.parent;
                }
                readURL(
                    url,
                    txt => {
                        var pic = new Image();
                        pic.onload = () => {
                            target.droppedSVG(
                                pic,
                                url.slice(
                                    url.lastIndexOf('/') + 1,
                                    url.lastIndexOf('.')
                                )
                            );
                        };
                        pic.src = 'data:image/svg+xml;utf8,' +
                            encodeURIComponent(txt);
                    }
                );
            }
        } else if (txt) {
            while (!target.droppedImage) {
                target = target.parent;
            }
            img = new Image();
            img.onload = () => {
                canvas = newCanvas(new Point(img.width, img.height), true);
                canvas.getContext('2d').drawImage(img, 0, 0);
                target.droppedImage(canvas);
            };
            src = parseImgURL(txt);
            if (src) { img.src = src; }
        }
    }

    // HandMorph tools

    destroyTemporaries() {
        /*
            temporaries are just an array of morphs which will be deleted upon
            the next mouse click, or whenever another temporary Morph decides
            that it needs to remove them. The primary purpose of temporaries is
            to display tools tips of speech bubble help.
        */
        this.temporaries.forEach(morph => {
            if (!(morph.isClickable
                && morph.bounds.containsPoint(this.position))) {
                morph.destroy();
                this.temporaries.splice(this.temporaries.indexOf(morph), 1);
            }
        });
    }

    fullChanged = HandMorph.prototype.changed;
}

// WorldMorph //////////////////////////////////////////////////////////

// I represent the <canvas> element

// WorldMorph inherits from FrameMorph:

class WorldMorph extends FrameMorph {
    // WorldMorph global settings & examples

    customMorphs = [];

    // WorldMorph instance creation:

    constructor (aCanvas, fillPage) {
        super();
        this.color = new Color(205, 205, 205);
        this.alpha = 1;
        this.bounds = new Rectangle(0, 0, aCanvas.width, aCanvas.height);
        this.isVisible = true;
        this.isDraggable = false;
        this.currentKey = null; // currently pressed key code
        this.worldCanvas = aCanvas;

        // additional properties:
        this.stamp = Date.now(); // reference in multi-world setups
        while (this.stamp === Date.now()) { nop(); }
        this.stamp = Date.now();

        this.useFillPage = fillPage;
        if (this.useFillPage === undefined) {
            this.useFillPage = true;
        }
        this.isDevMode = false;
        this.broken = [];
        this.animations = [];
        this.hand = new HandMorph(this);
        this.keyboardHandler = null;
        this.keyboardFocus = null;
        this.cursor = null;
        this.lastEditedText = null;
        this.activeMenu = null;
        this.activeHandle = null;

        if (!fillPage && aCanvas.isRetinaEnabled) {
            this.initRetina();
        }

        this.initKeyboardHandler();
        this.resetKeyboardHandler();
        this.initEventListeners();
    }

    // World Morph display:

    fullDrawOn (aContext, aRect) {
        super.fullDrawOn(aContext, aRect);
        this.hand.fullDrawOn(aContext, aRect);
    }

    updateBroken () {
        var ctx = this.worldCanvas.getContext('2d');
        this.condenseDamages();
        for (let i = 0; i < this.broken.length; i++) {
            const rect = this.broken[i];
            if (rect.extent.gt(ZERO)) {
                ctx.clearRect(rect.left, rect.top, rect.width, rect.height);
                this.fullDrawOn(ctx, rect);
            }
        }
        this.broken = [];
    }

    stepAnimations () {
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[i].step();
        }
        this.animations = this.animations.filter(anim => anim.isActive);
    }

    condenseDamages () {
        // collapse clustered damaged rectangles into their unions,
        // thereby reducing the array of brokens to a manageable size
        function condense(src) {
            var trgt = [], len = src.length, rect, test = each => each.isNearTo(rect, 20), hit, i;

            for (i = 0; i < len; i += 1) {
                rect = src[i];
                hit = detect(trgt, test);
                if (hit) {
                    hit.mergeWith(rect);
                } else {
                    trgt.push(rect);
                }
            }
            return trgt;
        }

        function mergeAll(rects) {
            var left = rects[0].origin.x,
                top = rects[0].origin.y,
                right = rects[0].corner.x,
                bottom = rects[0].corner.y,
                len = rects.length,
                each, i;

            for (i = 1; i < len; i += 1) {
                each = rects[i];
                left = Math.min(left, each.origin.x);
                top = Math.min(top, each.origin.y);
                right = Math.max(right, each.corner.x);
                bottom = Math.max(bottom, each.corner.y);
            }

            return new Rectangle(left, top, right, bottom);
        }

        if (this.broken.length > 1000) {
            this.broken = [mergeAll(this.broken)];
        } else {
            this.broken = condense(this.broken);
        }

        /* // overly eager reduction algorithm, commented out for performance
        var again = true,
            size = this.broken.length;
        
        while (again) {
            this.broken = condense(this.broken);
            again = (this.broken.length < size);
            size = this.broken.length;
        }
        */
    }

    doOneCycle () {
        this.stepFrame();
        this.stepAnimations();
        this.updateBroken();
    }

    fillPage () {
        var clientHeight = window.innerHeight, clientWidth = window.innerWidth;

        this.worldCanvas.style.position = "absolute";
        this.worldCanvas.style.left = "0px";
        this.worldCanvas.style.right = "0px";
        this.worldCanvas.style.width = "100%";
        this.worldCanvas.style.height = "100%";

        if (document.documentElement.scrollTop) {
            // scrolled down b/c of viewport scaling
            clientHeight = document.documentElement.clientHeight;
        }
        if (document.documentElement.scrollLeft) {
            // scrolled left b/c of viewport scaling
            clientWidth = document.documentElement.clientWidth;
        }
        if (this.worldCanvas.width !== clientWidth) {
            this.worldCanvas.width = clientWidth;
            this.width = clientWidth;
        }
        if (this.worldCanvas.height !== clientHeight) {
            this.worldCanvas.height = clientHeight;
            this.height = clientHeight;
        }
        this.children.forEach(child => {
            if (child.reactToWorldResize) {
                child.reactToWorldResize(this.bounds.copy());
            }
        });
    }

    initRetina () {
        var canvasHeight = this.worldCanvas.getBoundingClientRect().height,
            canvasWidth = this.worldCanvas.getBoundingClientRect().width;
        this.worldCanvas.style.width = canvasWidth + 'px';
        this.worldCanvas.width = canvasWidth;
        this.width = canvasWidth;
        this.worldCanvas.style.height = canvasHeight + 'px';
        this.worldCanvas.height = canvasHeight;
        this.height =  canvasHeight;
    }

    // WorldMorph global pixel access:

    getGlobalPixelColor (point) {
        // answer the color at the given point.
        var dta = this.worldCanvas.getContext('2d').getImageData(
            point.x,
            point.y,
            1,
            1
        ).data;
        return new Color(dta[0], dta[1], dta[2]);
    }

    // WorldMorph events:

    initKeyboardHandler () {
        var kbd = document.getElementById('morphic_keyboard');
        if (kbd) { // share existing handler with other worlds
            this.keyboardHandler = kbd;
            return;
        }
        kbd = document.createElement('textarea');
        kbd.setAttribute('id', 'morphic_keyboard');
        kbd.setAttribute('style', 'caret-color:transparent;');
        kbd.style.position = 'absolute';
        kbd.style.overflow = "hidden";
        kbd.style.border = 'none';
        kbd.style.resize = 'none';
        kbd.style.outline = 'none';
        kbd.style.border = 'none';
        kbd.wrap = "off";
        kbd.world = this;
        kbd.style.zIndex = -1;
        kbd.autofocus = true;
        kbd.style.width = '0px';
        kbd.style.height = '0px';
        document.body.appendChild(kbd);
        this.keyboardHandler = kbd;

        kbd.addEventListener(
            "keydown",
            event => {
                // remember the keyCode in the world's currentKey property
                kbd.world.currentKey = event.keyCode;
                if (kbd.world.activeMenu && !kbd.world.activeMenu.hasFocus) {
                    kbd.world.stopEditing();
                    kbd.world.activeMenu.getFocus();
                }
                if (kbd.world.keyboardFocus &&
                    kbd.world.keyboardFocus.processKeyDown) {
                    kbd.world.keyboardFocus.processKeyDown(event);
                }
                // suppress tab override and make sure tab gets
                // received by all browsers
                if (event.keyCode === 9) {
                    if (kbd.world.keyboardFocus &&
                        kbd.world.keyboardFocus.processKeyPress) {
                        kbd.world.keyboardFocus.processKeyPress(event);
                    }
                    event.preventDefault();
                }
                // suppress cmd-d/f/i/p/s override
                if ((event.ctrlKey || event.metaKey) &&
                    'dfiops'.includes(event.key)) {
                    event.preventDefault();
                }
            },
            true
        );

        kbd.addEventListener(
            "keyup",
            event => {
                // flush the world's currentKey property
                kbd.world.currentKey = null;
                // dispatch to keyboard receiver
                if (kbd.world.keyboardFocus &&
                    kbd.world.keyboardFocus.processKeyUp) {
                    kbd.world.keyboardFocus.processKeyUp(event);
                }
                event.preventDefault();
            },
            false
        );

        kbd.addEventListener(
            "keypress",
            event => {
                if (kbd.world.keyboardFocus &&
                    kbd.world.keyboardFocus.processKeyPress) {
                    kbd.world.keyboardFocus.processKeyPress(event);
                    event.preventDefault();
                }
            },
            false
        );

        kbd.addEventListener(
            "input",
            event => {
                if (kbd.world.keyboardFocus &&
                    kbd.world.keyboardFocus.processInput) {
                    // flush the world's currentKey property
                    kbd.world.currentKey = null;
                    kbd.world.keyboardFocus.processInput(event);
                } else {
                    kbd.world.keyboardHandler.value = '';
                }
                event.preventDefault();
            },
            false
        );
    }

    resetKeyboardHandler (keepValue) {
        var pos = getDocumentPositionOf(this.worldCanvas);

        function number2px(n) {
            return Math.ceil(n) + 'px';
        }

        if (!keepValue) {
            this.keyboardHandler.value = '';
        }
        this.keyboardHandler.style.top = number2px(pos.y);
        this.keyboardHandler.style.left = number2px(pos.x);
    }

    initEventListeners () {
        var canvas = this.worldCanvas;

        if (this.useFillPage) {
            this.fillPage();
        } else {
            this.changed();
        }

        canvas.addEventListener(
            "mousedown",
            event => {
                event.preventDefault();
                this.keyboardHandler.world = this; // focus the current world
                this.resetKeyboardHandler(true); // keep the handler's value
                if (!this.onNextStep) {
                    // horrible kludge to keep Safari from popping up
                    // a overlay when right-clicking out of a focused
                    // and edited text or string element
                    this.keyboardHandler.blur();
                    this.onNextStep = () => this.keyboardHandler.focus();
                }
                this.hand.processMouseDown(event);
            },
            true
        );

        canvas.addEventListener(
            "touchstart",
            event => this.hand.processTouchStart(event),
            false
        );

        canvas.addEventListener(
            "mouseup",
            event => {
                event.preventDefault();
                this.hand.processMouseUp(event);
            },
            false
        );

        canvas.addEventListener(
            "dblclick",
            event => {
                event.preventDefault();
                this.hand.processDoubleClick(event);
            },
            false
        );

        canvas.addEventListener(
            "touchend",
            event => this.hand.processTouchEnd(event),
            false
        );

        canvas.addEventListener(
            "mousemove",
            event => this.hand.processMouseMove(event),
            false
        );

        canvas.addEventListener(
            "touchmove",
            event => this.hand.processTouchMove(event),
            { passive: true }
        );

        canvas.addEventListener(
            "contextmenu",
            event => event.preventDefault(),
            true // suppress context menu for Mac-Firefox
        );

        canvas.addEventListener(
            "mousewheel",
            event => {
                this.hand.processMouseScroll(event);
                event.preventDefault();
            },
            false
        );
        canvas.addEventListener(
            "DOMMouseScroll",
            event => {
                this.hand.processMouseScroll(event);
                event.preventDefault();
            },
            false
        );

        window.addEventListener(
            "dragover",
            event => event.preventDefault(),
            true
        );
        window.addEventListener(
            "drop",
            event => {
                this.hand.processMouseMove(event);
                this.hand.processDrop(event);
                event.preventDefault();
            },
            false
        );

        window.addEventListener(
            "resize",
            () => {
                if (this.useFillPage) {
                    this.fillPage();
                }
            },
            false
        );

        window.onbeforeunload = (evt) => {
            var e = evt || window.event, msg = "Are you sure you want to leave?";
            // For IE and Firefox
            if (e) {
                e.returnValue = msg;
            }
            // For Safari / chrome
            return msg;
        };
    }

    wantsDropOf () {
        // allow handle drops if any drops are allowed
        return this.acceptsDrops;
    }

    // WorldMorph text field tabbing:

    nextTab (editField) {
        var next = this.nextEntryField(editField);
        if (next) {
            editField.clearSelection();
            next.selectAll();
            next.edit();
        }
    }

    previousTab (editField) {
        var prev = this.previousEntryField(editField);
        if (prev) {
            editField.clearSelection();
            prev.selectAll();
            prev.edit();
        }
    }

    // WorldMorph menu:

    contextMenu () {
        var menu;

        if (this.isDevMode) {
            menu = new MenuMorph(this, this.constructor.name ||
                this.constructor.toString().split(' ')[1].split('(')[0]);
        } else {
            menu = new MenuMorph(this, 'Morphic');
        }
        if (this.isDevMode) {
            menu.addItem("demo...", 'userCreateMorph', 'sample morphs');
            menu.addLine();
            menu.addItem("hide all...", 'hideAll');
            menu.addItem("show all...", 'showAllHiddens');
            menu.addItem(
                "move all inside...",
                'keepAllSubmorphsWithin',
                'keep all submorphs\nwithin and visible'
            );
            menu.addItem(
                "inspect...",
                'inspect',
                'open a window on\nall properties'
            );
            menu.addItem(
                "screenshot...",
                () => window.open(this.fullImage().toDataURL()),
                'open a new window\nwith a picture of this morph'
            );
            menu.addLine();
            menu.addItem(
                "restore display",
                'changed',
                'redraw the\nscreen once'
            );
            menu.addItem(
                "fill page...",
                'fillPage',
                'let the World automatically\nadjust to browser resizing'
            );
            if (useBlurredShadows) {
                menu.addItem(
                    "sharp shadows...",
                    'toggleBlurredShadows',
                    'sharp drop shadows\nuse for old browsers'
                );
            } else {
                menu.addItem(
                    "blurred shadows...",
                    'toggleBlurredShadows',
                    'blurry shades,\n use for new browsers'
                );
            }
            menu.addItem(
                "color...",
                () => {
                    this.pickColor(
                        menu.title + localize('\ncolor:'),
                        this.setColor,
                        this,
                        this.color
                    );
                },
                'choose the World\'s\nbackground color'
            );
            if (MorphicPreferences === standardSettings) {
                menu.addItem(
                    "touch screen settings",
                    'togglePreferences',
                    'bigger menu fonts\nand sliders'
                );
            } else {
                menu.addItem(
                    "standard settings",
                    'togglePreferences',
                    'smaller menu fonts\nand sliders'
                );
            }
            if (MorphicPreferences.showHoles) {
                menu.addItem(
                    'hide holes',
                    'toggleHolesDisplay',
                    'debug untouchable regions'
                );
            } else {
                menu.addItem(
                    'show holes',
                    'toggleHolesDisplay',
                    'debug untouchable regions'
                );
            }
            menu.addLine();
        }
        if (this.isDevMode) {
            menu.addItem(
                "user mode...",
                'toggleDevMode',
                'disable developers\'\ncontext menus'
            );
        } else {
            menu.addItem("development mode...", 'toggleDevMode');
        }
        menu.addItem("about morphic.js...", 'about');
        return menu;
    }

    userCreateMorph () {
        var myself = this, menu, newMorph;

        function create(aMorph) {
            var cpy = aMorph.fullCopy();
            cpy.isDraggable = true;
            cpy.pickUp(myself);
        }

        menu = new MenuMorph(this, 'make a morph');
        menu.addItem('rectangle', () => create(new Morph()));
        menu.addItem('box', () => create(new BoxMorph()));
        menu.addItem('circle box', () => create(new CircleBoxMorph()));
        menu.addLine();
        menu.addItem('slider', () => create(new SliderMorph()));
        menu.addItem('dial', () => {
            newMorph = new DialMorph();
            newMorph.pickUp(this);
        });
        menu.addItem('frame', () => {
            newMorph = new FrameMorph();
            newMorph.extent = new Point(350, 250);
            create(newMorph);
        });
        menu.addItem('scroll frame', () => {
            newMorph = new ScrollFrameMorph();
            newMorph.contents.acceptsDrops = true;
            newMorph.contents.adjustBounds();
            newMorph.extent = new Point(350, 250);
            create(newMorph);
        });
        menu.addItem('handle', () => create(new HandleMorph()));
        menu.addLine();
        menu.addItem("clock", () => create(new ClockMorph()));
        menu.addItem('string', () => {
            newMorph = new StringMorph('Hello, World!');
            newMorph.isEditable = true;
            create(newMorph);
        });
        menu.addItem('text', () => {
            newMorph = new TextMorph(
                "Ich wei\u00DF nicht, was soll es bedeuten, dass ich so " +
                "traurig bin, ein M\u00E4rchen aus uralten Zeiten, das " +
                "kommt mir nicht aus dem Sinn. Die Luft ist k\u00FChl " +
                "und es dunkelt, und ruhig flie\u00DFt der Rhein; der " +
                "Gipfel des Berges funkelt im Abendsonnenschein. " +
                "Die sch\u00F6nste Jungfrau sitzet dort oben wunderbar, " +
                "ihr gold'nes Geschmeide blitzet, sie k\u00E4mmt ihr " +
                "goldenes Haar, sie k\u00E4mmt es mit goldenem Kamme, " +
                "und singt ein Lied dabei; das hat eine wundersame, " +
                "gewalt'ge Melodei. Den Schiffer im kleinen " +
                "Schiffe, ergreift es mit wildem Weh; er schaut " +
                "nicht die Felsenriffe, er schaut nur hinauf in " +
                "die H\u00F6h'. Ich glaube, die Wellen verschlingen " +
                "am Ende Schiffer und Kahn, und das hat mit ihrem " +
                "Singen, die Loreley getan."
            );
            newMorph.isEditable = true;
            newMorph.maxWidth = 300;
            newMorph.fixLayout();
            create(newMorph);
        });
        menu.addItem('speech bubble', () => {
            newMorph = new SpeechBubbleMorph('Hello, World!');
            create(newMorph);
        });
        menu.addLine();
        menu.addItem('gray scale palette', () => create(new GrayPaletteMorph()));
        menu.addItem('color palette', () => create(new ColorPaletteMorph()));
        menu.addItem('color picker', () => create(new ColorPickerMorph()));
        menu.addLine();
        menu.addItem('sensor demo', () => {
            newMorph = new MouseSensorMorph();
            newMorph.setColor(new Color(230, 200, 100));
            newMorph.edge = 35;
            newMorph.border = 15;
            newMorph.borderColor = new Color(200, 100, 50);
            newMorph.alpha = 0.2;
            newMorph.extent = new Point(100, 100);
            create(newMorph);
        });
        menu.addItem('animation demo', () => {
            var foo, bar, baz, garply, fred;

            foo = new BouncerMorph();
            foo.position = new Point(50, 20);
            foo.extent = new Point(300, 200);
            foo.alpha = 0.9;
            foo.speed = 3;

            bar = new BouncerMorph();
            bar.setColor(new Color(50, 50, 50));
            bar.position = new Point(80, 80);
            bar.extent = new Point(80, 250);
            bar.type = 'horizontal';
            bar.direction = 'right';
            bar.alpha = 0.9;
            bar.speed = 5;

            baz = new BouncerMorph();
            baz.setColor(new Color(20, 20, 20));
            baz.position = new Point(90, 140);
            baz.extent = new Point(40, 30);
            baz.type = 'horizontal';
            baz.direction = 'right';
            baz.speed = 3;

            garply = new BouncerMorph();
            garply.setColor(new Color(200, 20, 20));
            garply.position = new Point(90, 140);
            garply.extent = new Point(20, 20);
            garply.type = 'vertical';
            garply.direction = 'up';
            garply.speed = 8;

            fred = new BouncerMorph();
            fred.setColor(new Color(20, 200, 20));
            fred.position = new Point(120, 140);
            fred.extent = new Point(20, 20);
            fred.type = 'vertical';
            fred.direction = 'down';
            fred.speed = 4;

            bar.add(garply);
            bar.add(baz);
            foo.add(fred);
            foo.add(bar);

            create(foo);
        });
        menu.addItem('pen', () => create(new PenMorph()));
        if (this.customMorphs.length) {
            menu.addLine();
            this.customMorphs.forEach(item => {
                var sub;
                if (item instanceof Array) { // assume [name, [morphs]]
                    sub = new MenuMorph();
                    item[1].forEach(morph => sub.addItem(morph,
                        () => create(morph instanceof Array ? morph[0] : morph)));
                    menu.addMenu(item[0], sub);
                } else { // assume a Morph
                    menu.addItem(item.toString(), () => create(item));
                }
            });
        }
        menu.popUpAtHand(this);
    }

    toggleDevMode () {
        this.isDevMode = !this.isDevMode;
    }
    
    hideAll () {
        this.children.forEach(child => child.hide());
    }

    showAllHiddens () {
        this.forAllChildren(child => {
            if (!child.isVisible) {
                child.show();
            }
        });
    }

    about () {
        var versions = '', module;

        for (module in modules) {
            if (Object.prototype.hasOwnProperty.call(modules, module)) {
                versions += ('\n' + module + ' (' + modules[module] + ')');
            }
        }
        if (versions !== '') {
            versions = '\n\nmodules:\n\n' +
                'morphic (' + morphicVersion + ')' +
                versions;
        }

        this.inform(
            'morphic.js\n\n' +
            'a lively Web GUI\ninspired by Squeak\n' +
            morphicVersion +
            '\n\nwritten by Jens M\u00F6nig\njens@moenig.org' +
            versions
        );
    }

    edit (aStringOrTextMorph) {
        if (this.lastEditedText === aStringOrTextMorph) {
            return;
        }
        if (!isNil(this.lastEditedText)) {
            this.stopEditing();
        }
        if (!aStringOrTextMorph.isEditable) {
            return null;
        }
        if (this.cursor) {
            this.cursor.destroy();
        }

        // some magic we apparently need for Android
        this.worldCanvas.focus();
        this.keyboardHandler.focus();

        // create a new cursor
        this.cursor = new CursorMorph(aStringOrTextMorph, this.keyboardHandler);
        this.keyboardFocus = this.cursor;
        aStringOrTextMorph.parent.add(this.cursor);
        this.cursor.rerender();
        if (MorphicPreferences.useSliderForInput) {
            if (!aStringOrTextMorph.parentThatIsA(MenuMorph)) {
                this.slide(aStringOrTextMorph);
            }
        }
        if (this.lastEditedText !== aStringOrTextMorph) {
            aStringOrTextMorph.escalateEvent('freshTextEdit', aStringOrTextMorph);
        }
        this.lastEditedText = aStringOrTextMorph;
    }

    slide (aStringOrTextMorph) {
        // display a slider for numeric text entries
        var val = parseFloat(aStringOrTextMorph.text), menu, slider;

        if (isNaN(val)) {
            val = 0;
        }
        menu = new MenuMorph();
        slider = new SliderMorph(
            val - 25,
            val + 25,
            val,
            10,
            'horizontal'
        );
        slider.alpha = 1;
        slider.color = new Color(225, 225, 225);
        slider.button.color = menu.borderColor;
        slider.button.highlightColor = slider.button.color.copy();
        slider.button.highlightColor.b += 100;
        slider.button.pressColor = slider.button.color.copy();
        slider.button.pressColor.b += 150;
        slider.extent = new Point(
            MorphicPreferences.scrollBarSize * 10,
            MorphicPreferences.menuFontSize
        );
        slider.action = (num) => {
            aStringOrTextMorph.changed();
            aStringOrTextMorph.text = Math.round(num).toString();
            aStringOrTextMorph.fixLayout();
            aStringOrTextMorph.rerender();
            aStringOrTextMorph.escalateEvent(
                'reactToSliderEdit',
                aStringOrTextMorph
            );
        };
        menu.items.push(slider);
        menu.popup(this, aStringOrTextMorph.bottomLeft.add(new Point(0, 5)));
    }

    stopEditing () {
        if (this.cursor) {
            this.cursor.target.escalateEvent('reactToEdit', this.cursor.target);
            this.cursor.target.clearSelection();
            this.cursor.destroy();
            this.cursor = null;
        }
        if (this.keyboardFocus && this.keyboardFocus.stopEditing) {
            this.keyboardFocus.stopEditing();
        }
        this.keyboardFocus = null;
        this.lastEditedText = null;
    }

    toggleBlurredShadows () {
        useBlurredShadows = !useBlurredShadows;
    }

    togglePreferences () {
        if (MorphicPreferences === standardSettings) {
            MorphicPreferences = touchScreenSettings;
        } else {
            MorphicPreferences = standardSettings;
        }
    }

    toggleHolesDisplay () {
        MorphicPreferences.showHoles = !MorphicPreferences.showHoles;
        this.rerender();
    }

    mouseDownLeft = nop;
    mouseClickLeft = nop;
    mouseDownRight = nop;
    mouseClickRight = nop;

    droppedImage = nop;
    droppedSVG = nop;
    droppedAudio = nop;
    droppedText = nop;
    beginBulkDrop = nop;
    endBulkDrop = nop;
}
