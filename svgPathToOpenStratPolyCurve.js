// TODO  If the path data string contains no valid commands, then the behavior is the same as the none value.
//       flag/booleans must be interpolated as fractions between zero and one, with any non-zero value considered to be a value of one/true. 
//

let myData = {};

function svgPathToOpenStratPolyCurve(){
  document.getElementById("openStratPolyCurve").value = '';
  document.getElementById("errors").value = '';  //**ToReview**// should? report errors and return shape up to last segment before error
  myData.svgPath = document.getElementById("svgPath").value;
  myData.svgWidth = +document.getElementById("svgWidth").value;
  myData.svgHeight = +document.getElementById("svgHeight").value;
  myData.fillColor = document.getElementById("fillColor").value;
  myData.result = '';
  myData.ptr = 0;
  myData.look = '';
  myData.currentCommand = null;
  myData.isNewPolyCurve = true;  //PolyCurve does not support sub-paths, so we will create a new PolyCurve for each sub-path
  myData.startOfPath = {...myData.cursorPos}; //this is repeated for each sub-path (in the z command)
  myData.cursorPos = {x: 0, y: 0};  //this also acts as the last point at the start of processing the current command
  myData.lastControlPoint = null;
  if (myData.svgPath == "none") return; //as with d='' defines a valid empty path which disables rendering of the path
  convertPathToPolyCurve();
  processResult();
}
//***********************************************************************
function convertPathToPolyCurve(){
  read();  //prime the pump
  consumeWhiteSpace();
  while (myData.ptr <= myData.svgPath.length){ //a path is a series of commands
    getCommand();
  }
}

function processResult(){  //display result and copy PolyCurve(s) to clipboard
  document.getElementById("openStratPolyCurve").value = myData.result;
  document.getElementById("openStratPolyCurve").focus();
  document.getElementById("openStratPolyCurve").select();
  document.execCommand('copy');
}

function getCommand(){     //moveTo(M, m), closePath(Z, z) lineTo(L, l, V, v, H, h), curve(C, c, S, s -- Q, q, T, t), arc(A, a) commands
  if (isStartOfNumber(myData.look) && !myData.isNewPolyCurve) {   //its a repeated command (ie command missing)
    if (myData.currentCommand == "m") myData.look = "l";
    else if (myData.currentCommand == "m") myData.look = "L";
    else myData.look = myData.currentCommand;
    myData.ptr--;  //fudged backtrack?
  } else {
    myData.currentCommand = myData.look;
  }
  switch (myData.currentCommand) {
    case 'z':
    case 'Z':
      getClosePath();
      break;
    case 'c':
    case 'C':
      getBezierCurve();
      break;
    case 'm':
    case 'M':
      getMoveTo();
      break;
    case 'l':
    case 'L':
      getLineTo();
      break;
    case 'v':
    case 'V':
      getVertical();
      break;
    case 'h':
    case 'H':
      getHorizontal();
      break;
    case 's':
    case 'S':
    case 'q':
    case 'Q':
    case 't':
    case 'T':
    case 'a':
    case 'A':
      warning("Command not implemented: '"+myData.look+"'"); //should this have just eaten coords until next command...
      expected("Known command"); //should this have just eaten coords until next command...
      break;
    default: expected(myData.look+"?? Command or number");
  }
}

