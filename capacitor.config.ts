export default {
  appId: 'com.example.drawtoday',
  appName: 'DrawToday',
  webDir: 'dist',
  android: {
    buildOptions: {
      GradleProperties: {
        'android.useAndroidX': 'true',
        'android.enableJetifier': 'true',
      },
    },
  },
};
