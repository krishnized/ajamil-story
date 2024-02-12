import parser from 'subtitles-parser'
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

var ru = fs.readFileSync('./ru.srt', 'utf-8');
var en = fs.readFileSync('./en.srt', 'utf-8');
var enSpeakers = fs.readFileSync('./en-speakers.srt', 'utf-8');

var ruData = parser.fromSrt(ru);
var enData = parser.fromSrt(en);
var enDataSpeakers = parser.fromSrt(enSpeakers);
// {id, startTime, endTime, text}


// a few edits (shift time)
// ruData = shift(ruData, '00:54:10,000', 8.2)
// ruData = shift(ruData, '00:56:14,000', -0.5)

// copy russian subs times into en subs
// enData = enData.map((item, i) => ({ ...item, startTime: ruData[i].startTime, endTime: ruData[i].endTime }))

// save en file back
// fs.writeFileSync('en.srt', parser.toSrt(enData))

// convert srt file (fragment) to elevenlabs CSV
const enFrag = slice(enDataSpeakers, '00:04:41,000', '00:06:20,000')
const ruFrag = slice(ruData, '00:04:41,000', '00:06:20,000')
let rows = [], speaker
for (let i = 0, l = enFrag.length; i < l; i++) {
  let enSub = enFrag[i], ruSub = ruFrag[i]

  // detect speaker
  let parts = enSub.text.split(': ')
  if (parts.length > 1 && parts[0].length && parts[0].length < parts[1].length) {
    speaker = parts.shift()
  }

  // speaker, start_time, end_time, transcription, translation
  rows.push([speaker, enSub.startTime, enSub.endTime, ruSub.text.replace(/\n/g, ' '), parts.join(': ').replace(/\n/g, ' ')])
}

fs.writeFileSync('../cuts/father-boy-guru.csv', stringify(rows, {
  columns: ['speaker', 'start_time', 'end_time', 'transcription', 'translation'],
  header: true,
  quoted: true
}))


// slice subs to indicated time range (reset start time to 0)
function slice(subs, fromTime, toTime) {
  let fromSeconds = timeStringToSeconds(fromTime), toSeconds = timeStringToSeconds(toTime)

  return subs.filter(sub => {
    let subStartTime = timeStringToSeconds(sub.startTime)
    if (subStartTime > fromSeconds && subStartTime < toSeconds) return true
  }).map(sub => {
    const newStartTime = timeStringToSeconds(sub.startTime) - fromSeconds,
      newEndTime = timeStringToSeconds(sub.endTime) - fromSeconds
    return { ...sub, startTime: secondsToTimeString(newStartTime), endTime: secondsToTimeString(newEndTime) };
  })
}

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
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(sec || 0) + Number(millis || 0) / 1000;
}

function secondsToTimeString(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}
