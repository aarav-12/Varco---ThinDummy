import Chat from "./components/Chat";

function App() {
  return (
    <div style={{ display: "flex", gap: "40px" }}>
      <Chat patientId={1} role="patient" />
      <Chat patientId={1} role="doctor" />
    </div>
  );
}

export default App;