var myData = {};

function svgPathToOpenStratShape(offset){
  myData.svgPath = document.getElementById("svgPath").value;
  myData.svgWidth = +document.getElementById("svgWidth").value;
  myData.svgHeight = +document.getElementById("svgHeight").value;
  myData.fillColor = document.getElementById("fillColor").value;
  document.getElementById("openStratShape").value = '';
  myData.result = '';
  myData.ptr = 0;
  myData.look = '';
  myData.cursorPos = {x: 0, y: 0};
  myData.newShape = true;
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

function getCommand(){
  //moveTo(M, m), lineTo(L, l), curve(C, c, S, s -- Q, q, T, t), arc(A, a) commands
  if (isDigit(myData.look) || myData.look == "-") {myData.look = myData.currentCommand; myData.ptr--;}
  else myData.currentCommand = myData.look;
  switch (myData.look) {
    case 'z':
      getClosePath(); //this should close the shape and prepare for new one?
      break;
    case 'c':
      getBezierCurve();
      break;
    case 'm':    //**SHOULDNT REALLY DRAW A LINE - NEEDS REVIEW (its ok if its the first.. as thats how openstrat shapes work)
    case 'l':
      getMoveOrLineTo();
      break;
    case 'v':
      getVertical();
      break;
    case 'h':
      getHorizontal();
      break;
    default: expected("Command expected or unknown:'"+myData.look+"' pos="+ myData.ptr);
  }
}

function getMoveOrLineTo(){
  var dx, dy;
  if (myData.look == "m" && myData.newShape) emit("Shape(");
  matchOne("ml");
  emit("LineSeg(");
  dx = +getNumber();
  dy = +getNumber();
  if (myData.newShape) {
    myData.startOfPath = {x: dx, y: dy};
    myData.newShape = false;
  }
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
  emit(svgToOpenStratSpace(myData.cursorPos.x, "x")+ " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
}

function getClosePath(){
  match("z");
  emit("LineSeg(" + svgToOpenStratSpace(myData.startOfPath.x, "x") + " vv " + svgToOpenStratSpace(myData.startOfPath.y, "y") + "))");
  if (myData.fillColor[1] == 'x') emit(".fill(Colour("+myData.fillColor+")),\r"); //no css level 4 colour names contain an x so it must be hex
  else emit(".fill("+myData.fillColor+")\r");
  myData.newShape = true;
}

function getBezierCurve(){
  var dx1, dy1, dx2, dy2, dx, dy;
  match("c");
  emit("BezierSeg(");
  dx1 = +getNumber();
  dy1 = +getNumber();
  dx2 = +getNumber();
  dy2 = +getNumber();
  dx = +getNumber();
  dy = +getNumber();
  emit( svgToOpenStratSpace(dx1 + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy1 + myData.cursorPos.y, "y") + ", "
      + svgToOpenStratSpace(dx2 + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy2 + myData.cursorPos.y, "y") + ", "
      + svgToOpenStratSpace(dx + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy + myData.cursorPos.y, "y") + "), ");
  
  myData.cursorPos.x = myData.cursorPos.x + dx;
  myData.cursorPos.y = myData.cursorPos.y + dy;
}

function getVertical(){
  match("v");
  emit("LineSeg(");
  dx = +getNumber();
  emit( svgToOpenStratSpace(dx + myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(myData.cursorPos.y, "y") + "), ");
  myData.cursorPos.x = myData.cursorPos.x + dx;
}

function getHorizontal(){
  match("h");
  emit("LineSeg(");
  dy = +getNumber();
  emit( svgToOpenStratSpace(myData.cursorPos.x, "x") + " vv " + svgToOpenStratSpace(dy + myData.cursorPos.y, "y") + "), ");
  myData.cursorPos.y = myData.cursorPos.y + dy;
}

function getNumber(){
  var ret = "";
  if (myData.look == "-") { ret = "-"; read(); }
  if (!isDigit(myData.look)) expected("Number: pos="+ myData.ptr);
  while (isDigite(myData.look)){
    if (myData.look.toLowerCase() == "e"){ 
      ret = ret + myData.look;
      read();
      if (myData.look == "-"){ // have to do this check here as two numbers can be expressed as 12.1-3.9
        ret = ret + myData.look;
        read();
      }
      if (!isDigit(myData.look))  expected("Number: pos="+ myData.ptr); // a number must follow e or e-
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
  if (myData.look != str) expected(str+ " expected: pos="+ myData.ptr);
  read();
  consumeWhiteSpace();
}

function matchOne(str){
  if (!~str.indexOf(myData.look)) expected(str.split("").join(" or ")+ " expected: pos="+ myData.ptr);
  read();
  consumeWhiteSpace();
}

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

function isDigite(str){ //  digits & exponents
  return ~"1234567890.e".indexOf(str);
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
//  return +parseFloat(a).toPrecision(12);
}
/*
<!--
m 74.016197,206.10902 c -1.131281,-0.36019 -3.719346,-0.31304 -5.157301,0.094 -
Shape(
      LineSeg(p1), 
      ArcSeg(arcCentre1, p2), 
      ArcSeg(arcCentre2, p3),
      BezierSeg(ctrl1, ctrl2, pt5),
      LineSeg(p5), 
    )



   https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
 An uppercase letter specifies absolute coordinates on the page, and a lowercase letter specifies relative coordinates (e.g., move 10px up and 7px to the left from the last point).
Line commands:
  Move To
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