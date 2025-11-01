# Arduino IntelliSense and Build Setup (ESP32 + PN532)

These steps configure VS Code to resolve Arduino headers (WiFi.h, HTTPClient.h, Wire.h, Adafruit_PN532.h) and build the sketch `Arduino1/Arduino1.ino` for ESP32.

## 1) Install required tools

- VS Code extensions (auto-prompted by this workspace):
  - C/C++ (ms-vscode.cpptools)
  - Arduino (vsciot-vscode.vscode-arduino)
- One of the following:
  - Arduino IDE 2.x (recommended), or
  - Arduino CLI

## 2) Install ESP32 board support

Using Arduino IDE:
- Open Arduino IDE → Boards Manager → search “ESP32” by Espressif → Install

Using Arduino CLI (optional):
- Open PowerShell and run:
  - `arduino-cli core update-index`
  - `arduino-cli core install esp32:esp32`

This will create the ESP32 core under your user folder, e.g.:
`%USERPROFILE%\AppData\Local\Arduino15\packages\esp32\hardware\esp32\<version>`

## 3) Install libraries

- In Arduino IDE → Library Manager:
  - Search and install “Adafruit PN532” (by Adafruit)
  - (Wire, WiFi, HTTPClient are included with the ESP32 core)

Using Arduino CLI (optional):
- `arduino-cli lib install "Adafruit PN532"`

This will place libraries under:
`%USERPROFILE%\Documents\Arduino\libraries\Adafruit_PN532`

## 4) VS Code project settings

This repo includes `.vscode/` with:
- `arduino.json` — sets the sketch and board (`esp32:esp32:esp32`)
- `c_cpp_properties.json` — configures IntelliSense include paths for:
  - Workspace sketch
  - `%USERPROFILE%\AppData\Local\Arduino15\packages\**` (ESP32 core & bundled libs)

**Note:** The Adafruit_PN532 library headers will be found automatically through the ESP32 core's library search paths once installed. If IntelliSense still shows squiggles, it usually clears after installing the ESP32 core and PN532 library, then reloading VS Code.

## 5) Select board and verify

In VS Code (Arduino extension):
- Click the Arduino status bar (bottom) → Select Board: `esp32:esp32:esp32`
- Select Sketch: `Arduino1/Arduino1.ino`
- (Optional) Select the correct serial port when you connect the device
- Run “Arduino: Verify” to compile

## 6) Common fixes

- After installing cores/libs, reload VS Code window: `Ctrl+Shift+P` → “Developer: Reload Window”
- If IntelliSense is stale, run: `C/C++: Reset IntelliSense database`
- If the PN532 library can’t be found, confirm it exists under `%USERPROFILE%\Documents\Arduino\libraries\Adafruit_PN532`

## 7) Notes for this sketch

- Target: ESP32 (uses `WiFi.h`, `HTTPClient.h`)
- PN532: I2C wiring — update SDA/SCL pins if your board differs
- Serial baud: 115200

If you need help auto-installing with Arduino CLI, let me know and I can add a one-click PowerShell script for your environment.