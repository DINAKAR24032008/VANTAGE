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
      assessmentId: (await prisma.assessment.findUnique({ where: { courseId: course3.id } }))!.id,
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
