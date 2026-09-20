// SVG Avatar Presets Generator for Male, Female, and Neutral Profiles

export interface AvatarPreset {
  id: string;
  gender: 'male' | 'female' | 'other';
  label: string;
  svg: string;
}

// Background Color Swatches matching Soft Paper theme
export const AVATAR_BG_COLORS = [
  '#166534', // Forest Green
  '#B45309', // Amber Brown
  '#0F766E', // Teal
  '#9F1239', // Burgundy
  '#4D7C0F', // Olive Green
  '#1D4ED8', // Royal Blue
  '#7C3AED', // Soft Purple
  '#78716C', // Slate Warm
];

const renderMaleAvatarSVG = (skin: string, hair: string, shirt: string, hairStyle: 'short' | 'curl' | 'spike' | 'wave') => {
  let hairPath = '';
  if (hairStyle === 'short') {
    hairPath = `<path d="M25,32 C25,18 35,12 50,12 C65,12 75,18 75,32 C75,25 65,16 50,16 C35,16 25,25 25,32 Z" fill="${hair}"/>`;
  } else if (hairStyle === 'curl') {
    hairPath = `<path d="M22,34 C20,18 34,10 50,10 C66,10 80,18 78,34 C74,22 64,14 50,14 C36,14 26,22 22,34 Z" fill="${hair}"/>`;
  } else if (hairStyle === 'spike') {
    hairPath = `<path d="M25,30 L32,15 L40,24 L50,10 L60,24 L68,15 L75,30 Z" fill="${hair}"/>`;
  } else {
    hairPath = `<path d="M22,32 Q35,12 50,20 Q65,12 78,32 Q65,16 50,22 Q35,16 22,32 Z" fill="${hair}"/>`;
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="transparent"/>
    <!-- Shoulders -->
    <path d="M20,95 C20,72 32,62 50,62 C68,62 80,72 80,95 Z" fill="${shirt}"/>
    <!-- Neck -->
    <rect x="42" y="50" width="16" height="18" rx="4" fill="${skin}"/>
    <!-- Head -->
    <ellipse cx="50" cy="40" rx="22" ry="24" fill="${skin}"/>
    <!-- Hair -->
    ${hairPath}
    <!-- Eyes -->
    <circle cx="42" cy="38" r="2.5" fill="#1E293B"/>
    <circle cx="58" cy="38" r="2.5" fill="#1E293B"/>
    <!-- Eyebrows -->
    <path d="M38,32 Q42,30 46,33" stroke="#1E293B" stroke-width="2" fill="none"/>
    <path d="M54,33 Q58,30 62,32" stroke="#1E293B" stroke-width="2" fill="none"/>
    <!-- Smile -->
    <path d="M43,49 Q50,55 57,49" stroke="#1E293B" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`;
};

const renderFemaleAvatarSVG = (skin: string, hair: string, shirt: string, hairStyle: 'long' | 'bob' | 'bun' | 'wavy') => {
  let hairPath = '';
  if (hairStyle === 'long') {
    hairPath = `<path d="M20,38 C20,15 35,8 50,8 C65,8 80,15 80,38 L82,75 C78,75 74,55 74,40 C74,20 64,12 50,12 C36,12 26,20 26,40 C26,55 22,75 18,75 Z" fill="${hair}"/>`;
  } else if (hairStyle === 'bob') {
    hairPath = `<path d="M22,40 C22,14 34,9 50,9 C66,9 78,14 78,40 L78,56 C70,56 72,35 72,25 C72,15 62,13 50,13 C38,13 28,15 28,25 C28,35 30,56 22,56 Z" fill="${hair}"/>`;
  } else if (hairStyle === 'bun') {
    hairPath = `<circle cx="50" cy="10" r="12" fill="${hair}"/><path d="M24,35 C24,18 35,14 50,14 C65,14 76,18 76,35 Z" fill="${hair}"/>`;
  } else {
    hairPath = `<path d="M20,35 C20,12 35,8 50,8 C65,8 80,12 80,35 L80,68 Q75,50 70,68 C68,40 32,40 30,68 Q25,50 20,68 Z" fill="${hair}"/>`;
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="transparent"/>
    <!-- Shoulders -->
    <path d="M22,95 C22,70 34,60 50,60 C66,60 78,70 78,95 Z" fill="${shirt}"/>
    <!-- Neck -->
    <rect x="43" y="48" width="14" height="18" rx="4" fill="${skin}"/>
    <!-- Head -->
    <ellipse cx="50" cy="38" rx="20" ry="22" fill="${skin}"/>
    <!-- Hair -->
    ${hairPath}
    <!-- Eyes -->
    <circle cx="43" cy="37" r="2.2" fill="#1E293B"/>
    <circle cx="57" cy="37" r="2.2" fill="#1E293B"/>
    <!-- Eyebrows -->
    <path d="M39,32 Q43,30 47,32" stroke="#1E293B" stroke-width="1.8" fill="none"/>
    <path d="M53,32 Q57,30 61,32" stroke="#1E293B" stroke-width="1.8" fill="none"/>
    <!-- Smile -->
    <path d="M44,47 Q50,53 56,47" stroke="#1E293B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  </svg>`;
};

export const MALE_AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'm1', gender: 'male', label: 'Scientist', svg: renderMaleAvatarSVG('#F6D0B1', '#3D2314', '#10B981', 'short') },
  { id: 'm2', gender: 'male', label: 'Analyst', svg: renderMaleAvatarSVG('#E0A57A', '#1E293B', '#3B82F6', 'spike') },
  { id: 'm3', gender: 'male', label: 'Engineer', svg: renderMaleAvatarSVG('#8D5B4C', '#0F172A', '#F59E0B', 'curl') },
  { id: 'm4', gender: 'male', label: 'Officer', svg: renderMaleAvatarSVG('#FFDBAC', '#B45309', '#10B981', 'wave') },
  { id: 'm5', gender: 'male', label: 'Researcher', svg: renderMaleAvatarSVG('#F6D0B1', '#475569', '#6366F1', 'short') },
  { id: 'm6', gender: 'male', label: 'Fellow', svg: renderMaleAvatarSVG('#C68642', '#1E293B', '#EC4899', 'spike') },
  { id: 'm7', gender: 'male', label: 'Specialist', svg: renderMaleAvatarSVG('#E0A57A', '#7C2D12', '#14B8A6', 'curl') },
  { id: 'm8', gender: 'male', label: 'Director', svg: renderMaleAvatarSVG('#8D5B4C', '#000000', '#F43F5E', 'wave') },
  { id: 'm9', gender: 'male', label: 'Captain', svg: renderMaleAvatarSVG('#FFDBAC', '#334155', '#8B5CF6', 'short') },
  { id: 'm10', gender: 'male', label: 'Operator', svg: renderMaleAvatarSVG('#F6D0B1', '#854D0E', '#0EA5E9', 'spike') },
  { id: 'm11', gender: 'male', label: 'Scholar', svg: renderMaleAvatarSVG('#C68642', '#000000', '#10B981', 'curl') },
  { id: 'm12', gender: 'male', label: 'Lead', svg: renderMaleAvatarSVG('#E0A57A', '#1E1B4B', '#F59E0B', 'wave') },
];

