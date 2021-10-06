/* Some code snippets of this file were copied from the default alert module https://github.com/MichMich/MagicMirror/tree/development/modules/default/alert */

var self;

Module.register("MMM-Pomodoro", {
	defaults: {
		animation: true
	},

	getStyles: function() {
		return ["MMM-Pomodoro.css"];
	},

	start: function() {
		self = this;
		this.isVisible = false;
		this.firstMessage = true;
	},

	notificationReceived: function(notification, payload, sender) {
		switch(notification) {
			case "START_TIMER":
			this.startTimer(payload.seconds, payload.type);
			break
		case "INTERRUPT_POMODORO":
			this.stopTimer();
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

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "MMM-Pomodoro-SAVEDATA") {
			
			switch(payload.next_type) {
				case "relax-30":
					this.displayMessageNoPopup("Do you want to long relax (30 mins) ?");
					break
				case "relax-5":
					this.displayMessageNoPopup("Do you want to relax 5 mins ?");
					break
				case "pomodoro":
					this.displayMessageNoPopup("Do you want to start another pomodoro ?");
			}

			this.displayMessageNoPopup('Yes', 'width-20', true, this.agreeClicked(payload.next_type));
			this.displayMessageNoPopup('No', 'width-20', true, this.disagreeClicked);
		}
	},

	startTimer: function(seconds, type){
		this.minutes = Math.floor(seconds / 60);
		this.seconds = (seconds % 60);
		this.initialisePomodoro(true, type);
	},
	stopTimer: function(){
		this.minutes = -1;
		this.seconds = -1;
		clearInterval(this.pomodoro);
		this.removeOverlay();
	},

	agreeClicked: function(type) {
		return function() {
			switch(type) {
				case "relax-30":
					self.startTimer(30, type);
					break
				case "relax-5":
					self.startTimer(5, type);
					break
				case "pomodoro":
					self.startTimer(25, type);
			}
		};
	},

	disagreeClicked: function() {
		self.stopTimer();
	},

	initialisePomodoro: function(isCounter, pomodoroType){
		pomodoroType = typeof pomodoroType !== 'undefined' ? pomodoroType : "pomodoro";

		clearInterval(this.pomodoro);
		if(this.isVisible) {
				this.removeOverlay();
			}
			this.createOverlay();
			this.pomodoro = setInterval(()=>{
		if(isCounter) {
				this.createTimer(pomodoroType)
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

	displayMessageNoPopup: function(message, additionClasses, isAppended, callback) {
		callback = typeof callback !== 'undefined' ? callback : function(){};
		additionClasses = typeof additionClasses !== 'undefined' ? additionClasses : "";
		isAppended = typeof isAppended !== 'undefined' ? isAppended : false;

		let child = document.createElement("div");
		child.className = `${additionClasses} alert-box ns-alert ns-growl ns-effect-jelly ns-type-notice ns-show`;
		child.innerHTML = `<div class="ns-box-inner"><span class='regular normal medium'>${message}</span></div>`;
		child.onclick = callback;
		if (isAppended) {
			this.ntf.appendChild(child);
		} else {
			this.ntf.innerHTML = child.outerHTML;
		}

		if(this.firstMessage) {
			this.ntf.className = "pomodoro-section"
			document.body.insertBefore(this.ntf, document.body.nextSibling);
			this.firstMessage = false;
		}
	},

	endingSound: function(soundName) {
		let sound = new Audio();
		sound.src = `modules/MMM-Pomodoro/sounds/${soundName}.wav`;
		sound.play();
	},

	createTimer: function(pomodoroType) {
			if(this.minutes == 0 && this.seconds == 0){
				this.decreaseTime();
				this.endingSound("pomodoro");
				this.sendSocketNotification("MMM-Pomodoro-SAVEDATA", { type: pomodoroType, time: new Date });
				// setTimeout(() => {
				// 	this.removeOverlay()
				// }, 3000);
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
						this.displayMessageNoPopup(this.minutes + ':0' + this.seconds, "watch-number");
					} else {
						this.displayMessageNoPopup(this.minutes + ':' + this.seconds, "watch-number");
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
