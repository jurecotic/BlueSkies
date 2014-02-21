/// Different custom bindings

ko.bindingHandlers.rotate = {
    update: function(element, valueAccessor) {
        rotateDiv($(element).get(0), ko.unwrap(valueAccessor()));
    }
};

ko.bindingHandlers.ruler = {
    update: function(element, valueAccessor) {
        var $element = $(element),
            max = ko.unwrap(valueAccessor()),

            prevOffset = 0;

        $element.children("li").each(function() {
            var $this = $(this),
                value = Number($this.text()),
                offset = Math.round(value / max * 100);
            $this.css("padding-left", (offset - prevOffset) + "%");
            prevOffset = offset;
        });
    }
};

/// Visibility bindings
ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        var shouldDisplay = ko.unwrap(valueAccessor());
        $(element).toggle(shouldDisplay);
    },
    update: function(element, valueAccessor) {
        var shouldDisplay = ko.unwrap(valueAccessor());
        shouldDisplay ? $(element).fadeIn() : $(element).fadeOut();
    }
};

ko.bindingHandlers.slideVisible = {
    init: function(element, valueAccessor) {
        var shouldDisplay = ko.unwrap(valueAccessor());
        $(element).toggle(shouldDisplay);
    },
    update: function(element, valueAccessor) {
        var shouldDisplay = ko.unwrap(valueAccessor());
        shouldDisplay ? $(element).slideDown() : $(element).slideUp();
    }
};

/// jQueury UI bindings
ko.bindingHandlers.jqSlider = {
    init: function(element, valueAccessor, allBindings) {
        $(element)
            .slider(allBindings.get('sliderOptions'))
            .on('slide', function(event, ui) {
                valueAccessor()(ui.value);
            })
            .find(".ui-slider-handle").unbind('keydown');
    },
    update: function(element, valueAccessor) {
        $(element).slider("value", ko.unwrap(valueAccessor()));
    }
};

ko.bindingHandlers.jqButtonset = {
    init: function(element, valueAccessor, allBindings) {
        $(element).buttonset();
        if (allBindings.get('no_padding')) {
            $(element)
                .find('span.ui-button-text')
                    .addClass('no-padding');
        }
    },
    update: function(element, valueAccessor) {
        $(element).buttonset('refresh');
    }
};

ko.bindingHandlers.jqProgressbar = {
    init: function(element, valueAccessor) {
        $(element).progressbar();
    },
    update: function(element, valueAccessor) {
        $(element).progressbar(ko.unwrap(valueAccessor()));
    }
};

/// Google maps api bindings

ko.bindingHandlers.marker = {
    init: function(element, valueAccessor, allBindings) {
        var options = allBindings.get('markerOptions');
        var marker = new google.maps.Marker(options);
    },
    update: function(element, valueAccessor, allBindings) {
        var marker = allBindings.get('marker');
        marker.setPosition(ko.unwrap(valueAccessor()));
    }
};

/// Presentation bindings
ko.bindingHandlers.setLanguage = {
    init: function(element, valueAccessor) {
        var language = ko.unwrap(valueAccessor());
        setLanguage(element, language);
    },
    update: function(element, valueAccessor) {
        var language = ko.unwrap(valueAccessor());
        setLanguage(element, language);
    }
};
