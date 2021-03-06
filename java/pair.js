var myDevice;
var myService = 0x180F; //generic tag
var myCharacterisitc;

function scan(){
  //navigator.bluetooth.getAvailability().then(function(isAvailable){
  //  document.getElementById("status").innerHTML=('bluetooth service unavailable');
  //})
  navigator.bluetooth.requestDevice({
    acceptAllDevices: true, //no filter, accept all devices
    optionalServices: [myService] //device serve
  })
  .then(function(device){
    myDevice = device;
    device.addEventListener('gattserverdisconnected', onDisconnected);
    console.log(device);
    document.getElementById("status").innerHTML=('Trying to connect to:  ' + device.name
                                                + ' device ID: ' + device.id);
    return device.gatt.connect(); //connect to selected device
  })
  .then(function(server){
    document.getElementById("status").innerHTML=('Connected! Finding Services... ');
    return server.getPrimaryService(myService);
  })
  .then(function(service){
    
    return service.getCharacteristics();
  })
  .then(function(characteristics){
    document.getElementById("status").innerHTML=('Connected! Finding Characteristics... ');
    for (c in characteristics){
      characteristics[c].startNotifications().then(subscribeToChanges);
      console.log(characteristics[c]);
      document.getElementById("status").innerHTML=(characteristics[c]);
    }
    
  })
  .catch(function(error) {
    // catch any errors:
    document.getElementById("log").innerHTML=('Connection Issue!  ' + error);
    console.error('Connection failed!', error);
    
  });
}
  
// subscribe to changes from the meter:
function subscribeToChanges(characteristic) {
  characteristic.oncharacteristicvaluechanged = handleData;
  document.getElementById("status").innerHTML=('Connection Success');
  document.getElementById("content").innerHTML=(myDevice.name + ' is ready');
}

// handle incoming data:
function handleData(event) {
  // get the data buffer from the meter:
  var buf = new Uint8Array(event.target.value);
  console.log(buf);
  document.getElementById("content").innerHTML=(buf);
}

// disconnect function:
function disconnect() {
  if (myDevice) {
    // disconnect:
    myDevice.gatt.disconnect();
  }
}

function onDisconnected(event){
 let device = event.target;
  document.getElementById("content").innerHTML=('.');
  document.getElementById("status").innerHTML=(device.name + ' is disconnected');
  console.log('Device ' + device.name + ' is disconnected');
}
