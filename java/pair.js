var myDevice;
var myService;
var myCharacterisitc;

function scan(){
  navigator.bluetooth.requestDevice({acceptAllDevices: true})
  .then(function(device){
    myDevice = device;
    console.log(device);
    return device.gatt.connect();
  })
  .catch(function(error) {
    // catch any errors:
    console.error('Connection failed!', error);
  });
  

function connect(){
  navigator.bluetooth.requestDevice({
    // filters: [myFilters]       // you can't use filters and acceptAllDevices together
    optionalServices: [myService],
    acceptAllDevices: true
  })
  .then(function(device) {
    // save the device returned so you can disconnect later:
    myDevice = device;
    console.log(device);
    // connect to the device once you find it:
    return device.gatt.connect();
  })
  .then(function(server) {
    // get the primary service:
    return server.getPrimaryService(myService);
  })
  .then(function(service) {
    // get the  characteristic:
    return service.getCharacteristics();
  })
  .then(function(characteristics) {
    // subscribe to the characteristic:
    for (c in characteristics) {
      characteristics[c].startNotifications()
      .then(subscribeToChanges);
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
