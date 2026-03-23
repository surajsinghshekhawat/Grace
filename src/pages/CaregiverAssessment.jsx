import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useStore from "../store";
import { getWeeklyQuestions } from "../data/questions";
import QuestionScreen from "../components/QuestionScreen";

const CaregiverAssessment = () => {
  const navigate = useNavigate();
  const { elderUserId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { currentQuestionIndex, setCurrentQuestionIndex } = useStore();

  const allQuestions = getWeeklyQuestions();
  const totalQuestions = allQuestions.length;

  useEffect(() => {
    setCurrentIndex(currentQuestionIndex);
  }, [currentQuestionIndex]);

  const progress = (currentIndex / totalQuestions) * 100;
  const currentQuestion = allQuestions[currentIndex];

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentQuestionIndex(nextIndex);
    } else {
      navigate(`/caregiver/elders/${elderUserId}/submit`);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentQuestionIndex(prevIndex);
    } else {
      navigate(`/caregiver/elders/${elderUserId}`);
    }
  };

  if (!currentQuestion) return null;

  return (
    <QuestionScreen
      key={currentQuestion.id ?? currentIndex}
      question={currentQuestion}
      onNext={handleNext}
      onBack={handleBack}
      progress={progress}
      questionIndex={currentIndex}
      totalQuestions={totalQuestions}
    />
  );
};

export default CaregiverAssessment;

