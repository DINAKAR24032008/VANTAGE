import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AssessmentQuestion, AssessmentAttemptResult } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Award, Check, ChevronRight, X } from 'lucide-react';

interface Props {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onAssessmentPassed: (cert: any) => void;
}

export const AssessmentModal: React.FC<Props> = ({
  courseId,
  courseTitle,
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
  }, [courseId]);

  const fetchAssessment = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/assessments/course/${courseId}`);
      setAssessment(res.data);
      setQuestions(res.data.questions || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assessment for this course.');
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
      });

      setResult(res.data);

      if (res.data.passed && res.data.certificate) {
        onAssessmentPassed(res.data.certificate);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit assessment attempt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold tracking-wider">
              Competency Evaluation Quiz
            </span>
            <h3 className="text-base font-bold text-white line-clamp-1">{courseTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading assessment questions...</div>
          ) : error && !result ? (
            <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : result ? (
            /* Results Screen */
            <div className="py-4 text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}
              >
                {result.passed ? <CheckCircle2 className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
              </div>

              <h4 className="text-xl font-bold text-slate-900">
                {result.passed ? 'Assessment Passed!' : 'Pass Threshold Not Met'}
              </h4>

              <div className="flex items-center justify-center gap-4 my-4">
                <div className="p-3 bg-slate-50 border rounded-xl">
                  <div className="text-2xl font-extrabold text-slate-800">{result.score}%</div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Your Score</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-xl">
                  <div className="text-2xl font-extrabold text-slate-800">{result.passThreshold}%</div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Pass Mark</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-xl">
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {result.correctAnswers} / {result.totalQuestions}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Correct Answers</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">{result.message}</p>

              {/* Review Question Breakdown */}
              <div className="text-left space-y-4 my-6 border-t pt-4">
                <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Detailed Feedback</h5>
                {result.gradedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      q.isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-500">Q{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 mb-2">{q.question}</p>
                        <p className="text-slate-600 text-[11px]">
                          Your Answer:{' '}
                          <span className={q.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {q.options[q.userAnswer] || 'None'}
                          </span>
                        </p>
                        {!q.isCorrect && (
                          <p className="text-emerald-700 font-bold text-[11px] mt-0.5">
                            Correct Answer: {q.options[q.correctIndex]}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-slate-500 text-[11px] italic mt-1 bg-white/70 p-2 rounded">
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
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <span>
                  Passing Score: <strong>{assessment?.passThreshold}%</strong>
                </span>
                <span>Total Questions: <strong>{questions.length}</strong></span>
              </div>

              {questions.map((q, qIndex) => (
                <div key={q.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-800 mb-3 flex items-start gap-2">
                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
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
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                              isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
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
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          {result ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
            >
              Done & Return to Course
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || questions.length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-50"
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
