let timeRange = [
  '0800-0850', '0900-0950', '1000-1050', '1100-1150',
  '1200-1250', '1300-1350', '1400-1450', '1500-1550',
  '1600-1650', '1700-1750', '1800-1850', '1900-1950',
  '2000-2050', '2100-2150'
]

let weekday = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
]

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

var canvas = document.getElementById("bg-canvas");
var ctx = canvas.getContext("2d");
var img = new Image();
// get canvas size
var cwidth = canvas.width;  // canvas width
var cheight = canvas.height;  // canvas height

const xy_pad = 40

const h_pad = 8
const v_pad = 6
let b_width = 160
let b_height = (((cheight / 3 * 2) - xy_pad * 2 + v_pad) / timeRange.length) - v_pad

let course_plain = []
let course_ds = []

function update_dimension(){
  b_width = (cwidth - xy_pad * 2) / weekday.length - h_pad + v_pad/timeRange.length
  b_height = (((cheight / 3 * 2) - xy_pad * 2 + v_pad) / timeRange.length) - v_pad
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

function time_merger(time){
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

function format_print(course_list){
  for (var i = 0; i < course_list.length; i++){
    course_plain.push(`Course: ${course_list[i][0][0]}\nLoc: ${course_list[i][0][1]}\nTime: ${weekday[course_list[i][1]]}, ${time_merger(course_list[i][2])}\n`)
  }
}

function check_table(){
  course_ds = [];
  course_plain = [];
  let all_courses = [];
  var table = document.getElementById("mytimetable");
  for (var i = 1, row; row = table.rows[i]; i++) { // ignore the first row
    //iterate through rows
    //rows would be accessed using the "row" variable assigned in the for loop
    const class_info = []
    for (var j = 1, col; col = row.cells[j]; j++) {  // ignore the first col
      //iterate through columns
      //columns would be accessed using the "col" variable assigned in the for loop
      if (col.innerHTML.replace('&nbsp;', ' ').trim().length !== 0) {  // check if the cell is empty
        class_info.push([extract_cname_location(col.innerHTML.replace('&nbsp;', ' ').trim()), j - 1, i - 1])
      }
    }
    all_courses = all_courses.concat(class_info)
  }
  course_ds = mergeCourse(all_courses)
  format_print(course_ds)
  document.getElementById('parse_result').innerHTML = course_plain.join('<br>')
}

function extract_cname_location(content){
  const re_matches = new RegExp("(.+[^\\)]\\))<br>([^<]+)<br>","g")
  let arr = re_matches.exec(content);
  return [arr[1], arr[2].trim()];
}

function wdSortFunction(a, b){
  if (a[1] === b[1]) {
    return 0;
  }
  else {
    return (a[1] < b[1]) ? -1 : 1;
  }
}

// fill canvas using picture from url

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
  placeholder_bg = 'https://unsplash.com/photos/RsRTIofe0HE/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8Mnx8d2FsbHBhcGVyfGVufDB8fHx8MTY0NjEzODYwNg&force=true&w=2400'
  img.src = document.getElementById("bg_url").value === '' ? placeholder_bg : document.getElementById("bg_url").value;
  return new Promise(resolve => {

    img.onload = function () {
      if (img.width < img.height) {
        var ratio = img.width / cwidth;
        img.width = cwidth;
        img.height = img.height / ratio;
      } else {
        var ratio = img.height / cheight;
        img.height = cheight;
        img.width = img.width / ratio;
      }
      ctx.drawImage(img, 0, 0, img.width, img.height);
      resolve('resolved');
    }

  });

}

function drawWorkdayHeader(){
  // write weekday on the canvas
  ctx.font = "30px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (var i = 0; i < weekday.length; i++){
    ctx.fillText(weekday[i], xy_pad + i * (b_width + h_pad) + b_width / 2, cheight / 3 - 55);
  }
}

function drawCourseBox(){
  for (var i = 0; i < course_ds.length; i++){
    var pos = getCourseBoxPosition(course_ds[i][1], course_ds[i][2], cwidth, cheight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(pos[0], pos[1], pos[2], pos[3]);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    texts = getLines(ctx, course_ds[i][0][0], pos[2])
    let offset = -25
    for (var j=0; j<texts.length; j++){
      ctx.fillText(texts[j], pos[0] + pos[2] / 2, pos[1] + pos[3] / 2 + offset);
      offset += 20;
    }
    // ctx.fillText(course_ds[i][0][0], pos[0] + pos[2] / 2, pos[1] + pos[3]/2 - 40 + 15);
    ctx.font = '12px Arial';
    ctx.fillText(course_ds[i][0][1], pos[0] + pos[2] / 2, pos[1] + pos[3]/2 + offset);
    ctx.fillText(time_merger(course_ds[i][2]), pos[0] + pos[2] / 2, pos[1] + pos[3]/2 + offset + 15);
  }
}

function getLastTime(time) {
  if (typeof (time) === 'number') {
    return time
  }else{
    return time[time.length - 1]
  }
}

function tablePruning(){
  let noCourseDay = [0,1,2,3,4,5]
  let noCourseAfter = 0
  for (var i = 0; i < course_ds.length; i++) {
    if (noCourseDay.indexOf(course_ds[i][1]) !== -1) {
      noCourseDay.splice(noCourseDay.indexOf(course_ds[i][1]), 1)
    }
    if (getLastTime(course_ds[i][2]) > noCourseAfter) {
      noCourseAfter = getLastTime(course_ds[i][2])
    }
  }
  for (var i = 0; i < noCourseDay.length; i++) {
    weekday.splice(noCourseDay[i], 1)
  }
  if (noCourseAfter !== timeRange.length - 1) {
    timeRange.splice(noCourseAfter + 1, timeRange.length - noCourseAfter - 1)
  }
  update_dimension();
}

function drawCanvas(){
  drawBackground().then(r => {
    tablePruning();
    drawWorkdayHeader();
    drawCourseBox();
    resetMapping();
  });
  // loop through course_ds and write text
}
