# svgPathToOpenStratPolyCurve
This is a utility for the [openstrat](https://github.com/Rich2/openstrat) strategy library

Converts a SVG path to an openstrat PolyCurve

Currently working for most svg-path commands (non circular Arcs may not be implemented until openstrat supports them)

Try it out [here](https://w0d.github.io/svgPathToOpenStratPolyCurve/)

<details>TODO:
    <summary>
<b>* Tidy code
* Remove duplicated commands (when an svg has too much detail the rounding .toPrecision can produce duplicates) - Optional
* Complete full set of commands  a - A - Arcs
* Consider converting Arcs to Polyline or Beziers
* Consider parsing an svg file
* Consider option for converting an svg file, which is a flag, into a openstrat Flag
* Turn openStratJsUtils.js development helper into bookmarklets and/or integrate into deb.scala
</b>
    </summary>
</details>

