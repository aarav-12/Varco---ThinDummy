const { createCalendarEvent } = require("../services/googleCalendarService");

// Book consultation
const bookConsultation = async (req, res) => {
  try {
    const { patientName, email, startTime, endTime } = req.body;

    const event = await createCalendarEvent({
      patientName,
      email,
      startTime,
      endTime,
    });

    res.json({
      message: "Consultation booked",
      eventId: event.id,
      eventLink: event.htmlLink,
      meetLink: event.hangoutLink || null,
    });

  } catch (error) {
    console.error("Calendar booking error:", error);
    res.status(500).json({
      message: "Failed to book consultation",
    });
  }
};

module.exports = {
  bookConsultation,
};