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
var t = 0; //data variables
var ot = 0;
var za = 0;
var zv = 0;
var zp = 0;
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
  sm = data.split(",");
	t = sm[0];
	za = sm[1];
	zv = sm[2];
	zp = sm[3];

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

// Switch terminal auto scrolling if it scrolls out of bottom.
terminalContainer.addEventListener('scroll', () => {
  const scrollTopOffset = terminalContainer.scrollHeight -
      terminalContainer.offsetHeight - terminalAutoScrollingLimit;

  isTerminalAutoScrolling = (scrollTopOffset < terminalContainer.scrollTop);
});

window.onload = function () {
	var aPoints = [];
	var vPoints = [];
	var pPoints = [];
	var aChart = new CanvasJS.Chart("aChart", {
		animationEnabled: true,  
		title:{
			text: "Z-Acceleration"
		},
		axisY: {
			title: "m/s^2",
		
		},
		data: [{
			type: "line",
			dataPoints: aPoints
		}]
	});
	var vChart = new CanvasJS.Chart("vChart", {
		animationEnabled: true,  
		title:{
			text: "Z-Velocity"
		},
		axisY: {
			title: "m/s",
		
		},
		data: [{
			type: "line",
			lineColor: "red",
			dataPoints: vPoints
		}]
	});
	var pChart = new CanvasJS.Chart("pChart", {
		animationEnabled: true,  
		title:{
			text: "Z-Position"
		},
		axisY: {
			title: "m",
		
		},
		data: [{
			type: "line",
			lineColor: "green",
			dataPoints: pPoints
		}]
	});
	var cChart = new CanvasJS.Chart("cChart", {
		animationEnabled: true,  
		title:{
			text: "Z Data"
		},
		legend:{
		},
		axisY: {
			//title: "m",
		
		},
		data: [{
			type: "line",
			showInLegend: true,
      			legendText: "Acc",
			dataPoints: aPoints
		},{
			type: "line",
			showInLegend: true,
      			legendText: "Vel",
			lineColor: "red",
			dataPoints: vPoints
		},{
			type: "line",
			showInLegend: true,
      			legendText: "Pos",
			lineColor: "green",
			dataPoints: pPoints
		}
		      ]
	});
	aChart.render();
	vChart.render();
	pChart.render();
	cChart.render();
	document.getElementById("saveChart").addEventListener("click",function(){
    		cChart.exportChart({format: "jpg"});
	});  	
	
	var updateData= function(){
		if (ot != NaN){
			aPoints.push({x: Number(ot), y: Number(za)});
			vPoints.push({x: Number(ot), y: Number(zv)});
			pPoints.push({x: Number(ot), y: Number(zp)});
		}
		ot = t;
	}
	
	var updateChart= function(){
		console.log(ot);
		console.log(t);
		console.log(za);
		//ot != t && 
		
			aChart.render();
			vChart.render();
			pChart.render();
			cChart.render();
			
		
		
	};
	setInterval(function(){updateData()},10);
	setInterval(function(){updateChart()}, 100);
		
}
