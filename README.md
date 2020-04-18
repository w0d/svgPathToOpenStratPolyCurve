# svgPathToOpenStratShape
This is a utility for the [openstrat](https://github.com/Rich2/openstrat) strategy library

Converts a SVG path to an openstrat Shape

Currently working for most relative svg-path commands - though Arcs may not be implemented until openstrat supports them

TODO:
* tidy code
* calculate excat svg offset from origin
* Make a Shape for each z/Z command in the svg-path
* Add an option to scale the converted svg-path
* Complete full set of relative commands (s, q, t) (except Arcs) 
* Add all absolute commands (the Capitols: M L H V etc)
* Consider converting Arcs to Polyline or Beziers
* Consider parsing an svg file
* Consider option for converting an svg file, which is a flag, into a openstrat Flag
