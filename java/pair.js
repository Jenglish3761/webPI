var myDevice;
var myService = 0x181C; //user data tag
var myCharacterisitc;

function scan(){
  navigator.bluetooth.requestDevice({
    acceptAllDevices: true, //no filter accept all devices
    optionalServices: [myService] //device serve
  })
  .then(function(device){
    myDevice = device;
    console.log(device);
    return device.gatt.connect(); //connect to selected device
  })
  .then(function(server){
    return server.getPrimaryService(myService);
  })
  .then(function(service){
    return service.getCharacteristics();
  })
  .then(function(characteristics){
    for (c in characteristics){
      characteristics[c].startNotifications().then(subscribeToChanges);
    }
  })
  .catch(function(error) {
    // catch any errors:
    console.error('Connection failed!', error);
  });
}
  
// subscribe to changes from the meter:
function subscribeToChanges(characteristic) {
  characteristic.oncharacteristicvaluechanged = handleData;
}

// handle incoming data:
function handleData(event) {
  // get the data buffer from the meter:
  var buf = new Uint8Array(event.target.value);
  console.log(buf);
}

// disconnect function:
function disconnect() {
  if (myDevice) {
    // disconnect:
    myDevice.gatt.disconnect();
  }
}

