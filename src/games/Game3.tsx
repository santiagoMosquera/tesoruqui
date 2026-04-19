import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useBluetooth } from '../bluetooth/BluetoothContext';

type Props = {
  goBack: () => void;
};

type GameStatus = 'blocked' | 'playing' | 'win';
type BallPosition = 'left' | 'center' | 'right' | 'up';

const WIN_STEALS = 3;
const MOVE_INTERVAL = 950;

const gameBackground = require('../assets/goat-giant.png');

const BALL_POSITIONS: BallPosition[] = ['left', 'center', 'right', 'up'];

export default function Game3({ goBack }: Props): React.JSX.Element {
  const { connectedDevice, sendMessage } = useBluetooth();

  const [gameStatus, setGameStatus] = useState<GameStatus>('blocked');
  const [steals, setSteals] = useState(0);
  const [ballPosition, setBallPosition] = useState<BallPosition>('center');
  const [overlayText, setOverlayText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [canSteal, setCanSteal] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const winSentRef = useRef(false);

  const ballStyle = useMemo(() => {
    switch (ballPosition) {
      case 'left':
        return { left: 30, top: 320 };
      case 'center':
        return { left: '50%' as const, marginLeft: -26, top: 320 };
      case 'right':
        return { right: 30, top: 320 };
      case 'up':
      default:
        return { left: '50%' as const, marginLeft: -26, top: 118 };
    }
  }, [ballPosition]);

  const pickNextBallPosition = (): BallPosition => {
    const randomIndex = Math.floor(Math.random() * BALL_POSITIONS.length);
    return BALL_POSITIONS[randomIndex];
  };

  const startRound = () => {
    if (!connectedDevice) {
      setGameStatus('blocked');
      setOverlayText('Conecta el Bluetooth para jugar este reto 🏀');
      return;
    }

    winSentRef.current = false;
    setSteals(0);
    setBallPosition(pickNextBallPosition());
    setFeedbackText('');
    setOverlayText('');
    setCanSteal(true);
    setGameStatus('playing');
  };

  useEffect(() => {
    if (connectedDevice) {
      if (gameStatus === 'blocked') {
        setOverlayText('Bluetooth conectado. ¡Ya puedes jugar! 💙');
      }
    } else {
      setGameStatus('blocked');
      setOverlayText('Conecta el Bluetooth para jugar este reto 🏀');
    }
  }, [connectedDevice, gameStatus]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (gameStatus !== 'playing') {
      return;
    }

    intervalRef.current = setInterval(() => {
      setBallPosition(pickNextBallPosition());
      setFeedbackText('');
      setCanSteal(true);
    }, MOVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameStatus]);

  const handleBallPress = () => {
    if (gameStatus !== 'playing' || !canSteal) {
      return;
    }

    setCanSteal(false);
    setFeedbackText('¡Robo! 🏀✨');

    setSteals(prev => {
      const next = prev + 1;

      if (next >= WIN_STEALS) {
        setGameStatus('win');
        setOverlayText('¡Ganaste! Lograste robar el balón, mira la caja mágica 💖');

        if (!winSentRef.current) {
          winSentRef.current = true;
          sendMessage('3');
        }
      } else {
        setBallPosition(pickNextBallPosition());
      }

      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.topButtons}>
              <Pressable style={styles.backButton} onPress={goBack}>
                <Text style={styles.backButtonText}>← Volver</Text>
              </Pressable>

              <Pressable style={styles.resetButtonTop} onPress={startRound}>
                <Text style={styles.resetText}>🔄 Reiniciar</Text>
              </Pressable>
            </View>

            <Text style={styles.kawaiiEmoji}>૮ ˶ᵔ ᵕ ᵔ˶ ა</Text>
            <Text style={styles.title}>🏀 Basketball</Text>
            <Text style={styles.subtitle}>
              Toca la pelota cada vez que cambie de lugar
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>ROBOS</Text>
                <Text style={styles.infoValue}>🏀 {steals} / {WIN_STEALS}</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>BLUETOOTH</Text>
                <Text style={styles.infoValue}>
                  {connectedDevice ? '💙 Conectado' : '💤 Sin conexión'}
                </Text>
              </View>
            </View>

            <ImageBackground
              source={gameBackground}
              style={styles.board}
              imageStyle={styles.boardImage}
              resizeMode="cover"
            >
              <View style={styles.boardOverlay} />

              <Pressable
                onPress={handleBallPress}
                style={[styles.ball, ballStyle]}
              >
                <Text style={styles.ballEmoji}>🏀</Text>
              </Pressable>

              {feedbackText ? (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>{feedbackText}</Text>
                </View>
              ) : null}

              {gameStatus !== 'playing'  ? (
                <View style={styles.overlayBox}>
                  <Text style={gameStatus === 'win' ? styles.winText : styles.loseText}>
                    {gameStatus === 'win' ? '¡Ganaste! 💖' : 'Juego bloqueado 🔒'}
                  </Text>
                  <Text style={styles.messageSub}>{overlayText}</Text>

                  <Pressable style={styles.overlayButton} onPress={startRound}>
                    <Text style={styles.overlayButtonText}>
                      {connectedDevice ? 'Jugar' : 'Intentar otra vez'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {gameStatus === 'win' ? (
                <View style={styles.overlayBox}>
                  <Text style={gameStatus === 'win' ? styles.winText : styles.loseText}>
                    {gameStatus === 'win' ? '¡Ganaste! 💖' : 'Juego bloqueado 🔒'}
                  </Text>
                  <Text style={styles.messageSub}>{overlayText}</Text>

                  <Pressable style={styles.overlayButton}onPress={() => {
                                        goBack(); // 👈 vuelve al menú
                                    }}>
                    <Text style={styles.overlayButtonText}>
                      {connectedDevice ? 'Jugar' : 'Intentar otra vez'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              
            </ImageBackground>

            <View style={styles.controlsInfo}>
              <Text style={styles.controlsInfoText}>
                💡 La pelota aparece en cualquier posición random
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eefff9',
  },
  scrollContent: {
    paddingBottom: 18,
  },
  container: {
    flex: 1,
    backgroundColor: '#eefff9',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: '#fff8fc',
    borderRadius: 28,
    padding: 18,
    borderWidth: 3,
    borderColor: '#c7ffea',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    flex: 1,
    marginRight: 6,
    backgroundColor: '#d9c2ff',
    borderColor: '#a97dff',
    borderWidth: 2,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#5a3550',
    fontWeight: '800',
    fontSize: 16,
  },
  resetButtonTop: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#ffc4dc',
    borderColor: '#ff7db5',
    borderWidth: 2,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  resetText: {
    color: '#5a3550',
    fontWeight: '800',
    fontSize: 16,
  },
  kawaiiEmoji: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 6,
    color: '#25eec9',
  },
  title: {
    color: '#25eec9',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9c6b86',
    marginTop: 4,
    marginBottom: 12,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f8fffd',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#c7ffea',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  infoLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7ab6a9',
    fontWeight: '800',
    marginBottom: 4,
  },
  infoValue: {
    textAlign: 'center',
    fontSize: 16,
    color: '#5a3550',
    fontWeight: '800',
  },
  board: {
    alignSelf: 'center',
    width: '100%',
    height: 430,
    borderWidth: 3,
    borderColor: '#76ddc6',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  boardImage: {
    borderRadius: 20,
  },
 boardOverlay: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(255,255,255,0.08)',
},
  ball: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballEmoji: {
    fontSize: 34,
  },
  feedbackBox: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 248, 252, 0.94)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#ffd3e8',
  },
  feedbackText: {
    color: '#5a3550',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  overlayBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 128,
    backgroundColor: 'rgba(255, 248, 252, 0.96)',
    borderWidth: 2,
    borderColor: '#ffcad4',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  winText: {
    color: '#ff5d8f',
    fontSize: 22,
    fontWeight: '800',
  },
  loseText: {
    color: '#9c6b86',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  messageSub: {
    color: '#7f6a79',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  overlayButton: {
    marginTop: 14,
    backgroundColor: '#ffcad4',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ff9fba',
  },
  overlayButtonText: {
    color: '#5a3550',
    fontWeight: '800',
    fontSize: 14,
  },
  controlsInfo: {
    marginTop: 14,
    alignItems: 'center',
  },
  controlsInfoText: {
    color: '#9c6b86',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});