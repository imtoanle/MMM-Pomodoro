/* Some code snippets of this file were copied from the default alert module https://github.com/MichMich/MagicMirror/tree/development/modules/default/alert */

Module.register("MMM-Pomodoro", {
defaults: {
	animation: true
},

getStyles: function() {
	return ["MMM-Pomodoro.css"];
},

start: function() {
	this.isVisible = false;
	this.firstMessage = true;
},

notificationReceived: function(notification, payload, sender) {
  switch(notification) {
    case "START_TIMER":
		this.minutes = Math.floor(payload / 60);
		this.seconds = (payload % 60);
		this.initialisePomodoro(true);
		break
	case "INTERRUPT_POMODORO":
		this.minutes = -1;
		this.seconds = -1;
		clearInterval(this.pomodoro);
		this.removeOverlay();
	  	break
	case "PAUSE_POMODORO":
		clearInterval(this.pomodoro);
		break
	case "UNPAUSE_TIMER":
		if(this.minutes > -1 && this.seconds > -1) {
			this.initialisePomodoro(true);
		}
		break
	case "START_STOPWATCH":
		this.minutes = 0;
		this.seconds = 0;
		this.initialisePomodoro(false);
		break
	case "UNPAUSE_STOPWATCH":
		if(this.minutes > -1 && this.seconds > -1) {
			this.initialisePomodoro(false);
		}
  }
},

initialisePomodoro: function(isCounter){
	clearInterval(this.pomodoro);
	if(this.isVisible) {
    	this.removeOverlay();
    }
    this.createOverlay();
    this.pomodoro = setInterval(()=>{
	if(isCounter) {
	  	this.createTimer()
	} else {
		this.createStopwatch()
	}
  	}, 1000)
},

createOverlay: function() {
	const overlay = document.createElement("div");
	overlay.id = "overlay";
	overlay.innerHTML += '<div class="black_overlay"></div>';
	document.body.insertBefore(overlay, document.body.firstChild);
	this.ntf = document.createElement("div")
	this.isVisible = true;
},

removeOverlay: function() {
	const overlay = document.getElementById("overlay");
	overlay.parentNode.removeChild(overlay);
	document.body.removeChild(this.ntf);
	this.isVisible = false;
	this.firstMessage = true;
},

displayMessagePopup: function(message) {
  let strinner = '<div class="ns-box-inner">';
  strinner += "<span class='regular normal medium'>" + message + "</span>";
  strinner += "</div>";
  this.ntf.innerHTML = strinner;
  this.ntf.className = "ns-alert ns-growl ns-effect-jelly ns-type-notice ns-show"
  document.body.insertBefore(this.ntf, document.body.nextSibling);
},

displayMessageNoPopup: function(message) {
  let strinner = '<div class="ns-box-inner">';
  strinner += "<span class='regular normal medium'>" + message + "</span>";
  strinner += "</div>";
  this.ntf.innerHTML = strinner;
  if(this.firstMessage) {
  	this.ntf.className = "ns-alert ns-growl ns-effect-jelly ns-type-notice ns-show"
  	document.body.insertBefore(this.ntf, document.body.nextSibling);
  	this.firstMessage = false;
  }
},

endingSound: function(soundName) {
	let sound = new Audio();
	sound.src = `modules/MMM-Pomodoro/sounds/${soundName}.wav`;
	sound.play();
},

createTimer: function() {
		if(this.minutes == 0 && this.seconds == 0){
			this.decreaseTime();
			this.displayMessageNoPopup('Done');
			this.endingSound("pomodoro");
			// this.sendSocketNotification("MMM-Pomodoro-SAVEDATA", { time: new Date });
			setTimeout(() => {
				this.removeOverlay()
			}, 3000);
		}
		if(this.minutes > 0 || this.seconds > 0) {
			if(this.config.animation) {
				if(this.seconds < 10) {
					this.displayMessagePopup(this.minutes + ':0' + this.seconds);
				} else {
					this.displayMessagePopup(this.minutes + ':' + this.seconds);
				}
			} else {	
				if(this.seconds < 10) {
					this.displayMessageNoPopup(this.minutes + ':0' + this.seconds);
				} else {
					this.displayMessageNoPopup(this.minutes + ':' + this.seconds);
				}
			}
			this.decreaseTime();
		}
},

createStopwatch: function() {
	if(this.config.animation) {
		if(this.seconds < 10) {
			this.displayMessagePopup(this.minutes + ':0' + this.seconds);
		} else {
			this.displayMessagePopup(this.minutes + ':' + this.seconds);
		}
	} else {
			if(this.seconds < 10) {
			this.displayMessageNoPopup(this.minutes + ':0' + this.seconds);
		} else {
			this.displayMessageNoPopup(this.minutes + ':' + this.seconds);
		}
	}
	this.increaseTime();
},

decreaseTime: function() {
	if(this.seconds > 0) {
		this.seconds--
	} else {
		if(this.minutes > 0) {
			this.minutes--
			this.seconds = 59;
		} else {
			this.minutes = -1;
			this.seconds = -1;	
		}
	}	
},

increaseTime: function() {
	if(this.seconds < 59) {
		this.seconds++
	} else {
		this.seconds = 0;
		this.minutes++;
	}
},
})
