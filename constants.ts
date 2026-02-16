// Firmware v21.0 Color Map
export const COLORS = {
  // Physical Chassis
  bezel: '#333333',
  
  // Firmware Colors (Approximate Hex from 565RGB)
  bg: '#000000',          // COL_BG
  header: '#102040',      // 0x0841 (Dark Blue/Gray)
  cyan: '#00FFFF',        // COL_CYAN
  amber: '#FFBF00',       // COL_AMBER
  pink: '#FF00FF',        // COL_PINK
  dark: '#203050',        // COL_DARK
  off: '#303030',         // COL_OFF
  
  // UI Elements
  textWhite: '#FFFFFF',
  textGray: '#888888',
  gridBorder: '#00FFFF',

  // Component Specific Colors
  acOnBorder: '#00FFFF',
  acOnBg: '#003333',
  stdOnBorder: '#4ADE80',
};

export const BEZEL_DIMS = {
  width: 680,
  height: 540
};

// --- NEXUS CLOUD CREDENTIALS ---

export const MQTT_CONFIG = {
  host: 'e462158e43674f3faf283e5e3390e2ff.s1.eu.hivemq.cloud',
  // Note: HiveMQ Cloud uses port 8884 for Secure WebSockets (WSS) typically, 
  // while 8883 is for TCP/TLS which browsers can't use directly.
  port: 8884, 
  protocol: 'wss' as const,
  path: '/mqtt',
  username: 'nexus_admin',
  password: 'Nexus@2026',
};

export const DB_CONFIG = {
  // STRICTLY using libsql:// protocol as requested
  url: 'libsql://nexus-yossamr.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzExOTA0MTgsImlkIjoiMDc0MTNmM2YtOTViNC00ZjQxLWJjM2EtNjU0YTQwNmZiZDY0IiwicmlkIjoiZDM5NjNjNTUtYTEzNC00NDY3LTllYTMtYmIwYzI5MjI0NGY1In0.bqV7wh1caal8nLWgekDEOq1Z3lpoeXvuKF7PapUCh4u2e9pUKXrJzQXgBuUmeIFmfljU1rNT8Qr-NTayhBftBQ'
};
