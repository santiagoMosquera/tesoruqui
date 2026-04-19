import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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

type Question = {
  id: number;
  text: string;
  image?: any;
  options: string[];
  correctIndex: number;
};

const QUESTIONS_PER_GAME = 10;

const ALL_QUESTIONS: Question[] = [
  {
    id: 1,
    text: '¿Cuánto es 7 × 8?',
    options: ['54', '56', '64', '48'],
    correctIndex: 1,
  },
  {
    id: 2,
    text: '¿Qué número sigue? 2, 4, 8, 16, __',
    options: ['18', '24', '30', '32'],
    correctIndex: 3,
  },
  {
    id: 3,
    text: '¿Cuántos lados tiene un hexágono?',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
  },
  {
    id: 4,
    text: '¿Cuál es la mitad de 90?',
    options: ['40', '45', '50', '55'],
    correctIndex: 1,
  },
  {
    id: 5,
    text: '¿Qué número falta? 3, 6, 9, __, 15',
    options: ['10', '11', '12', '13'],
    correctIndex: 2,
  },
  {
    id: 6,
    text: '¿Cuánto es 15 + 27?',
    options: ['42', '40', '44', '38'],
    correctIndex: 0,
  },
  {
    id: 7,
    text: '¿Qué figura tiene 4 lados iguales?',
    options: ['Triángulo', 'Rectángulo', 'Cuadrado', 'Trapecio'],
    correctIndex: 2,
  },
  {
    id: 8,
    text: '¿Cuánto es 9 × 6?',
    options: ['54', '56', '48', '60'],
    correctIndex: 0,
  },
  {
    id: 9,
    text: '¿Cuál es mayor?',
    options: ['0.5', '0.8', '0.3', '0.6'],
    correctIndex: 1,
  },
  {
    id: 10,
    text: '¿Qué número completa la serie? 1, 1, 2, 3, 5, __',
    options: ['6', '7', '8', '9'],
    correctIndex: 2,
  },
  {
    id: 11,
    text: '¿Cuántos grados tiene un ángulo recto?',
    options: ['45', '60', '90', '120'],
    correctIndex: 2,
  },
  {
    id: 12,
    text: '¿Cuánto es 100 - 45?',
    options: ['45', '55', '65', '50'],
    correctIndex: 1,
  },
  {
    id: 13,
    text: 'Si un cuadrado gira, ¿cuántos lados sigue teniendo?',
    options: ['2', '3', '4', 'Depende'],
    correctIndex: 2,
  },
  {
    id: 14,
    text: '¿Cuánto es 12 × 12?',
    options: ['124', '144', '132', '154'],
    correctIndex: 1,
  },
  {
    id: 15,
    text: 'Si un número es par, ¿cuál de estos puede ser?',
    options: ['13', '17', '22', '31'],
    correctIndex: 2,
  },
{
  id: 17,
  text: 'Si un número es el doble de 14, ¿cuál es?',
  options: ['21', '24', '28', '32'],
  correctIndex: 2,
},
{
  id: 18,
  text: '¿Cuál fracción es mayor?',
  options: ['1/2', '3/4', '2/3', '5/8'],
  correctIndex: 1,
},

{
  id: 20,
  text: '¿Qué número es 2 veces mayor que 9?',
  options: ['11', '16', '18', '20'],
  correctIndex: 2,
},
];

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Game4({ goBack }: Props): React.JSX.Element {
  const { connectedDevice, sendMessage } = useBluetooth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [gameStatus, setGameStatus] = useState<'blocked' | 'playing' | 'finished'>('blocked');

  const startGame = () => {
    if (!connectedDevice) {
      setGameStatus('blocked');
      setOverlayText('Conecta el Bluetooth para jugar este reto 🧠');
      return;
    }

    const shuffled = shuffleArray(ALL_QUESTIONS).slice(0, QUESTIONS_PER_GAME);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    setOverlayText('');
    setGameStatus('playing');
  };

  useEffect(() => {
    if (connectedDevice) {
      if (gameStatus === 'blocked') {
        setOverlayText('Bluetooth conectado. ¡Ya puedes jugar! 💙');
      }
    } else {
      setGameStatus('blocked');
      setOverlayText('Conecta el Bluetooth para jugar este reto 🧠');
    }
  }, [connectedDevice, gameStatus]);

  const current = questions[currentIndex];

  const handleAnswer = (index: number) => {
    if (!current || selected !== null || gameStatus !== 'playing') {
      return;
    }

    setSelected(index);

    const isCorrect = index === current.correctIndex;
    const nextScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      setScore(nextScore);
    }

    setTimeout(() => {
      const isLastQuestion = currentIndex + 1 >= QUESTIONS_PER_GAME;

      if (isLastQuestion) {
        setFinished(true);
        setGameStatus('finished');

        if (nextScore === QUESTIONS_PER_GAME) {
          setOverlayText('¡Perfecto! Sacaste 10/10, superaste el reto final 💖');
          sendMessage('4');
        } else {
          setOverlayText(`Sacaste ${nextScore}/10. Inténtalo de nuevo ✨`);
        }
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelected(null);
      }
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.topButtons}>
              <Pressable style={styles.backButton} onPress={goBack}>
                <Text style={styles.backButtonText}>← Volver</Text>
              </Pressable>

              <Pressable style={styles.resetButtonTop} onPress={startGame}>
                <Text style={styles.resetText}>🔄 Reiniciar</Text>
              </Pressable>
            </View>

            <Text style={styles.kawaiiEmoji}>૮ ˶ᵔ ᵕ ᵔ˶ ა</Text>
            <Text style={styles.title}>🤯 Mates</Text>
            <Text style={styles.subtitle}>
              Resuelve 10 retos del banco de 15
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>PUNTAJE</Text>
                <Text style={styles.infoValue}>⭐ {score} / 10</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>BLUETOOTH</Text>
                <Text style={styles.infoValue}>
                  {connectedDevice ? '💙 Conectado' : '💤 Sin conexión'}
                </Text>
              </View>
            </View>

            {gameStatus === 'playing' && current ? (
              <View style={styles.questionCard}>
                <Text style={styles.progress}>
                  Pregunta {currentIndex + 1} / {QUESTIONS_PER_GAME}
                </Text>

                <Text style={styles.question}>{current.text}</Text>

                {current.image ? (
                  <Image source={current.image} style={styles.image} resizeMode="contain" />
                ) : null}

                {current.options.map((option, index) => {
                  const isSelected = selected === index;
                  const isCorrect = current.correctIndex === index;

                  let extraStyle = null;

                  if (selected !== null) {
                    if (isCorrect) {
                      extraStyle = styles.correctOption;
                    } else if (isSelected) {
                      extraStyle = styles.wrongOption;
                    }
                  }

                  return (
                    <Pressable
                      key={`${current.id}-${index}`}
                      style={[styles.option, extraStyle]}
                      onPress={() => handleAnswer(index)}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.questionCard}>
                <Text style={styles.progress}>Banco de 15 retos</Text>
                <Text style={styles.question}>
                  Presiona “Reiniciar” para empezar una ronda de 10 preguntas aleatorias.
                </Text>
              </View>
            )}

            {(gameStatus === 'blocked' || finished) && (
              <View style={styles.overlayBox}>
                <Text style={finished && score === 10 ? styles.winText : styles.loseText}>
                  {finished ? (score === 10 ? '¡Ganaste! 💖' : 'Inténtalo de nuevo ✨') : 'Juego bloqueado 🔒'}
                </Text>

                <Text style={styles.messageSub}>{overlayText}</Text>

                <Pressable style={styles.overlayButton} onPress={score === 10 ?() => {
                                        goBack(); // 👈 vuelve al menú
                                    }:startGame}>
                  <Text style={styles.overlayButtonText}>
                    {connectedDevice ? 'Jugar' : 'Intentar otra vez'}
                  </Text>
                </Pressable>
              </View>
            )}
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
  questionCard: {
    backgroundColor: '#f8fffd',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#c7ffea',
    padding: 16,
  },
  progress: {
    textAlign: 'center',
    color: '#7ab6a9',
    fontWeight: '800',
    marginBottom: 10,
  },
  question: {
    color: '#5a3550',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  image: {
    width: '100%',
    height: 150,
    marginBottom: 12,
  },
  option: {
    backgroundColor: '#cdb4ff',
    borderColor: '#b08cff',
    borderWidth: 2,
    marginVertical: 6,
    padding: 14,
    borderRadius: 16,
  },
  optionText: {
    textAlign: 'center',
    fontWeight: '800',
    color: '#5a3550',
    fontSize: 15,
  },
  correctOption: {
    backgroundColor: '#b8f2e6',
    borderColor: '#7edfcf',
  },
  wrongOption: {
    backgroundColor: '#ffcad4',
    borderColor: '#ff9fba',
  },
  overlayBox: {
    marginTop: 16,
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
});