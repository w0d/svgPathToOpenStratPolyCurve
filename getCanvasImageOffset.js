function rowBlank(imageData, width, y) {
  for (var x = 0; x < width; ++x) {
    if (imageData.data[y * width * 4 + x * 4]+imageData.data[y * width * 4 + x * 4 + 1]+imageData.data[y * width * 4 + x * 4 + 2] !== 255*3) return false;
  }
  return true;
}

function columnBlank(imageData, width, x, top, bottom) {
  for (var y = top; y < bottom; ++y) {
    if (imageData.data[y * width * 4 + x * 4]+imageData.data[y * width * 4 + x * 4 + 1]+imageData.data[y * width * 4 + x * 4 + 2] !== 255*3) return false;
  }
  return true;
 }

function getCanvasImageOffset() {
  var canvas = document.getElementById("scanv");
  var ctx = canvas.getContext("2d");
  var width = canvas.width;
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var top = 0, bottom = imageData.height, left = 0, right = imageData.width;

  while (top < bottom && rowBlank(imageData, width, top)) ++top;
  while (bottom - 1 > top && rowBlank(imageData, width, bottom - 1)) --bottom;
  while (left < right && columnBlank(imageData, width, left, top, bottom)) ++left;
  while (right - 1 > left && columnBlank(imageData, width, right - 1, top, bottom)) --right;

  var shapeOrigin = {x: (left+right)/2, y: (top+bottom)/2};
  var canvasOrigin = {x: canvas.width/2, y: canvas.height/2};
  var originalSvgOffset = {x: shapeOrigin.x-canvasOrigin.x, y: shapeOrigin.y-canvasOrigin.y};

  return originalSvgOffset;
}
