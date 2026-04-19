import React, { useEffect, useState } from 'react';
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

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    handleReload();
  }, []);

  const handleReload = async () => {
    try {
      const result = await loadBondedDevices();

      if (!result || result.length === 0) {
        setMessage('☁️ No encontré dispositivos emparejados todavía');
      } else {
        setMessage('✨ Lista actualizada correctamente');
      }
    } catch {
      setMessage('⚠️ No se pudieron cargar los dispositivos');
    }
  };

  const handleConnect = async (item: any) => {
    try {
      const ok = await connectToDevice(item);

      if (ok) {
        setMessage(`💙 Conectado a ${item.name || item.address}`);
      } else {
        setMessage('⚠️ No se pudo conectar al dispositivo');
      }
    } catch {
      setMessage('⚠️ Ocurrió un error al intentar conectar');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setMessage('💔 Dispositivo desconectado');
    } catch {
      setMessage('⚠️ No se pudo desconectar');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.subtitle}></Text>

        <Text style={styles.title}>Bluetooth</Text>
        <Text style={styles.subtitle}>Conecta la caja mágica</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Estado actual</Text>
          <Text style={styles.statusText}>
            {connectedDevice
              ? `💙 Conectado a ${connectedDevice.name || connectedDevice.address}`
              : '💤 Sin conexión'}
          </Text>
        </View>

        <TouchableOpacity style={styles.purpleButton} onPress={handleReload}>
          <Text style={styles.buttonText}>🔄 Recargar dispositivos</Text>
        </TouchableOpacity>

        {connectedDevice ? (
          <TouchableOpacity style={styles.resetButton} onPress={handleDisconnect}>
            <Text style={styles.buttonText}>💔 Desconectar</Text>
          </TouchableOpacity>
        ) : null}

        {isConnecting ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#25eec9" />
            <Text style={styles.loadingText}>Conectando...</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Dispositivos emparejados</Text>

        <FlatList
          data={devices}
          keyExtractor={item => item.address}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deviceCard}
              onPress={() => handleConnect(item)}
            >
              <Text style={styles.deviceName}>🫧 {item.name || 'Sin nombre'}</Text>
              <Text style={styles.deviceAddress}>{item.address}</Text>
              <Text style={styles.tapHint}>Toca para conectar</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>☁️</Text>
              <Text style={styles.emptyText}>No hay dispositivos emparejados</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        <TouchableOpacity style={styles.mintButton} onPress={goBack}>
          <Text style={styles.buttonText}>🌸 Volver al menú</Text>
        </TouchableOpacity>

        {message && (
          <View style={styles.overlayBox}>
            <Text style={styles.overlayText}>{message}</Text>

            <TouchableOpacity
              style={styles.overlayButton}
              onPress={() => setMessage(null)}
            >
              <Text style={styles.overlayButtonText}>OK 💖</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const baseButton = {
  paddingVertical: 14 as const,
  borderRadius: 18,
  marginBottom: 12,
  borderWidth: 2,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#eefff9',
  },
  card: {
    flex: 1,
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
    marginBottom: 18,
  },
  statusCard: {
    backgroundColor: '#f8fffd',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#c7ffea',
    padding: 14,
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7ab6a9',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5a3550',
    textAlign: 'center',
  },
  purpleButton: {
    ...baseButton,
    backgroundColor: '#cdb4ff',
    borderColor: '#b08cff',
  },
  resetButton: {
    ...baseButton,
    backgroundColor: '#ffcad4',
    borderColor: '#ff9fba',
  },
  mintButton: {
    ...baseButton,
    backgroundColor: '#b8f2e6',
    borderColor: '#7edfcf',
    marginTop: 10,
    marginBottom: 0,
  },
  buttonText: {
    color: '#5a3550',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9c6b86',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '800',
    color: '#25eec9',
    marginTop: 4,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 8,
  },
  deviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffd7ec',
    padding: 14,
    marginBottom: 10,
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#5a3550',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 13,
    color: '#9c6b86',
    marginBottom: 6,
  },
  tapHint: {
    fontSize: 12,
    color: '#25eec9',
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9c6b86',
    fontSize: 15,
    fontWeight: '700',
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