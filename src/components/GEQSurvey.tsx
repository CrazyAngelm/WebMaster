// 📁 src/components/GEQSurvey.tsx - Game Experience Questionnaire Survey
// 🎯 Core function: Collects player experience feedback
// 🔗 Key dependencies: React, GEQ data
// 💡 Usage: Shown to players after game sessions for research

import React, { useState } from 'react';
import { Clipboard, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { GEQ_QUESTIONS, GEQ_SCALE_LABELS, getCategories, getCategoryName, GEQCategory } from '../data/GEQ';

interface GEQSurveyProps {
  onComplete: (answers: Record<string, number>) => void;
  onSkip: () => void;
}

export const GEQSurvey: React.FC<GEQSurveyProps> = ({ onComplete, onSkip }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [showNPCCategory, setShowNPCCategory] = useState(false);

  const categories = getCategories();
  const currentCategory = categories[currentCategoryIndex];
  const questions = GEQ_QUESTIONS.filter(q => q.category === currentCategory);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const currentQuestionIndex = 0; // Show all questions in category at once

  const isCategoryComplete = () => {
    return questions.every(q => answers[q.id] !== undefined);
  };

  const nextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    } else if (!showNPCCategory) {
      setShowNPCCategory(true);
    } else {
      onComplete(answers);
    }
  };

  const prevCategory = () => {
    if (showNPCCategory) {
      setShowNPCCategory(false);
    } else if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const progress = showNPCCategory 
    ? 100 
    : Math.round(((currentCategoryIndex + 1) / (categories.length + (showNPCCategory ? 1 : 0))) * 100);

  const npcQuestions = GEQ_QUESTIONS.filter(q => q.category === 'npc_specific');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-fantasy-surface border-2 border-fantasy-accent rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-fantasy-accent/20 flex items-center justify-center">
              <Clipboard className="text-fantasy-accent" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-serif text-fantasy-accent">
                {showNPCCategory ? 'Оценка NPC' : getCategoryName(currentCategory, 'ru')}
              </h2>
              <p className="text-xs text-gray-400">
                Вопрос {showNPCCategory ? currentCategoryIndex + 1 : currentCategoryIndex + 1} из {categories.length + 1}
              </p>
            </div>
          </div>
          <button onClick={onSkip} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-fantasy-dark rounded-full mb-6">
          <div 
            className="h-full bg-fantasy-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {(showNPCCategory ? npcQuestions : questions).map(question => (
            <div key={question.id} className="space-y-2">
              <p className="text-white font-medium">{question.textRu}</p>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    onClick={() => handleAnswer(question.id, value)}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      answers[question.id] === value
                        ? 'bg-fantasy-accent text-black shadow-lg shadow-fantasy-accent/30'
                        : 'bg-fantasy-dark text-gray-300 hover:bg-fantasy-accent/20'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>{GEQ_SCALE_LABELS.ru[1 as keyof typeof GEQ_SCALE_LABELS.ru]}</span>
                <span>{GEQ_SCALE_LABELS.ru[5 as keyof typeof GEQ_SCALE_LABELS.ru]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-fantasy-accent/20">
          <button 
            onClick={prevCategory}
            disabled={currentCategoryIndex === 0 && !showNPCCategory}
            className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            Назад
          </button>
          
          <button
            onClick={nextCategory}
            disabled={!showNPCCategory && !isCategoryComplete()}
            className="fantasy-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showNPCCategory ? 'Завершить' : 'Далее'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GEQSurvey;
