//Citation from
//loginov-rocks, "main.js", v1.3.2
//https://github.com/loginov-rocks/Web-Bluetooth-Terminal/blob/master/js/main.js


// UI elements.
const deviceNameLabel = document.getElementById('device-name');
const connectButton = document.getElementById('connect');
const disconnectButton = document.getElementById('disconnect');
const terminalContainer = document.getElementById('terminal');
const sendForm = document.getElementById('send-form');
const inputField = document.getElementById('input');
var t = 0;
var ot = 0;
var za = 0;
// Helpers.
const defaultDeviceName = 'Terminal';
const terminalAutoScrollingLimit= terminalContainer.offsetHeight / 2;
let isTerminalAutoScrolling = true;

const scrollElement = (element) => {
  const scrollTop = element.scrollHeight - element.offsetHeight;

  if (scrollTop > 0) {
    element.scrollTop = scrollTop;
  }
};

const logToTerminal = (message, type = '') => {
  terminalContainer.insertAdjacentHTML('beforeend',
      `<div${type && ` class="${type}"`}>${message}</div>`);
  
  if (isTerminalAutoScrolling) {
    scrollElement(terminalContainer);
  }
};

// Obtain configured instance.
const terminal = new BluetoothTerminal();

// Override `receive` method to log incoming data to the terminal.
terminal.receive = function(data) {
  //logToTerminal(data, 'in'); //show data in terminal
  //alert(message);
  sm = data.split(",");
	t = sm[3]/1000;
	za = sm[2];
  //document.cookie = "t=" + sm[3] + "; z=" + sm[2];
  console.log(za);
  //'data',JSON.stringify({t: sm[3], z: sm[2]}));
  //console.log(JSON.parse(document.cookie('data')));
};

// Override default log method to output messages to the terminal and console.
terminal._log = function(...messages) {
  // We can't use `super._log()` here.
  messages.forEach((message) => {
    logToTerminal(message);
    console.log(message); // eslint-disable-line no-console
    
  });
};

// Implement own send function to log outcoming data to the terminal.
const send = (data) => {
  terminal.send(data).
      then(() => logToTerminal(data, 'out')).
      catch((error) => logToTerminal(error));
};

// Bind event listeners to the UI elements.
connectButton.addEventListener('click', () => {
  terminal.connect().
      then(() => {
        deviceNameLabel.textContent = terminal.getDeviceName() ?
            terminal.getDeviceName() : defaultDeviceName;
      });
});

disconnectButton.addEventListener('click', () => {
  terminal.disconnect();
  deviceNameLabel.textContent = defaultDeviceName;
});

//sendForm.addEventListener('submit', (event) => {
//  event.preventDefault();

//  send(inputField.value);

// inputField.value = '';
//  inputField.focus();
//});

// Switch terminal auto scrolling if it scrolls out of bottom.
terminalContainer.addEventListener('scroll', () => {
  const scrollTopOffset = terminalContainer.scrollHeight -
      terminalContainer.offsetHeight - terminalAutoScrollingLimit;

  isTerminalAutoScrolling = (scrollTopOffset < terminalContainer.scrollTop);
});

window.onload = function () {
var dataPoints = [{x: 0, y: 0}];
var chart = new CanvasJS.Chart("chartContainer", {
	animationEnabled: true,  
	title:{
		text: "Z-Acceleration"
	},
	axisY: {
		title: "m/s^2",
		minimum: -5,
		maximum: 5
		//valueFormatString: "#0.",
		//suffix: "",
		//stripLines: [{
		//	value: 3366500,
		//	label: "Average"
		//}]
	},
	data: [{
		//yValueFormatString: "#.### m/s^2",
		//xValueFormatString: "##.#",
		type: "line",
		dataPoints: dataPoints
	}]
});
chart.render();
	var updateChart= function(){
		console.log(ot);
		console.log(t);
		console.log(za);
		var az = za;
		if (ot != t && t != null){
			dataPoints.push({x: t, y: Number(za)});
			//chart.data[0].addTo("dataPoints", {x: t, y: za});
			chart.render();
			chart.options.title.text = za;
		}
		ot = t;
	};
	
	setInterval(function(){updateChart()}, 100);
		
}
