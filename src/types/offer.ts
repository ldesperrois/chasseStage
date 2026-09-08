export type JobDomain = 
  | 'embedded' 
  | 'software' 
  | 'robotics' 
  | 'iot' 
  | 'firmware' 
  | 'fpga';

export type OrganizationType = 'company' | 'university' | 'research_lab';

export type ApplicationStatus = 
  | 'liked' 
  | 'to_apply' 
  | 'applied' 
  | 'interview' 
  | 'rejected' 
  | 'offer';

export interface InternshipOffer {
  id: string;
  title: string;
  company: string; // Entreprise ou Université
  organizationType: OrganizationType; // 'company' | 'university' | 'research_lab'
  labName?: string; // Nom du laboratoire de recherche
  companyLogo?: string;
  companyColor?: string;
  location: string;
  city: string;
  country: string;
  countryCode: string; // 'GB' | 'IE' | 'US' | 'CA' | 'NL' | 'DE' | 'SE' | 'AU' etc.
  countryFlag: string;
  region?: string;
  isAnglophone: boolean;
  domain: JobDomain;
  domainLabel: string;
  startDate: string; // e.g., "Mai 2026"
  endDate: string;   // e.g., "Fin Août 2026"
  durationWeeks: number;
  isEnstaCompliant: boolean; // >= 10 weeks
  salary: string;
  tags: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
  applyUrl: string;
  source: string;
  postedAt: string;
  enstaFit: {
    score: number; // 0 to 100
    badge: string; // e.g. "Recommandé ENSTA FIPA", "Top Fit Embarqué"
    reason: string;
  };
}

export interface MatchedOffer {
  offer: InternshipOffer;
  status: ApplicationStatus;
  savedAt: string;
  notes?: string;
  rating?: number; // 1 to 5 stars
}

export interface FilterState {
  countries: string[];
  domains: JobDomain[];
  organizationTypes: OrganizationType[];
  minWeeks: number;
  searchQuery: string;
  enstaOnly: boolean;
  minSalaryOnly: boolean;
  excludeUSA?: boolean;
}