export const FEMALE_AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'f1', gender: 'female', label: 'Scientist', svg: renderFemaleAvatarSVG('#F6D0B1', '#3D2314', '#10B981', 'long') },
  { id: 'f2', gender: 'female', label: 'Analyst', svg: renderFemaleAvatarSVG('#E0A57A', '#0F172A', '#3B82F6', 'bob') },
  { id: 'f3', gender: 'female', label: 'Engineer', svg: renderFemaleAvatarSVG('#8D5B4C', '#7C2D12', '#EC4899', 'bun') },
  { id: 'f4', gender: 'female', label: 'Officer', svg: renderFemaleAvatarSVG('#FFDBAC', '#B45309', '#14B8A6', 'wavy') },
  { id: 'f5', gender: 'female', label: 'Researcher', svg: renderFemaleAvatarSVG('#F6D0B1', '#475569', '#8B5CF6', 'long') },
  { id: 'f6', gender: 'female', label: 'Fellow', svg: renderFemaleAvatarSVG('#C68642', '#1E293B', '#F59E0B', 'bob') },
  { id: 'f7', gender: 'female', label: 'Specialist', svg: renderFemaleAvatarSVG('#E0A57A', '#334155', '#10B981', 'bun') },
  { id: 'f8', gender: 'female', label: 'Director', svg: renderFemaleAvatarSVG('#8D5B4C', '#000000', '#F43F5E', 'wavy') },
  { id: 'f9', gender: 'female', label: 'Captain', svg: renderFemaleAvatarSVG('#FFDBAC', '#854D0E', '#0EA5E9', 'long') },
  { id: 'f10', gender: 'female', label: 'Operator', svg: renderFemaleAvatarSVG('#F6D0B1', '#1E1B4B', '#6366F1', 'bob') },
  { id: 'f11', gender: 'female', label: 'Scholar', svg: renderFemaleAvatarSVG('#C68642', '#7C2D12', '#10B981', 'bun') },
  { id: 'f12', gender: 'female', label: 'Lead', svg: renderFemaleAvatarSVG('#E0A57A', '#0F172A', '#F59E0B', 'wavy') },
];

export const NEUTRAL_AVATAR_PRESETS: AvatarPreset[] = [
  ...MALE_AVATAR_PRESETS.slice(0, 6),
  ...FEMALE_AVATAR_PRESETS.slice(0, 6),
];

export const getPresetsForGender = (gender: 'male' | 'female' | 'other'): AvatarPreset[] => {
  if (gender === 'male') return MALE_AVATAR_PRESETS;
  if (gender === 'female') return FEMALE_AVATAR_PRESETS;
  return NEUTRAL_AVATAR_PRESETS;
};
