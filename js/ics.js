/* global saveAs, Blob, BlobBuilder, console */
/* exported ics */

var ics = function(uidDomain, prodId, vtimezone) {
  'use strict';

  if (navigator.userAgent.indexOf('MSIE') > -1 && navigator.userAgent.indexOf('MSIE 10') == -1) {
    console.log('Unsupported Browser');
    return;
  }

  if (typeof uidDomain === 'undefined') { uidDomain = 'default'; }
  if (typeof prodId === 'undefined') { prodId = 'Calendar'; }

  var SEPARATOR = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
  var calendarEvents = [];

  var tzBlock = (typeof vtimezone !== 'undefined') ? vtimezone : null;
  var tzidMatch = tzBlock ? tzBlock.match(/TZID:([^\r\n]+)/) : null;
  var timezone = tzidMatch ? tzidMatch[1].trim() : null;

  var calendarStart = [
    'BEGIN:VCALENDAR',
    'PRODID:' + prodId,
    'VERSION:2.0'
  ].join(SEPARATOR) + (tzBlock ? SEPARATOR + tzBlock : '');
  var calendarEnd = SEPARATOR + 'END:VCALENDAR';
  var BYDAY_VALUES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  return {
    /**
     * Returns events array
     * @return {array} Events
     */
    'events': function() {
      return calendarEvents;
    },

    /**
     * Returns calendar
     * @return {string} Calendar in iCalendar format
     */
    'calendar': function() {
      return calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;
    },

    /**
     * Add event to the calendar
     * @param  {string} subject     Subject/Title of event
     * @param  {string} description Description of event
     * @param  {string} location    Location of event
     * @param  {string} begin       Beginning date of event
     * @param  {string} stop        Ending date of event
     * @param  {object} rrule       Recurrence rule object (optional)
     * @param  {number} alarmBefore Number of minutes before event to trigger alarm (optional)
     * @param  {object} geo         Geographical coordinates object with lat and lon properties (optional) format: { lat: number, lon: number, radius: number }
     * @param  {object} appleGeo    Coordinates to use for Apple structured location (optional). If null, falls back to geo coordinates. Format: { lat: number, lon: number }
     */
    'addEvent': function(subject, description, location, begin, stop, rrule, alarmBefore, geo, appleGeo) {
      // I'm not in the mood to make these optional... So they are all required
      if (typeof subject === 'undefined' ||
        typeof description === 'undefined' ||
        typeof location === 'undefined' ||
        typeof begin === 'undefined' ||
        typeof stop === 'undefined'
      ) {
        return false;
      }

      // validate rrule
      if (rrule) {
        if (!rrule.rrule) {
          if (rrule.freq !== 'YEARLY' && rrule.freq !== 'MONTHLY' && rrule.freq !== 'WEEKLY' && rrule.freq !== 'DAILY') {
            throw "Recurrence rrule frequency must be provided and be one of the following: 'YEARLY', 'MONTHLY', 'WEEKLY', or 'DAILY'";
          }

          if (rrule.until) {
            if (isNaN(Date.parse(rrule.until))) {
              throw "Recurrence rrule 'until' must be a valid date string";
            }
          }

          if (rrule.interval) {
            if (isNaN(parseInt(rrule.interval))) {
              throw "Recurrence rrule 'interval' must be an integer";
            }
          }

          if (rrule.count) {
            if (isNaN(parseInt(rrule.count))) {
              throw "Recurrence rrule 'count' must be an integer";
            }
          }

          if (typeof rrule.byday !== 'undefined') {
            if ((Object.prototype.toString.call(rrule.byday) !== '[object Array]')) {
              throw "Recurrence rrule 'byday' must be an array";
            }

            if (rrule.byday.length > 7) {
              throw "Recurrence rrule 'byday' array must not be longer than the 7 days in a week";
            }

            // Filter any possible repeats
            rrule.byday = rrule.byday.filter(function(elem, pos) {
              return rrule.byday.indexOf(elem) == pos;
            });

            for (var d in rrule.byday) {
              if (BYDAY_VALUES.indexOf(rrule.byday[d]) < 0) {
                throw "Recurrence rrule 'byday' values must include only the following: 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'";
              }
            }
          }
        }
      }

      //TODO add time and time zone? use moment to format?
      var start_date = new Date(begin);
      var end_date = new Date(stop);
      var now_date = new Date();

      var start_year = ("0000" + (start_date.getFullYear().toString())).slice(-4);
      var start_month = ("00" + ((start_date.getMonth() + 1).toString())).slice(-2);
      var start_day = ("00" + ((start_date.getDate()).toString())).slice(-2);
      var start_hours = ("00" + (start_date.getHours().toString())).slice(-2);
      var start_minutes = ("00" + (start_date.getMinutes().toString())).slice(-2);
      var start_seconds = ("00" + (start_date.getSeconds().toString())).slice(-2);

      var end_year = ("0000" + (end_date.getFullYear().toString())).slice(-4);
      var end_month = ("00" + ((end_date.getMonth() + 1).toString())).slice(-2);
      var end_day = ("00" + ((end_date.getDate()).toString())).slice(-2);
      var end_hours = ("00" + (end_date.getHours().toString())).slice(-2);
      var end_minutes = ("00" + (end_date.getMinutes().toString())).slice(-2);
      var end_seconds = ("00" + (end_date.getSeconds().toString())).slice(-2);

      var now_year = ("0000" + (now_date.getUTCFullYear().toString())).slice(-4);
      var now_month = ("00" + ((now_date.getUTCMonth() + 1).toString())).slice(-2);
      var now_day = ("00" + ((now_date.getUTCDate()).toString())).slice(-2);
      var now_hours = ("00" + (now_date.getUTCHours().toString())).slice(-2);
      var now_minutes = ("00" + (now_date.getUTCMinutes().toString())).slice(-2);
      var now_seconds = ("00" + (now_date.getUTCSeconds().toString())).slice(-2);

      // Since some calendars don't add 0 second events, we need to remove time if there is none...
      var start_time = '';
      var end_time = '';
      if (start_hours + start_minutes + start_seconds + end_hours + end_minutes + end_seconds != 0) {
        start_time = 'T' + start_hours + start_minutes + start_seconds;
        end_time = 'T' + end_hours + end_minutes + end_seconds;
      }
      var now_time = 'T' + now_hours + now_minutes + now_seconds + 'Z';

      var start = start_year + start_month + start_day + start_time;
      var end = end_year + end_month + end_day + end_time;
      var now = now_year + now_month + now_day + now_time;

      // recurrence rrule vars
      var rruleString;
      if (rrule) {
        if (rrule.rrule) {
          rruleString = rrule.rrule;
        } else {
          rruleString = 'RRULE:FREQ=' + rrule.freq;

          if (rrule.until) {
            var uDate = new Date(Date.parse(rrule.until)).toISOString();
            rruleString += ';UNTIL=' + uDate.substring(0, uDate.length - 13).replace(/[-]/g, '') + '000000Z';
          }

          if (rrule.interval) {
            rruleString += ';INTERVAL=' + rrule.interval;
          }

          if (rrule.count) {
            rruleString += ';COUNT=' + rrule.count;
          }

          if (rrule.byday && rrule.byday.length > 0) {
            rruleString += ';BYDAY=' + rrule.byday.join(',');
          }
        }
      }

      // Validate geo coordinates if provided
      if (geo) {
        if (typeof geo.lat !== 'number' || typeof geo.lon !== 'number') {
          throw "Geo coordinates must be numbers";
        }
        if (geo.lat < -90 || geo.lat > 90) {
          throw "Latitude must be between -90 and 90";
        }
        if (geo.lon < -180 || geo.lon > 180) {
          throw "Longitude must be between -180 and 180";
        }
      }

      var stamp = new Date().toISOString();

      var calendarEvent = [
        'BEGIN:VEVENT',
        'UID:' + calendarEvents.length + "@" + uidDomain,
        'CLASS:PUBLIC',
        'DESCRIPTION:' + description,
        'DTSTAMP:' + now,
        (timezone ? 'DTSTART;TZID=' + timezone : 'DTSTART') + ':' + start,
        (timezone ? 'DTEND;TZID=' + timezone : 'DTEND') + ':' + end,
        'LOCATION:' + location,
        'SUMMARY;LANGUAGE=en-us:' + subject,
        'TRANSP:TRANSPARENT',
      ];

      if (geo) {
        calendarEvent.splice(calendarEvent.indexOf('LOCATION:' + location) + 1, 0,
          'GEO:' + geo.lat + ';' + geo.lon
        );
        // Use appleGeo coordinates if provided, otherwise fall back to geo
        var apLat = (appleGeo && typeof appleGeo.lat === 'number') ? appleGeo.lat : geo.lat;
        var apLon = (appleGeo && typeof appleGeo.lon === 'number') ? appleGeo.lon : geo.lon;
        var apRadius = geo.radius || 50;
        calendarEvent.splice(calendarEvent.indexOf('GEO:' + geo.lat + ';' + geo.lon) + 1, 0,
          'X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-ADDRESS=' + location + ';X-APPLE-RADIUS=' + apRadius + ';X-TITLE=' + location + ':geo:' + apLat + ',' + apLon
        );
      }

      // Add alarm if specified
      if (typeof alarmBefore !== 'undefined' && alarmBefore.toString().trim() !== '') {
        calendarEvent.push(
          'BEGIN:VALARM',
          'TRIGGER:-PT' + Math.abs(alarmBefore) + 'M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Reminder: ' + subject,
          'END:VALARM'
        );
      }

      calendarEvent.push('END:VEVENT');

      if (rruleString) {
        calendarEvent.splice(4, 0, rruleString);
      }

      calendarEvent = calendarEvent.join(SEPARATOR);

      calendarEvents.push(calendarEvent);
      return calendarEvent;
    },

    /**
     * Download calendar using the saveAs function from filesave.js
     * @param  {string} filename Filename
     * @param  {string} ext      Extention
     */
    'download': function(filename, ext) {
      if (calendarEvents.length < 1) {
        return false;
      }

      ext = (typeof ext !== 'undefined') ? ext : '.ics';
      filename = (typeof filename !== 'undefined') ? filename : 'calendar';
      var calendar = calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;

      var blob;
      if (navigator.userAgent.indexOf('MSIE 10') === -1) { // chrome or firefox
        blob = new Blob([calendar]);
      } else { // ie
        var bb = new BlobBuilder();
        bb.append(calendar);
        blob = bb.getBlob('text/x-vCalendar;charset=' + document.characterSet);
      }
      saveAs(blob, filename + ext);
      return calendar;
    },

    /**
     * Build and return the ical contents
     */
    'build': function() {
      if (calendarEvents.length < 1) {
        return false;
      }

      var calendar = calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;

      return calendar;
    }
  };
};
