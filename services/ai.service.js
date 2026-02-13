/* eslint-disable no-undef */
const riskMessages = {

    high: "High pain detected. Recommend consultation..",
    medium: "Medium risk detected. Monitor the patient closely and do some exercises.",
    low: "Low risk. Continue preventive care."
};


const generateExplanation = async (riskLevel) => {
    try {
//normalize th text(caps to lower case)
const normalized = riskLevel?.tolowerCase() || "";

//lookup msg

const message = riskMessages[normalized];

//return mapped msg
return message || "Unable to determine risk. Please consult a doctor.";


   
} catch (error) {
    console.error("Ai service error:", error);
    return "An error occurred while generating the explanation.";
}
};

module.exports = {
    generateExplanation
};