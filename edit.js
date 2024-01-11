import parser from 'subtitles-parser'
import fs from 'fs';

var ru = fs.readFileSync('ru.srt', 'utf-8');
var en = fs.readFileSync('en.srt', 'utf-8');

var ruData = parser.fromSrt(ru);
var enData = parser.fromSrt(en);
// {id, startTime, endTime, text}


// a few edits
// ruData = shift(ruData, '00:54:10,000', 8.2)
// ruData = shift(ruData, '00:56:14,000', -0.5)

// copy russian subs times into en subs
enData = enData.map((item, i) => ({ ...item, startTime: ruData[i].startTime, endTime: ruData[i].endTime }))

fs.writeFileSync('en.srt', parser.toSrt(enData))


// shift everything after indicated time by ...
function shift(subtitles, from, shiftSeconds) {
  const fromSeconds = timeStringToSeconds(from);

  return subtitles.map(subtitle => {
    if (timeStringToSeconds(subtitle.startTime) > fromSeconds) {
      const newStartTime = secondsToTimeString(timeStringToSeconds(subtitle.startTime) + shiftSeconds);
      const newEndTime = secondsToTimeString(timeStringToSeconds(subtitle.endTime) + shiftSeconds);

      return { ...subtitle, startTime: newStartTime, endTime: newEndTime };
    }
    return subtitle;
  });
}

function timeStringToSeconds(timeString) {
  const [hours, minutes, seconds] = timeString.split(':');
  const [sec, millis] = seconds.split(',');
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(sec) + Number(millis) / 1000;
}

function secondsToTimeString(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}
