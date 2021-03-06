// TODO  If the path data string contains no valid commands, then the behavior is the same as the none value.
//       flag/booleans must be interpolated as fractions between zero and one, with any non-zero value considered to be a value of one/true. 
//       handle viewport rather than just width & height
//       handle the + sign
// dont need last connect line to close polygon
//line length limit 150

let myData = {};

function getUserInputById(id, prop){
  //if no user input then get placeholder value (or default - for checkboxes)
  const element = document.getElementById(id)
  return element[prop] ? element[prop] : element.placeholder;
}

function svgPathToOpenStratPolyCurve(){
  myData.isDebug = getUserInputById("debug", "checked");
  document.getElementById("openStratPolyCurve").value = '';
  document.getElementById("errors").value = '';  //**ToReview**// should? report errors and return shape up to last segment before error
  myData.precision = +getUserInputById("precision", "value");
  myData.svgPath = getUserInputById("svgPath", "value");
  myData.svgWidth = +getUserInputById("svgWidth", "value");
  myData.svgHeight = +getUserInputById("svgHeight", "value");
  myData.fillColor = getUserInputById("fillColor", "value");
  myData.result = '';
  myData.ptr = 0;
  myData.look = '';
  myData.currentCommand = null;
  myData.isNewPolyCurve = true;  //PolyCurve does not support sub-paths, so we will create a new PolyCurve for each sub-path
  myData.startOfPath = {...myData.cursorPos}; //this is repeated for each sub-path (in the z command)
  myData.cursorPos = {x: 0, y: 0};
  myData.lastCubicControlPoint = null;
  myData.lastQuadraticControlPoint = null;
  if (myData.svgPath == "none") return; //as with d='' defines a valid empty path which disables rendering of the path
  convertPathToPolyCurve();
  processResult();
}

function translateVector(){
  const svgX = getUserInputById("svgCoordx", "value");
  const svgY = getUserInputById("svgCoordy", "value");
  myData.precision = +getUserInputById("precision", "value");
  myData.svgWidth = +getUserInputById("svgWidth", "value");
  myData.svgHeight = +getUserInputById("svgHeight", "value");
  pointToTranslate = JSON.parse('{"x":'+ svgX + ', "y":' + svgY +'}');
  pointToTranslate.x = +parseFloat(pointToTranslate.x/myData.svgHeight).toPrecision(myData.precision);
  pointToTranslate.y = +parseFloat(-pointToTranslate.y/myData.svgHeight).toPrecision(myData.precision);
  document.getElementById("Vec2").value = pointToTranslate.x + " vv " + pointToTranslate.y
}

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
  if (isStartOfNumber(myData.look) && !myData.isNewPolyCurve) {   // its an implicit command (repeated) (ie command missing)
    if (myData.currentCommand == "m") myData.look = "l";          // implicit moveTo are intrepreted as lineTo in spec
    else if (myData.currentCommand == "M") myData.look = "L";
    else myData.look = myData.currentCommand;
    myData.ptr--;
  } else if (myData.isNewPolyCurve) {
    emit("PolyCurve(");
    //if M || m doesnt follow z then need to spit out a moveto (in openstrat no moveto but 1st lineto acts as one at start of shape (or sub-shape))
    if ("Zz".indexOf(myData.currentCommand) != -1 && "M" != myData.look.toUpperCase()) {
      emit("LineSeg(" + svgToOpenStratSpace(myData.startOfPath.x, "x") + " vv " + svgToOpenStratSpace(myData.startOfPath.y, "y") + "), ");
    }
  } 
  myData.currentCommand = myData.look;
  switch (myData.currentCommand) {
    case 'z':
    case 'Z':
      getClosePath();
      break;
    case 'c':
    case 'C':
      getCurveTo();
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
      getSmoothCurveTo();
      break;
    case 'q':
    case 'Q':
      getQuadraticTo();
      break;
    case 't':
    case 'T':
      getSmoothQuadraticTo();
      break;
    case 'a':
    case 'A':
      getEllipticalArc();
      break;
    default: expected(myData.look+" ? Command or number");
  }
  if ("Z" == myData.currentCommand.toUpperCase()) myData.isNewPolyCurve = true;
  else myData.isNewPolyCurve = false;
  if ("CcSs".indexOf(myData.currentCommand) == -1) myData.lastCubicControlPoint = null;
  if ("QqTt".indexOf(myData.currentCommand) == -1) myData.lastQuadraticControlPoint = null;
}

