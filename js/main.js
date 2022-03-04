let timeRange = [
  '0800-0850', '0900-0950', '1000-1050', '1100-1150',
  '1200-1250', '1300-1350', '1400-1450', '1500-1550',
  '1600-1650', '1700-1750', '1800-1850', '1900-1950',
  '2000-2050', '2100-2150'
]

let weekday = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
]

var canvas = document.getElementById("bg-canvas");
var ctx = canvas.getContext("2d");
ctx.crossOrigin = "Anonymous";

// sizes for elements

let c_width = canvas.width;  // canvas width
let c_height = canvas.height;  // canvas height

let b_width = 0
let b_height = 0

let xy_pad = 0
let h_pad = 0
let v_pad = 0

// Course Data Structure

let course_ds = []
let course_plain = []

function resizeCanvas(production_size) {
  let production_width = production_size[0]
  let production_height = production_size[1]
  // resize canvas to full screen
  canvas.width = production_width;
  canvas.height = production_height;
  c_width = canvas.width;  // canvas width
  c_height = canvas.height;  // canvas height
  updateCellDimension(c_width, c_height);
  console.log('sizes:', canvas.width, canvas.height, c_width, c_height, b_width, b_height, h_pad, v_pad, xy_pad)
}

function updateCellDimension(canvas_width, canvas_height) {
  xy_pad = canvas_width * 0.05;
  h_pad = Math.floor(canvas_width * 0.005);
  v_pad = Math.floor(canvas_width * 0.005);
  b_width = (canvas_width - xy_pad * 2) / weekday.length - h_pad + v_pad/timeRange.length;
  b_height = (((canvas_height / 3 * 2) - xy_pad * 2 + v_pad) / timeRange.length) - v_pad;
}

function resetMapping(){
  timeRange = [
    '0800-0850', '0900-0950', '1000-1050', '1100-1150',
    '1200-1250', '1300-1350', '1400-1450', '1500-1550',
    '1600-1650', '1700-1750', '1800-1850', '1900-1950',
    '2000-2050', '2100-2150'
  ]

  weekday = [
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ]
}

function mergeCourse(course_array){
  course_array = course_array.sort(wdSortFunction);
  let new_array = []
  for (var i=0; i < course_array.length; i++){
    if (new_array.length === 0) {
      new_array.push(course_array[i])
      continue;
    }
    if (new_array[new_array.length-1][0][0] === course_array[i][0][0] && new_array[new_array.length-1][0][1] === course_array[i][0][1]){
      new_array[new_array.length-1][2] = [new_array[new_array.length-1][2], course_array[i][2]]
    }else{
      new_array.push(course_array[i])
    }
  }
  return new_array
}

function mergeTime(time){
  if (typeof time === 'object'){
    let start_time = timeRange[time[0]].split('-')[0]
    let end_time = timeRange[time[time.length-1]].split('-')[1]
    return `${start_time}-${end_time}`
  }else if (typeof time === 'number'){
    return timeRange[time]
  } else{
    console.log('Time format is wrong')
    return -1
  }
}

function formattingPrint(course_list){
  for (var i = 0; i < course_list.length; i++){
    course_plain.push(`Course: ${course_list[i][0][0]}\nLoc: ${course_list[i][0][1]}\nTime: ${weekday[course_list[i][1]]}, ${mergeTime(course_list[i][2])}\n`)
  }
}

function parseTable(){
  course_ds = [];
  course_plain = [];
  let all_courses = [];
  var table = document.getElementById("mytimetable");
  try {
    for (var i = 1, row; row = table.rows[i]; i++) { // ignore the first row
      //iterate through rows
      //rows would be accessed using the "row" variable assigned in the for loop
      const class_info = []
      for (var j = 1, col; col = row.cells[j]; j++) {  // ignore the first col
        //iterate through columns
        //columns would be accessed using the "col" variable assigned in the for loop
        if (col.innerHTML.replace('&nbsp;', ' ').trim().length !== 0) {  // check if the cell is empty
          class_info.push([extractCourseInfo(col.innerHTML.replace('&nbsp;', ' ').trim()), j - 1, i - 1])
        }
      }
      all_courses = all_courses.concat(class_info)
    }
  } catch (e) {
    alert('Your timetable is invalid. Please check whether you paste to include the table head (containing day of the week) and all empty cells.')
  }
  course_ds = mergeCourse(all_courses)
  formattingPrint(course_ds)
  document.getElementById('parse_result').innerHTML = course_plain.join('<br>')
}

