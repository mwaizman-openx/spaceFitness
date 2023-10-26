import "./styles.css";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
export type SpacedRepetitionItem = {
  interval: number;
  repetition: number;
  efactor: number;
};

export type SpacedRepetitionGrade = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export function SpacedRepetition(
  item: SpacedRepetitionItem,
  grade: SpacedRepetitionGrade
): SpacedRepetitionItem {
  let nextInterval: number;
  let nextRepetition: number;
  let nextEfactor: number;

  if (grade >= 3) {
    if (item.repetition === 0) {
      nextInterval = 1;
      nextRepetition = 1;
    } else if (item.repetition === 1) {
      nextInterval = 6;
      nextRepetition = 2;
    } else {
      nextInterval = Math.round(item.interval * item.efactor);
      nextRepetition = item.repetition + 1;
    }
  } else {
    nextInterval = 1;
    nextRepetition = 0;
  }

  nextEfactor =
    item.efactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

  if (nextEfactor < 1.3) nextEfactor = 1.3;

  return {
    interval: nextInterval,
    repetition: nextRepetition,
    efactor: nextEfactor
  };
}

interface FlashCardItem extends SpacedRepetitionItem {
  id: number;
  front: string;
  back: string;
  dueDate: string;
}

export default function App() {
  const [cards, setCards] = useState<FlashCardItem[]>([]);
  const [front, setFront] = useState<string>("");
  const [back, setBack] = useState<string>("");
  const [reviewMode, setReviewMode] = useState<boolean>(false);
  const [showBack, setShowBack] = useState<boolean>(false);

  useEffect(() => {
    const storedCards: FlashCardItem[] = JSON.parse(
      localStorage.getItem("cards") || "[]"
    );
    setCards(storedCards);
  }, []);

  const addCard = () => {
    const newCard: FlashCardItem = {
      id: Date.now(),
      front,
      back,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: dayjs().toISOString()
    };
    setCards((prev) => [...prev, newCard]);
    localStorage.setItem("cards", JSON.stringify([...cards, newCard]));
    setFront("");
    setBack("");
  };

  const deleteCard = (id: number) => {
    const filteredCards = cards.filter((card) => card.id !== id);
    setCards(filteredCards);
    localStorage.setItem("cards", JSON.stringify(filteredCards));
  };

  const getNextDueCardIndex = (): number => {
    const now = dayjs();
    const sortedCards = [...cards].sort((a, b) =>
      dayjs(a.dueDate).diff(b.dueDate)
    );
    for (let i = 0; i < sortedCards.length; i++) {
      if (dayjs(sortedCards[i].dueDate).isBefore(now)) {
        return cards.indexOf(sortedCards[i]);
      }
    }
    return -1;
  };

  const practice = (
    flashcard: FlashCardItem,
    grade: SpacedRepetitionGrade
  ): FlashCardItem => {
    const { interval } = SpacedRepetition(flashcard, grade);
    const dueDate = dayjs().add(interval, "day").toISOString();
    return { ...flashcard, ...SpacedRepetition(flashcard, grade), dueDate };
  };

  const handleGrade = (grade: SpacedRepetitionGrade) => {
    const updatedCard = practice(cards[getNextDueCardIndex()], grade);
    const updatedCards = cards.map((card) =>
      card.id === updatedCard.id ? updatedCard : card
    );
    setCards(updatedCards);
    localStorage.setItem("cards", JSON.stringify(updatedCards));

    if (getNextDueCardIndex() === -1) {
      setReviewMode(false);
    }
  };
  return (
    <div className="bg-gray-800 min-h-screen text-white p-4">
      {/* Card List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Flash Cards</h2>
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-gray-700 p-4 rounded mt-2 flex justify-between"
          >
            <div>
              <p className="font-bold">{card.front}</p>
              <p className="mt-1 text-gray-400">{card.back}</p>
            </div>
            <button
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
              onClick={() => deleteCard(card.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Card Creation */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Add New Card</h2>
        <div className="flex flex-col">
          <input
            type="text"
            className="p-2 rounded mb-2"
            placeholder="Front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
          <textarea
            className="p-2 rounded mb-2"
            placeholder="Back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
          ></textarea>
          <button
            className="bg-blue-500 hover:bg-blue-600 p-2 rounded"
            onClick={addCard}
          >
            Add Card
          </button>
        </div>
      </div>

      {/* Review Mode */}
      {reviewMode ? (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Review Mode</h2>
          <div className="bg-gray-700 p-4 rounded">
            <p className="font-bold">{cards[getNextDueCardIndex()].front}</p>
            {showBack && (
              <p className="mt-4">{cards[getNextDueCardIndex()].back}</p>
            )}
            {!showBack && (
              <button
                className="bg-blue-500 hover:bg-blue-600 p-2 rounded mt-4"
                onClick={() => setShowBack(true)}
              >
                Show Back
              </button>
            )}
          </div>
          <div className="mt-4">
            {[0, 1, 2, 3, 4, 5].map((grade) => (
              <button
                key={grade}
                className="bg-green-500 hover:bg-green-600 p-2 rounded m-1"
                onClick={() => handleGrade(grade as SpacedRepetitionGrade)}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          className="bg-purple-500 hover:bg-purple-600 p-2 rounded mt-8"
          onClick={() => {
            if (getNextDueCardIndex() !== -1) {
              setReviewMode(true);
              setShowBack(false);
            }
          }}
        >
          Start Review
        </button>
      )}
    </div>
  );
}