function emitLineSeg(x, y){
  emit("LineSeg(");
  emit(svgToOpenStratSpace(x, "x")+ " vv " + svgToOpenStratSpace(y, "y") + "), ");
}

function emitArcSeg(centrePoint, endPoint){
  emit("ArcSeg(");
  emit(svgToOpenStratSpace(centrePoint.x, "x")+ " vv " + svgToOpenStratSpace(centrePoint.y, "y") + ", "
      + svgToOpenStratSpace(endPoint.x, "x")+ " vv " + svgToOpenStratSpace(endPoint.y, "y") + "), " );
}
//ArcSeg(pCen: Vec2, pEnd: Vec2)
function emitBezierSeg(controlPoint1, controlPoint2, endPoint){
  emit("BezierSeg(");
  emit( svgToOpenStratSpace(controlPoint1.x, "x") + " vv " + svgToOpenStratSpace(controlPoint1.y, "y") + ", "
      + svgToOpenStratSpace(controlPoint2.x, "x") + " vv " + svgToOpenStratSpace(controlPoint2.y, "y") + ", "
      + svgToOpenStratSpace(endPoint.x, "x") + " vv " + svgToOpenStratSpace(endPoint.y, "y") + "), "
  );
}

function getMoveTo(){
  match("m");
  const dx = +getNumber();
  const dy = +getNumber();
  if (!myData.isNewPolyCurve) warning("Literal (not implicit) moveTo should represent the start of a new sub-path ie only ");
  if (myData.currentCommand == 'M') myData.cursorPos = {x: 0, y: 0};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
  if (myData.isNewPolyCurve) myData.startOfPath = {...myData.cursorPos};
  emitLineSeg(myData.cursorPos.x, myData.cursorPos.y);
}

function getLineTo(){
  match("l");
  const dx = +getNumber();
  const dy = +getNumber();
  if (myData.currentCommand == "L") myData.cursorPos = {x: 0, y: 0};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
  emitLineSeg(myData.cursorPos.x, myData.cursorPos.y);
}

function getClosePath(){
  match("z");
  emit("LineSeg(" + svgToOpenStratSpace(myData.startOfPath.x, "x") + " vv " + svgToOpenStratSpace(myData.startOfPath.y, "y") + "))");
  if (myData.fillColor[1] == 'x') emit(".fill(Colour("+myData.fillColor+"))\r\r"); //no css level 4 colour names contain an x so it must be hex
  else emit(".fill("+myData.fillColor+")\r");
  myData.cursorPos = {...myData.startOfPath};
}

function cross(A,B){
  if (A.length == 2) A[2] = 0;
  if (B.length == 2) B[2] = 0;
  ret = [];
  ret[0] = A[1]*B[2] - A[2]*B[1];
  ret[1] = A[2]*B[0] - A[0]*B[2];
  ret[2] = A[0]*B[1] - A[1]*B[0];
  return ret;
}

function mag(vec){
  temp = 0;
  vec.forEach(i => temp += i*i);
  return Math.sqrt(temp);
}

