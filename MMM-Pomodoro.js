/* Some code snippets of this file were copied from the default alert module https://github.com/MichMich/MagicMirror/tree/development/modules/default/alert */

var self;

Module.register("MMM-Pomodoro", {
	defaults: {
		animation: true
	},

	getStyles: function() {
		return ["MMM-Pomodoro.css"];
	},

	getDom: function() {
		// create element wrapper for show into the module
		var wrapper = document.createElement("div");

		if (this.dataNotification) {
			var wrapperDataNotification = document.createElement("div");
			wrapperDataNotification.className = "medium";
			wrapperDataNotification.innerHTML = `Today Pomodoro <span class="bright">${this.dataNotification.todayPomodoro}</span>`;
			if (this.dataNotification.lastCompleted) {
				wrapperDataNotification.innerHTML += `. Last from <span class="bright">${this.dataNotification.lastCompleted}</span>`;
			}
			wrapper.appendChild(wrapperDataNotification);
		}

		return wrapper;
	},

	start: function() {
		self = this;
		this.dataNotification = null;
		this.isVisible = false;
		this.nextType = null;
		this.firstMessage = true;

		self.sendSocketNotification("MMM-Pomodoro-UPDATEDOM", {});
	},

	notificationReceived: function(notification, payload, sender) {
		switch(notification) {
			case "START_TIMER":
			if (this.isVisible && this.nextType) {
				self.agreeClicked(this.nextType)();
			} else {
				this.startTimer(payload.seconds, payload.type);
			}
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
		if (notification === "MMM-Pomodoro-SAVEDATA") {
			switch(payload.next_type) {
				case "long-relax":
					this.endingSound("pomodoro");
					this.displayMessageNoPopup("Do you want to long relax ?");
					break
				case "short-relax":
					this.endingSound("pomodoro");
					this.displayMessageNoPopup("Do you want to short relax ?");
					break
				case "pomodoro":
					this.endingSound("relax");
					this.displayMessageNoPopup("Do you want to start another pomodoro ?");
			}

			this.displayMessageNoPopup('Yes', 'width-20', true, this.agreeClicked(payload.next_type));
			this.displayMessageNoPopup('No', 'width-20', true, this.disagreeClicked);
			self.sendSocketNotification("MMM-Pomodoro-UPDATEDOM", {});
			this.nextType = payload.next_type;
		} else if (notification === "MMM-Pomodoro-UPDATEDOM") {
			this.dataNotification = payload;
			this.updateDom();
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
				case "long-relax":
					self.startTimer(self.config.longRelaxTime, type);
					break
				case "short-relax":
					self.startTimer(self.config.shortRelaxTime, type);
					break
				case "pomodoro":
					self.startTimer(self.config.pomodoroTime, type);
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
		this.nextType = null;
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
		child.className = `${additionClasses} alert-box ns-alert ns-growl ns-effect-jelly ns-type-notice`;
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
