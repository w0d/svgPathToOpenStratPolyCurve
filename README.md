# svgPathToOpenStratPolyCurve
This is a utility for the [openstrat](https://github.com/Rich2/openstrat) strategy library

Converts a SVG path to an openstrat PolyCurve

Currently working for most svg-path commands (non circular Arcs may not be implemented until openstrat supports them)

Try it out [here](https://w0d.github.io/svgPathToOpenStratPolyCurve/)

<details><b>TODO:</b>
    <summary>
<b>* Tidy code</b>
<b>* Remove duplicated commands (when an svg has too much detail the rounding .toPrecision can produce duplicates) - Optional</b>
<b>* Complete full set of commands  a - A - Arcs</b>
<b>* Consider converting Arcs to Polyline or Beziers</b>
<b>* Consider parsing an svg file</b>
<b>* Consider option for converting an svg file, which is a flag, into a openstrat Flag</b>
<b>* Turn openStratJsUtils.js development helper into bookmarklets and/or integrate into deb.scala</b>
    </summary>
</details>

