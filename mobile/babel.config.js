module.exports = {
  // RN 0.73 uses @react-native/babel-preset (the legacy metro-react-native-babel-preset
  // is not installed in this toolchain).
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: { '@': './src' },
        extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    ],
  ],
};
