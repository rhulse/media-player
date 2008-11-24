/*
 	Attach Audio player Popup Plugin

	This plugin attaches events to specified elements and pops up a window

	Copyright (c) 2008 Radio New Zealand
	Author: Richard Hulse
	This software is released under the GNU GPL version 2 or later. <http://www.opensource.org/licenses/gpl-2.0.php>

	based in part on Popupwindow plugin for jQuery by Tony Petruzzi, homepage: http://rip747.wordpress.com

	required plugins: cookie, cookieplaylist

*/

// the mode to determine what is sent to the playlist
const PLAYLIST_ID 	= 1;
const PLAYLIST_HREF = 2;

(function($) {

	// set up the cookie playlist manager
	var playlist_queue = $.cookiePlaylist.initialise('audio_playlist_queue');

  $.fn.attachPlayerPopup = function(options) {

    var settings = $.extend({}, $.fn.attachPlayerPopup.defaults, options);

    return this.each(function() {

			// center the window
			if (settings.center == 1){
				settings.top = (screen.height-(settings.height + 110))/2;
				settings.left = (screen.width-settings.width)/2;
			}

			parameters = "location=" + settings.location + ",menubar=" + settings.menubar + ",height=" + settings.height + ",width=" + settings.width + ",toolbar=" + settings.toolbar + ",scrollbars=" + settings.scrollbars  + ",status=" + settings.status + ",resizable=" + settings.resizable + ",left=" + settings.left  + ",screenX=" + settings.left + ",top=" + settings.top  + ",screenY=" + settings.top;

	    $(this).click(function(event) {
				event.preventDefault();

				var metadata;

				if ( settings.mode == PLAYLIST_HREF ) {
					metadata = this.href;
				}
				else {
					metadata = this.id.split( "_" )[1] || 0;
				}

				$.fn.attachPlayerPopup.prototype.doPopup(settings.play_url, metadata, 'AudioPlayerPopUp', parameters);
			});

  	});

	}

  $.fn.attachPlayerPopup.prototype.doPopup = function( url, metadata, name, params ){

		/*
			There are two ways to test for the existence of the audio player window.
			The cookie and the window object that is saved with the window the opens it

			Case | Player Cookie | Player Object | Status
			=====|===============|===============|=================================================
				1	 |    	1		  	 |			 1		   | Window is open and is linked to this window
			-----|---------------|---------------|--------------------------------------------------
				2	 |   		1				 |			 0			 | Window is open and is not linked to this window
			-----|---------------|---------------|--------------------------------------------------
				3	 |   expired		 |			 0			 | Window may be open and not linked to this window
			-----|---------------|---------------|--------------------------------------------------
				4	 | 			0				 |			 0			 | There is no window

			For case 3 we assume that after 2 hours there is probably no window anymore

		*/

	  var PLAYER = $(window).data('player') || false ;

		// work out the current age of the player
		var time = new Date();
		var current_timestamp = Math.floor(time.getTime()/1000);

		// get the cookie time or use the current_timestamp
		var player_timestamp = $.cookie('audioPlayerOpen') || current_timestamp;

		// player_age will equal the age of the player cookie relative to now.
		// a value of 0 means there is no player yet.
		var player_age = current_timestamp - player_timestamp;

		// add the item to the playlist queue which works for all cases
		//add_to_playlist( metadata );

		// then do explicit handling as required
		try{
	   	if ( player_age > 7200 || player_age == 0 ) {
				// CASE 3 & 4
				playlist_queue.clear();
				// if PLAYER is not open or has expired (2 hours) then open a new one
				PLAYER = window.open( url, name, params );
				if( PLAYER ) {
					PLAYER.focus();
					$(window).data( 'player', PLAYER );
				}
	    }
			else if( PLAYER ){
				// CASE 1 & 2
				// the PLAYER window exists and is attached
				if( ! PLAYER.closed ){
					PLAYER.focus();
				}
			}
		}
		catch(ex){
			// some unexpected error
		}
		if( metadata ) {
			playlist_queue.add( metadata );
			// playlist_queue.show();
		}
	}

  $.fn.attachPlayerPopup.defaults = {
		mode			: PLAYLIST_ID,
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
