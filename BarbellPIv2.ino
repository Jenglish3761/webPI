#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_LSM303_U.h>
#include <Adafruit_L3GD20_U.h>
#include <Adafruit_9DOF.h>
#include <bluefruit.h>
#include <math.h>
#include <avr/dtostrf.h>

#define d_to_r 0.01745329252
#define buttonPin 27 //

// BLE Service
BLEDfu  bledfu;  // OTA DFU service
BLEDis  bledis;  // device information
BLEUart bleuart; // uart over ble
BLEBas  blebas;  // battery


int totalTime = 0;

float ar[3];
float txnew = 0;
float roll[21];
float az[21];
float txold, txreset;
float dt;
float vnew, vold; 
float norm_az;
float pnew, pold; 
int i, acount, rcount;


/* Assign a unique ID to the sensors */
Adafruit_9DOF                 dof   = Adafruit_9DOF();
Adafruit_LSM303_Accel_Unified accel = Adafruit_LSM303_Accel_Unified(30301);
Adafruit_LSM303_Mag_Unified   mag   = Adafruit_LSM303_Mag_Unified(30302);
Adafruit_L3GD20_Unified       gyro  = Adafruit_L3GD20_Unified(20);

void sensorConfig();
void configuration(float* ar_a);

void setup() {
  Serial.begin(115200);
  Serial.println(F("Barbell PI")); Serial.println("");
  Bluefruit.autoConnLed(true);
  Bluefruit.configPrphBandwidth(BANDWIDTH_MAX);
  Bluefruit.begin();
  Bluefruit.setTxPower(4);    // Check bluefruit.h for supported values
  Bluefruit.setName("Barbell PI");
  //Bluefruit.setName(getMcuUniqueID()); // useful testing with multiple central connections
  Bluefruit.Periph.setConnectCallback(connect_callback);
  Bluefruit.Periph.setDisconnectCallback(disconnect_callback);

  // To be consistent OTA DFU should be added first if it exists
  bledfu.begin();

  // Configure and Start Device Information Service
  bledis.setManufacturer("Adafruit Industries");
  bledis.setModel("Bluefruit Feather52");
  bledis.begin();

  // Configure and Start BLE Uart Service
  bleuart.begin();

  // Start BLE Battery Service
  blebas.begin();
  blebas.write(100);
  
  startAdv();
  sensorConfig();

  pinMode(buttonPin, INPUT);
  
}

int f=1;
void loop() {

  if(f==1){
    configuration(ar);
    f=0;
  }
   
  /* Get a new sensor event */
  /*sensors_event_t event;*/
  sensors_event_t accel_event;
  sensors_event_t mag_event;
  sensors_vec_t   orientation;

  txold = txnew;
  txnew = accel_event.timestamp;
  dt = (txnew - txold)/1000;
  
  int buttonState = digitalRead(buttonPin);
  if (buttonState == HIGH) {    
    txreset = txnew;
    configuration(ar);
    rcount = 0;
    acount = 0;
    i = 0; 
    vnew = 0;
    vold = 0;
    pnew = 0;
    pold = 0;
    Serial.print("RESET\n"); 
  }
  
  /*accel.getEvent(&event);*/
  accel.getEvent(&accel_event);
  mag.getEvent(&mag_event);

  
  

  
  if (dof.accelGetOrientation(&accel_event, &orientation)){
    roll[i] = orientation.roll;
  }
  //Wait for first 20 values of roll to be populated//
  if(rcount <= 20){
    rcount++;
  }

  
  //increase array #//
  i++;
  
  if(rcount == 20){
    Serial.print("Roll Set \n");
    i = 0;
    rcount++;
  }


  
  if(rcount == 21){
    
    //Average the roll//
    float norm_roll;
    for(int j = 0; j<20; j++){
      norm_roll += roll[j];
    }
    norm_roll = norm_roll/21;
    
    //populate array with modified sensor data//
    az[i] = accel_event.acceleration.z-ar[2]-cos(abs(norm_roll*d_to_r))*9.81;
    
    //Simple 'high pass filter' to reduce noise//
    if(az[i] <= 0.55 && az[i] >= -0.55){
      az[i] = 0;
    }
    
  
    
  
    //wait for first 20 values to be populated//
    if(acount <= 20){
      acount++;
    }
    if(acount == 20){
      Serial.print("Accel Set \n");
      txreset = txnew;
    }
    //After first 20 values are populated, start calculations//
    if(acount == 21){
      
    
    
      //noramlize acceleration be averaging 20 points//
      for(int j = 0; j<20; j++){
        norm_az += az[j];
      }

      //Shoddy math//
      norm_az = norm_az/21;
      vnew = (norm_az)*dt + vold;
      pnew = vnew*dt + pold;
      
      if(pnew <= 0){
        pnew = 0;
        if(vnew <= 0){
          vnew = 0;
        }
        
      }
      
      //Print Data for converting to .csv//
      /*Serial.print("Timestamp:,"); Serial.print(txnew);Serial.print(",");
      Serial.print("Accel_norm:,"); Serial.print(norm_az,5);Serial.print(",");
      Serial.print("Vel:,"); Serial.print(vnew,5);Serial.print(",");//Serial.print(vold);
      Serial.print("Pos:,"); Serial.print(pnew,5);Serial.print(",");//Serial.print(pold);
      
      Serial.print("\n");*/
      ////
      vold = vnew;
      pold = pnew;


      //Bluetooth Stuff//
      String out = String((txnew-txreset)/1000) + "," + norm_az + "," + vnew +  "," + pnew + " \n";
      //Serial.print("out = ");Serial.println(out);Serial.print("\n");
      unsigned int count = out.length();
      char buf[50];
      out.toCharArray(buf, 50);
      bleuart.write(buf,out.length());
      //Serial.print("Count = ");Serial.print(count);Serial.print("\n");
      Serial.print("buf = ");Serial.print(buf);//Serial.print("\n");

      
      //reset i for ring buffer//
      if(i == 20){
        i = 0;
      }
  
    }
  
  
  

  } 
  
  
  //delay(100);
}


