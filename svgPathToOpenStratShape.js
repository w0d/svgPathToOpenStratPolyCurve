let myData = {};

function svgPathToOpenStratShape(){
  myData.svgPath = document.getElementById("svgPath").value;
  myData.svgWidth = +document.getElementById("svgWidth").value;
  myData.svgHeight = +document.getElementById("svgHeight").value;
  myData.fillColor = document.getElementById("fillColor").value;
  document.getElementById("openStratShape").value = '';
  myData.result = '';
  myData.ptr = 0;
  myData.look = '';
  myData.cursorPos = {x: 0, y: 0};
  myData.startOfPath = {...myData.cursorPos};
  myData.isNewShape = true;
  myData.currentCommand = null;
  convertPathToShape();
  processResult();
}
//***********************************************************************
function convertPathToShape(){
  read();
  consumeWhiteSpace();
  while (myData.ptr <= myData.svgPath.length){
    getCommand();
  }
}

function processResult(){
  document.getElementById("openStratShape").value = myData.result;
  document.getElementById("openStratShape").focus();
  document.getElementById("openStratShape").select();
  document.execCommand('copy');
}

function getCommand(){     //moveTo(M, m), lineTo(L, l, V, v, H, h), curve(C, c, S, s -- Q, q, T, t), arc(A, a) commands
  if (isStartOfNumber(myData.look) && !myData.isNewShape) {   //its a repeated command (ie command missing)
    myData.look = myData.currentCommand;
    myData.ptr--;
  } else {
    myData.currentCommand = myData.look;
  }
  switch (myData.currentCommand) {
    case 'z':
    case 'Z':
      getClosePath();
      break;
    case 'c':
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
    default: expected("Command expected or unknown:'"+myData.look+"' pos="+ myData.ptr);
  }
}

