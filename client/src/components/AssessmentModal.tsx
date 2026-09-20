import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AssessmentQuestion, AssessmentAttemptResult } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Award, Check, ChevronRight, X } from 'lucide-react';
import { HeadingEmoji } from './HeadingEmoji';

interface Props {
  courseId: string;
  courseTitle: string;
  moduleId?: string;
  moduleTitle?: string;
  onClose: () => void;
  onAssessmentPassed: (cert: any, result?: AssessmentAttemptResult) => void;
}

export const AssessmentModal: React.FC<Props> = ({
  courseId,
  courseTitle,
  moduleId,
  moduleTitle,
  onClose,
  onAssessmentPassed,
}) => {
  const [assessment, setAssessment] = useState<any | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessment();
  }, [courseId, moduleId]);

  const fetchAssessment = async () => {
    try {
      setIsLoading(true);
      const url = moduleId
        ? `/assessments/course/${courseId}?moduleId=${moduleId}`
        : `/assessments/course/${courseId}`;
      const res = await api.get(url);
      setAssessment(res.data);
      setQuestions(res.data.questions || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assessment questions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (result) return; // Prevent changing after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    // Verify all answered
    if (Object.keys(selectedAnswers).length < questions.length) {
      setError('Please select an answer for all questions before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Convert map to ordered array of indices
      const answersArray = questions.map((_, idx) => selectedAnswers[idx]);

      const res = await api.post(`/assessments/${assessment.id}/attempt`, {
        answers: answersArray,
        moduleId: moduleId || assessment.moduleId || undefined,
      });

      setResult(res.data);

      if (res.data.passed) {
        onAssessmentPassed(res.data.certificate, res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit assessment attempt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl shadow-paper-lg max-w-2xl w-full border border-border overflow-hidden relative max-h-[90vh] flex flex-col text-textPrimary">
        {/* Header */}
        <div className="bg-surface2 text-textPrimary p-5 flex items-center justify-between border-b border-border">
          <div>
            <span className="text-[10px] uppercase text-primary font-bold tracking-wider">
              <HeadingEmoji emoji="📝" />{moduleTitle ? `Module Quiz • ${moduleTitle}` : 'Competency Evaluation Quiz'}
            </span>
            <h3 className="text-base font-bold text-textPrimary line-clamp-1">{courseTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-border/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-surface">
          {isLoading ? (
            <div className="py-16 text-center text-textSecondary text-xs">Loading assessment questions...</div>
          ) : error && !result ? (
            <div className="p-4 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : result ? (
            /* Results Screen */
            <div className="py-4 text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border ${
                  result.passed
                    ? 'bg-primarySoft border-primary text-primary shadow-paper-sm'
                    : 'bg-dangerSoft border-danger text-danger'
                }`}
              >
                {result.passed ? <CheckCircle2 className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
              </div>

              <h4 className="text-xl font-bold text-textPrimary">
                {result.passed ? 'Assessment Passed!' : 'Pass Threshold Not Met'}
              </h4>

              <div className="flex items-center justify-center gap-4 my-4">
                <div className="p-3 bg-surface2 border border-border rounded-xl">
                  <div className="text-2xl font-extrabold text-primary">{result.score}%</div>
                  <div className="text-[10px] text-textSecondary uppercase font-medium">Your Score</div>
                </div>
                <div className="p-3 bg-surface2 border border-border rounded-xl">
                  <div className="text-2xl font-extrabold text-textSecondary">{result.passThreshold}%</div>
                  <div className="text-[10px] text-textSecondary uppercase font-medium">Pass Mark</div>
                </div>
                <div className="p-3 bg-surface2 border border-border rounded-xl">
                  <div className="text-2xl font-extrabold text-primary">
                    {result.correctAnswers} / {result.totalQuestions}
                  </div>
                  <div className="text-[10px] text-textSecondary uppercase font-medium">Correct Answers</div>
                </div>
              </div>

              <p className="text-xs text-textSecondary max-w-md mx-auto mb-6">{result.message}</p>

              {/* Review Question Breakdown */}
              <div className="text-left space-y-4 my-6 border-t border-border pt-4">
                <h5 className="text-xs font-bold uppercase text-primary tracking-wider">Detailed Feedback</h5>
                {result.gradedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      q.isCorrect
                        ? 'bg-primarySoft/40 border-primary/30'
                        : 'bg-dangerSoft/40 border-danger/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-textSecondary">Q{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="font-semibold text-textPrimary mb-2">{q.question}</p>
                        <p className="text-textSecondary text-[11px]">
                          Your Answer:{' '}
                          <span className={q.isCorrect ? 'text-primary font-bold' : 'text-danger font-bold'}>
                            {q.options[q.userAnswer] || 'None'}
                          </span>
                        </p>
                        {!q.isCorrect && (
                          <p className="text-primary font-bold text-[11px] mt-0.5">
                            Correct Answer: {q.options[q.correctIndex]}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-textSecondary text-[11px] mt-1 bg-surface p-2 rounded border border-border">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Quiz Questions Form */
            <div className="space-y-6">
              <div className="p-3 bg-surface2 border border-border rounded-xl text-xs text-textSecondary flex items-center justify-between">
                <span>
                  Passing Score: <strong className="text-primary">{assessment?.passThreshold}%</strong>
                </span>
                <span>Total Questions: <strong className="text-textPrimary">{questions.length}</strong></span>
              </div>

              {questions.map((q, qIndex) => (
                <div key={q.id} className="p-4 bg-surface2 rounded-xl border border-border">
                  <p className="text-xs font-bold text-textPrimary mb-3 flex items-start gap-2">
                    <span className="bg-surface text-primary border border-border px-1.5 py-0.5 rounded text-[10px]">
                      Q{qIndex + 1}
                    </span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option, optIndex) => {
                      const isSelected = selectedAnswers[qIndex] === optIndex;
                      return (
                        <label
                          key={optIndex}
                          onClick={() => handleSelectOption(qIndex, optIndex)}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-primarySoft border-primary text-primary font-semibold shadow-paper-sm'
                              : 'bg-surface border-border text-textPrimary hover:border-primary/50 hover:bg-surface2'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                              isSelected ? 'border-primary bg-primary text-primaryContrast' : 'border-border'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-surface2 p-4 border-t border-border flex items-center justify-between">
          {result ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast text-xs font-bold rounded-xl transition shadow-paper-sm"
            >
              Done & Return to Course
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-border/40 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || questions.length === 0}
                className="px-6 py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-paper-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Grading Answers...' : 'Submit Assessment'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
