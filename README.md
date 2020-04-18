# svgPathToOpenStratShape
This is a utility for the [openstrat](https://github.com/Rich2/openstrat) strategy library

Converts a SVG path to an openstrat Shape

Currently working for most relative svg-path commands - though Arcs may not be implemented until either openstrat supports them

TODO:
* Make Shapes for each z/Z command in the svg-path
* Add the option to scale the converted svg-path
* Complete full set of relative commands ( ) (except Arcs) 
* Add all absolute commands (the Capitols: M L H V etc)
* Consider converting Arcs to Polyline or Beziers
* Consider parsing an svg file
