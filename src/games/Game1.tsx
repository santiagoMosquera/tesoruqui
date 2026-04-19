import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBluetooth } from '../bluetooth/BluetoothContext';

type Position = {
    x: number;
    y: number;
};

type Direction = {
    x: number;
    y: number;
};

type GameStatus = 'blocked' | 'playing' | 'win' | 'lose';

type Props = {
    goBack: () => void;
};

const GRID_SIZE = 12;
const CELL_SIZE = Math.floor(
    Math.min(Dimensions.get('window').width * 0.82, 360) / GRID_SIZE,
);
const BOARD_SIZE = CELL_SIZE * GRID_SIZE;
const TICK = 220;
const WIN_COINS = 10;

const DIRECTIONS: Record<'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Direction> = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
};

function getRandomIceCream(snake: Position[]): Position {
    while (true) {
        const iceCream: Position = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };

        const isOnSnake = snake.some(
            part => part.x === iceCream.x && part.y === iceCream.y,
        );

        if (!isOnSnake) {
            return iceCream;
        }
    }
}

type SnakeCellProps = {
    x: number;
    y: number;
    color: string;
    children?: React.ReactNode;
};

function SnakeCell({ x, y, color, children }: SnakeCellProps): React.JSX.Element {
    return (
        <View
            style={[
                styles.cell,
                {
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: color,
                },
            ]}
        >
            {children}
        </View>
    );
}

