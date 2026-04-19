import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BluetoothProvider } from './src/bluetooth/BluetoothContext';
import BluetoothScreen from './src/bluetooth/BluetoothScreen';
import Game1 from './src/games/Game1';
import Game2 from './src/games/Game2';
import Game3 from './src/games/Game3';
import Game4 from './src/games/Game4';
import { useBluetooth } from './src/bluetooth/BluetoothContext';
import { Alert } from 'react-native';

type Screen =
  | 'home'
  | 'bluetooth'
  | 'game1'
  | 'game2'
  | 'game3'
  | 'game4';

type HomeProps = {
  goTo: (screen: Screen) => void;
};

function Home({ goTo }: HomeProps): React.JSX.Element {
  const { sendMessage, connectedDevice } = useBluetooth();

  const handleReset = async () => {
    if (!connectedDevice) {
      Alert.alert('Primero conecta el Bluetooth');
      return;
    }

    const ok = await sendMessage('0');
    if (ok) {
      Alert.alert('Reinicio enviado (0)');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menú principal</Text>

      <TouchableOpacity style={styles.button} onPress={() => goTo('bluetooth')}>
        <Text style={styles.buttonText}>Configurar Bluetooth</Text>
      </TouchableOpacity>

      {/* 🔴 BOTÓN REINICIAR */}
      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.buttonText}>REINICIAR</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => goTo('game1')}>
        <Text style={styles.buttonText}>Juego 1</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => goTo('game2')}>
        <Text style={styles.buttonText}>Juego 2</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => goTo('game3')}>
        <Text style={styles.buttonText}>Juego 3</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => goTo('game4')}>
        <Text style={styles.buttonText}>Juego 4</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('home');

  let content: React.JSX.Element;

  switch (screen) {
    case 'bluetooth':
      content = <BluetoothScreen goBack={() => setScreen('home')} />;
      break;
    case 'game1':
      content = <Game1 goBack={() => setScreen('home')} />;
      break;
    case 'game2':
      content = <Game2 goBack={() => setScreen('home')} />;
      break;
    case 'game3':
      content = <Game3 goBack={() => setScreen('home')} />;
      break;
    case 'game4':
      content = <Game4 goBack={() => setScreen('home')} />;
      break;
    default:
      content = <Home goTo={setScreen} />;
  }

  return (
    <BluetoothProvider>
      <View style={styles.app}>
        <StatusBar barStyle="dark-content" />
        {content}
      </View>
    </BluetoothProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#111',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },resetButton: {
  backgroundColor: '#dc2626', // rojo
  paddingVertical: 14,
  borderRadius: 12,
  marginBottom: 12,
},
});