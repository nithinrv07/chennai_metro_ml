import { Language, CrowdLevel, JourneyOptionType, TelemetryDataSource } from '../types';

export interface TranslationDictionary {
  appTitle: string;
  tagline: string;
  heroQuestion: string;
  heroSubtitle: string;
  fromLabel: string;
  toLabel: string;
  departLabel: string;
  nowLabel: string;
  findJourneyBtn: string;
  swapTooltip: string;
  
  // Journey Options
  fastestTitle: string;
  fastestSubtitle: string;
  leastCrowdedTitle: string;
  leastCrowdedSubtitle: string;
  fewestTransfersTitle: string;
  fewestTransfersSubtitle: string;
  durationLabel: string;
  fareLabel: string;
  singaraFareLabel: string;
  transfersLabel: string;
  directTrain: string;
  transferRequired: string;
  recommendedTag: string;
  
  // Train Card
  approachingTrain: string;
  platformLabel: string;
  arrivingIn: string;
  boardNowBtn: string;
  whyThisRecBtn: string;
  hideRecBtn: string;
  coachAdvice: string;
  mlConfidence: string;
  
  // Data Transparency
  liveSource: string;
  predictedSource: string;
  demoSource: string;
  closedSource: string;
  lastUpdated: string;
  justNow: string;
  secondsAgo: string;
  refreshBtn: string;
  
  // Failure / Status States
  loadingTitle: string;
  loadingSubtitle: string;
  closedTitle: string;
  closedDesc: string;
  invalidStationTitle: string;
  invalidStationDesc: string;
  staleDataWarning: string;
  retryBtn: string;
  
  // Navigation Tabs
  navPlan: string;
  navMap: string;
  navMyTrip: string;
  navTrends: string;
  adminOps: string;

  // Accessibility & Crowd Labels
  crowdLowDesc: string;
  crowdModDesc: string;
  crowdHighDesc: string;
  crowdPackedDesc: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appTitle: 'Chennai Metro',
    tagline: 'Predictive Commuter Engine',
    heroQuestion: 'Which journey should I take?',
    heroSubtitle: 'Real-time ML recommendation comparing speed, coach comfort, and transfers across CMRL Blue & Green Lines.',
    fromLabel: 'From Station',
    toLabel: 'To Destination',
    departLabel: 'Departure',
    nowLabel: 'Leaving Now',
    findJourneyBtn: 'Find Best Journey',
    swapTooltip: 'Swap stations',

    fastestTitle: 'Fastest Route',
    fastestSubtitle: 'Minimum travel duration to destination',
    leastCrowdedTitle: 'Least Crowded',
    leastCrowdedSubtitle: 'Highest seating chance & low coach density',
    fewestTransfersTitle: 'Fewest Transfers',
    fewestTransfersSubtitle: 'Direct corridor with zero or minimum walking',
    durationLabel: 'Duration',
    fareLabel: 'Standard Token',
    singaraFareLabel: 'Singara NCMC (20% OFF)',
    transfersLabel: 'Transfers',
    directTrain: 'Direct (0 transfers)',
    transferRequired: '1 interchange at',
    recommendedTag: 'BEST MATCH',

    approachingTrain: 'Approaching Metro Train',
    platformLabel: 'Platform',
    arrivingIn: 'Arriving in',
    boardNowBtn: 'Board This Train',
    whyThisRecBtn: 'Why this recommendation?',
    hideRecBtn: 'Hide details',
    coachAdvice: 'Coach Staging Recommendation',
    mlConfidence: 'ML Confidence',

    liveSource: 'Live Telemetry',
    predictedSource: 'ML Predicted',
    demoSource: 'Fallback estimates',
    closedSource: 'Service Closed',
    lastUpdated: 'Updated',
    justNow: 'just now',
    secondsAgo: 's ago',
    refreshBtn: 'Refresh',

    loadingTitle: 'Calculating Optimal Journeys...',
    loadingSubtitle: 'Analyzing real-time coach loads, platform queues, and arrival headways',
    closedTitle: 'CMRL Metro Services Closed',
    closedDesc: 'Daily train operations run 05:00 AM - 11:00 PM. Night maintenance window is active.',
    invalidStationTitle: 'Station Not Found',
    invalidStationDesc: 'Please choose valid Chennai Metro stations from Blue or Green lines.',
    staleDataWarning: 'Showing cached schedule telemetry. Tap refresh for live stream.',
    retryBtn: 'Retry Connection',

    navPlan: 'Plan',
    navMap: 'Map',
    navMyTrip: 'My Trip',
    navTrends: 'Crowd Trends',
    adminOps: 'Admin ML Ops',

