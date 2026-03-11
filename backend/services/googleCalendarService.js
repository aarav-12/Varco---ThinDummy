const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config();
// console.log("EVENT LINK:", response.data.htmlLink);
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const generateAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
};

const getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  global.googleTokens = tokens;

  return tokens;
};

const createCalendarEvent = async (eventData) => {
  oauth2Client.setCredentials(global.googleTokens);

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const event = {
    summary: `Doctor Consultation - ${eventData.patientName}`,
    description: "Doctor consultation booking",
    start: {
      dateTime: eventData.startTime,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: eventData.endTime,
      timeZone: "Asia/Kolkata",
    },
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
  });

  return response.data;
};

module.exports = {
  generateAuthUrl,
  getTokens,
  createCalendarEvent,
};
