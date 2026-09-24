import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CountrySelect } from '../components/CountrySelect';
import { HeadingEmoji } from '../components/HeadingEmoji';
import { ArrowRight, ArrowLeft, Check, Sparkles, User, Briefcase, FileText, AlertCircle, Plus, X } from 'lucide-react';

export const ProfileWizardPage: React.FC = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    country: 'India',
    state: '',
    city: '',
    dateOfBirth: '',
    profession: 'STUDENT',
    highestDegree: 'BACHELORS',
    fieldOfStudy: '',
    institution: '',
    graduationYear: new Date().getFullYear() + 1,
    company: '',
    jobTitle: '',
    yearsOfExperience: '',
    bio: '',
  });

  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Load initial draft from server
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await api.get('/profile/me');
        if (res.data.profile) {
          const p = res.data.profile;
          setFormData((prev) => ({
            ...prev,
            fullName: p.fullName || user?.name || '',
            country: p.country || 'India',
            state: p.state || '',
            city: p.city || '',
            profession: p.profession || 'STUDENT',
            highestDegree: p.highestDegree || 'BACHELORS',
            fieldOfStudy: p.fieldOfStudy || '',
            institution: p.institution || '',
            graduationYear: p.graduationYear || new Date().getFullYear() + 1,
            company: p.company || '',
            jobTitle: p.jobTitle || '',
            yearsOfExperience: p.yearsOfExperience || '',
            bio: p.bio || '',
          }));
        }
        if (res.data.skills && Array.isArray(res.data.skills)) {
          setSkillsList(res.data.skills.map((s: any) => s.name));
        }
      } catch (err) {
        console.error('Failed to load profile draft', err);
      }
    };
    fetchDraft();
  }, [user]);

  // Save current step draft to server
  const saveStepDraft = async (dataToSave: any) => {
    try {
      setLoading(true);
      setError(null);
      await api.put('/profile/me', dataToSave);
    } catch (err: any) {
      console.error('Draft save failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.country.trim() || !formData.city.trim()) {
      setError('Country and City are required.');
      return;
    }

    await saveStepDraft({
      fullName: formData.fullName,
      country: formData.country,
      state: formData.state,
      city: formData.city,
      dateOfBirth: formData.dateOfBirth || null,
    });

    setStep(2);
  };

  const handleNextStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    await saveStepDraft({
      profession: formData.profession,
      highestDegree: formData.highestDegree,
      fieldOfStudy: formData.fieldOfStudy,
      institution: formData.institution,
      graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
      company: formData.company,
      jobTitle: formData.jobTitle,
      yearsOfExperience: formData.yearsOfExperience,
    });

    setStep(3);
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (skillsList.length >= 10) return;
    if (!skillsList.includes(skillInput.trim())) {
      setSkillsList([...skillsList, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillsList(skillsList.filter((s) => s !== skill));
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      setError(null);

      // Save bio
      await api.put('/profile/me', { bio: formData.bio });

      // Save skills if any
      if (skillsList.length > 0) {
        const skillsPayload = skillsList.map((name) => ({
          name,
          level: 'INTERMEDIATE',
          source: 'SELF',
        }));
        await api.put('/profile/me/skills', { skills: skillsPayload });
      }

      // Complete profile
      await api.post('/profile/me/complete');
      updateUser({ profileCompleted: true });
      await refreshUser();

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-background text-textPrimary flex flex-col justify-center items-center">
      <div className="w-full max-w-xl">
        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primarySoft text-primary border border-primary/30 mb-3 shadow-paper-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-normal">
            <HeadingEmoji emoji="🚀" />
            Complete Your Profile
          </h1>
          <p className="mt-1 text-xs text-textSecondary font-semibold uppercase tracking-wider">
            Step {step} of 3 • Vantage Career & Learning Profile
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-textSecondary mb-2 font-bold">
            <span className={step >= 1 ? 'text-primary' : ''}>1. About You</span>
            <span className={step >= 2 ? 'text-primary' : ''}>2. Your Background</span>
            <span className={step >= 3 ? 'text-primary' : ''}>3. Bio & Skills</span>
          </div>
          <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Card Container */}
        <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-paper-lg">
          {error && (
            <div className="mb-4 p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: About You */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-textPrimary">Step 1: Personal Details</h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Country *</label>
                <CountrySelect
                  value={formData.country}
                  onChange={(country) => setFormData({ ...formData, country })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Tamil Nadu / California"
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Erode / San Francisco"
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition flex items-center gap-1.5"
                >
                  Next: Background
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Background & Profession */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Briefcase className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-textPrimary">Step 2: Education & Profession</h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-2">
                  Select your current status *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'STUDENT', label: 'Student' },
                    { id: 'WORKING_PROFESSIONAL', label: 'Working Professional' },
                    { id: 'FREELANCER', label: 'Freelancer' },
                    { id: 'JOB_SEEKER', label: 'Job Seeker' },
                    { id: 'ENTREPRENEUR', label: 'Entrepreneur' },
                    { id: 'OTHER', label: 'Other' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, profession: p.id })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                        formData.profession === p.id
                          ? 'bg-primarySoft text-primary border-primary'
                          : 'bg-surface2 text-textPrimary border-border hover:border-primary/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Highest Degree
                </label>
                <select
                  value={formData.highestDegree}
                  onChange={(e) => setFormData({ ...formData, highestDegree: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                >
                  <option value="BACHELORS">Bachelor's Degree (B.Tech / B.Sc / B.A)</option>
                  <option value="MASTERS">Master's Degree (M.Tech / M.Sc / M.A)</option>
                  <option value="DIPLOMA">Diploma / Polytechnic</option>
                  <option value="HIGH_SCHOOL">High School (10+2)</option>
                  <option value="DOCTORATE">Doctorate (Ph.D)</option>
                  <option value="OTHER">Other Qualification</option>
                  <option value="NONE">None</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={formData.fieldOfStudy}
                    onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">Institution / University</label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="e.g. Anna University"
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Conditional Fields for Working Professional / Freelancer / Entrepreneur */}
              {['WORKING_PROFESSIONAL', 'FREELANCER', 'ENTREPRENEUR'].includes(formData.profession) && (
                <div className="p-3 bg-surface2 rounded-xl border border-border space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-textSecondary mb-1">Company / Org</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Vantage HQ"
                        className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-textSecondary mb-1">Job Title</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-surface2 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition flex items-center gap-1.5"
                >
                  Next: Bio & Skills
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Bio & Skills */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-textPrimary">Step 3: Short Bio & Skills</h3>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-textSecondary">
                    Short Bio (Max 300 chars)
                  </label>
                  <span className="text-[11px] text-textSecondary">
                    {formData.bio.length} / 300
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={300}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a brief introduction about your goals, background, or learning interests..."
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Skills & Interests (Up to 10)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. Python, React, Data Science"
                    className="flex-1 px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-primarySoft text-primary border border-primary/30 rounded-xl text-xs font-bold hover:bg-primary/20 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-10 p-2.5 bg-surface2 rounded-xl border border-border">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primarySoft text-primary border border-primary/30 text-xs font-semibold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-danger"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {skillsList.length === 0 && (
                    <span className="text-xs text-textSecondary italic">No skill tags added yet</span>
                  )}
                </div>
              </div>

              {/* Summary Review Card */}
              <div className="p-4 bg-surface2 rounded-xl border border-border space-y-1 text-xs">
                <span className="font-bold text-textPrimary block mb-1">Summary Review:</span>
                <p>
                  <strong className="text-textPrimary">Name:</strong> {formData.fullName} ({formData.profession})
                </p>
                <p>
                  <strong className="text-textPrimary">Location:</strong> {formData.city}, {formData.country}
                </p>
                {formData.highestDegree !== 'NONE' && (
                  <p>
                    <strong className="text-textPrimary">Education:</strong> {formData.highestDegree} in {formData.fieldOfStudy || 'General'}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-surface2 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Completing Profile...' : 'Finish & Go to Dashboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
