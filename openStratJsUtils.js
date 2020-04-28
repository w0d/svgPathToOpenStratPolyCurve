//**BOOKMARKLETS**//
//*mouse position:
//javascript:(function()%7Bdocument.body.onmousemove%20%3D%20function(e)%7Bif%20(document.getElementById(%22mouseFeedback%22)%20%3D%3D%20null)%20%7Blet%20myDiv%20%3D%20document.createElement(%22div%22)%3BmyDiv.id%20%3D%20%22mouseFeedback%22%3BmyDiv.style%20%3D%20%22position%3Aabsolute%3Bleft%3A0px%3Btop%3A0px%3Bwidth%3A100px%3Bheight%3A14px%22%3Bdocument.body.appendChild(myDiv)%3B%7Dlet%20feedbackDiv%20%3D%20document.getElementById(%22mouseFeedback%22)%3Blet%20theCanvas%20%3D%20document.getElementById(%22scanv%22)%3BfeedbackDiv.innerText%20%3D%20%22%22%2B(e.clientX%20-%20theCanvas.width%2F2)%2B%22%2C%20%22%2B(-e.clientY%20%2B%20theCanvas.height%2F2)%3B%7D%7D)()
//*drawOpenStratGrid:
//javascript:(function()%7Bvar%20x%20%3D%20document.getElementById(%22scanv%22)%3Bvar%20context%20%3D%20x.getContext(%222d%22)%3Bvar%20width%20%3D%20context.canvas.width%3Bvar%20height%20%3D%20context.canvas.height%3Bvar%20centreX%20%3D%20width%2F2.0%3Bvar%20centreY%20%3D%20height%2F2.0%3Bcontext.beginPath()%3Bcontext.strokeStyle%20%3D%20'aqua'%3Bcontext.lineWidth%20%3D%200.25%3Bfor%20(var%20i%3DcentreX%3B%20i%20%3C%3D%20width%3B%20i%3Di%2B10)%7Bcontext.moveTo(i%2C%200)%3Bcontext.lineTo(i%2C%20height)%3Bif%20((centreX-i)%25100%20%3D%3D%200)%20context.lineTo(i%2C%200)%3B%7Dfor%20(var%20i%3DcentreX%3B%20i%20%3E%3D%20-width%3B%20i%3Di-10)%7Bcontext.moveTo(i%2C%200)%3Bcontext.lineTo(i%2C%20height)%3Bif%20((centreX-i)%25100%20%3D%3D%200)%20context.lineTo(i%2C%200)%3B%7Dfor%20(i%3DcentreY%3B%20i%20%3C%3D%20height%3B%20i%3Di%2B10)%7Bcontext.moveTo(0%2C%20i)%3Bcontext.lineTo(width%2C%20i)%3Bif%20((centreY-i)%25100%20%3D%3D%200)%20context.lineTo(0%2C%20i)%3B%7Dfor%20(i%3DcentreY%3B%20i%20%3E%3D%20-height%3B%20i%3Di-10)%7Bcontext.moveTo(0%2C%20i)%3Bcontext.lineTo(width%2C%20i)%3Bif%20((centreY-i)%25100%20%3D%3D%200)%20context.lineTo(0%2C%20i)%3B%7Dcontext.stroke()%3Bcontext.beginPath()%3Bcontext.moveTo(width%2F2%2C%200)%3Bcontext.lineTo(width%2F2%2C%20height)%3Bcontext.moveTo(0%2C%20height%2F2)%3Bcontext.lineTo(width%2C%20height%2F2)%3Bcontext.stroke()%7D)()

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

function drawOpenStratGrid(canvasRef){
  var thisCanvas = canvasRef ? canvasRef : document.getElementById("scanv");
  var context = thisCanvas.getContext("2d");

  var width = context.canvas.width;
  var height = context.canvas.height;

  var centreX = width/2.0;
  var centreY = height/2.0;

  context.beginPath();
  context.strokeStyle = 'aqua';
  context.lineWidth = 0.1;
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

function getMouseFeedback(){
  document.body.onmousemove = function(e){
    if (document.getElementById("mouseFeedback") == null) {
      let myDiv = document.createElement("div");
      myDiv.id = "mouseFeedback";
      myDiv.style = "position:absolute;left:0px;top:0px;width:130px;height:14px";
      document.body.appendChild(myDiv);
    }
    let feedbackDiv = document.getElementById("mouseFeedback");
    let openstratCanvas = document.getElementById("scanv");
    feedbackDiv.innerText = ""+(e.clientX - openstratCanvas.width/2)+", "+(-e.clientY + openstratCanvas.height/2);
  }
}

function makeBackgroundGrid(){ //using drawOpenStratGrid() may work better on some monitors but will overlay the grid ontop of the canvas
  let tempCanvas = document.createElement("canvas");
  let openstratCanvas = document.getElementById("scanv");
  tempCanvas.width = openstratCanvas.width;
  tempCanvas.height = openstratCanvas.height;
  drawOpenStratGrid(tempCanvas);
  document.body.style.background = 'url(' + tempCanvas.toDataURL() + ')';
  document.getElementById("scanv").style.opacity = 0.75;
}