function extractCourseInfo(content){
  const re_matches = new RegExp("(.+[^\\)]\\))<br>([^<]+)<br>","g")
  let arr = re_matches.exec(content);
  return [arr[1], arr[2].trim()];
}

function getCourseBoxPosition(weekday, time, area_width, area_height){
  let x = xy_pad + weekday * h_pad + weekday * b_width
  if (time.length > 1) {
    let y = time[0] * v_pad + time[0] * b_height
    return [x, y + (area_height / 3), b_width, b_height * time.length + v_pad * (time.length - 1)]
  }else{
    let y = time * v_pad + time  * b_height
    return [x, y + (area_height / 3), b_width, b_height]
  }
}

function getLines(ctx, text, maxWidth) {
  var words = text.split(" ").slice(0, -1)

  var lines = [];
  var currentLine = words[0];

  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    var width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  if (lines.length === 1) {
    lines.push(' ')
  }
  return lines;
}

function drawBackground(){
  var img = new Image();
  img.crossOrigin = "anonymous";
  img.src = getBackgroundSetup()
  console.log('background', img.src)
  return new Promise(resolve => {
    img.onload = function () {
      if (img.width < img.height) {
        var ratio = img.width / c_width;
        img.width = c_width;
        img.height = img.height / ratio;
      } else {
        var ratio = img.height / c_height;
        img.height = c_height;
        img.width = img.width / ratio;
      }
      ctx.drawImage(img, 0, 0, img.width, img.height);
      resolve('resolved');
    }
  });

}

function drawWorkdayHeader(){
  // write weekday on the canvas
  ctx.font = "120px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (var i = 0; i < weekday.length; i++){
    ctx.fillText(weekday[i], xy_pad + i * (b_width + h_pad) + b_width / 2, c_height / 3 - 220);
  }
}

function drawCourseBox(){
  for (var i = 0; i < course_ds.length; i++){
    var pos = getCourseBoxPosition(course_ds[i][1], course_ds[i][2], c_width, c_height)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(pos[0], pos[1], pos[2], pos[3]);
    ctx.fillStyle = 'black';
    ctx.font = '80px Arial';
    texts = getLines(ctx, course_ds[i][0][0], pos[2])
    let offset = -100
    for (var j=0; j<texts.length; j++){
      ctx.fillText(texts[j], pos[0] + pos[2] / 2, pos[1] + pos[3] / 2 + offset);
      offset += 80;
    }
    // ctx.fillText(course_ds[i][0][0], pos[0] + pos[2] / 2, pos[1] + pos[3]/2 - 40 + 15);
    ctx.font = '48px Arial';
    ctx.fillText(course_ds[i][0][1], pos[0] + pos[2] / 2, pos[1] + pos[3]/2 + offset);
    ctx.fillText(mergeTime(course_ds[i][2]), pos[0] + pos[2] / 2, pos[1] + pos[3]/2 + offset + 60);
  }
}

function tablePruning(){
  let noCourseDay = [0,1,2,3,4,5]
  let noCourseAfter = 0
  for (var i = 0; i < course_ds.length; i++) {
    if (noCourseDay.indexOf(course_ds[i][1]) !== -1) {
      noCourseDay.splice(noCourseDay.indexOf(course_ds[i][1]), 1)
    }
    if (getEndTime(course_ds[i][2]) > noCourseAfter) {
      noCourseAfter = getEndTime(course_ds[i][2])
    }
  }
  for (var i = 0; i < noCourseDay.length; i++) {
    weekday.splice(noCourseDay[i], 1)
  }
  if (noCourseAfter !== timeRange.length - 1) {
    timeRange.splice(noCourseAfter + 1, timeRange.length - noCourseAfter - 1)
  }
}

function drawCanvas(){
  console.log('drawing canvas')
  return new Promise(resolve => {
    tablePruning();
    resizeCanvas(getProductionSize());
    drawBackground().then(r => {
      drawWorkdayHeader();
      drawCourseBox();
      console.log('resizing canvas')
      resizeToTarget();
      console.log('done resizing')
      resetMapping();
      resolve('resolved');
    });
  });
}

function getEndTime(time) {
  if (typeof (time) === 'number') {
    return time
  }else{
    return time[time.length - 1]
  }
}

function wdSortFunction(a, b){
  if (a[1] === b[1]) {
    return 0;
  }
  else {
    return (a[1] < b[1]) ? -1 : 1;
  }
}