function getMoveTo(){
  match("m");
  const dx = +getNumber();
  const dy = +getNumber();
  if (myData.isNewShape) emit("Shape(");
  emit("LineSeg(");
  if (myData.currentCommand == 'm') {
    myData.cursorPos.x = myData.cursorPos.x + dx;
    myData.cursorPos.y = myData.cursorPos.y + dy;
  } else {
    myData.cursorPos.x = dx;
    myData.cursorPos.y = dy;
  }
  if (myData.isNewShape) myData.startOfPath = {...myData.cursorPos};
  emit(svgToOpenStratSpace(myData.cursorPos.x, "x")+ " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
  myData.isNewShape = false;
}

function getLineTo(){
  match("l");
  emit("LineSeg(");
  const dx = +getNumber();
  const dy = +getNumber();
  if (myData.currentCommand == "l") {
    myData.cursorPos.x = myData.cursorPos.x + dx;
    myData.cursorPos.y = myData.cursorPos.y + dy;
  } else {
    myData.cursorPos.x = dx;
    myData.cursorPos.y = dy;
  }
  emit(svgToOpenStratSpace(myData.cursorPos.x, "x")+ " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
}

function getClosePath(){
  match("z");
  emit("LineSeg(" + svgToOpenStratSpace(myData.startOfPath.x, "x") + " vv " + svgToOpenStratSpace(myData.startOfPath.y, "y") + "))");
  if (myData.fillColor[1] == 'x') emit(".fill(Colour("+myData.fillColor+"))\r"); //no css level 4 colour names contain an x so it must be hex
  else emit(".fill("+myData.fillColor+")\r");
  myData.cursorPos = {...myData.startOfPath};
  myData.isNewShape = true;
}

function getBezierCurve(){
  matchCase("c");
  emit("BezierSeg(");
  const dx1 = +getNumber();
  const dy1 = +getNumber();
  const dx2 = +getNumber();
  const dy2 = +getNumber();
  const dx = +getNumber();
  const dy = +getNumber();
  emit( svgToOpenStratSpace(dx1 + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy1 + myData.cursorPos.y, "y") + ", "
      + svgToOpenStratSpace(dx2 + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy2 + myData.cursorPos.y, "y") + ", "
      + svgToOpenStratSpace(dx + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy + myData.cursorPos.y, "y") + "), ");
  
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
}

function getVertical(){
  match("v");
  emit("LineSeg(");
  const dy = +getNumber();
  if (myData.currentCommand == "v") {
    myData.cursorPos.y = myData.cursorPos.y + dy;
  } else { 
    myData.cursorPos.y = dy;
  }
  emit( svgToOpenStratSpace(myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
}

function getHorizontal(){
  match("h");
  emit("LineSeg(");
  const dx = +getNumber();
  if (myData.currentCommand == "h") {
    myData.cursorPos.x = myData.cursorPos.x + dx;
  } else {
    myData.cursorPos.x = dx;
  }
  emit( svgToOpenStratSpace(myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
}

function getNumber(){
  var dotCount = 0;   // have to check this as two numbers can be expressed as 12.1.9 ie 12.1 & 0.9
  var ret = "";
  if (myData.look == "-") { ret = "-"; read(); }
  if (!isDigit(myData.look)) expected("Number: pos="+ myData.ptr);
  while (isDigite(myData.look)){
    if (myData.look == ".") dotCount += 1;
    if (dotCount > 1) break;
    if (myData.look.toLowerCase() == "e"){ 
      ret += "e";
      read();
      if (myData.look == "-"){ // have to do this check here as two numbers can be expressed as 12.1-3.9 ie 12.1 & -3.9
        ret += "-";
        read();
      }
      if (!isDigit(myData.look))  expected("Number exponent: pos="+ myData.ptr); // a number must follow e or e-
    } else {
      ret = ret + myData.look;
      read();
    }
  }
  eat(",");
  return +ret;
}

function consumeWhiteSpace(){
  while (myData.look == " ") read();
}

function eat(str){
  if (myData.look == str) read();
  consumeWhiteSpace();
}

function match(str){
  if (myData.look.toUpperCase() != str.toUpperCase()) expected(str+ " expected: pos="+ myData.ptr);
  read();
  consumeWhiteSpace();
}

function matchCase(str){
  if (myData.look != str) expected(str+ " expected: pos="+ myData.ptr);
  read();
  consumeWhiteSpace();
}

// function matchOne(str){
//   if (!~str.indexOf(myData.look)) expected(str.split("").join(" or ")+ " expected: pos="+ myData.ptr);
//   read();
//   consumeWhiteSpace();
// }

function expected(str){
  document.getElementById("svgPath").focus();
  document.getElementById("svgPath").selectionStart = myData.ptr-1;
  document.getElementById("svgPath").selectionEnd = myData.ptr;
  document.getElementById("openStratShape").value = myData.result;
  throw str;
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

function svgToOpenStratSpace(a, xOrY){ /// sort out float rounding errors and map to openstrat flag space
  if (xOrY == 'x') {
    a = (a - myData.svgWidth / 2) / myData.svgHeight;
  } else if (xOrY == 'y') {
    a = -(a / myData.svgHeight - 0.5)
  }
  return +parseFloat(a).toPrecision(4);
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
    //if it follows another S command or a C command, the first control point is assumed to be a reflection of the one used previously. If the S command doesn't follow another S or C command, then the current position of the cursor is used as the first control point. In this case the result is the same as what the Q command would have produced with the same parameters.
    S  x2 y2, x y 
    s  dx2 dy2, dx dy
    //quadratic curve (shared control point)
    //Note: The co-ordinate deltas for q are both relative to the previous point (that is, dx and dy are not relative to dx1 and dy1).
    Q  x1 y1, x y 
    q  dx1 dy1, dx dy
    //multiple quadratic Béziers
    //This shortcut looks at the previous control point used and infers a new one from it. This means that after the first control point, fairly complex shapes can be made by specifying only end points.
    //This only works if the previous command was a Q or a T command. If not, then the control point is assumed to be the same as the previous point, and only lines will be drawn
    T  x y
    t  dx dy
Arcs
    A  rx ry x-axis-rotation large-arc-flag sweep-flag x y
    a  rx ry x-axis-rotation large-arc-flag sweep-flag dx dy
--> 
*/