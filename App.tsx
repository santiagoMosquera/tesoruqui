import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BluetoothProvider, useBluetooth } from './src/bluetooth/BluetoothContext';
import BluetoothScreen from './src/bluetooth/BluetoothScreen';
import Game1 from './src/games/Game1';
import Game2 from './src/games/Game2';
import Game3 from './src/games/Game3';
import Game4 from './src/games/Game4';

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
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!connectedDevice) {
      setModalMessage('🔒 Primero conecta el Bluetooth');
      return;
    }

    const ok = await sendMessage('0');

    if (ok) {
      setModalMessage('✨ Reinicio enviado correctamente (0)');
    } else {
      setModalMessage('⚠️ No se pudo enviar el reinicio');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Games</Text>

        <TouchableOpacity style={styles.purpleButton} onPress={() => goTo('bluetooth')}>
          <Text style={styles.buttonText}>💙 Configurar Bluetooth</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>Elige una aventura</Text>

        <TouchableOpacity style={styles.pinkButton} onPress={() => goTo('game1')}>
          <Text style={styles.buttonText}>🍦 Spacial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.yellowButton} onPress={() => goTo('game2')}>
          <Text style={styles.buttonText}>🤸🏻 Gymnastics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mintButton} onPress={() => goTo('game3')}>
          <Text style={styles.buttonText}>🏀 Basketball</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.peachButton} onPress={() => goTo('game4')}>
          <Text style={styles.buttonText}>🤯 Mates</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}> </Text>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.buttonText}>💖 REINICIAR</Text>
        </TouchableOpacity>

    

        {modalMessage && (
          <View style={styles.overlayBox}>
            <Text style={styles.overlayText}>{modalMessage}</Text>

            <TouchableOpacity
              style={styles.overlayButton}
              onPress={() => setModalMessage(null)}
            >
              <Text style={styles.overlayButtonText}>OK 💖</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
        <StatusBar barStyle="dark-content" backgroundColor="#ffdff2" />
        {content}
      </View>
    </BluetoothProvider>
  );
}

const baseButton = {
  paddingVertical: 14 as const,
  borderRadius: 18,
  marginBottom: 12,
  borderWidth: 2,
};

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#ffeef8',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#eefff9',
  },
  card: {
    backgroundColor: '#fff8fc',
    borderRadius: 28,
    padding: 24,
    borderWidth: 3,
    borderColor: '#c7ffea',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    position: 'relative',
  },
  kawaiiEmoji: {
    textAlign: 'center',
    fontSize: 30,
    marginBottom: 8,
    color: '#25eec9',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: '#25eec9',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#9c6b86',
    marginBottom: 22,
  },
  purpleButton: {
    ...baseButton,
    backgroundColor: '#cdb4ff',
    borderColor: '#b08cff',
  },
  resetButton: {
    ...baseButton,
    backgroundColor: '#ff8fab',
    borderColor: '#ff5d8f',
  },
  pinkButton: {
    ...baseButton,
    backgroundColor: '#ffcad4',
    borderColor: '#ff9fba',
  },
  yellowButton: {
    ...baseButton,
    backgroundColor: '#ffeaa7',
    borderColor: '#ffd166',
  },
  mintButton: {
    ...baseButton,
    backgroundColor: '#b8f2e6',
    borderColor: '#7edfcf',
  },
  peachButton: {
    ...baseButton,
    backgroundColor: '#ffd6a5',
    borderColor: '#ffb86b',
  },
  buttonText: {
    color: '#5a3550',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  overlayBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '35%',
    backgroundColor: 'rgba(255, 248, 252, 0.96)',
    borderWidth: 2,
    borderColor: '#ffcad4',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  overlayText: {
    color: '#5a3550',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  overlayButton: {
    marginTop: 12,
    backgroundColor: '#ffcad4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff9fba',
  },
  overlayButtonText: {
    color: '#5a3550',
    fontWeight: '800',
  },
});