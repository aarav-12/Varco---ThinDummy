/* eslint-disable no-undef */
exports.getAllPatients = (req, res) => {
  res.json({
    patients: [],
  });
};

exports.getPatientById = (req, res) => {
  res.json({
    id: req.params.id,
    name: "Demo Patient",
    painLevel: 5,
    symptoms: "Demo symptoms",
    riskLevel: "Moderate",
    aiExplanation: "Demo AI explanation",
  });
};
