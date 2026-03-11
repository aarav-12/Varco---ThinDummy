const {
  generateAuthUrl,
  getTokens,
  createCalendarEvent,
} = require("../services/googleCalendarService");

const connectGoogleCalendar = (req, res) => {

  const url = generateAuthUrl();

  res.redirect(url);
};

const googleCallback = async (req, res) => {

  const { code } = req.query;

  await getTokens(code);

  res.send("Google Calendar Connected");
};

const bookConsultation = async (req, res) => {

  const { patientName, startTime, endTime } = req.body;

  const event = await createCalendarEvent({
    patientName,
    startTime,
    endTime,
  });

 res.json({
  message: "Consultation booked",
  eventId: event.id,
  eventLink: event.htmlLink
});
};

module.exports = {
  connectGoogleCalendar,
  googleCallback,
  bookConsultation,
};