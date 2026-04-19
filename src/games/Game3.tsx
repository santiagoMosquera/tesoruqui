import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBluetooth } from '../bluetooth/BluetoothContext';

type Props = {
  goBack: () => void;
};

export default function Game3({ goBack }: Props): React.JSX.Element {
  const { sendMessage, connectedDevice } = useBluetooth();

  const handleSend = async () => {
    const ok = await sendMessage('3');
    if (ok) Alert.alert('Enviado', 'Se envió el número 3');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Juego 3</Text>
      <Text style={styles.info}>
        {connectedDevice ? 'Bluetooth conectado' : 'Bluetooth no conectado'}
      </Text>

      <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
        <Text style={styles.buttonText}>Enviar 3</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  info: { textAlign: 'center', marginBottom: 24, fontSize: 16 },
  actionButton: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, marginBottom: 12 },
  backButton: { backgroundColor: '#111827', padding: 16, borderRadius: 12 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});