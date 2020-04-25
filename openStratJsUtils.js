function drawCanvasGrid(){
  var x = document.getElementById("scanv");
  var context = x.getContext("2d");

  var width = context.canvas.width;
  var height = context.canvas.height;

  context.beginPath();
  context.strokeStyle = 'aqua';
  context.lineWidth = 0.25;
  for (var i=0; i <= width; i=i+10){
    context.moveTo(i, 0);
    context.lineTo(i, height);
    if (i%100 == 0) context.lineTo(i, 0);  //redraw major grid lines to make them stand out
  }
  for (i=0; i <= height; i=i+10){
    context.moveTo(0, i);
    context.lineTo(width, i);
    if (i%100 == 0) context.lineTo(0, i);  //redraw major grid lines to make them stand out
  }
  context.stroke();
}

function drawOpenStratGrid(canvasId){
  var x = canvasId ? document.getElementById(canvasId) : document.getElementById("scanv");
  var context = x.getContext("2d");

  var width = context.canvas.width;
  var height = context.canvas.height;

  var centreX = width/2.0;
  var centreY = height/2.0;

  context.beginPath();
  context.strokeStyle = 'aqua';
  context.lineWidth = 0.25;
  for (var i=centreX; i <= width; i=i+10){
    context.moveTo(i, 0);
    context.lineTo(i, height);
    if ((centreX-i)%100 == 0) context.lineTo(i, 0);  //redraw major grid lines to make them stand out
  }
  for (var i=centreX; i >= -width; i=i-10){
    context.moveTo(i, 0);
    context.lineTo(i, height);
    if ((centreX-i)%100 == 0) context.lineTo(i, 0);  //redraw major grid lines to make them stand out
  }
  for (i=centreY; i <= height; i=i+10){
    context.moveTo(0, i);
    context.lineTo(width, i);
    if ((centreY-i)%100 == 0) context.lineTo(0, i);  //redraw major grid lines to make them stand out
  }
  for (i=centreY; i >= -height; i=i-10){
    context.moveTo(0, i);
    context.lineTo(width, i);
    if ((centreY-i)%100 == 0) context.lineTo(0, i);  //redraw major grid lines to make them stand out
  }
  context.stroke();
  context.beginPath();
  context.moveTo(width/2, 0);
  context.lineTo(width/2, height);  //redraw origin lines to make them stand out even more
  context.moveTo(0, height/2);
  context.lineTo(width, height/2);  //redraw origin lines to make them stand out even more
  context.stroke();
}

//drawCanvasGrid()
drawOpenStratGrid();

document.body.onmousemove = function(e){
  if (document.getElementById("mouseFeedback") == null) {
    let myDiv = document.createElement("div");
    myDiv.id = "mouseFeedback";
    myDiv.style = "position:absolute;left:0px;top:0px;width:100px;height:14px";
    document.body.appendChild(myDiv);
  }

  let feedbackDiv = document.getElementById("mouseFeedback");
  let theCanvas = document.getElementById("scanv");
  feedbackDiv.innerText = ""+(e.clientX - theCanvas.width/2)+", "+(-e.clientY + theCanvas.height/2);
}

function makeBackgroundGrid(){
  let underCanvas = document.createElement("canvas");
  let theCanvas = document.getElementById("scanv");
  underCanvas.id = "underCanvas";
  underCanvas.style = "position:absolute;left:0px;top:0px;width:"+theCanvas.width+"px;height:"+theCanvas.height+"px";
  document.body.prepend(underCanvas);
  drawOpenStratGrid(underCanvas.id);
}
