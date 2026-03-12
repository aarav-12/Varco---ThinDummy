const { google } = require("googleapis");
const path = require("path");

// Service Account Authentication
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "service-account.json"),
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({
  version: "v3",
  auth,
});

// Check if the time slot is available
const checkAvailability = async (startTime, endTime) => {
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startTime,
      timeMax: endTime,
      timeZone: "Asia/Kolkata",
      items: [{ id: "primary" }],
    },
  });

  const busySlots = response.data.calendars.primary.busy;

  return busySlots.length === 0;
};

// Create calendar event
const createCalendarEvent = async (eventData) => {
  const { patientName, email, startTime, endTime } = eventData;

  // Check availability first
  const isAvailable = await checkAvailability(startTime, endTime);

  if (!isAvailable) {
    throw new Error("Time slot already booked");
  }

  const event = {
    summary: `Doctor Consultation - ${patientName}`,
    description: "Doctor consultation booking",
    start: {
      dateTime: startTime,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endTime,
      timeZone: "Asia/Kolkata",
    },

    attendees: [{ email }],

    conferenceData: {
      createRequest: {
        requestId: "consultation-" + Date.now(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  return response.data;
};

module.exports = {
  createCalendarEvent,
};