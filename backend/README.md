like this is the api contracts of the patients

purpose: accept patient reported data and create a patiend record

req body : 
{
    "name": "John Doe",
    "age": 30,
    "painlevel": "number",
    "symptoms": "string",
}

res body:

{
    "patiendid": "string",
    status: "submitted"
}

2️⃣ Get AI Explanation

Endpoint: POST /api/chat
Called by: Patient UI

Purpose:
Generate an explanation based on patient data and risk score.

Request Body:

{
  "patientId": "string"
}


Response (Success):

{
  "explanation": "string",
  "riskLevel": "High | Moderate | Low"
}


Notes:

AI logic stays backend-only

Initially mocked, real AI can replace later

3️⃣ Get All Patients (Doctor Dashboard)

Endpoint: GET /api/doctor/patients
Called by: Doctor Dashboard

Purpose:
Fetch a list of all submitted patients.

Response (Success):

{
  "patients": [
    {
      "id": "string",
      "name": "string",
      "painLevel": "number"
    }
  ]
}

4️⃣ Get Patient Detail (Doctor View)

Endpoint: GET /api/doctor/patient/:id
Called by: Doctor Dashboard

Purpose:
Fetch full details + AI explanation for a single patient.

Response (Success):

{
  "id": "string",
  "name": "string",
  "age": "number",
  "painLevel": "number",
  "symptoms": "string",
  "riskLevel": "High | Moderate | Low",
  "aiExplanation": "string"
}