    crowdLowDesc: 'Low Crowd • Plenty of vacant seats',
    crowdModDesc: 'Moderate • Standee area open, some seats',
    crowdHighDesc: 'High Crowd • Standing only, rush hours',
    crowdPackedDesc: 'Packed • High wait time, consider next train',
  },
  ta: {
    appTitle: 'சென்னை மெட்ரோ',
    tagline: 'முன்கணிப்பு பயண வழிகாட்டி',
    heroQuestion: 'நான் எந்தப் பயணத்தைத் தேர்ந்தெடுக்க வேண்டும்?',
    heroSubtitle: 'வேகம், பெட்டி நெரிசல் மற்றும் ரயில் மாற்றங்களை ஒப்பிட்டு சிறந்த பயண பரிந்துரை.',
    fromLabel: 'புறப்படும் நிலையம்',
    toLabel: 'சேரும் இடம்',
    departLabel: 'புறப்படும் நேரம்',
    nowLabel: 'இப்போது புறப்பட',
    findJourneyBtn: 'சிறந்த பயணத்தை காண்க',
    swapTooltip: 'நிலையங்களை மாற்றுக',

    fastestTitle: 'விரைவான பயணம்',
    fastestSubtitle: 'குறைந்த பயண நேரம்',
    leastCrowdedTitle: 'குறைந்த நெரிசல்',
    leastCrowdedSubtitle: 'அமர அதிக வாய்ப்பு மற்றும் அமைதியான பெட்டி',
    fewestTransfersTitle: 'குறைந்த இடமாற்றம்',
    fewestTransfersSubtitle: 'நேரடி ரயில் மற்றும் நடைபயிற்சி குறைவு',
    durationLabel: 'கால அளவு',
    fareLabel: 'வழக்கமான கட்டணம்',
    singaraFareLabel: 'சிங்கார கார்டு (20% தள்ளுபடி)',
    transfersLabel: 'இடமாற்றம்',
    directTrain: 'நேரடி ரயில் (0 மாற்றம்)',
    transferRequired: '1 இடமாற்றம்:',
    recommendedTag: 'சிறந்த தேர்வு',

    approachingTrain: 'அடுத்து வரும் மெட்ரோ ரயில்',
    platformLabel: 'தளம்',
    arrivingIn: 'வருகிறது இன்னும்',
    boardNowBtn: 'இந்த ரயிலில் ஏறுக',
    whyThisRecBtn: 'இந்த பரிந்துரை ஏன்?',
    hideRecBtn: 'விவரங்களை மறை',
    coachAdvice: 'பெட்டி பரிந்துரை',
    mlConfidence: 'AI கணிப்பு உறுதி',

    liveSource: 'நேரலை தகவல்',
    predictedSource: 'AI கணிக்கப்பட்டது',
    demoSource: 'மாதிரி தகவல்',
    closedSource: 'சேவை நிறுத்தம்',
    lastUpdated: 'புதுப்பிக்கப்பட்டது',
    justNow: 'இப்போது',
    secondsAgo: 'விநாடிகளுக்கு முன்',
    refreshBtn: 'புதுப்பி',

    loadingTitle: 'சிறந்த பயணத்தை கணக்கிடுகிறது...',
    loadingSubtitle: 'பெட்டி நெரிசல் மற்றும் ரயில் நேரங்களை ஆய்வு செய்கிறது',
    closedTitle: 'சென்னை மெட்ரோ சேவை தற்போது இயங்கவில்லை',
    closedDesc: 'மெட்ரோ ரயில்கள் காலை 5:00 முதல் இரவு 11:00 மணி வரை மட்டுமே இயங்கும்.',
    invalidStationTitle: 'நிலையம் கிடைக்கவில்லை',
    invalidStationDesc: 'நீலம் அல்லது பச்சை வழித்தடத்தில் உள்ள சரியான நிலையத்தை தேர்வு செய்யவும்.',
    staleDataWarning: 'பழைய தகவல் காட்டப்படுகிறது. நேரலைக்கு புதுப்பிக்கவும்.',
    retryBtn: 'மீண்டும் முயல்க',

    navPlan: 'திட்டமிடு',
    navMap: 'வரைபடம்',
    navMyTrip: 'எனது பயணம்',
    navTrends: 'நெரிசல் போக்கு',
    adminOps: 'நிர்வாக AI கட்டுப்பாட்டகம்',

    crowdLowDesc: 'குறைந்த நெரிசல் • பல காலி இருக்கைகள் உண்டு',
    crowdModDesc: 'நடுத்தர நெரிசல் • நிற்க இடம் உண்டு, சில இருக்கைகள்',
    crowdHighDesc: 'அதிக நெரிசல் • நிற்க மட்டுமே முடியும், அவசர நேரம்',
    crowdPackedDesc: 'கடும் நெரிசல் • அடுத்த ரயிலுக்காக காத்திருக்கலாம்',
  },
};

export function getCrowdAccessibleLabel(level: CrowdLevel, lang: Language = 'en'): string {
  const t = translations[lang];
  switch (level) {
    case 'Low':
      return t.crowdLowDesc;
    case 'Moderate':
      return t.crowdModDesc;
    case 'High':
      return t.crowdHighDesc;
    case 'Very High':
    case 'Overflowing':
      return t.crowdPackedDesc;
    default:
      return level;
  }
}
