const DASHBOARD_URL =
  "https://script.google.com/macros/s/AKfycbyIkwUcqkTByR1sYmWiVKuyH5sUH5Rhl0w3183V8w698Wv-QK4eDRNuq40VDq3m5H7i/exec";

export default function DashboardModule() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 112px)" }}>
      <iframe
        src={DASHBOARD_URL}
        title="Dashboard Consumos"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          display: "block",
        }}
        allow="fullscreen"
      />
    </div>
  );
}
