import React, { createContext, useContext, useMemo, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

type BluetoothDevice = {
  name?: string;
  address: string;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  write: (message: string, encoding?: string) => Promise<any>;
};

type BluetoothContextType = {
  devices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  isConnecting: boolean;
  loadBondedDevices: () => Promise<BluetoothDevice[]>;
  connectToDevice: (device: BluetoothDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendMessage: (message: string) => Promise<boolean>;
};

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export function BluetoothProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);

      return (
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const location = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    return location === PermissionsAndroid.RESULTS.GRANTED;
  };

  const ensureBluetoothEnabled = async (): Promise<boolean> => {
    try {
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        await RNBluetoothClassic.requestBluetoothEnabled();
      }
      return true;
    } catch {
      Alert.alert('Error', 'No se pudo activar Bluetooth');
      return false;
    }
  };

  const loadBondedDevices = async (): Promise<BluetoothDevice[]> => {
    try {
      const granted = await requestBluetoothPermissions();
      if (!granted) {
        Alert.alert('Permisos', 'No se concedieron los permisos Bluetooth');
        return [];
      }

      const ok = await ensureBluetoothEnabled();
      if (!ok) return [];

      const bonded = (await RNBluetoothClassic.getBondedDevices()) as BluetoothDevice[];
      setDevices(bonded || []);
      return bonded || [];
    } catch (error: any) {
      Alert.alert('Error', `No se pudieron cargar los dispositivos: ${error.message}`);
      return [];
    }
  };

  const connectToDevice = async (device: BluetoothDevice): Promise<boolean> => {
    try {
      setIsConnecting(true);

      const granted = await requestBluetoothPermissions();
      if (!granted) {
        Alert.alert('Permisos', 'No se concedieron los permisos Bluetooth');
        return false;
      }

      const ok = await ensureBluetoothEnabled();
      if (!ok) return false;

      const connected = await device.connect();
      if (connected) {
        setConnectedDevice(device);
        //Alert.alert('Conectado', `Conectado a ${device.name || device.address}`);
        return true;
      }

      Alert.alert('Error', 'No se pudo conectar');
      return false;
    } catch (error: any) {
      Alert.alert('Error', `Falló la conexión: ${error.message}`);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      if (connectedDevice) {
        await connectedDevice.disconnect();
      }
      setConnectedDevice(null);
      //Alert.alert('Bluetooth', 'Desconectado');
    } catch (error: any) {
      Alert.alert('Error', `No se pudo desconectar: ${error.message}`);
    }
  };

  const sendMessage = async (message: string): Promise<boolean> => {
    try {
      if (!connectedDevice) {
        Alert.alert('Bluetooth', 'Primero conecta un dispositivo');
        return false;
      }

      await connectedDevice.write(String(message), 'utf-8');
      return true;
    } catch (error: any) {
      Alert.alert('Error', `No se pudo enviar: ${error.message}`);
      return false;
    }
  };

  const value = useMemo(
    () => ({
      devices,
      connectedDevice,
      isConnecting,
      loadBondedDevices,
      connectToDevice,
      disconnect,
      sendMessage,
    }),
    [devices, connectedDevice, isConnecting],
  );

  return <BluetoothContext.Provider value={value}>{children}</BluetoothContext.Provider>;
}

export function useBluetooth(): BluetoothContextType {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetooth debe usarse dentro de BluetoothProvider');
  }
  return context;
}