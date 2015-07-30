Serial Projector
================

A simple Chrome Application that shows last line of text got from serial port
with a big font.

Use Serial Projector with Arduino and other development boards to show coming
data with style and formatting of your choice. Go full screen to make your
42″ TV a blazing output peripheral.

Installation
------------

Find Serial Projector in [Chrome Web Store](https://chrome.google.com/webstore/detail/serial-projector/kbkjgbkmphnikcpkcodjbifkblmgidia)
and click “Add to Browser...”.  Thats all.

Usage
-----

Just send text to serial. Once Serial Projector will see end of line (`\n`)
the text on sceen will be updated.

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
  Serial.println(" °C");
}
```

Use buttons at the bottom right corner to adjust application settings.

[Demo video](http://www.youtube.com/watch?v=JpcsKiafKZ8#t=2m00s) is available on YouTube.

Authors and License
-------------------

Written by Victor Nakoryakov, © Amperka LLC.

This software may be modified and distributed under the terms
of the MIT license. See the LICENSE.txt file for details.
