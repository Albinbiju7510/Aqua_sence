#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

#define FLOW_SENSOR_PIN 2

volatile int pulseCount = 0;
float flowRate = 0.0;
float totalLitres = 0.0;

unsigned long oldTime = 0;
unsigned long leakStartTime = 0;

const float LEAK_FLOW_THRESHOLD = 0.5;   // L/min
const unsigned long LEAK_TIME_LIMIT = 30000; // 30 seconds

bool leakDetected = false;

void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

void setup() {
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("AquaSense");
  lcd.setCursor(0, 1);
  lcd.print("Initializing");
  delay(2000);

  lcd.clear();
}

void loop() {
  if ((millis() - oldTime) > 1000) {  // Every 1 second
    detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));

    // Flow calculation
    // YF-S201: 7.5 pulses per second per L/min
    flowRate = (pulseCount / 7.5);

    // Total water usage
    totalLitres += (flowRate / 60.0);

    // Leak detection logic
    if (flowRate > LEAK_FLOW_THRESHOLD) {
      if (leakStartTime == 0) {
        leakStartTime = millis();
      } else if ((millis() - leakStartTime) >= LEAK_TIME_LIMIT) {
        leakDetected = true;
      }
    } else {
      leakStartTime = 0;
      leakDetected = false;
    }

    // LCD Display
    lcd.clear();
    lcd.setCursor(0, 0);

    if (leakDetected) {
      lcd.print("LEAK DETECTED!");
      lcd.setCursor(0, 1);
      lcd.print("Flow:");
      lcd.print(flowRate, 1);
      lcd.print(" L/m");
    } else {
      lcd.print("Flow:");
      lcd.print(flowRate, 1);
      lcd.print(" L/m");

      lcd.setCursor(0, 1);
      lcd.print("Used:");
      lcd.print(totalLitres, 2);
      lcd.print(" L");
    }

    pulseCount = 0;
    oldTime = millis();

    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
  }
}
