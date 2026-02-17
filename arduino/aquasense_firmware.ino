/*
 * AquaSense Firmware for ESP8266
 * 
 * Hardware Connections:
 * - Flow Sensor (YF-S201): GPIO 4 (D2)
 * - Vibration Sensor (SW-420): GPIO 5 (D1)
 * - DS18B20 Temp Sensor: GPIO 2 (D4)
 */

#include <ESP8266WiFi.h>
#include <FirebaseArduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Config - UPDATE THESE 3 LINES
#define FIREBASE_HOST "aqua-sense-7d9d4-default-rtdb.firebaseio.com" // Linked to your Dashboard
#define FIREBASE_AUTH "Your_Database_Secret" // Settings > Service Accounts > Database Secrets
#define WIFI_SSID "Your_WiFi_Name"
#define WIFI_PASSWORD "Your_WiFi_Password"

// Pins
#define FLOW_SENSOR_PIN 4
#define VIB_SENSOR_PIN 5
#define TEMP_SENSOR_PIN 2

// Objects
OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature sensors(&oneWire);

// Global Variables
volatile int flow_pulse_count;
float flowRate;
unsigned long oldTime;

void ICACHE_RAM_ATTR pulseCounter() {
  flow_pulse_count++;
}

void setup() {
  Serial.begin(9600);
  
  // Sensors Init
  pinMode(FLOW_SENSOR_PIN, INPUT);
  digitalWrite(FLOW_SENSOR_PIN, HIGH);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, RISING);
  
  pinMode(VIB_SENSOR_PIN, INPUT);
  
  sensors.begin();

  // WiFi Connect
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Connected: ");
  Serial.println(WiFi.localIP());

  // Firebase Init
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
}

void loop() {
  if((millis() - oldTime) > 1000) { 
    detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));
    
    // Calculate Flow Rate
    flowRate = ((1000.0 / (millis() - oldTime)) * flow_pulse_count) / 7.5;
    oldTime = millis();
    flow_pulse_count = 0;
    
    // Read Other Sensors
    int vibration = digitalRead(VIB_SENSOR_PIN);
    sensors.requestTemperatures(); 
    float tempC = sensors.getTempCByIndex(0);
    
    // Leak Logic
    bool leakDetected = (flowRate > 30.0) || (vibration == 1);

    // Prepare JSON Payload
    StaticJsonBuffer<200> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    root["flowRate"] = flowRate;
    root["temperature"] = tempC;
    root["vibration"] = vibration;
    root["leakDetected"] = leakDetected;
    root["timestamp"] = millis(); // Timestamp from device uptime

    // Send to Firebase
    Firebase.set("sensors/current", root);
    
    // Handle Error
    if (Firebase.failed()) {
      Serial.print("set failed:");
      Serial.println(Firebase.error());  
      return;
    }
    
    Serial.print("Flow: "); Serial.print(flowRate);
    Serial.print(" | Temp: "); Serial.println(tempC);

    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, RISING);
  }
}
