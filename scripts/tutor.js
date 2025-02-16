"use strict";
function startTutor(id) {
    var allDialogs, // List of all dialog objects, populated from html automagically
        nextDialogIndex;

    function closeDialog() {
        $(this).dialog("close");
    }

    function nextDialog() {
        if (nextDialogIndex < allDialogs.size()) {
            if (nextDialogIndex == allDialogs.size() - 1) {
                sim.misc.tutorFinished(true);
            }

            allDialogs.eq(nextDialogIndex).dialog("open");
            nextDialogIndex++;
        }
    }

    var highlightClass = "tutor-highlight";

    var commonOptions = {
        autoOpen: false,
        resizable: false,
        draggable: false,
        minHeight: 0,
        modal: false,
        width: "auto",
        show: "fade",
        hide: "fade",
        dialogClass: "tutor",
        performHighlighting: true,
        buttons: [ {
            text: localize("Got it!"),
            click: closeDialog
        }, {
            text: localize("Skip tutor"),
            click: function() {
                nextDialogIndex = allDialogs.size() - 1;
                $(this).dialog("close");
            }
        }
        ],
        open: function() {
            var $this = $(this);
            if ($this.dialog('option', "performHighlighting")) {
                $($this.dialog('option', 'position').of).addClass(highlightClass);
            }
        },
        close: function() {
            var $this = $(this);
            if ($this.dialog('option', "performHighlighting")) {
                $($this.dialog('option', 'position').of).removeClass(highlightClass);
            }
            nextDialog();
        }
    };

    var specificOptions = {
        "welcome": {
            modal: true,
            performHighlighting: false,
            position: {
                of: "#map-canvas"
            }
        },
        "dz-selection": {
            position: {
                of: "#dz-finder",
                my: "center top",
                at: "center bottom+10"
            }
        },
        "target": {
            performHighlighting: false,
            position: {
                of: "#map-canvas",
                my: "left top",
                at: "center+10 center+10"
            }
        },
        "wind": {
            position: {
                of: "#wind-conditions",
                my: "right top",
                at: "left top"
            }
        },
        "reachset": {
            position: {
                of: "#display-ui-element-buttons",
                my: "right top",
                at: "left bottom"
            }
        },
        "pattern": {
            position: {
                of: "#pattern-settings",
                my: "right top",
                at: "left top"
            }
        },
        "restart": {
            position: {
                of: ".tutor-button:visible",
                my: "right top",
                at: "left bottom"
            }
        },
        "rightclick": {
            modal: false,
            performHighlighting: false,
            buttons: [],
            position: {
                of: "#map-canvas",
                my: "center bottom",
                at: "center bottom-50"
            }
        }
    };

    var allDialogs = $(id).children("div");

    allDialogs.each(function() {
        var specific = specificOptions[$(this).attr("id").replace("tutor-","")];
        $(this).dialog(commonOptions).dialog("option", specific);
    });

    var finished = sim.misc.tutorFinished();
    nextDialogIndex = finished ? allDialogs.size() - 1 : 0;
    nextDialog();

    $(".tutor-button").click(function() {
        nextDialogIndex = 0;
        var visible = allDialogs.filter(function() { return $(this).dialog("isOpen") }).dialog("close");
        if (visible.size() == 0) {
            nextDialog();
        }
    });
}
