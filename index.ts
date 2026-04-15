import 'react-native-url-polyfill/auto';
// Configure NativeWind dark mode for web before any rendering
import { StyleSheet } from 'react-native';
(StyleSheet as any).setFlag?.('darkMode', 'class');
import 'expo-router/entry';
