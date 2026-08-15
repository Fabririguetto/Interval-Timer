# Interval Timer

App de timer por intervalos para entrenamientos, hecha con React Native y Expo.

## Funcionalidades

- Crear y editar rutinas con múltiples ejercicios
- Configurar tiempos de preparación, trabajo, descanso, series, transición, rondas y descanso entre rondas
- Timer con animación circular por fase
- Barra de progreso general del entrenamiento
- Sonidos de aviso al cambiar de fase y cuenta regresiva en los últimos 3 segundos
- Pausar, reanudar y saltar fases
- Rutinas guardadas localmente en el dispositivo

## Stack

- [Expo](https://expo.dev) SDK 54
- React Native 0.81
- expo-audio (sonidos)
- react-native-svg (animación circular)
- AsyncStorage (persistencia)
- React Navigation v6

## Instalación

```bash
npm install
npx expo start
```

Escanear el QR con Expo Go (Android/iOS).

## Build APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