void startAdv(void)
{
  // Advertising packet
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();

  // Include bleuart 128-bit uuid
  Bluefruit.Advertising.addService(bleuart);

  // Secondary Scan Response packet (optional)
  // Since there is no room for 'Name' in Advertising packet
  Bluefruit.ScanResponse.addName();
  
  /* Start Advertising
   * - Enable auto advertising if disconnected
   * - Interval:  fast mode = 20 ms, slow mode = 152.5 ms
   * - Timeout for fast mode is 30 seconds
   * - Start(timeout) with timeout = 0 will advertise forever (until connected)
   * 
   * For recommended advertising interval
   * https://developer.apple.com/library/content/qa/qa1931/_index.html   
   */
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);    // in unit of 0.625 ms
  Bluefruit.Advertising.setFastTimeout(30);      // number of seconds in fast mode
  Bluefruit.Advertising.start(0);                // 0 = Don't stop advertising after n seconds  
}

// callback invoked when central connects
void connect_callback(uint16_t conn_handle)
{
  // Get the reference to current connection
  BLEConnection* connection = Bluefruit.Connection(conn_handle);

  char central_name[32] = { 0 };
  connection->getPeerName(central_name, sizeof(central_name));

  Serial.print("Connected to ");
  Serial.println(central_name);
  
}

/**
 * Callback invoked when a connection is dropped
 * @param conn_handle connection where this event happens
 * @param reason is a BLE_HCI_STATUS_CODE which can be found in ble_hci.h
 */
void disconnect_callback(uint16_t conn_handle, uint8_t reason)
{
  (void) conn_handle;
  (void) reason;

  Serial.println();
  Serial.println("Disconnected");
}

void sensorConfig(){
/* Initialise the sensors */
  Serial.println(F("Configuring Sensors")); Serial.println("");
  if(!accel.begin())
  {
    /* There was a problem detecting the ADXL345 ... check your connections */
    Serial.println(F("Ooops, no LSM303 detected ... Check your wiring!"));
    while(1);
  }
  accel.setGain(LSM303_ACCELGAIN_02);
  if(!mag.begin())
  {
    /* There was a problem detecting the LSM303 ... check your connections */
    Serial.println("Ooops, no LSM303 detected ... Check your wiring!");
    while(1);
  }
  if(!gyro.begin(GYRO_RANGE_250DPS))
  {
    /* There was a problem detecting the L3GD20 ... check your connections */
    Serial.print("Ooops, no L3GD20 detected ... Check your wiring or I2C ADDR!");
    while(1);
  }
  Serial.println(F("Sensors connected")); Serial.println("");
  loop();
}

void configuration(float* ar_a){ /*Subtract the average offset of the initial sensor data*/
  int n = 0;

  float ax;
  float ay;
  float az;
  
  float ax_tot = 0;
  float ay_tot = 0;
  float az_tot = 0;
  
  do{
   sensors_event_t accel_event;
   sensors_event_t mag_event;
   sensors_vec_t   orientation;
   
   accel.getEvent(&accel_event);
   mag.getEvent(&mag_event);


 
   ax = accel_event.acceleration.x;
   ay = accel_event.acceleration.y - sin(orientation.roll*d_to_r)*9.81;
   az = accel_event.acceleration.z - cos(abs(orientation.roll*d_to_r))*9.81;
   

   ax_tot = ax_tot + ax;
   ay_tot = ay_tot + ay;
   az_tot = az_tot + az;
  
   n++;
  }while(n<10);

  ar_a[0] = ax_tot / n;
  ar_a[1] = ay_tot / n;
  ar_a[2] = az_tot / n;

  //Serial.print("\nax_avg: "); Serial.print(ar_a[0]); Serial.print("\n");

  
}


