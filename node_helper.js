/* Magic Mirror
 * Node Helper: MMM-Pomodoro
 *
 * By Toan Le
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var fs = require('fs');
var defaultData = { today: [] };
var dataPath = 'modules/MMM-Pomodoro/data.json';

module.exports = NodeHelper.create({

	// Override socketNotificationReceived method.

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function(notification, payload) {
		if (notification === "MMM-Pomodoro-SAVEDATA") {
      this.addSuccessPomodoro(payload);

			// console.log("Working notification system. Notification:", notification, "payload: ", payload);
			// Send notification
      this.sendSocketNotification("MMM-Pomodoro-SAVEDATA", this.returnPayload());
		}
	},

	// this you can create extra routes for your module
	extraRoutes: function() {
		var self = this;
		this.expressApp.get("/MMM-Pomodoro/extra_route", function(req, res) {
			// call another function
			values = self.anotherFunction();
			res.send(values);
		});
	},

	// Test another function
	anotherFunction: function() {
		return {date: new Date()};
	},

  readData: function(){
    var jsonData;

    try {
      jsonData = JSON.parse(fs.readFileSync(dataPath));
    } catch (err) {
      console.log(err);
      jsonData = defaultData;
    }

    return jsonData;
  },

  filterTodayPomodoro: function(array) {
    let midnightToday = new Date;
    midnightToday.setHours(0,0,0,0);

    return array.filter( x => Date.parse(x.time) >= midnightToday );
  },

  addSuccessPomodoro: function(payload){
    let jsonData = this.readData();
    jsonData.today = this.filterTodayPomodoro(jsonData.today);
    jsonData.today.push(payload);

    let data = JSON.stringify(jsonData, defaultData, 2);
    
    fs.writeFileSync(dataPath, data, (err) => {
      if (err) throw err;
    });
  },

  detectNextCycleType: function(){
    let todayCycles = this.readData().today.reverse();

    if (todayCycles[0].type != "pomodoro") {
      return "pomodoro";
    } else {
      let recentPomodoroCycles = todayCycles.filter( x => x.type == "pomodoro" || x.type == "relax-30" ).slice(0, 4);

      for (var i = 0; i < recentPomodoroCycles.length - 1; i++) {
        let diffTime = Math.abs(Date.parse(recentPomodoroCycles[i].time) - Date.parse(recentPomodoroCycles[i+1].time));
        if (diffTime > 15*60*1000) {
          return "relax-5";
        }
      }
  
      if (recentPomodoroCycles.filter( x => x.type == "pomodoro").length == 4) {
        return "relax-30";
      } else {
        return "relax-5";
      }
    }
  },

  returnPayload: function() {
    let data = this.readData();

    return {
      today_cycle: data.today.length,
      next_type: this.detectNextCycleType()
    }
  }
});