function getEllipticalArc(){
  match("a");
  const rx = +getNumber();
  const ry = +getNumber();
  const xAxisRotation = +getNumber();
  const largeArcFlag = getFlag();
  const sweepFlag = getFlag();
  const dx = +getNumber();
  const dy = +getNumber();

// A = Current Point, B = End Point, r = radius, v = (B-A)/2, n = (AxB)x(B-A)
//center of circle = (B-A)/2 +- Root( (r2 - |v|2) /  |n|2 )*n
//let C = B-A
//center of circle = C/2 +- Root( (r2 - |C/2|2) /  |(AxB)xC|2 )*(AxB)xC
  const A = [myData.cursorPos.x, myData.cursorPos.y];
  if (myData.currentCommand == "A")  myData.cursorPos = {x: 0, y: 0};
  const B = [myData.cursorPos.x + dx, myData.cursorPos.y + dy];
  const C = [B[0]-A[0], B[1]-A[1]];
  const AxB = cross(A, B);
  const n = cross(AxB, C);
  const root = Math.sqrt((rx*rx - Math.pow(mag([C[0]/2, C[1]/2]),2))/ Math.pow(mag(n), 2));
  const flagCentre = {x: myData.cursorPos.x + C[0]/2 - root*n[0], y: myData.cursorPos.y + C[1]/2 - root*n[1]};
  
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
  emitArcSeg(flagCentre, myData.cursorPos);
}

function getQuadraticTo(){
  match("q");
  const dx1 = +getNumber();  //**SHOULD**// add cursor pos ere
  const dy1 = +getNumber();
  const dx = +getNumber();
  const dy = +getNumber();

  //get equivalent cubic control points from a quadratic 
  const ctrlPt1 = {x: (myData.cursorPos.x + 2 * dx1)/3.0, y: (myData.cursorPos.y + 2 * dy1)/3.0};
  if (myData.currentCommand == "Q")  myData.cursorPos = {x: 0, y: 0};
  const ctrlPt2 = {x: (dx + myData.cursorPos.x + 2 * dx1)/3.0, y:(dy + myData.cursorPos.y + 2 * dy1)/3.0};
  emitBezierSeg({x: ctrlPt1.x, y: ctrlPt1.y},
                {x: ctrlPt2.x, y: ctrlPt2.y},
                {x: dx + myData.cursorPos.x,  y: dy + myData.cursorPos.y});
  myData.lastQuadraticControlPoint = {x: dx1 + myData.cursorPos.x, y: dy1 + myData.cursorPos.y};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
}

function getSmoothQuadraticTo(){
  match("t");
  const dx1 = reflectionOfLastControlPoint("quadratic").x; 
  const dy1 = reflectionOfLastControlPoint("quadratic").y;
  const dx = +getNumber();
  const dy = +getNumber();

  //get equivalent cubic control points from a quadratic 
  const ctrlPt1 = {x: (myData.cursorPos.x + 2 * dx1)/3.0, y: (myData.cursorPos.y + 2 * dy1)/3.0};
  if (myData.currentCommand == "T") myData.cursorPos = {x: 0, y: 0};
  const ctrlPt2 = {x: (dx + myData.cursorPos.x + 2 * dx1)/3.0, y:(dy + myData.cursorPos.y + 2 * dy1)/3.0};
  emitBezierSeg({x: ctrlPt1.x, y: ctrlPt1.y},
                {x: ctrlPt2.x, y: ctrlPt2.y},
                {x: dx + myData.cursorPos.x,  y: dy + myData.cursorPos.y});
  myData.lastQuadraticControlPoint = {x: dx1 + myData.cursorPos.x, y: dy1 + myData.cursorPos.y};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
}

function getCurveTo(){
  match("c");
  const dx1 = +getNumber();
  const dy1 = +getNumber();
  const dx2 = +getNumber();
  const dy2 = +getNumber();
  const dx = +getNumber();
  const dy = +getNumber();
  if (myData.currentCommand == "C") myData.cursorPos = {x: 0, y: 0};
  emitBezierSeg({x: dx1 + myData.cursorPos.x, y: dy1 + myData.cursorPos.y},
                {x: dx2 + myData.cursorPos.x, y: dy2 + myData.cursorPos.y},
                {x: dx + myData.cursorPos.x,  y: dy + myData.cursorPos.y});
  myData.lastCubicControlPoint = {x: dx2 + myData.cursorPos.x, y: dy2 + myData.cursorPos.y};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
}

