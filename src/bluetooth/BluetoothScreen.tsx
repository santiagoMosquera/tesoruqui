import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBluetooth } from './BluetoothContext';

type Props = {
  goBack: () => void;
};

export default function BluetoothScreen({ goBack }: Props): React.JSX.Element {
  const {
    devices,
    connectedDevice,
    isConnecting,
    loadBondedDevices,
    connectToDevice,
    disconnect,
  } = useBluetooth();

  useEffect(() => {
    loadBondedDevices();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth ESP32</Text>

      <Text style={styles.status}>
        Estado:{' '}
        {connectedDevice
          ? `Conectado a ${connectedDevice.name || connectedDevice.address}`
          : 'Sin conexión'}
      </Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadBondedDevices}>
        <Text style={styles.buttonText}>Recargar dispositivos emparejados</Text>
      </TouchableOpacity>

      {connectedDevice ? (
        <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
          <Text style={styles.buttonText}>Desconectar</Text>
        </TouchableOpacity>
      ) : null}

      {isConnecting ? <ActivityIndicator size="large" style={{ marginVertical: 16 }} /> : null}

      <FlatList
        data={devices}
        keyExtractor={item => item.address}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceCard} onPress={() => connectToDevice(item)}>
            <Text style={styles.deviceName}>{item.name || 'Sin nombre'}</Text>
            <Text style={styles.deviceAddress}>{item.address}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay dispositivos emparejados</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.buttonText}>Volver al menú</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12, color: '#111827' },
  status: { fontSize: 16, marginBottom: 16, color: '#1f2937' },
  secondaryButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  disconnectButton: {
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  deviceCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deviceName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  deviceAddress: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 20 },
});