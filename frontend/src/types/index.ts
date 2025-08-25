// User and Authentication Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Form Data Types
export interface Country {
  id: string;
  name: string;
  hasStates?: boolean;
  hasProvinces?: boolean;
}

export interface State {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  hasTeams?: boolean;
}

export interface Team {
  id: string;
  name: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface JobTitle {
  id: string;
  name: string;
  department: string;
  level: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

// Form Types
export interface BasicFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  comments?: string;
}

export interface ComplexFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  employment: {
    department: string;
    team: string;
    jobTitle: string;
    startDate: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  };
  skills: string[];
  preferences: {
    workLocation: 'remote' | 'office' | 'hybrid';
    travelWillingness: boolean;
    relocationWillingness: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

// Multi-page Form Types
export interface MultiPageSession {
  id: string;
  userId: number;
  pages: Record<string, any>;
  currentPage: number;
  startedAt: string;
  lastUpdated?: string;
  submitted?: boolean;
  submittedAt?: string;
}

// Select Option Types for react-select
export interface SelectOption {
  value: string;
  label: string;
  meta?: string;
}

export interface GroupedOption {
  label: string;
  options: SelectOption[];
}

// Component Props Types
export interface DropdownProps {
  label: string;
  name: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: SelectOption[];
  isMulti?: boolean;
  isSearchable?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}