export default function Game1({ goBack }: Props): React.JSX.Element {
    const { connectedDevice, sendMessage } = useBluetooth();

    const initialSnake = useMemo<Position[]>(
        () => [
            { x: 2, y: 5 },
            { x: 1, y: 5 },
            { x: 0, y: 5 },
        ],
        [],
    );

    const [snake, setSnake] = useState<Position[]>(initialSnake);
    const [direction, setDirection] = useState<Direction>(DIRECTIONS.RIGHT);
    const [nextDirection, setNextDirection] = useState<Direction>(DIRECTIONS.RIGHT);
    const [iceCream, setIceCream] = useState<Position>(() =>
        getRandomIceCream(initialSnake),
    );
    const [coins, setCoins] = useState<number>(0);
    const [gameStatus, setGameStatus] = useState<GameStatus>('blocked');

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const winSentRef = useRef<boolean>(false);
    const initialAlertShownRef = useRef<boolean>(false);

    useEffect(() => {
        if (connectedDevice) {
            if (gameStatus === 'blocked') {
                setGameStatus('playing');
            }
        } else {
            setGameStatus('blocked');

            if (!initialAlertShownRef.current) {
                initialAlertShownRef.current = true;
                Alert.alert(
                    'Bluetooth',
                    'Primero conecta el Bluetooth para poder jugar.',
                );
            }
        }
    }, [connectedDevice, gameStatus]);

    const changeDirection = (newDirection: Direction) => {
        if (gameStatus !== 'playing') return;

        const opposite =
            direction.x + newDirection.x === 0 && direction.y + newDirection.y === 0;

        if (!opposite) {
            setNextDirection(newDirection);
        }
    };

    const resetGame = () => {
        if (!connectedDevice) {
            Alert.alert(
                'Bluetooth',
                'Primero conecta el Bluetooth para poder jugar.',
            );
            setGameStatus('blocked');
            return;
        }


        const freshSnake: Position[] = [
            { x: 2, y: 5 },
            { x: 1, y: 5 },
            { x: 0, y: 5 },
        ];

        winSentRef.current = false;
        setSnake(freshSnake);
        setDirection(DIRECTIONS.RIGHT);
        setNextDirection(DIRECTIONS.RIGHT);
        setIceCream(getRandomIceCream(freshSnake));
        setCoins(0);
        setGameStatus('playing');
    };

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (gameStatus !== 'playing') return;

        intervalRef.current = setInterval(() => {
            setSnake(currentSnake => {
                const currentHead = currentSnake[0];
                const activeDirection = nextDirection;

                const newHead: Position = {
                    x: currentHead.x + activeDirection.x,
                    y: currentHead.y + activeDirection.y,
                };

                setDirection(activeDirection);

                const hitsWall =
                    newHead.x < 0 ||
                    newHead.y < 0 ||
                    newHead.x >= GRID_SIZE ||
                    newHead.y >= GRID_SIZE;

                const hitsSelf = currentSnake.some(
                    part => part.x === newHead.x && part.y === newHead.y,
                );

                if (hitsWall || hitsSelf) {
                    setGameStatus('lose');
                    return currentSnake;
                }

                const ateIceCream =
                    newHead.x === iceCream.x && newHead.y === iceCream.y;

                const newSnake = [newHead, ...currentSnake];

                if (ateIceCream) {
                    setCoins(prev => {
                        const updated = prev + 1;

                        if (updated >= WIN_COINS) {
                            setGameStatus('win');

                            if (!winSentRef.current) {
                                winSentRef.current = true;
                                sendMessage('1').then(ok => {
                                    if (!ok) {
                                        console.log('Error enviando bluetooth');
                                    }
                                });
                            }
                        }

                        return updated;
                    });

                    setIceCream(getRandomIceCream(newSnake));
                    return newSnake;
                }

                newSnake.pop();
                return newSnake;
            });
        }, TICK);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [iceCream, nextDirection, gameStatus, sendMessage]);

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

                            <Pressable style={styles.resetButtonTop} onPress={resetGame}>
                                <Text style={styles.resetText}>🔄 Reiniciar</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.title}>🍦 Spacial</Text>
                        <Text style={styles.subtitle}>Come helados.. cada uno te cuesta USD 1 🤪</Text>

                        <View style={styles.infoRow}>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>Dinero</Text>
                                <Text style={styles.infoValue}>🪙 {coins} / {WIN_COINS}</Text>
                            </View>

                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>Bluetooth</Text>
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

                        <View style={styles.board}>
                            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                                const x = index % GRID_SIZE;
                                const y = Math.floor(index / GRID_SIZE);

                                return (
                                    <View
                                        key={`grid-${x}-${y}`}
                                        style={[
                                            styles.gridCell,
                                            {
                                                left: x * CELL_SIZE,
                                                top: y * CELL_SIZE,
                                                width: CELL_SIZE,
                                                height: CELL_SIZE,
                                            },
                                        ]}
                                    />
                                );
                            })}

                            <SnakeCell x={iceCream.x} y={iceCream.y} color="#fff0f7">
                                <Text style={styles.iceCreamEmoji}>🍦</Text>
                            </SnakeCell>

                            {snake.map((part, index) => (
                                <SnakeCell
                                    key={`${part.x}-${part.y}-${index}`}
                                    x={part.x}
                                    y={part.y}
                                    color={index === 0 ? '#25eec9' : '#7edfcf'}
                                />
                            ))}
                        </View>

                        {gameStatus === 'win' && (
                            <View style={styles.overlayBox}>
                                <Text style={styles.winText}>¡Ganaste! 💖</Text>
                                <Text style={styles.messageSub}>
                                    Llegaste a {WIN_COINS} monedas, mira la caja mágica.
                                </Text>

                                <Pressable style={styles.overlayButton} onPress={() => {
                                    goBack(); // 👈 vuelve al menú
                                }}>
                                    <Text style={styles.overlayButtonText}>Continuar</Text>
                                </Pressable>
                            </View>
                        )}

                        {gameStatus === 'lose' && (
                            <View style={styles.overlayBox}>
                                <Text style={styles.loseText}>Ups, perdiste 💥</Text>
                                <Text style={styles.messageSub}>La serpiente chocó.</Text>

                                <Pressable style={styles.overlayButton} onPress={resetGame}>
                                    <Text style={styles.overlayButtonText}>Intentar otra vez</Text>
                                </Pressable>
                            </View>
                        )}


                        <View style={styles.controlsWrapper}>
                            <Pressable
                                style={styles.controlButton}
                                onPress={() => changeDirection(DIRECTIONS.UP)}
                            >
                                <Text style={styles.controlText}>↑</Text>
                            </Pressable>

                            <View style={styles.middleControls}>
                                <Pressable
                                    style={styles.controlButton}
                                    onPress={() => changeDirection(DIRECTIONS.LEFT)}
                                >
                                    <Text style={styles.controlText}>←</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.controlButton}
                                    onPress={() => changeDirection(DIRECTIONS.DOWN)}
                                >
                                    <Text style={styles.controlText}>↓</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.controlButton}
                                    onPress={() => changeDirection(DIRECTIONS.RIGHT)}
                                >
                                    <Text style={styles.controlText}>→</Text>
                                </Pressable>
                            </View>
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
        paddingBottom: 16,
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
    backButton: {
        flex: 1,
        marginRight: 6,
        backgroundColor: '#cdb4ff',
        borderColor: '#b08cff',
        borderWidth: 2,
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
    },


    backButtonText: {
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
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        color: '#9c6b86',
        marginTop: 4,
        marginBottom: 12,
        fontSize: 15,
        textAlign: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    infoBox: {
        flex: 1,
        backgroundColor: '#f8fffd',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#c7ffea',
        padding: 10,
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
        fontSize: 15,
        color: '#5a3550',
        fontWeight: '800',
    },
    board: {
        alignSelf: 'center',
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        backgroundColor: '#f8fffd',
        borderWidth: 3,
        borderColor: '#c7ffea',
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
    },
    gridCell: {
        position: 'absolute',
        borderWidth: 0.5,
        borderColor: '#daf9ef',
    },
    cell: {
        position: 'absolute',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iceCreamEmoji: {
        fontSize: CELL_SIZE * 0.72,
    },
    messageBox: {
        marginTop: 14,
        alignItems: 'center',
    },
    winText: {
        color: '#ff5d8f',
        fontSize: 23,
        fontWeight: '800',
    },
    loseText: {
        color: '#9c6b86',
        fontSize: 21,
        fontWeight: '800',
    },
    messageSub: {
        color: '#7f6a79',
        marginTop: 6,
        textAlign: 'center',
    },
    resetButton: {
        marginTop: 16,
        marginBottom: 8,
        alignSelf: 'center',
        backgroundColor: '#ffcad4',
        borderColor: '#ff9fba',
        borderWidth: 2,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 16,
    },
    resetText: {
        color: '#5a3550',
        fontWeight: '800',
        fontSize: 16,
    },
    controlsWrapper: {
        marginTop: 10,
        marginBottom: 6,
        alignItems: 'center',
    },
    middleControls: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 12,
    },
    controlButton: {
        width: 68,
        height: 68,
        borderRadius: 18,
        backgroundColor: '#b8f2e6',
        borderWidth: 2,
        borderColor: '#7edfcf',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 6,
    },
    controlText: {
        color: '#5a3550',
        fontSize: 28,
        fontWeight: '800',
    },
    topButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    resetButtonTop: {
        backgroundColor: '#ffcad4',
        borderColor: '#ff9fba',
        borderWidth: 2,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
    },
    overlayBox: {
        position: 'absolute',
        left: 20,
        right: 20,
        top: '30%',
        backgroundColor: 'rgba(255, 248, 252, 0.96)',
        borderWidth: 3,
        borderColor: '#ffcad4',
        borderRadius: 22,
        padding: 18,
        alignItems: 'center',
        zIndex: 10,
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