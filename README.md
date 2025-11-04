# Serial Projector

A simple web application that shows last line of text got from serial port
with a big font.

Use Serial Projector with Arduino and other development boards to show coming
data with style and formatting of your choice. Go full screen to make your
42″ TV a blazing output peripheral.

## Installation

Open [website](https://projector.amperka.ru) in Chromium-based browser and use.
Optionally, install as application.

## Usage

Just send text to serial. Once Serial Projector will see a carriage return
character (ASCII 13, or `\r`) and a newline character (ASCII 10, or `\n`) the
text on sceen will be updated.

You can send UTF-8 unicode and HTML.

```cpp
void setup()
{
  Serial.begin(9600);
}

void loop()
{
  int t = analogRead(A0) / 100;
  Serial.print("<div style='font-size: 0.2em'>Температура / Temperature</div>");
  Serial.print(t);
  Serial.println(" ℃");
}
```

Use buttons at the bottom right corner to adjust application settings.

## Authors and License

Written by Victor Nakoryakov, Sergei Korolev © Amperka LLC.

This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/amperka/serial-projector)