function getSmoothCurveTo(){
  match("s");
  const dx1 = reflectionOfLastControlPoint("cubic").x;
  const dy1 = reflectionOfLastControlPoint("cubic").y;
  const dx2 = +getNumber();
  const dy2 = +getNumber();
  const dx = +getNumber();
  const dy = +getNumber();
  if (myData.currentCommand == "S") myData.cursorPos = {x: 0, y: 0};
  emitBezierSeg({x: dx1 + myData.cursorPos.x, y: dy1 + myData.cursorPos.y},
                {x: dx2 + myData.cursorPos.x, y: dy2 + myData.cursorPos.y},
                {x: dx + myData.cursorPos.x,  y: dy + myData.cursorPos.y});
  myData.lastCubicControlPoint = {x: dx2 + myData.cursorPos.x, y: dy2 + myData.cursorPos.y};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
}

function getVertical(){
  match("v");
  const dy = +getNumber();
  if (myData.currentCommand == "V") myData.cursorPos = {x: 0, y: 0};
  myData.cursorPos.y = myData.cursorPos.y + dy;
  emitLineSeg(myData.cursorPos.x, myData.cursorPos.y);
}

function getHorizontal(){
  match("h");
  const dx = +getNumber();
  if (myData.currentCommand == "H") myData.cursorPos = {x: 0, y: 0};
  myData.cursorPos.x = myData.cursorPos.x + dx;
  emitLineSeg(myData.cursorPos.x, myData.cursorPos.y);
}

function getFlag(){
  if (!isFlag(myData.look)) expected("Flag");
  const ret = myData.look;
  read();
  eat(",");
  return +ret;
}

function getNumber(){
  var dotCount = 0;   // have to check this as two numbers can be expressed as 3.814.383 ie 3.814 & .383 ***but this is ambigious!!! see iraq flag eg 2.008.656.667 implies only sane way to interpret as is here****
  var ret = "";
  if (myData.look == "-") { ret = "-"; read(); }
  if (!isDigit(myData.look)) expected("Number");
  while (isDigite(myData.look)){
    if (myData.look == ".") dotCount += 1;
    if (dotCount > 1) break;
    if (myData.look.toLowerCase() == "e"){ // exponents don't appear in the spec but ARE found in the wild
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
  if (!myData.isDebug){
    if (axis == 'x') {
     number = (number - myData.svgWidth / 2) / myData.svgHeight;
    } else if (axis == 'y') {
     number = -(number / myData.svgHeight - 0.5)
    }
  }
  return +parseFloat(number).toPrecision(myData.precision);
}

function reflectionOfLastControlPoint(whichType, aboutThisPoint){  // For S/s and T/t commands 1st control point = reflection of last segments control point relative to the current point.
  if (whichType == 'cubic'){
    if (myData.lastCubicControlPoint == null)  myData.lastCubicControlPoint = {...myData.cursorPos};
    return {x: 2*myData.cursorPos.x - myData.lastCubicControlPoint.x, y: 2*myData.cursorPos.y - myData.lastCubicControlPoint.y};
  } else if (whichType == 'quadratic'){
    if (myData.lastQuadraticControlPoint == null)  myData.lastQuadraticControlPoint = {...myData.cursorPos};
    return {x: 2*myData.cursorPos.x - myData.lastQuadraticControlPoint.x, y: 2*myData.cursorPos.y - myData.lastQuadraticControlPoint.y};
  }
}

function consumeWhiteSpace(){
  while (myData.look == " " || myData.look == "\n" || myData.look == "\r" || myData.look == "\t" || myData.look == "\f") read();
}

function eat(str){
  consumeWhiteSpace();
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
  let errorStr = "ERROR: " + str + " expected: pos=" + myData.ptr;
  document.getElementById("errors").value += errorStr;
  throw errorStr;
}

function isFlag(str){ //recognize a decimal digit
  return ~"01".indexOf(str);
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
