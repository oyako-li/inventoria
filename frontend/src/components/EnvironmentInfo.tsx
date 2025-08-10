import React from 'react';
import { apiConfig } from '../utils/api';

const EnvironmentInfo: React.FC = () => {
  const mode = import.meta.env.MODE;

  return (
    <div className="environment-info">
      <div className="env-badge">
        <span className={`env-label ${mode}`}>
          {mode.toUpperCase()}
        </span>
        <span className="env-api-url">
          API: {apiConfig.baseURL}
        </span>
        {apiConfig.debug && (
          <span className="env-debug">DEBUG</span>
        )}
      </div>
    </div>
  );
};

export default EnvironmentInfo; 