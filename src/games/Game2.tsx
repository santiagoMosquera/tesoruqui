import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBluetooth } from '../bluetooth/BluetoothContext';

type Props = {
    goBack: () => void;
};

type GameStatus = 'blocked' | 'playing' | 'win' | 'lose';

type Obstacle = {
    x: number;
    gapY: number;
    passed?: boolean;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAME_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
const GAME_HEIGHT = 420;

const PLAYER_X = 70;
const PLAYER_SIZE = 72;

const GRAVITY = 0.65;
const JUMP_FORCE = -8.5;
const TICK = 30;

const PIPE_WIDTH = 56;
const PIPE_GAP = 150;
const PIPE_SPEED = 3.2;
const PIPE_SPACING = 260;

const HITBOX_SIZE = 42;
const HITBOX_OFFSET = (PLAYER_SIZE - HITBOX_SIZE) / 2;

const WIN_SCORE = 15;

const imgSplit = require('../assets/uno.png');
const imgFlip = require('../assets/dos.png');
const imgUp = require('../assets/tres.png');

function randomGapY(): number {
    const min = 110;
    const max = GAME_HEIGHT - 110;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Gymnast({ y, velocity }: { y: number; velocity: number }): React.JSX.Element {
    let image = imgSplit;

    if (velocity < -2) {
        image = imgUp;
    } else if (velocity > 3) {
        image = imgFlip;
    }

    return (
        <Image
            source={image}
            style={[
                styles.gymnastImage,
                {
                    left: PLAYER_X,
                    top: y,
                },
            ]}
            resizeMode="contain"
        />
    );
}

export default function Game2({ goBack }: Props): React.JSX.Element {
    const { connectedDevice, sendMessage } = useBluetooth();

    const initialObstacles = useMemo<Obstacle[]>(
        () => [
            { x: GAME_WIDTH + 40, gapY: randomGapY(), passed: false },
            { x: GAME_WIDTH + 40 + PIPE_SPACING, gapY: randomGapY(), passed: false },
            { x: GAME_WIDTH + 40 + PIPE_SPACING * 2, gapY: randomGapY(), passed: false },
        ],
        [],
    );

    const [playerY, setPlayerY] = useState(160);
    const [velocity, setVelocity] = useState(0);
    const [obstacles, setObstacles] = useState(initialObstacles);
    const [score, setScore] = useState(0);
    const [gameStatus, setGameStatus] = useState<GameStatus>('blocked');

    const intervalRef = useRef<any>(null);
    const winSentRef = useRef(false);
    const alertShownRef = useRef(false);

    useEffect(() => {
        if (connectedDevice) {
            if (gameStatus === 'blocked') {
                setGameStatus('playing');
            }
        } else {
            setGameStatus('blocked');

            if (!alertShownRef.current) {
                alertShownRef.current = true;
                Alert.alert('Bluetooth', 'Conecta el ESP32 para jugar');
            }
        }
    }, [connectedDevice, gameStatus]);

    const resetGame = () => {
        if (!connectedDevice) {
            Alert.alert('Bluetooth', 'Primero conecta el Bluetooth');
            return;
        }

        winSentRef.current = false;
        setPlayerY(160);
        setVelocity(0);
        setScore(0);
        setGameStatus('playing');
        setObstacles([
            { x: GAME_WIDTH + 40, gapY: randomGapY(), passed: false },
            { x: GAME_WIDTH + 40 + PIPE_SPACING, gapY: randomGapY(), passed: false },
            { x: GAME_WIDTH + 40 + PIPE_SPACING * 2, gapY: randomGapY(), passed: false },
        ]);
    };

    const flap = () => {
        if (!connectedDevice) {
            Alert.alert('Bluetooth', 'Primero conecta el Bluetooth');
            setGameStatus('blocked');
            return;
        }

        if (gameStatus !== 'playing') return;
        setVelocity(JUMP_FORCE);
    };

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (gameStatus !== 'playing') return;

        intervalRef.current = setInterval(() => {
            setVelocity(v => v + GRAVITY);

            setPlayerY(y => {
                const next = y + velocity;

                if (next <= 0) {
                    setGameStatus('lose');
                    return 0;
                }

                if (next + PLAYER_SIZE >= GAME_HEIGHT) {
                    setGameStatus('lose');
                    return GAME_HEIGHT - PLAYER_SIZE;
                }

                return next;
            });

            setObstacles(prev => {
                let addScore = 0;

                const moved = prev.map(o => {
                    let x = o.x - PIPE_SPEED;
                    let passed = o.passed;

                    if (!passed && x + PIPE_WIDTH < PLAYER_X) {
                        passed = true;
                        addScore++;
                    }

                    if (x < -PIPE_WIDTH) {
                        const farthestX = Math.max(...prev.map(item => item.x));
                        const extraSpace = Math.floor(Math.random() * 40);
                        return {
                            x: farthestX + PIPE_SPACING + extraSpace,
                            gapY: randomGapY(),
                            passed: false,
                        };
                    }

                    return { ...o, x, passed };
                });

                if (addScore > 0) {
                    setScore(s => {
                        const newScore = s + addScore;

                        if (newScore >= WIN_SCORE && !winSentRef.current) {
                            winSentRef.current = true;
                            setGameStatus('win');

                            sendMessage('2').then(ok => {
                                if (!ok) {
                                    console.log("erorr en el bluetooth");
                                }
                            });
                        }

                        return newScore;
                    });
                }

                return moved;
            });
        }, TICK);

        return () => clearInterval(intervalRef.current);
    }, [gameStatus, velocity, sendMessage]);

    useEffect(() => {
        if (gameStatus !== 'playing') return;

        for (const o of obstacles) {
            const playerLeft = PLAYER_X + HITBOX_OFFSET;
            const playerRight = playerLeft + HITBOX_SIZE;

            const playerTop = playerY + HITBOX_OFFSET;
            const playerBottom = playerTop + HITBOX_SIZE;
            const inX =
                playerRight > o.x &&
                playerLeft < o.x + PIPE_WIDTH;

            const gapTop = o.gapY - PIPE_GAP / 2;
            const gapBottom = o.gapY + PIPE_GAP / 2;


            const hit =
                playerTop < gapTop ||
                playerBottom > gapBottom;

            if (inX && hit) {
                setGameStatus('lose');
            }
        }
    }, [playerY, obstacles, gameStatus]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    <View style={styles.card}>
                        <View style={styles.topButtons}>
                            <Pressable style={styles.backButton} onPress={goBack}>
                                <Text style={styles.backButtonText}>← Volver</Text>
                            </Pressable>

                            <Pressable style={styles.resetButtonTop} onPress={resetGame}>
                                <Text style={styles.resetText}>🔄 Reiniciar</Text>
                            </Pressable>
                        </View>


                        <Text style={styles.title}>🤸🏻 Gymnastics</Text>
                        <Text style={styles.subtitle}>Toca para saltar entre obstáculos</Text>

                        <View style={styles.infoRow}>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>PUNTAJE</Text>
                                <Text style={styles.infoValue}>⭐ {score} / {WIN_SCORE}</Text>
                            </View>

                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>BLUETOOTH</Text>
                                <Text style={styles.infoValue}>
                                    {connectedDevice ? '💙 Conectado' : '💤 Sin conexión'}
                                </Text>
                            </View>
                        </View>

                        {gameStatus === 'blocked' && (
                            <View style={styles.messageBox}>
                                <Text style={styles.loseText}>Conecta el Bluetooth</Text>
                                <Text style={styles.messageSub}>
                                    No puedes iniciar este juego sin el ESP32 conectado.
                                </Text>
                            </View>
                        )}

                        <Pressable style={styles.board} onPress={flap}>
                            {Array.from({ length: 7 }).map((_, i) => (
                                <View
                                    key={`cloud-${i}`}
                                    style={[
                                        styles.cloud,
                                        {
                                            left: 12 + i * 48,
                                            top: 18 + (i % 3) * 38,
                                        },
                                    ]}
                                />
                            ))}

                            <View style={styles.ground} />

                            {obstacles.map((o, i) => {
                                const topHeight = o.gapY - PIPE_GAP / 2;
                                const bottomY = o.gapY + PIPE_GAP / 2;
                                const bottomHeight = GAME_HEIGHT - bottomY;

                                return (
                                    <React.Fragment key={i}>
                                        <View style={[styles.pipe, { left: o.x, top: 0, height: topHeight }]} />
                                        <View style={[styles.pipeCap, { left: o.x - 4, top: topHeight - 16 }]} />

                                        <View
                                            style={[styles.pipe, { left: o.x, top: bottomY, height: bottomHeight }]}
                                        />
                                        <View style={[styles.pipeCap, { left: o.x - 4, top: bottomY }]} />
                                    </React.Fragment>
                                );
                            })}

                            <Gymnast y={playerY} velocity={velocity} />

                            {gameStatus === 'lose' && (
                                <View style={styles.overlayBox}>
                                    <Text style={styles.loseText}>Ups, perdiste 💥</Text>
                                    <Text style={styles.messageSub}>Tu gimnasta chocó. Toca reiniciar.</Text>
                                </View>
                            )}

                            {gameStatus === 'win' && (
                                <View style={styles.overlayBox}>
                                    <Text style={styles.winText}>¡Ganaste! 💖</Text>
                                    <Text style={styles.messageSub}>
                                        Mira la caja mágica
                                    </Text>
                                </View>
                            )}

                            {gameStatus === 'win' && (
                                <View style={styles.overlayBox}>
                                    <Text style={styles.winText}>¡Ganaste! 💖</Text>
                                    <Text style={styles.messageSub}>
                                        Llegaste a {WIN_SCORE} monedas, mira la caja mágica.
                                    </Text>

                                    <Pressable style={styles.overlayButton} onPress={() => {
                                        goBack(); // 👈 vuelve al menú
                                    }}>
                                        <Text style={styles.overlayButtonText}>Continuar</Text>
                                    </Pressable>
                                </View>
                            )}

                            {gameStatus === 'playing' && (
                                <View style={styles.tapHintBox}>
                                    <Text style={styles.tapHint}>Toca la pantalla para saltar ✨</Text>
                                </View>
                            )}
                        </Pressable>


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
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: '#dff7ff',
        borderWidth: 3,
        borderColor: '#76ddc6',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    cloud: {
        position: 'absolute',
        width: 44,
        height: 22,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.72)',
    },
    ground: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 26,
        backgroundColor: '#b8f2e6',
        borderTopWidth: 2,
        borderColor: '#7edfcf',
    },
    pipe: {
        position: 'absolute',
        width: PIPE_WIDTH,
        backgroundColor: '#ffcade',
        borderWidth: 3,
        borderColor: '#d16ba5',
        borderRadius: 12,
    },
    pipeCap: {
        position: 'absolute',
        width: PIPE_WIDTH + 8,
        height: 16,
        backgroundColor: '#a7f0e4',
        borderWidth: 3,
        borderColor: '#59cbb7',
        borderRadius: 10,
    },
    gymnastImage: {
        position: 'absolute',
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
    },
    messageBox: {
        marginTop: 14,
        alignItems: 'center',
    },
    overlayBox: {
        position: 'absolute',
        left: 20,
        right: 20,
        top: 140,
        backgroundColor: 'rgba(255, 248, 252, 0.95)',
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
    tapHintBox: {
        position: 'absolute',
        bottom: 34,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 248, 252, 0.92)',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderWidth: 2,
        borderColor: '#ffd3e8',
    },
    tapHint: {
        color: '#5a3550',
        fontSize: 13,
        fontWeight: '800',
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
});