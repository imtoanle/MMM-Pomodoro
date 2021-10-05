/* Magic Mirror
 * Node Helper: MMM-Pomodoro
 *
 * By Toan Le
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var fs = require('fs');

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
      console.log("Dau xanh rau ma");
      console.log(payload)
			// console.log("Working notification system. Notification:", notification, "payload: ", payload);
			// Send notification
			// this.sendNotificationTest(this.anotherFunction()); //Is possible send objects :)
		}
	},

	// Example function send notification test
	sendNotificationTest: function(payload) {
		this.sendSocketNotification("MMM-CasperValidator-NOTIFICATION_TEST", payload);
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

  // readData: function(){
  //   let jsonData;

  //   fs.readFile('modules/MMM-Pomodoro/data.json', (err, data) => {
  //     if (err)
  //       jsonData = { today: [] };
  //     else
  //       jsonData = JSON.parse(data);
  //   });

  //   return jsonData;
  // },

  // addSuccessPomodoro: function(data){
  //   let jsonData = this.readData();
  //   jsonData.today = jsonData.today.filter( e => e.time )
  //   let data = JSON.stringify(student, null, 2);
    
  //   fs.writeFile('student-3.json', data, (err) => {
  //       if (err) throw err;
  //       console.log('Data written to file');
  //   });
  // }
});
