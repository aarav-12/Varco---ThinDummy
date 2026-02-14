-- Create chat_messages table for doctor-patient messaging

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  sender VARCHAR(50) NOT NULL, -- 'doctor' or 'patient'
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by patient_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_patient_id ON chat_messages(patient_id);
