import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Capacity Connect (SIH26075 - Ministry of Earth Sciences)...');

  // Clear existing records to ensure idempotent fresh seed
  await prisma.forumPost.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseCompetencyTag.deleteMany();
  await prisma.course.deleteMany();
  await prisma.roleCompetencyRequirement.deleteMany();
  await prisma.competencyProfile.deleteMany();
  await prisma.competency.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Core Competencies
  console.log('Creating Competency Library...');
  const compRadar = await prisma.competency.create({
    data: {
      name: 'Satellite Meteorology & Radar Remote Sensing',
      category: 'Atmospheric Sciences',
      description: 'Interpretation of INSAT-3D/3DR satellite imagery, Doppler Weather Radar (DWR) data, and severe convective storm tracking.',
    },
  });

  const compNWP = await prisma.competency.create({
    data: {
      name: 'Numerical Weather Prediction (NWP) Modeling',
      category: 'Atmospheric Sciences',
      description: 'Execution and calibration of WRF/GFS high-resolution atmospheric models and ensemble forecasting techniques.',
    },
  });

  const compOceanTsunami = await prisma.competency.create({
    data: {
      name: 'Ocean Hydrodynamics & Tsunami Warning Systems',
      category: 'Ocean Sciences',
      description: 'Operation of BPR/tide-gauge networks, numerical tsunami propagation modeling, and coastal inundation mapping.',
    },
  });

  const compDeepSea = await prisma.competency.create({
    data: {
      name: 'Deep Sea Exploration & Submersible Robotics',
      category: 'Ocean Sciences',
      description: 'Autonomous Underwater Vehicles (AUVs), deep-sea hydrothermal vent exploration, and ocean floor geophysical surveys.',
    },
  });

  const compSeismic = await prisma.competency.create({
    data: {
      name: 'Seismic Hazard Assessment & Microzonation',
      category: 'Seismology & Solid Earth',
      description: 'Broadband seismograph networks, focal mechanism inversion, PGA attenuation, and earthquake microzonation.',
    },
  });

  const compGIS = await prisma.competency.create({
    data: {
      name: 'Geospatial GIS & Earth Observation Analytics',
      category: 'Data Systems & Geoinformatics',
      description: 'Multi-spectral satellite processing, GDAL/QGIS pipelines, and spatial multi-criteria decision analysis.',
    },
  });

  const compHPC = await prisma.competency.create({
    data: {
      name: 'HPC & Parallel Computing for Earth Science Models',
      category: 'Data Systems & Geoinformatics',
      description: 'MPI/OpenMP optimization, GPU acceleration on PRATYUSH/MIHIR supercomputers, and NetCDF/GRIB big data pipelines.',
    },
  });

  const compPython = await prisma.competency.create({
    data: {
      name: 'Python Programming & Scientific Computing',
      category: 'Data Systems & Geoinformatics',
      description: 'Foundational programming in Python: syntax, data structures, functional patterns, file I/O, and scientific packages for Earth Sciences.',
    },
  });

  // 2. Create Role Competency Requirements (Static Matrices)
  console.log('Creating Role Competency Matrices...');
  await prisma.roleCompetencyRequirement.create({
    data: {
      jobRole: 'Meteorological Assistant',
      department: 'India Meteorological Department (IMD)',
      requirements: JSON.stringify([
        { competencyId: compRadar.id, competencyName: compRadar.name, requiredLevel: 4, weight: 1.5 },
        { competencyId: compNWP.id, competencyName: compNWP.name, requiredLevel: 4, weight: 1.5 },
        { competencyId: compGIS.id, competencyName: compGIS.name, requiredLevel: 3, weight: 1.0 },
        { competencyId: compHPC.id, competencyName: compHPC.name, requiredLevel: 3, weight: 1.0 },
        { competencyId: compPython.id, competencyName: compPython.name, requiredLevel: 3, weight: 1.2 },
      ]),
    },
  });

  await prisma.roleCompetencyRequirement.create({
    data: {
      jobRole: 'Ocean Data Analyst',
      department: 'Indian National Centre for Ocean Information Services (INCOIS)',
      requirements: JSON.stringify([
        { competencyId: compOceanTsunami.id, competencyName: compOceanTsunami.name, requiredLevel: 5, weight: 1.5 },
        { competencyId: compGIS.id, competencyName: compGIS.name, requiredLevel: 4, weight: 1.2 },
        { competencyId: compDeepSea.id, competencyName: compDeepSea.name, requiredLevel: 3, weight: 1.0 },
        { competencyId: compHPC.id, competencyName: compHPC.name, requiredLevel: 3, weight: 1.0 },
        { competencyId: compPython.id, competencyName: compPython.name, requiredLevel: 4, weight: 1.5 },
      ]),
    },
  });

  await prisma.roleCompetencyRequirement.create({
    data: {
      jobRole: 'Seismological Field Officer',
      department: 'National Centre for Seismology (NCS)',
      requirements: JSON.stringify([
        { competencyId: compSeismic.id, competencyName: compSeismic.name, requiredLevel: 5, weight: 1.5 },
        { competencyId: compGIS.id, competencyName: compGIS.name, requiredLevel: 3, weight: 1.0 },
        { competencyId: compHPC.id, competencyName: compHPC.name, requiredLevel: 2, weight: 0.8 },
      ]),
    },
  });

  await prisma.roleCompetencyRequirement.create({
    data: {
      jobRole: 'Marine Research Fellow',
      department: 'National Institute of Ocean Technology (NIOT)',
      requirements: JSON.stringify([
        { competencyId: compDeepSea.id, competencyName: compDeepSea.name, requiredLevel: 4, weight: 1.5 },
        { competencyId: compOceanTsunami.id, competencyName: compOceanTsunami.name, requiredLevel: 4, weight: 1.2 },
        { competencyId: compGIS.id, competencyName: compGIS.name, requiredLevel: 3, weight: 1.0 },
      ]),
    },
  });

  await prisma.roleCompetencyRequirement.create({
    data: {
      jobRole: 'Polar Research Assistant',
      department: 'National Centre for Polar and Ocean Research (NCPOR)',
      requirements: JSON.stringify([
        { competencyId: compRadar.id, competencyName: compRadar.name, requiredLevel: 4, weight: 1.2 },
        { competencyId: compGIS.id, competencyName: compGIS.name, requiredLevel: 4, weight: 1.3 },
        { competencyId: compNWP.id, competencyName: compNWP.name, requiredLevel: 3, weight: 1.0 },
        { competencyId: compPython.id, competencyName: compPython.name, requiredLevel: 3, weight: 1.2 },
      ]),
    },
  });

  // 3. Create Admin & Trainers
  console.log('Creating Admin and Trainers...');
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Rameshwar Rao',
      email: 'admin@capacityconnect.gov.in',
      passwordHash,
      role: 'admin',
      department: 'Ministry Headquarters (MoES)',
      jobRole: 'Training Director',
    },
  });

  const trainerMet = await prisma.user.create({
    data: {
      name: 'Dr. Ananya Sen',
      email: 'trainer.met@capacityconnect.gov.in',
      passwordHash,
      role: 'trainer',
      department: 'India Meteorological Department (IMD)',
      jobRole: 'Chief Meteorological Scientist',
    },
  });

  const trainerOcean = await prisma.user.create({
    data: {
      name: 'Dr. Vikram Nair',
      email: 'trainer.ocean@capacityconnect.gov.in',
      passwordHash,
      role: 'trainer',
      department: 'National Institute of Ocean Technology (NIOT)',
      jobRole: 'Principal Oceanographer',
    },
  });

  // 4. Create 5 Learners with varied initial competency levels
  console.log('Creating Learners & Competency Profiles...');
  const learner1 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'learner1@capacityconnect.gov.in',
      passwordHash,
      role: 'learner',
      department: 'India Meteorological Department (IMD)',
      jobRole: 'Meteorological Assistant',
    },
  });
  await prisma.competencyProfile.create({
    data: {
      userId: learner1.id,
      skills: JSON.stringify([
        { competencyId: compRadar.id, competencyName: compRadar.name, currentLevel: 2 },
        { competencyId: compNWP.id, competencyName: compNWP.name, currentLevel: 1 },
        { competencyId: compGIS.id, competencyName: compGIS.name, currentLevel: 2 },
        { competencyId: compHPC.id, competencyName: compHPC.name, currentLevel: 1 },
        { competencyId: compPython.id, competencyName: compPython.name, currentLevel: 1 },
      ]),
    },
  });

  const learner2 = await prisma.user.create({
    data: {
      name: 'Rajesh Kulkarni',
      email: 'learner2@capacityconnect.gov.in',
      passwordHash,
      role: 'learner',
      department: 'Indian National Centre for Ocean Information Services (INCOIS)',
      jobRole: 'Ocean Data Analyst',
    },
  });
  await prisma.competencyProfile.create({
    data: {
      userId: learner2.id,
      skills: JSON.stringify([
        { competencyId: compOceanTsunami.id, competencyName: compOceanTsunami.name, currentLevel: 4 },
        { competencyId: compGIS.id, competencyName: compGIS.name, currentLevel: 2 },
        { competencyId: compDeepSea.id, competencyName: compDeepSea.name, currentLevel: 2 },
        { competencyId: compHPC.id, competencyName: compHPC.name, currentLevel: 2 },
        { competencyId: compPython.id, competencyName: compPython.name, currentLevel: 2 },
      ]),
    },
  });

  const learner3 = await prisma.user.create({
    data: {
      name: 'Sneha Patel',
      email: 'learner3@capacityconnect.gov.in',
      passwordHash,
      role: 'learner',
      department: 'National Centre for Seismology (NCS)',
      jobRole: 'Seismological Field Officer',
    },
  });
  await prisma.competencyProfile.create({
    data: {
      userId: learner3.id,
      skills: JSON.stringify([
        { competencyId: compSeismic.id, competencyName: compSeismic.name, currentLevel: 3 },
        { competencyId: compGIS.id, competencyName: compGIS.name, currentLevel: 2 },
        { competencyId: compHPC.id, competencyName: compHPC.name, currentLevel: 1 },
      ]),
    },
  });

  const learner4 = await prisma.user.create({
    data: {
      name: 'Arun Verma',
      email: 'learner4@capacityconnect.gov.in',
      passwordHash,
      role: 'learner',
      department: 'National Institute of Ocean Technology (NIOT)',
      jobRole: 'Marine Research Fellow',
    },
  });
  await prisma.competencyProfile.create({
    data: {
      userId: learner4.id,
      skills: JSON.stringify([
        { competencyId: compDeepSea.id, competencyName: compDeepSea.name, currentLevel: 1 },
        { competencyId: compOceanTsunami.id, competencyName: compOceanTsunami.name, currentLevel: 2 },
        { competencyId: compGIS.id, competencyName: compGIS.name, currentLevel: 1 },
        { competencyId: compPython.id, competencyName: compPython.name, currentLevel: 1 },
      ]),
    },
  });

  const learner5 = await prisma.user.create({
    data: {
      name: 'Deepak Menon',
      email: 'learner5@capacityconnect.gov.in',
      passwordHash,
      role: 'learner',
      department: 'National Centre for Polar and Ocean Research (NCPOR)',
      jobRole: 'Polar Research Assistant',
    },
  });
  await prisma.competencyProfile.create({
    data: {
      userId: learner5.id,
      skills: JSON.stringify([
        { competencyId: compRadar.id, competencyName: compRadar.name, currentLevel: 3 },
        { competencyId: compGIS.id, competencyName: compGIS.name, currentLevel: 3 },
        { competencyId: compNWP.id, competencyName: compNWP.name, currentLevel: 1 },
        { competencyId: compPython.id, competencyName: compPython.name, currentLevel: 1 },
      ]),
    },
  });

  // 5. Create 6 Comprehensive Domain Courses
  console.log('Creating Courses, Modules, Assessments...');

  // Course 1
  const course1 = await prisma.course.create({
    data: {
      title: 'Doppler Weather Radar (DWR) Operations & Extreme Weather Nowcasting',
      description: 'Hands-on training on S-band and C-band Doppler radars for early cyclone detection, severe squall line tracking, and heavy rainfall estimation.',
      difficultyLevel: 'Intermediate',
      trainerId: trainerMet.id,
      contentUrl: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod1-1',
          title: 'Radar Principles & Dual-Polarization Data Interpretation',
          durationMinutes: 45,
          order: 1,
          contentMarkdown: '# Radar Principles\n\nLearn how dual-polarization pulse-Doppler radar identifies precipitation types (Zdr, Kdp, and correlation coefficient RhoHV).',
        },
        {
          id: 'mod1-2',
          title: 'Tropical Cyclone Eye Identification & Radial Velocity Signatures',
          durationMinutes: 60,
          order: 2,
          contentMarkdown: '# Cyclone Tracking\n\nIdentify mesocyclones, vortex shear, and eye-wall replacement cycles in the Bay of Bengal.',
        },
        {
          id: 'mod1-3',
          title: 'Nowcasting Heavy Precipitation Events for Urban Disaster Management',
          durationMinutes: 50,
          order: 3,
          contentMarkdown: '# Nowcasting Protocols\n\nTranslating reflectivity (dBZ) into Quantitative Precipitation Estimates (QPE) within 30-minute lead time.',
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compRadar.id, targetLevel: 4 },
          { competencyId: compGIS.id, targetLevel: 3 },
        ],
      },
    },
  });

  // Assessment for Course 1
  await prisma.assessment.create({
    data: {
      courseId: course1.id,
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'q1-1',
          question: 'Which Doppler radar parameter provides direct indication of non-meteorological hydrometeors (e.g. biological scatterers or sea clutter)?',
          options: ['Differential Reflectivity (ZDR)', 'Cross-Correlation Coefficient (RhoHV)', 'Specific Differential Phase (KDP)', 'Equivalent Radar Reflectivity (Ze)'],
          correctIndex: 1,
          explanation: 'Correlation coefficient (RhoHV) drops significantly below 0.85 for non-uniform, non-meteorological scatterers.',
        },
        {
          id: 'q1-2',
          question: 'What velocity signature on a Doppler radial velocity display indicates a cyclonic vortex in the Northern Hemisphere?',
          options: ['Inbound velocity adjacent to outbound velocity (couplet)', 'Uniform positive velocities across the entire azimuth', 'Zero isodop line parallel to radar beam', 'High velocity dispersion'],
          correctIndex: 0,
          explanation: 'A vortex produces an inbound/outbound velocity couplet where adjacent beams detect motion toward and away from the radar.',
        },
        {
          id: 'q1-3',
          question: 'In Quantitative Precipitation Estimation (QPE), what is the standard Marshall-Palmer relation parameters Z = A * R^b?',
          options: ['Z = 200 * R^1.6', 'Z = 500 * R^2.0', 'Z = 100 * R^1.2', 'Z = 300 * R^1.4'],
          correctIndex: 0,
          explanation: 'The classic stratiform rainfall Marshall-Palmer formula is Z = 200 * R^1.6.',
        },
      ]),
    },
  });

  // Course 2
  const course2 = await prisma.course.create({
    data: {
      title: 'High-Resolution Numerical Weather Prediction using WRF-ARW',
      description: 'Master the setup, parameterization, and boundary condition configuration for the Weather Research and Forecasting (WRF) model on MoES HPC clusters.',
      difficultyLevel: 'Advanced',
      trainerId: trainerMet.id,
      contentUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod2-1',
          title: 'WRF Preprocessing System (WPS) & Domain Nesting',
          durationMinutes: 55,
          order: 1,
          contentMarkdown: '# WPS Setup\n\nConfiguring geogrid, ungrib, and metgrid for nested 9km and 3km domains.',
        },
        {
          id: 'mod2-2',
          title: 'Microphysics & Planetary Boundary Layer (PBL) Schemes',
          durationMinutes: 70,
          order: 2,
          contentMarkdown: '# Physics Parameterization\n\nComparing WSM6 vs Thompson microphysics and YSU vs MYJ boundary layer schemes during Indian Monsoon.',
        },
        {
          id: 'mod2-3',
          title: 'Ensemble Data Assimilation & HPC Parallel Scaling',
          durationMinutes: 65,
          order: 3,
          contentMarkdown: '# Data Assimilation\n\nIncorporating Doppler radar and satellite radiance observations into WRF-DA with 3D/4D-Var.',
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compNWP.id, targetLevel: 4 },
          { competencyId: compHPC.id, targetLevel: 3 },
        ],
      },
    },
  });

  await prisma.assessment.create({
    data: {
      courseId: course2.id,
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'q2-1',
          question: 'Which component of WPS interpolates static geographical datasets (topography, land use) to simulation domains?',
          options: ['ungrib.exe', 'metgrid.exe', 'geogrid.exe', 'real.exe'],
          correctIndex: 2,
          explanation: 'geogrid.exe defines domain projection and interpolates terrestrial datasets onto computational grids.',
        },
        {
          id: 'q2-2',
          question: 'For cloud-resolving grid spacing below 4 km, which parameterization scheme should normally be disabled?',
          options: ['Cumulus convection scheme', 'Microphysics scheme', 'Surface layer physics', 'Longwave radiation scheme'],
          correctIndex: 0,
          explanation: 'At grid resolutions under 4 km, deep convection is explicitly resolved by dynamics, so cumulus parameterization is turned off.',
        },
      ]),
    },
  });

  // Course 3
  const course3 = await prisma.course.create({
    data: {
      title: 'Tsunami Early Warning & Ocean State Forecast Services',
      description: 'Operating the Indian Tsunami Early Warning Centre (ITEWC): Bottom Pressure Recorders, deep ocean buoys, and real-time decision support systems.',
      difficultyLevel: 'Intermediate',
      trainerId: trainerOcean.id,
      contentUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod3-1',
          title: 'Seismic Source Inversion for Tsunami Generation Potential',
          durationMinutes: 40,
          order: 1,
          contentMarkdown: '# Seismic Inversion\n\nDetermining earthquake moment magnitude (Mw) and fault rupture geometry within 10 minutes.',
        },
        {
          id: 'mod3-2',
          title: 'TUNAMI-N2 Hydrodynamic Propagation Modeling',
          durationMinutes: 50,
          order: 2,
          contentMarkdown: '# Wave Modeling\n\nSimulating open-ocean wave travel times and shoaling amplification near coastlines.',
        },
        {
          id: 'mod3-3',
          title: 'Coastal Vulnerability & Community Warning Dissemination',
          durationMinutes: 45,
          order: 3,
          contentMarkdown: '# Warning Dissemination\n\nIssuing Threat Pass/Watch/Alert bulletins to disaster management authorities.',
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compOceanTsunami.id, targetLevel: 5 },
          { competencyId: compGIS.id, targetLevel: 3 },
        ],
      },
    },
  });

  await prisma.assessment.create({
    data: {
      courseId: course3.id,
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'q3-1',
          question: 'What is the characteristic open-ocean propagation speed of a tsunami in deep water of depth H = 4000 meters? (c = sqrt(g*H))',
          options: ['Approximately 700-800 km/h (jet airliner speed)', 'Approximately 80-100 km/h', 'Approximately 1500 km/h (supersonic)', 'Approximately 30 km/h'],
          correctIndex: 0,
          explanation: 'c = sqrt(9.8 * 4000) ~ 198 m/s = ~712 km/h.',
        },
        {
          id: 'q3-2',
          question: 'Which instrument confirmed tsunami wave generation in the open ocean without coastal reflection noise?',
          options: ['Coastal Tide Gauge', 'Deep-ocean Bottom Pressure Recorder (BPR / DART)', 'Sub-surface acoustic pinger', 'Satellite Altimeter only'],
          correctIndex: 1,
          explanation: 'Bottom Pressure Recorders detect millimetric hydrostatic pressure changes caused by passing tsunami waves.',
        },
      ]),
    },
  });

  // Course 4
  const course4 = await prisma.course.create({
    data: {
      title: 'Deep-Ocean Submersible Operations & Autonomous Underwater Vehicles (AUV)',
      description: 'Samudrayaan mission technologies: manned submersibles (MATSYA 6000), deep-sea imaging systems, and benthic habitat mapping.',
      difficultyLevel: 'Advanced',
      trainerId: trainerOcean.id,
      contentUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod4-1',
          title: 'Titanium Pressure Hull Engineering & Life Support Systems',
          durationMinutes: 60,
          order: 1,
          contentMarkdown: '# Titanium Hull Design\n\nWithstanding 600 bar hydrostatic pressure at 6000m depth.',
        },
        {
          id: 'mod4-2',
          title: 'Acoustic Navigation (USBL/LBL) & Sub-sea Communications',
          durationMinutes: 45,
          order: 2,
          contentMarkdown: '# Acoustic Positioning\n\nUltra-Short Baseline (USBL) acoustic positioning and Doppler Velocity Logs (DVL).',
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compDeepSea.id, targetLevel: 4 },
        ],
      },
    },
  });

  await prisma.assessment.create({
    data: {
      courseId: course4.id,
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'q4-1',
          question: 'Why is titanium alloy (e.g. Ti-6Al-4V ELI) selected for the MATSYA 6000 human crew sphere?',
          options: ['High strength-to-weight ratio and exceptional corrosion resistance at extreme hydrostatic pressures', 'It is cheaper than mild steel', 'It completely blocks all magnetic fields', 'It dissolves in seawater after mission completion'],
          correctIndex: 0,
          explanation: 'Titanium Ti-6Al-4V provides the required yield strength to resist 60 MPa hydrostatic pressure without buckling.',
        },
      ]),
    },
  });

  // Course 5
  const course5 = await prisma.course.create({
    data: {
      title: 'Earthquake Hazard Microzonation & Broadband Seismograph Networks',
      description: 'National Centre for Seismology training on digital broadband telemetry, earthquake location algorithms (HypoInverse), and site amplification.',
      difficultyLevel: 'Intermediate',
      trainerId: trainerMet.id,
      contentUrl: 'https://images.unsplash.com/photo-1584974292709-5c2f30b91d4e?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1584974292709-5c2f30b91d4e?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod5-1',
          title: 'Digital Seismic Sensors & SeedLink Real-Time Telemetry',
          durationMinutes: 50,
          order: 1,
          contentMarkdown: '# Broadband Instrumentation\n\nSetting up Trillium 120s sensors, Taurus digitizers, and VSAT communication links.',
        },
        {
          id: 'mod5-2',
          title: 'H/V Spectral Ratio & Shear Wave Velocity (Vs30) Profiling',
          durationMinutes: 55,
          order: 2,
          contentMarkdown: '# Microzonation\n\nNakamura H/V ambient noise technique and MASW geophysical testing.',
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compSeismic.id, targetLevel: 4 },
          { competencyId: compGIS.id, targetLevel: 3 },
        ],
      },
    },
  });

  await prisma.assessment.create({
    data: {
      courseId: course5.id,
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'q5-1',
          question: 'What does the fundamental resonance frequency (f0) obtained from H/V ambient noise measurements indicate?',
          options: ['The resonant frequency at which sediment layers amplify ground motion', 'The depth of the mantle-core boundary', 'The magnitude of the next earthquake', 'The epicentral distance of the event'],
          correctIndex: 0,
          explanation: 'H/V spectral peaks correspond to the fundamental resonant period where soft sediment columns trap seismic shear waves.',
        },
      ]),
    },
  });

  // Course 6
  const course6 = await prisma.course.create({
    data: {
      title: 'Geospatial Cloud & Big Earth Data Processing with Python & GDAL',
      description: 'Scalable raster analytics for oceanographic and atmospheric datasets using Xarray, Dask, Cloud-Optimized GeoTIFFs (COG), and Open Data Cube.',
      difficultyLevel: 'Beginner',
      trainerId: trainerOcean.id,
      contentUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod6-1',
          title: 'NetCDF4, GRIB2 & OPeNDAP Remote Access',
          durationMinutes: 40,
          order: 1,
          contentMarkdown: '# Multi-dimensional Data\n\nAccessing gridded climate datasets from ECMWF and INCOIS thredds servers.',
        },
        {
          id: 'mod6-2',
          title: 'Parallel Geospatial Pipelines using Dask & GeoPandas',
          durationMinutes: 50,
          order: 2,
          contentMarkdown: '# Big Data Analytics\n\nProcessing satellite sea surface temperature (SST) time-series across decades.',
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compGIS.id, targetLevel: 3 },
          { competencyId: compHPC.id, targetLevel: 2 },
        ],
      },
    },
  });

  await prisma.assessment.create({
    data: {
      courseId: course6.id,
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'q6-1',
          question: 'What is the primary benefit of Cloud-Optimized GeoTIFFs (COG) over traditional GeoTIFF files?',
          options: ['HTTP Range requests can stream specific bounding-box pixels without downloading the entire multi-gigabyte file', 'They compress data by 99% without loss', 'They can only be opened with proprietary software', 'They do not contain any geospatial metadata'],
          correctIndex: 0,
          explanation: 'COGs utilize internal tiling and overview pyramids alongside HTTP GET Range headers for instant on-demand tile streaming.',
        },
      ]),
    },
  });

  // Course 7 - Introduction to Python (Modular with per-module video & quizzes)
  console.log('Creating Course 7: Introduction to Python...');
  const course7 = await prisma.course.create({
    data: {
      title: 'Introduction to Python',
      description: 'A beginner-friendly course covering Python fundamentals — syntax, data types, control flow, functions, and basic data structures. Aimed at learners with no prior programming background, providing the coding foundation needed for scientific data analysis in Earth Sciences.',
      difficultyLevel: 'Beginner',
      trainerId: trainerMet.id,
      contentUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=600&q=80',
      modules: JSON.stringify([
        {
          id: 'mod-py-1',
          title: 'Python Setup & Basics',
          durationMinutes: 45,
          order: 1,
          videoUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
          contentMarkdown: '# Module 1: Python Setup & Basics\n\nWelcome to **Introduction to Python**! In this module, you will learn the role of Python in modern Earth and Atmospheric sciences, how to install Python 3, configure your development environment, and write your first Python statements.\n\n### Key Topics:\n- Installing Python 3 & VS Code\n- Python Interactive Shell (REPL)\n- Comments, indentation, and code formatting\n- Built-in `print()` and `input()` functions\n- Writing and executing your first `.py` script',
        },
        {
          id: 'mod-py-2',
          title: 'Variables & Data Types',
          durationMinutes: 50,
          order: 2,
          videoUrl: 'https://www.youtube.com/watch?v=khKv-8q7YmY',
          contentMarkdown: '# Module 2: Variables & Data Types\n\nUnderstand how Python stores information in memory. Learn the dynamic typing system, scalar data types, type casting, and string formatting techniques crucial for processing meteorological and oceanographic observations.\n\n### Key Topics:\n- Integers, Floats, Booleans, and Strings\n- Dynamic typing and variable naming conventions\n- Arithmetic, logical, and comparison operators\n- Type conversion functions: `int()`, `float()`, `str()`\n- String concatenation and f-strings (`f"Temperature: {temp}°C"`)',
        },
        {
          id: 'mod-py-3',
          title: 'Control Flow (Conditionals & Loops)',
          durationMinutes: 55,
          order: 3,
          videoUrl: 'https://www.youtube.com/watch?v=6iF8Xb7Z3wQ',
          contentMarkdown: '# Module 3: Control Flow (Conditionals & Loops)\n\nLearn how to direct the flow of execution in your programs using decision structures and iteration. Automate repetitive tasks such as iterating over weather sensor records and evaluating storm warning thresholds.\n\n### Key Topics:\n- `if`, `elif`, and `else` conditional branching\n- Iteration with `for` loops and `range()`\n- `while` loops and sentinel conditions\n- Loop control: `break`, `continue`, and `pass`\n- Nested control structures and list iterations',
        },
        {
          id: 'mod-py-4',
          title: 'Functions & Scope',
          durationMinutes: 50,
          order: 4,
          videoUrl: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
          contentMarkdown: '# Module 4: Functions & Scope\n\nMaster the creation of modular, reusable code blocks. Functions form the backbone of analytical pipelines in scientific workflows, enabling clean separation of concerns and reproducible science.\n\n### Key Topics:\n- Defining functions using `def` and returning values with `return`\n- Positional, keyword, and default parameters\n- Variable length arguments (`*args` and `**kwargs`)\n- Variable scope: Local, Enclosing, Global, and Built-in (LEGB rule)\n- Docstrings and type hinting basics',
        },
        {
          id: 'mod-py-5',
          title: 'Data Structures (Lists, Tuples, Dictionaries, Sets)',
          durationMinutes: 60,
          order: 5,
          videoUrl: 'https://www.youtube.com/watch?v=R-HLU9Fl5ug',
          contentMarkdown: '# Module 5: Data Structures\n\nOrganize, store, and manipulate collections of data using Python versatile built-in container types. Learn the differences between mutable and immutable collections and when to use each for geospatial datasets.\n\n### Key Topics:\n- Lists: indexing, slicing, methods (`append`, `pop`, `sort`), and list comprehensions\n- Tuples: immutability, tuple packing and unpacking\n- Dictionaries: key-value mapping, dict methods (`.keys()`, `.values()`, `.items()`, `.get()`)\n- Sets: unique membership, mathematical set operations (union, intersection, difference)\n- Time complexity trade-offs for collections',
        },
        {
          id: 'mod-py-6',
          title: 'File Handling & Intro to Object-Oriented Programming',
          durationMinutes: 60,
          order: 6,
          videoUrl: 'https://www.youtube.com/watch?v=JeznW_7DlB0',
          contentMarkdown: '# Module 6: File Handling & Intro to OOP\n\nConclude the foundational course by reading from and writing to disk files (CSV, TXT), managing resources safely with context managers, and getting a hands-on introduction to classes and object-oriented design.\n\n### Key Topics:\n- Safe file handling using `with open(..., mode) as f:`\n- Reading line-by-line, `.read()`, and `.readlines()`\n- Exception handling fundamentals: `try`, `except`, `finally`\n- Defining classes, attributes, and `__init__` constructors\n- Creating objects and invoking instance methods',
        },
      ]),
      competencyTags: {
        create: [
          { competencyId: compPython.id, targetLevel: 3 },
          { competencyId: compGIS.id, targetLevel: 1 },
        ],
      },
    },
  });

  // Module 1 Quiz (5 questions)
  await prisma.assessment.create({
    data: {
      courseId: course7.id,
      moduleId: 'mod-py-1',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py1-q1',
          question: 'Which terminal command displays the currently installed version of Python 3?',
          options: ['python --version', 'python -getversion', 'py.status()', 'pip check version'],
          correctIndex: 0,
          explanation: 'Running `python --version` (or `python3 --version`) in your terminal prints the installed Python version.',
        },
        {
          id: 'py1-q2',
          question: 'How do you create a single-line comment in a Python script?',
          options: ['// This is a comment', '# This is a comment', '/* This is a comment */', '-- This is a comment'],
          correctIndex: 1,
          explanation: 'In Python, single-line comments begin with the hash character `#`.',
        },
        {
          id: 'py1-q3',
          question: 'Which of the following is an INVALID variable name in Python?',
          options: ['radar_reading_1', '_sensor_id', '2nd_station', 'stationDepth'],
          correctIndex: 2,
          explanation: 'Python variable names cannot start with a digit (e.g., `2nd_station` triggers a SyntaxError).',
        },
        {
          id: 'py1-q4',
          question: 'What is the return data type of the built-in input() function in Python 3?',
          options: ['int', 'str', 'float', 'None'],
          correctIndex: 1,
          explanation: 'The `input()` function always reads input from the user as a string (`str`).',
        },
        {
          id: 'py1-q5',
          question: 'What is the standard indentation level recommended by the official Python PEP 8 style guide?',
          options: ['2 spaces', '4 spaces', '1 tab character', '8 spaces'],
          correctIndex: 1,
          explanation: 'PEP 8 recommends 4 spaces per indentation level rather than tabs or 2 spaces.',
        },
      ]),
    },
  });

  // Module 2 Quiz (5 questions)
  await prisma.assessment.create({
    data: {
      courseId: course7.id,
      moduleId: 'mod-py-2',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py2-q1',
          question: 'What is the result of type(1013.25) in Python?',
          options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'decimal'>"],
          correctIndex: 1,
          explanation: 'Numbers with a fractional decimal part are represented by the `float` type in Python.',
        },
        {
          id: 'py2-q2',
          question: 'What are the outputs of floor division (17 // 5) and modulo (17 % 5)?',
          options: ['3.4 and 2', '3 and 2', '3 and 0.4', '4 and 2'],
          correctIndex: 1,
          explanation: '`17 // 5` performs floor division yielding integer `3`, and `17 % 5` computes the remainder `2`.',
        },
        {
          id: 'py2-q3',
          question: 'What happens if you execute: greeting = "MoES " + 2026 ?',
          options: [
            'greeting is assigned "MoES 2026"',
            'Raises a TypeError because Python does not automatically coerce integers to strings in concatenation',
            'greeting is assigned "MoES "',
            'greeting is assigned 2026',
          ],
          correctIndex: 1,
          explanation: 'Python is strongly typed and will raise `TypeError: can only concatenate str (not "int") to str`. Use `str(2026)` or f-strings.',
        },
        {
          id: 'py2-q4',
          question: 'Which f-string expression correctly formats a float temp = 28.6789 to exactly 2 decimal places?',
          options: ['f"{temp:2d}"', 'f"{temp:.2f}"', 'f"{round(temp, 2):format}"', 'f"{temp%2}"'],
          correctIndex: 1,
          explanation: 'The format specifier `:.2f` rounds and formats floating-point values to 2 decimal places.',
        },
        {
          id: 'py2-q5',
          question: 'Which of the following values evaluates to False when passed to bool()?',
          options: ['bool("0")', 'bool([0])', 'bool("")', 'bool(-1)'],
          correctIndex: 2,
          explanation: 'An empty string `""` is falsy in Python; non-empty strings and non-empty lists evaluate to True.',
        },
      ]),
    },
  });

  // Module 3 Quiz (5 questions)
  await prisma.assessment.create({
    data: {
      courseId: course7.id,
      moduleId: 'mod-py-3',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py3-q1',
          question: 'What is the output of list(range(2, 11, 3))?',
          options: ['[2, 5, 8, 11]', '[2, 5, 8]', '[3, 6, 9]', '[2, 4, 6, 8, 10]'],
          correctIndex: 1,
          explanation: '`range(start, stop, step)` generates values up to but NOT including stop: 2, 5, 8.',
        },
        {
          id: 'py3-q2',
          question: 'What is the function of the break statement within a loop?',
          options: [
            'Skips the rest of the current iteration and advances to the next',
            'Immediately exits the innermost enclosing loop',
            'Restarts the loop from the beginning',
            'Terminates the entire Python program',
          ],
          correctIndex: 1,
          explanation: '`break` terminates the execution of the nearest enclosing `for` or `while` loop.',
        },
        {
          id: 'py3-q3',
          question: 'What does this loop print?\nfor i in range(5):\n    if i == 2:\n        continue\n    print(i, end=" ")',
          options: ['0 1', '0 1 2 3 4', '0 1 3 4 ', '2 3 4'],
          correctIndex: 2,
          explanation: 'When `i == 2`, `continue` skips the `print` statement and jumps to the next iteration.',
        },
        {
          id: 'py3-q4',
          question: 'Which Python keyword is used as a placeholder to create an empty code block without syntax errors?',
          options: ['empty', 'void', 'pass', 'null'],
          correctIndex: 2,
          explanation: '`pass` is a null statement used as a syntactic placeholder where code is syntactically required.',
        },
        {
          id: 'py3-q5',
          question: 'How is the expression True or False and False evaluated in Python?',
          options: [
            'True, because and has higher precedence than or',
            'False, because or is evaluated before and',
            'False, because evaluation is strictly left-to-right',
            'SyntaxError due to missing parentheses',
          ],
          correctIndex: 0,
          explanation: '`and` binds tighter than `or`. Thus `False and False` is evaluated first to `False`, then `True or False` evaluates to `True`.',
        },
      ]),
    },
  });

  // Module 4 Quiz (5 questions)
  await prisma.assessment.create({
    data: {
      courseId: course7.id,
      moduleId: 'mod-py-4',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py4-q1',
          question: 'Which keyword is used to declare a function in Python?',
          options: ['function', 'fun', 'def', 'define'],
          correctIndex: 2,
          explanation: 'Functions in Python are declared with the `def` keyword followed by the function name and parentheses.',
        },
        {
          id: 'py4-q2',
          question: 'What does a Python function return if it executes to completion without an explicit return statement?',
          options: ['0', 'False', '"" (empty string)', 'None'],
          correctIndex: 3,
          explanation: 'Functions without an explicit `return` automatically return the singleton object `None`.',
        },
        {
          id: 'py4-q3',
          question: 'In def calibrate(sensor, offset=0.0):, what is offset called?',
          options: ['A required positional argument', 'A default (keyword) parameter', 'A global constant', 'A pointer parameter'],
          correctIndex: 1,
          explanation: '`offset=0.0` defines a parameter with a default value, making it optional when invoking the function.',
        },
        {
          id: 'py4-q4',
          question: 'What does the LEGB rule describe in Python scoping?',
          options: [
            'List, Element, Global, Boolean order of operations',
            'Local, Enclosing, Global, Built-in scope lookup priority',
            'Linear Equation Gradient Balancing algorithm',
            'Loop Execution Guidance Boundary',
          ],
          correctIndex: 1,
          explanation: 'Python resolves variable names following the LEGB order: Local, Enclosing function locals, Global (module), and Built-in.',
        },
        {
          id: 'py4-q5',
          question: 'What does placing *args in a function parameter list accomplish?',
          options: [
            'Forces arguments to be passed as keyword-only pairs',
            'Packs any number of extra positional arguments into a tuple',
            'Multiplies all incoming numerical arguments',
            'Converts arguments directly into a dictionary',
          ],
          correctIndex: 1,
          explanation: '`*args` collects arbitrary additional positional arguments passed to the function into a tuple.',
        },
      ]),
    },
  });

  // Module 5 Quiz (5 questions)
  await prisma.assessment.create({
    data: {
      courseId: course7.id,
      moduleId: 'mod-py-5',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py5-q1',
          question: 'What is the output of the list comprehension [x * 2 for x in [1, 2, 3] if x > 1]?',
          options: ['[2, 4, 6]', '[4, 6]', '[2, 3]', '[4]'],
          correctIndex: 1,
          explanation: 'The filter `if x > 1` selects 2 and 3, and `x * 2` yields `[4, 6]`.',
        },
        {
          id: 'py5-q2',
          question: 'Which of the following statements about Python tuples is TRUE?',
          options: [
            'Tuples can be modified in-place using .append()',
            'Tuples are immutable sequences whose elements cannot be reassigned after creation',
            'Tuples cannot contain elements of different data types',
            'Tuples are defined exclusively using square brackets []',
          ],
          correctIndex: 1,
          explanation: 'Tuples are immutable; once created, items cannot be added, removed, or reassigned.',
        },
        {
          id: 'py5-q3',
          question: 'How can you retrieve the value of key "pressure" from dict station without throwing a KeyError if it is missing?',
          options: [
            'station["pressure"]',
            'station.fetch("pressure")',
            'station.get("pressure", None)',
            'station.find("pressure")',
          ],
          correctIndex: 2,
          explanation: 'The `.get(key, default)` method returns the value if the key exists, or the default value (or `None`) if missing.',
        },
        {
          id: 'py5-q4',
          question: 'Which built-in Python collection stores only unique, unordered elements?',
          options: ['list', 'tuple', 'set', 'dict_values'],
          correctIndex: 2,
          explanation: 'A `set` automatically deduplicates items and provides O(1) average lookup time for membership testing.',
        },
        {
          id: 'py5-q5',
          question: 'Given the list readings = [12, 24, 36, 48, 60], what is the result of readings[1:4]?',
          options: ['[12, 24, 36]', '[24, 36, 48]', '[24, 36, 48, 60]', '[36, 48]'],
          correctIndex: 1,
          explanation: 'Slicing `readings[1:4]` starts at index 1 (24) and stops before index 4 (48), producing `[24, 36, 48]`.',
        },
      ]),
    },
  });

  // Module 6 Quiz (5 questions)
  await prisma.assessment.create({
    data: {
      courseId: course7.id,
      moduleId: 'mod-py-6',
      passThreshold: 70,
      questions: JSON.stringify([
        {
          id: 'py6-q1',
          question: 'Why is using "with open(filepath, \'r\') as f:" the recommended way to open files in Python?',
          options: [
            'It accelerates disk read speeds by 50%',
            'It acts as a context manager that guarantees the file is closed automatically, even if exceptions occur',
            'It prevents the file from ever being modified',
            'It automatically parses CSV files into lists',
          ],
          correctIndex: 1,
          explanation: 'The `with` statement utilizes context management to ensure `f.close()` is executed reliably upon exiting the block.',
        },
        {
          id: 'py6-q2',
          question: 'Which file open mode appends new data to the end of a file without overwriting existing content?',
          options: ["'r'", "'w'", "'a'", "'x'"],
          correctIndex: 2,
          explanation: "Mode `'a'` (append) writes data to the end of the file, preserving any prior file contents.",
        },
        {
          id: 'py6-q3',
          question: 'In a Python class, what does the first parameter self represent in an instance method?',
          options: [
            'The class blueprint itself',
            'The specific instance of the class on which the method is called',
            'A global pointer to the Python runtime',
            'A keyword for static memory allocation',
          ],
          correctIndex: 1,
          explanation: '`self` represents the instance of the class, allowing access to instance attributes and methods.',
        },
        {
          id: 'py6-q4',
          question: 'What is the name of the constructor method in a Python class that initializes new object instances?',
          options: ['__construct__', '__new__', '__init__', '__start__'],
          correctIndex: 2,
          explanation: '`__init__` is the initialization method invoked automatically when a new instance of a class is created.',
        },
        {
          id: 'py6-q5',
          question: 'In a try...except...finally block, when does the finally block execute?',
          options: [
            'Only if an exception is successfully caught by an except block',
            'Only if NO exceptions occurred in the try block',
            'Always, regardless of whether an exception was raised or handled',
            'Never, unless explicitly invoked with finally()',
          ],
          correctIndex: 2,
          explanation: 'The `finally` clause always executes before exiting the `try` construct, making it ideal for cleanup actions.',
        },
      ]),
    },
  });

  // 6. Seed Realistic Enrollments, Completed Courses & Certificates for Analytics
  console.log('Seeding Enrollments, Attempts & Official Certificates...');

  // Learner 2 (Rajesh Kulkarni - Ocean Analyst) has completed Course 3 (Tsunami Warning)
  const enrollLearner2 = await prisma.enrollment.create({
    data: {
      userId: learner2.id,
      courseId: course3.id,
      status: 'completed',
      progressPercent: 100,
      completedModules: JSON.stringify(['mod3-1', 'mod3-2', 'mod3-3']),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  const certNumber2 = 'MOES-CC-2026-894210';
  await prisma.certificate.create({
    data: {
      userId: learner2.id,
      courseId: course3.id,
      certificateNumber: certNumber2,
      issuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      verificationHash: crypto.createHash('sha256').update(`${learner2.id}:${course3.id}:${certNumber2}`).digest('hex'),
      certificateUrl: `/certificates/${certNumber2}.pdf`,
    },
  });

  await prisma.assessmentAttempt.create({
    data: {
      userId: learner2.id,
      assessmentId: (await prisma.assessment.findFirst({ where: { courseId: course3.id } }))!.id,
      score: 100,
      passed: true,
      answers: JSON.stringify([0, 1]),
    },
  });

  // Learner 1 (Priya Sharma) has completed Course 6 (Geospatial Python) and is in progress on Course 1
  await prisma.enrollment.create({
    data: {
      userId: learner1.id,
      courseId: course6.id,
      status: 'completed',
      progressPercent: 100,
      completedModules: JSON.stringify(['mod6-1', 'mod6-2']),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const certNumber1 = 'MOES-CC-2026-319082';
  await prisma.certificate.create({
    data: {
      userId: learner1.id,
      courseId: course6.id,
      certificateNumber: certNumber1,
      issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      verificationHash: crypto.createHash('sha256').update(`${learner1.id}:${course6.id}:${certNumber1}`).digest('hex'),
      certificateUrl: `/certificates/${certNumber1}.pdf`,
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: learner1.id,
      courseId: course1.id,
      status: 'in_progress',
      progressPercent: 66,
      completedModules: JSON.stringify(['mod1-1', 'mod1-2']),
    },
  });

  // Learner 3 (Sneha Patel - Seismology) is in progress on Course 5
  await prisma.enrollment.create({
    data: {
      userId: learner3.id,
      courseId: course5.id,
      status: 'in_progress',
      progressPercent: 50,
      completedModules: JSON.stringify(['mod5-1']),
    },
  });

  // Learner 4 (Arun Verma) enrolled in Course 4
  await prisma.enrollment.create({
    data: {
      userId: learner4.id,
      courseId: course4.id,
      status: 'in_progress',
      progressPercent: 0,
      completedModules: JSON.stringify([]),
    },
  });

  // 7. Seed Discussion Forum Posts (Course & General)
  console.log('Seeding Knowledge Forum Posts & Threads...');
  const post1 = await prisma.forumPost.create({
    data: {
      title: 'Best practices for DWR calibration during pre-monsoon convective outbreaks',
      body: 'Hello colleagues, in our Chennai radar station we noticed anomalous ground clutter returns during high humidity nights. Has anyone tuned the clutter mitigation filter without losing low-level boundary layer convergence signals?',
      authorId: learner1.id,
      courseId: course1.id,
    },
  });

  await prisma.forumPost.create({
    data: {
      body: 'Excellent observation Priya. At IMD HQ we recommend applying the GMIC (Gaussian Model Adaptive Processing) clutter filter coupled with dual-pol RhoHV thresholding at 0.85.',
      authorId: trainerMet.id,
      courseId: course1.id,
      parentPostId: post1.id,
    },
  });

  const generalPost = await prisma.forumPost.create({
    data: {
      title: 'Open Data Initiative: Accessing INCOIS high-resolution ocean reanalysis (IRAS-5)',
      body: 'We have published sample Jupyter notebooks for accessing daily Sea Surface Salinity and Current velocities across the Exclusive Economic Zone. Feel free to use them in your research models.',
      authorId: trainerOcean.id,
      courseId: null, // General knowledge forum
    },
  });

  await prisma.forumPost.create({
    data: {
      body: 'Thank you Dr. Vikram! This will be immensely useful for our marine ecosystem trophic modeling at CMLRE.',
      authorId: learner4.id,
      courseId: null,
      parentPostId: generalPost.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('Default credentials for testing:');
  console.log('  Admin:   admin@capacityconnect.gov.in / Password@123');
  console.log('  Trainer: trainer.met@capacityconnect.gov.in / Password@123');
  console.log('  Trainer: trainer.ocean@capacityconnect.gov.in / Password@123');
  console.log('  Learner: learner1@capacityconnect.gov.in / Password@123');
  console.log('  Learner: learner2@capacityconnect.gov.in / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