function getProductionSize(){
  // get selected aspect ratio
  let aspect_ratio = document.getElementById("aspect-ratio-dropdown").value
  // get resolution
  const production_resolution = 4320
  let p_resolution_coff = production_resolution / aspect_ratio.split(':')[1]
  let production_width = p_resolution_coff * aspect_ratio.split(':')[1]
  let production_height = p_resolution_coff * aspect_ratio.split(':')[0]
  return [production_width, production_height]
}

function getTargetSize(){
  // get selected aspect ratio
  let aspect_ratio = document.getElementById("aspect-ratio-dropdown").value
  // get resolution
  let resolution = document.querySelector('input[name="ResolutionOptions"]:checked').value;
  let resolution_coff = resolution / aspect_ratio.split(':')[1]
  let target_width = resolution_coff * aspect_ratio.split(':')[1]
  let target_height = resolution_coff * aspect_ratio.split(':')[0]
  return [target_width, target_height]
}

function getBackgroundSetup(){
  let selectImg = document.querySelector('input[name="imgBackgroundOption"]:checked').value;
  let fillInImg = document.getElementById('bg_url').value;
  let imageBackground = ''
  if (fillInImg.length > 0) {
    if (validateURL(fillInImg)) {
      imageBackground = fillInImg
    } else {
      alert('Please enter a valid URL, fallback to default image')
      imageBackground = selectImg
    }
  } else {
    imageBackground = selectImg
  }
  return imageBackground
}

function validateURL(url){
  const url_regex = new RegExp('https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)');
  if (url_regex.test(url)) {
    return true
  } else {
    return false
  }
}

function resizeToTarget(){
  let target_size = getTargetSize()
  let target_width = target_size[0]
  resample_single(canvas, target_size[0], target_size[1], true)
}

function resample_single(canvas, width, height, resize_canvas) {
  var width_source = canvas.width;
  var height_source = canvas.height;
  width = Math.round(width);
  height = Math.round(height);

  var ratio_w = width_source / width;
  var ratio_h = height_source / height;
  var ratio_w_half = Math.ceil(ratio_w / 2);
  var ratio_h_half = Math.ceil(ratio_h / 2);
  console.log(ratio_w, ratio_h)

  var ctx = canvas.getContext("2d");
  var img = ctx.getImageData(0, 0, width_source, height_source);
  var img2 = ctx.createImageData(width, height);
  var data = img.data;
  var data2 = img2.data;

  for (var j = 0; j < height; j++) {
    for (var i = 0; i < width; i++) {
      var x2 = (i + j * width) * 4;
      var weight = 0;
      var weights = 0;
      var weights_alpha = 0;
      var gx_r = 0;
      var gx_g = 0;
      var gx_b = 0;
      var gx_a = 0;
      var center_y = (j + 0.5) * ratio_h;
      var yy_start = Math.floor(j * ratio_h);
      var yy_stop = Math.ceil((j + 1) * ratio_h);
      for (var yy = yy_start; yy < yy_stop; yy++) {
        var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
        var center_x = (i + 0.5) * ratio_w;
        var w0 = dy * dy; //pre-calc part of w
        var xx_start = Math.floor(i * ratio_w);
        var xx_stop = Math.ceil((i + 1) * ratio_w);
        for (var xx = xx_start; xx < xx_stop; xx++) {
          var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
          var w = Math.sqrt(w0 + dx * dx);
          if (w >= 1) {
            //pixel too far
            continue;
          }
          //hermite filter
          weight = 2 * w * w * w - 3 * w * w + 1;
          var pos_x = 4 * (xx + yy * width_source);
          //alpha
          gx_a += weight * data[pos_x + 3];
          weights_alpha += weight;
          //colors
          if (data[pos_x + 3] < 255)
            weight = weight * data[pos_x + 3] / 250;
          gx_r += weight * data[pos_x];
          gx_g += weight * data[pos_x + 1];
          gx_b += weight * data[pos_x + 2];
          weights += weight;
        }
      }
      data2[x2] = gx_r / weights;
      data2[x2 + 1] = gx_g / weights;
      data2[x2 + 2] = gx_b / weights;
      data2[x2 + 3] = gx_a / weights_alpha;
    }
  }
  //clear and resize canvas
  if (resize_canvas === true) {
    canvas.width = width;
    canvas.height = height;
  } else {
    ctx.clearRect(0, 0, width_source, height_source);
  }

  //draw
  ctx.putImageData(img2, 0, 0);
}
