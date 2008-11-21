/*
 	Attach Popup Plugin

	This plugin attaches events to specified elements and pops up a window

	Copyright (c) 2008 Radio New Zealand
	Author: Richard Hulse
	This software is released under the GNU GPL version 2 or later. <http://www.opensource.org/licenses/gpl-2.0.php>

	based in part on Popupwindow plugin for jQuery by Tony Petruzzi, homepage: http://rip747.wordpress.com

*/

(function($) {
  $.fn.attachPopup = function(options) {

    var settings = $.extend({}, $.fn.attachPopup.defaults, options);

    return this.each(function() {

			// center the window
			if (settings.center == 1){
				settings.top = (screen.height-(settings.height + 110))/2;
				settings.left = (screen.width-settings.width)/2;
			}

			parameters = "location=" + settings.location + ",menubar=" + settings.menubar + ",height=" + settings.height + ",width=" + settings.width + ",toolbar=" + settings.toolbar + ",scrollbars=" + settings.scrollbars  + ",status=" + settings.status + ",resizable=" + settings.resizable + ",left=" + settings.left  + ",screenX=" + settings.left + ",top=" + settings.top  + ",screenY=" + settings.top;

	    $(this).click(function(event) {
				event.preventDefault();
				POPUP = window.open(settings.play_url, 'AudioPlayerPopUp', parameters);
				if( POPUP ) {
					POPUP.focus();
				}
			});

  	});

	}

  $.fn.attachPopup.defaults = {
		play_url	: 'player.html',
		height		: 500, 	// sets the height in pixels of the window.
		width			: 550, 	// sets the width in pixels of the window.
		toolbar		: 0, 		// determines whether a toolbar (includes the forward and back buttons) is displayed {1 (YES) or 0 (NO)}.
		scrollbars: 0, 		// determines whether scrollbars appear on the window {1 (YES) or 0 (NO)}.
		status		: 0, 		// whether a status line appears at the bottom of the window {1 (YES) or 0 (NO)}.
		resizable	: 1, 		// whether the window can be resized {1 (YES) or 0 (NO)}. Can also be overloaded using resizable.
		left			: 0, 		// left position when the window appears.
		top				: 0, 		// top position when the window appears.
		center		: 1, 		// should we center the window? {1 (YES) or 0 (NO)}. overrides top and left
		location	: 0, 		// determines whether the address bar is displayed {1 (YES) or 0 (NO)}.
		menubar		: 0 		// determines whether the menu bar is displayed {1 (YES) or 0 (NO)}.
	}

})(jQuery);