function getMoveTo(){
  match("m");
  const dx = +getNumber();
  const dy = +getNumber();
  if (myData.isNewPolyCurve) emit("PolyCurve(");
  else warning("moveTo should represent the start of a new sub-path");
  emit("LineSeg(");
  if (myData.currentCommand == 'M') myData.cursorPos = {x: 0, y: 0};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
  if (myData.isNewPolyCurve) myData.startOfPath = {...myData.cursorPos};
  emit(svgToOpenStratSpace(myData.cursorPos.x, "x")+ " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
  myData.isNewPolyCurve = false;
}

function getLineTo(){
  match("l");
  emit("LineSeg(");
  const dx = +getNumber();
  const dy = +getNumber();
  if (myData.currentCommand == "L") myData.cursorPos = {x: 0, y: 0};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
  emit(svgToOpenStratSpace(myData.cursorPos.x, "x")+ " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
}

function getClosePath(){
  match("z");
  emit("LineSeg(" + svgToOpenStratSpace(myData.startOfPath.x, "x") + " vv " + svgToOpenStratSpace(myData.startOfPath.y, "y") + "))");
  if (myData.fillColor[1] == 'x') emit(".fill(Colour("+myData.fillColor+"))\r"); //no css level 4 colour names contain an x so it must be hex
  else emit(".fill("+myData.fillColor+")\r");
  myData.cursorPos = {...myData.startOfPath};
  myData.isNewPolyCurve = true;
  myData.lastControlPoint = null;
}

function getBezierCurve(){
  match("c");
  emit("BezierSeg(");
  const dx1 = +getNumber();
  const dy1 = +getNumber();
  const dx2 = +getNumber();
  const dy2 = +getNumber();
  const dx = +getNumber();
  const dy = +getNumber();
  if (myData.currentCommand == "C") myData.cursorPos = {x: 0, y: 0};
  emit( svgToOpenStratSpace(dx1 + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy1 + myData.cursorPos.y, "y") + ", "
      + svgToOpenStratSpace(dx2 + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy2 + myData.cursorPos.y, "y") + ", "
      + svgToOpenStratSpace(dx + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy + myData.cursorPos.y, "y") + "), ");
  myData.lastControlPoint = {x: dx2 + myData.cursorPos.x, y: dy2 + myData.cursorPos.y};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
}

function getVertical(){
  match("v");
  emit("LineSeg(");
  const dy = +getNumber();
  if (myData.currentCommand == "V") myData.cursorPos = {x: 0, y: 0};
  myData.cursorPos.y = myData.cursorPos.y + dy;
  emit( svgToOpenStratSpace(myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
}

function getHorizontal(){
  match("h");
  emit("LineSeg(");
  const dx = +getNumber();
  if (myData.currentCommand == "H") myData.cursorPos = {x: 0, y: 0};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  emit( svgToOpenStratSpace(myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
}

function getNumber(){
  var dotCount = 0;   // have to check this as two numbers can be expressed as 3.814.383 ie 3.814 & .383 ***but this is ambigious!!! see iraq flag eg 2.008.656.667 implies only sane way to interpret as is here****
  var ret = "";
  if (myData.look == "-") { ret = "-"; read(); }
  if (!isDigit(myData.look)) expected("Number");
  while (isDigite(myData.look)){
    if (myData.look == ".") dotCount += 1;
    if (dotCount > 1) break;
    if (myData.look.toLowerCase() == "e"){ // this doesn't appear in the spec but IS found in the wild
      ret += "e";
      read();
      if (myData.look == "-"){ // have to do this check here as two numbers can be expressed as 12.1-3.9 ie 12.1 & -3.9
        ret += "-";
        read();
      }
      if (!isDigit(myData.look))  expected("Number exponent:"); // a number must follow e or e-
    } else {
      ret = ret + myData.look;
      read();
    }
  }
  eat(",");
  return +ret;
}

function svgToOpenStratSpace(number, axis){ /// sort out float rounding errors and map to openstrat flag space
  if (axis == 'x') {
    number = (number - myData.svgWidth / 2) / myData.svgHeight;
  } else if (axis == 'y') {
    number = -(number / myData.svgHeight - 0.5)
  }
  return +parseFloat(number).toPrecision(4);
}

function reflectionOfLastControlPoint(){  // For S/s and T/t commands 1st control point = reflection of last segments control point relative to the current point.
  if (myData.lastControlPoint == null) {
    warning("reflectionOfLastControlPoint requires last segment to be bezier");
    expected("last segment to be bezier");
  }
  return {x: 2*myData.cursorPos.x - myData.lastControlPoint.x, y: 2*myData.cursorPos.y - myData.lastControlPoint.y};
}

function consumeWhiteSpace(){
  while (myData.look == " " || myData.look == "\n" || myData.look == "\r" || myData.look == "\t" || myData.look == "\f") read();
}

function eat(str){
  if (myData.look == str) read();
  consumeWhiteSpace();
}

function match(str){
  if (myData.look.toUpperCase() != str.toUpperCase()) expected(str);
  read();
  consumeWhiteSpace();
}

function matchCase(str){
  if (myData.look != str) expected(str);
  read();
  consumeWhiteSpace();
}

// function matchOne(str){
//   if (!~str.indexOf(myData.look)) expected(str.split("").join(" or "));
//   read();
//   consumeWhiteSpace();
// }

function warning(str){
  document.getElementById("errors").value += "WARNING: " + str + "\n";
}

function expected(str){
  document.getElementById("svgPath").focus();
  document.getElementById("svgPath").selectionStart = myData.ptr-1;
  document.getElementById("svgPath").selectionEnd = myData.ptr;
  document.getElementById("openStratPolyCurve").value = myData.result;
  let errorStr = str + " expected: pos=" + myData.ptr;
  document.getElementById("errors").value += errorStr;
  throw errorStr;
}

function isDigit(str){ //recognize a decimal digit
  return ~"1234567890.".indexOf(str);
}

function isDigite(str){ //  digits & exponents NB: the - that may follow e is handled by getNumber()
  return ~"1234567890.e".indexOf(str);
}

function isStartOfNumber(str){ // first char cant be e
  return ~"1234567890.-".indexOf(str);
}

function read(){
  if (myData.ptr <= myData.svgPath.length) {
    myData.look = myData.svgPath[myData.ptr];
    myData.ptr = myData.ptr + 1;
  } else {
    console.log("Fin");
  }
}

function emit(str){
  myData.result += str;// + '\r';
}
/*
<!--
   https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
 An uppercase letter specifies absolute coordinates on the page, and a lowercase letter specifies relative coordinates (e.g., move 10px up and 7px to the left from the last point).
Line commands:
  Move To:
  If this command is followed by multiple pairs of coordinates, these coordinates that follow are treated as lineto commands (discussed further in the next section), drawing a straight line. These assumed lineto commands will be relative if the moveto is relative, and absolute if the moveto is absolute.
  If the first element begins with a relative moveto (m) path then those pairs of coordinates are treated as absolute ones and pairs of coordinates to follow are treated as relative.
    M  x y
    m  dx dy
  Line To
    L  x y
    l  dx dy
  Horizontal and Vertical Lines
    H  x
    h  dx
    V  y
    v  dy
  Close Path
    Z
    z
Curve commands
  Bézier Curves (control points & end point)
    C  x1 y1, x2 y2, x y 
    c  dx1 dy1, dx2 dy2, dx dy
    //if it follows another S command or a C command, the first control point is assumed to be a reflection of the one used previously.
    //If the S command doesn't follow another S or C command, then the current position of the cursor is used as the first control point.
    // In this case the result is the same as what the Q command would have produced with the same parameters.
    S  x2 y2, x y 
    s  dx2 dy2, dx dy
    //quadratic curve (shared control point)
    //Note: The co-ordinate deltas for q are both relative to the previous point (that is, dx and dy are not relative to dx1 and dy1).
    Q  x1 y1, x y 
    q  dx1 dy1, dx dy
    //multiple quadratic Béziers
    //This shortcut looks at the previous control point used and infers a new one from it. 
    //This means that after the first control point, fairly complex shapes can be made by specifying only end points.
    //This only works if the previous command was a Q or a T command. 
    //If not, then the control point is assumed to be the same as the previous point, and only lines will be drawn
    T  x y
    t  dx dy
Arcs
    A  rx ry x-axis-rotation large-arc-flag sweep-flag x y
    a  rx ry x-axis-rotation large-arc-flag sweep-flag dx dy
--> 

9.3.9. The grammar for path data

SVG path data matches the following EBNF grammar.

svg_path::= wsp* moveto? (moveto drawto_command*)?

drawto_command::=
    moveto
    | closepath
    | lineto
    | horizontal_lineto
    | vertical_lineto
    | curveto
    | smooth_curveto
    | quadratic_bezier_curveto
    | smooth_quadratic_bezier_curveto
    | elliptical_arc

moveto::=
    ( "M" | "m" ) wsp* coordinate_pair_sequence

closepath::=
    ("Z" | "z")

lineto::=
    ("L"|"l") wsp* coordinate_pair_sequence

horizontal_lineto::=
    ("H"|"h") wsp* coordinate_sequence

vertical_lineto::=
    ("V"|"v") wsp* coordinate_sequence

curveto::=
    ("C"|"c") wsp* curveto_coordinate_sequence

curveto_coordinate_sequence::=
    coordinate_pair_triplet
    | (coordinate_pair_triplet comma_wsp? curveto_coordinate_sequence)

smooth_curveto::=
    ("S"|"s") wsp* smooth_curveto_coordinate_sequence

smooth_curveto_coordinate_sequence::=
    coordinate_pair_double
    | (coordinate_pair_double comma_wsp? smooth_curveto_coordinate_sequence)

quadratic_bezier_curveto::=
    ("Q"|"q") wsp* quadratic_bezier_curveto_coordinate_sequence

quadratic_bezier_curveto_coordinate_sequence::=
    coordinate_pair_double
    | (coordinate_pair_double comma_wsp? quadratic_bezier_curveto_coordinate_sequence)

smooth_quadratic_bezier_curveto::=
    ("T"|"t") wsp* coordinate_pair_sequence

elliptical_arc::=
    ( "A" | "a" ) wsp* elliptical_arc_argument_sequence

elliptical_arc_argument_sequence::=
    elliptical_arc_argument
    | (elliptical_arc_argument comma_wsp? elliptical_arc_argument_sequence)

elliptical_arc_argument::=
    number comma_wsp? number comma_wsp? number comma_wsp
    flag comma_wsp? flag comma_wsp? coordinate_pair

coordinate_pair_double::=
    coordinate_pair comma_wsp? coordinate_pair

coordinate_pair_triplet::=
    coordinate_pair comma_wsp? coordinate_pair comma_wsp? coordinate_pair

coordinate_pair_sequence::=
    coordinate_pair | (coordinate_pair comma_wsp? coordinate_pair_sequence)

coordinate_sequence::=
    coordinate | (coordinate comma_wsp? coordinate_sequence)

coordinate_pair::= coordinate comma_wsp? coordinate

coordinate::= sign? number

sign::= "+"|"-"
number ::= ([0-9])+
flag::=("0"|"1")
comma_wsp::=(wsp+ ","? wsp*) | ("," wsp*)
wsp ::= (#x9 | #x20 | #xA | #xC | #xD)

*/
