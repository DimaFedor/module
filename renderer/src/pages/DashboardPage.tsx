import React from 'react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  return (
    <div className="card">
      <h1 style={{ marginTop: 0, marginBottom: 12 }}>Dashboard</h1>
      <p style={{ marginBottom: 16, fontSize: 14 }}>
        High-level view of your evidence vault and recent audit activity.
      </p>
      <ul style={{ fontSize: 14, paddingLeft: 18 }}>
        <li>
          Go to the <Link to="/vault">Evidence Vault</Link> to manage items.
        </li>
        <li>
          Review <Link to="/audit-log">Audit Log</Link> for critical changes.
        </li>
        <li>
          Build an <Link to="/export">Export Package</Link> for auditors.
        </li>
      </ul>
    </div>
  );
};

