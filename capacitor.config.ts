import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vector.app',
  appName: 'Vector',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
