require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Lightweight request logging for diagnostics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    try {
      const ms = Date.now() - start;
      const userId = (req.user && req.user.id) || 'anon';
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} status=${res.statusCode} user=${userId} ${ms}ms`);
    } catch {}
  });
  next();
});

// Rate limiting (disabled for form-data endpoints to avoid 429s during dropdown priming/tests)
const RATE_LIMIT_ENABLED = String(process.env.RATE_LIMIT_ENABLED || 'false').toLowerCase() === 'true';
if (RATE_LIMIT_ENABLED) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  // Apply only to auth and form submission flows; do NOT apply to /api/form-data/**
  app.use('/api/auth', limiter);
  app.use('/api/forms', limiter);
}

// In-memory storage (replace with database in production)
const users = [];
const sessions = new Map();
// Submitted forms persisted to disk
let submissions = [];

// Add a demo user for testing
(async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  users.push({
    id: 1,
    email: 'demo@example.com',
    password: hashedPassword,
    firstName: 'Demo',
    lastName: 'User',
    createdAt: new Date().toISOString()
  });
})();

// Mock data for forms
const mockFormData = {
  countries: [],
  states: {
    US: [],
    CA: [
      { id: 'ON', name: 'Ontario' },
      { id: 'QC', name: 'Quebec' },
      { id: 'BC', name: 'British Columbia' },
      { id: 'AB', name: 'Alberta' },
      { id: 'MB', name: 'Manitoba' },
      { id: 'SK', name: 'Saskatchewan' }
    ],
    AU: [
      { id: 'NSW', name: 'New South Wales' },
      { id: 'VIC', name: 'Victoria' },
      { id: 'QLD', name: 'Queensland' },
      { id: 'WA', name: 'Western Australia' },
      { id: 'SA', name: 'South Australia' },
      { id: 'TAS', name: 'Tasmania' }
    ]
  },
  departments: [
    { id: 'eng', name: 'Engineering', hasTeams: true },
    { id: 'sales', name: 'Sales', hasTeams: true },
    { id: 'marketing', name: 'Marketing', hasTeams: true },
    { id: 'hr', name: 'Human Resources' },
    { id: 'finance', name: 'Finance' },
    { id: 'ops', name: 'Operations', hasTeams: true },
    { id: 'legal', name: 'Legal' },
    { id: 'product', name: 'Product', hasTeams: true }
  ],
  teams: {
    eng: [
      { id: 'frontend', name: 'Frontend Development' },
      { id: 'backend', name: 'Backend Development' },
      { id: 'devops', name: 'DevOps' },
      { id: 'qa', name: 'Quality Assurance' },
      { id: 'security', name: 'Security' }
    ],
    sales: [
      { id: 'enterprise', name: 'Enterprise Sales' },
      { id: 'smb', name: 'SMB Sales' },
      { id: 'channel', name: 'Channel Partners' }
    ],
    marketing: [
      { id: 'content', name: 'Content Marketing' },
      { id: 'demand', name: 'Demand Generation' },
      { id: 'brand', name: 'Brand Marketing' },
      { id: 'product-marketing', name: 'Product Marketing' }
    ],
    ops: [
      { id: 'it', name: 'IT Operations' },
      { id: 'facilities', name: 'Facilities' },
      { id: 'procurement', name: 'Procurement' }
    ],
    product: [
      { id: 'design', name: 'Product Design' },
      { id: 'research', name: 'User Research' },
      { id: 'analytics', name: 'Product Analytics' }
    ]
  },
  skills: [
    { id: 'js', name: 'JavaScript', category: 'Programming' },
    { id: 'python', name: 'Python', category: 'Programming' },
    { id: 'java', name: 'Java', category: 'Programming' },
    { id: 'react', name: 'React', category: 'Framework' },
    { id: 'angular', name: 'Angular', category: 'Framework' },
    { id: 'vue', name: 'Vue.js', category: 'Framework' },
    { id: 'node', name: 'Node.js', category: 'Runtime' },
    { id: 'docker', name: 'Docker', category: 'DevOps' },
    { id: 'k8s', name: 'Kubernetes', category: 'DevOps' },
    { id: 'aws', name: 'AWS', category: 'Cloud' },
    { id: 'azure', name: 'Azure', category: 'Cloud' },
    { id: 'gcp', name: 'Google Cloud', category: 'Cloud' }
  ],
  jobTitles: []
};

// Always initialize countries and US states
try {
  const { getData } = require('country-list');
  const countriesData = getData();
  mockFormData.countries = countriesData
    .map(c => ({ 
      id: c.code, 
      name: c.name, 
      hasStates: ['US', 'CA', 'AU'].includes(c.code) 
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
} catch (e) {
  mockFormData.countries = [
    { id: 'US', name: 'United States', hasStates: true },
    { id: 'CA', name: 'Canada', hasStates: true },
    { id: 'UK', name: 'United Kingdom' },
    { id: 'DE', name: 'Germany' },
    { id: 'FR', name: 'France' },
  ];
}

mockFormData.states.US = [
  { id: 'AL', name: 'Alabama' },
  { id: 'AK', name: 'Alaska' },
  { id: 'AZ', name: 'Arizona' },
  { id: 'AR', name: 'Arkansas' },
  { id: 'CA', name: 'California' },
  { id: 'CO', name: 'Colorado' },
  { id: 'CT', name: 'Connecticut' },
  { id: 'DE', name: 'Delaware' },
  { id: 'FL', name: 'Florida' },
  { id: 'GA', name: 'Georgia' },
  { id: 'HI', name: 'Hawaii' },
  { id: 'ID', name: 'Idaho' },
  { id: 'IL', name: 'Illinois' },
  { id: 'IN', name: 'Indiana' },
  { id: 'IA', name: 'Iowa' },
  { id: 'KS', name: 'Kansas' },
  { id: 'KY', name: 'Kentucky' },
  { id: 'LA', name: 'Louisiana' },
  { id: 'ME', name: 'Maine' },
  { id: 'MD', name: 'Maryland' },
  { id: 'MA', name: 'Massachusetts' },
  { id: 'MI', name: 'Michigan' },
  { id: 'MN', name: 'Minnesota' },
  { id: 'MS', name: 'Mississippi' },
  { id: 'MO', name: 'Missouri' },
  { id: 'MT', name: 'Montana' },
  { id: 'NE', name: 'Nebraska' },
  { id: 'NV', name: 'Nevada' },
  { id: 'NH', name: 'New Hampshire' },
  { id: 'NJ', name: 'New Jersey' },
  { id: 'NM', name: 'New Mexico' },
  { id: 'NY', name: 'New York' },
  { id: 'NC', name: 'North Carolina' },
  { id: 'ND', name: 'North Dakota' },
  { id: 'OH', name: 'Ohio' },
  { id: 'OK', name: 'Oklahoma' },
  { id: 'OR', name: 'Oregon' },
  { id: 'PA', name: 'Pennsylvania' },
  { id: 'RI', name: 'Rhode Island' },
  { id: 'SC', name: 'South Carolina' },
  { id: 'SD', name: 'South Dakota' },
  { id: 'TN', name: 'Tennessee' },
  { id: 'TX', name: 'Texas' },
  { id: 'UT', name: 'Utah' },
  { id: 'VT', name: 'Vermont' },
  { id: 'VA', name: 'Virginia' },
  { id: 'WA', name: 'Washington' },
  { id: 'WV', name: 'West Virginia' },
  { id: 'WI', name: 'Wisconsin' },
  { id: 'WY', name: 'Wyoming' },
];

// Generate large datasets (guarded to avoid duplication on hot-reload)
if (!mockFormData._initialized) {
  // Countries: use ISO-3166 list from country-list package for completeness
  try {
    const { getData } = require('country-list');
    const countriesData = getData(); // [{code:'AF', name:'Afghanistan'}, ...]
    mockFormData.countries = countriesData
      .map(c => ({ id: c.code, name: c.name, hasStates: c.code === 'US' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    // Fallback minimal set if dependency missing
    mockFormData.countries = [
      { id: 'US', name: 'United States', hasStates: true },
      { id: 'CA', name: 'Canada' },
      { id: 'UK', name: 'United Kingdom' },
      { id: 'DE', name: 'Germany' },
      { id: 'FR', name: 'France' }
    ];
  }

  // US states full list (50)
  mockFormData.states.US = [
    { id: 'AL', name: 'Alabama' },
    { id: 'AK', name: 'Alaska' },
    { id: 'AZ', name: 'Arizona' },
    { id: 'AR', name: 'Arkansas' },
    { id: 'CA', name: 'California' },
    { id: 'CO', name: 'Colorado' },
    { id: 'CT', name: 'Connecticut' },
    { id: 'DE', name: 'Delaware' },
    { id: 'FL', name: 'Florida' },
    { id: 'GA', name: 'Georgia' },
    { id: 'HI', name: 'Hawaii' },
    { id: 'ID', name: 'Idaho' },
    { id: 'IL', name: 'Illinois' },
    { id: 'IN', name: 'Indiana' },
    { id: 'IA', name: 'Iowa' },
    { id: 'KS', name: 'Kansas' },
    { id: 'KY', name: 'Kentucky' },
    { id: 'LA', name: 'Louisiana' },
    { id: 'ME', name: 'Maine' },
    { id: 'MD', name: 'Maryland' },
    { id: 'MA', name: 'Massachusetts' },
    { id: 'MI', name: 'Michigan' },
    { id: 'MN', name: 'Minnesota' },
    { id: 'MS', name: 'Mississippi' },
    { id: 'MO', name: 'Missouri' },
    { id: 'MT', name: 'Montana' },
    { id: 'NE', name: 'Nebraska' },
    { id: 'NV', name: 'Nevada' },
    { id: 'NH', name: 'New Hampshire' },
    { id: 'NJ', name: 'New Jersey' },
    { id: 'NM', name: 'New Mexico' },
    { id: 'NY', name: 'New York' },
    { id: 'NC', name: 'North Carolina' },
    { id: 'ND', name: 'North Dakota' },
    { id: 'OH', name: 'Ohio' },
    { id: 'OK', name: 'Oklahoma' },
    { id: 'OR', name: 'Oregon' },
    { id: 'PA', name: 'Pennsylvania' },
    { id: 'RI', name: 'Rhode Island' },
    { id: 'SC', name: 'South Carolina' },
    { id: 'SD', name: 'South Dakota' },
    { id: 'TN', name: 'Tennessee' },
    { id: 'TX', name: 'Texas' },
    { id: 'UT', name: 'Utah' },
    { id: 'VT', name: 'Vermont' },
    { id: 'VA', name: 'Virginia' },
    { id: 'WA', name: 'Washington' },
    { id: 'WV', name: 'West Virginia' },
    { id: 'WI', name: 'Wisconsin' },
    { id: 'WY', name: 'Wyoming' },
  ];
  // Job titles (500)
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const levels = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];
  const jobTitles = Array.from({ length: 500 }, (_, idx) => {
    const i = idx + 1;
    return {
      id: `job-${i}`,
      name: `Job Title ${i}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
    };
  });
  mockFormData.jobTitles = jobTitles;

  // Skills (1000 mixed)
  const baseSkills = mockFormData.skills.slice();
  const skillCategories = ['Programming', 'Framework', 'DevOps', 'Cloud', 'Data', 'Security', 'Testing'];
  const generatedSkills = Array.from({ length: 1000 }, (_, idx) => {
    const i = idx + 1;
    return {
      id: `skill-${i}`,
      name: `Skill ${i}`,
      category: skillCategories[i % skillCategories.length],
    };
  });
  mockFormData.skills = [...baseSkills, ...generatedSkills];

  Object.defineProperty(mockFormData, '_initialized', {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn(`[${new Date().toISOString()}] AUTH missing token for ${req.method} ${req.originalUrl}`);
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.warn(`[${new Date().toISOString()}] AUTH invalid token for ${req.method} ${req.originalUrl}: ${err && err.message}`);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      createdAt: new Date().toISOString()
    };

    users.push(user);

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Form data endpoints
// Countries and states served from JSON files in ./data
const dataDir = path.join(__dirname, 'data');
const statesDir = path.join(dataDir, 'states');
let countriesCache = [];
// Submissions persistence
const submissionsFile = path.join(dataDir, 'submissions.json');
const ensureDataDir = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (e) {
    console.error('Failed to ensure data directory:', e.message);
  }
};
const loadSubmissionsFromFile = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(submissionsFile)) {
      fs.writeFileSync(submissionsFile, JSON.stringify([], null, 2), 'utf8');
      submissions = [];
      return;
    }
    const raw = fs.readFileSync(submissionsFile, 'utf8');
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      submissions = list;
    } else {
      submissions = [];
    }
  } catch (e) {
    console.error('Failed to load submissions:', e.message);
    submissions = [];
  }
};
const persistSubmissionsToFile = () => {
  try {
    ensureDataDir();
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to persist submissions:', e.message);
  }
};
// initialize submissions on startup
loadSubmissionsFromFile();
const loadCountriesFromFile = () => {
  try {
    const filePath = path.join(dataDir, 'countries.json');
    if (!fs.existsSync(filePath)) {
      // Generate from country-list and write to file
      try {
        const { getData } = require('country-list');
        const list = getData().map(c => ({ id: c.code, name: c.name }));
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
      } catch (e) {
        console.error('Failed to generate countries.json from country-list:', e.message);
      }
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const list = JSON.parse(raw);
    countriesCache = list
      .map((c) => ({
        id: c.id,
        name: c.name,
        hasStates: fs.existsSync(path.join(statesDir, `${c.id}.json`))
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error('Failed to load countries.json:', e.message);
    countriesCache = [];
  }
};
if (fs.existsSync(path.join(dataDir, 'countries.json'))) {
  loadCountriesFromFile();
}

app.get('/api/form-data/countries', (req, res) => {
  if (!countriesCache.length) {
    loadCountriesFromFile();
  }
  setTimeout(() => res.json(countriesCache), 200);
});

app.get('/api/form-data/states/:countryId', (req, res) => {
  const { countryId } = req.params;
  const filePath = path.join(statesDir, `${countryId}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const list = JSON.parse(raw);
      setTimeout(() => res.json(list), 300);
    } else {
      setTimeout(() => res.json([]), 300);
    }
  } catch (e) {
    console.error('Failed to load states for', countryId, e.message);
    setTimeout(() => res.json([]), 300);
  }
});

app.get('/api/form-data/departments', (req, res) => {
  setTimeout(() => {
    res.json(mockFormData.departments);
  }, 400);
});

app.get('/api/form-data/teams/:departmentId', (req, res) => {
  const { departmentId } = req.params;
  setTimeout(() => {
    res.json(mockFormData.teams[departmentId] || []);
  }, 600);
});

app.get('/api/form-data/skills', (req, res) => {
  const { search = '', category = '', limit = 20, offset = 0 } = req.query;
  
  let filtered = mockFormData.skills;
  
  if (search) {
    filtered = filtered.filter(skill => 
      skill.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (category) {
    filtered = filtered.filter(skill => skill.category === category);
  }
  
  const total = filtered.length;
  const items = filtered.slice(Number(offset), Number(offset) + Number(limit));
  
  setTimeout(() => {
    res.json({
      items,
      total,
      hasMore: Number(offset) + Number(limit) < total
    });
  }, 700);
});

// Progressive loading endpoint for job titles
app.get('/api/form-data/job-titles', (req, res) => {
  const { search = '', limit = 50, offset = 0 } = req.query;
  
  let filtered = mockFormData.jobTitles;
  
  if (search) {
    filtered = filtered.filter(job => 
      job.name.toLowerCase().includes(search.toLowerCase()) ||
      job.department.toLowerCase().includes(search.toLowerCase()) ||
      job.level.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const total = filtered.length;
  const items = filtered.slice(Number(offset), Number(offset) + Number(limit));
  
  setTimeout(() => {
    res.json({
      items,
      total,
      hasMore: Number(offset) + Number(limit) < total
    });
  }, 800);
});

// Hierarchical data (for AJAX lazy loading)
const hierarchies = {
  categories: {
    root: [
      { id: 'technology', label: 'Technology', hasChildren: true },
      { id: 'design', label: 'Design', hasChildren: true },
    ],
    byParent: {
      technology: [
        { id: 'frontend', label: 'Frontend Development', parentId: 'technology', hasChildren: true },
        { id: 'backend', label: 'Backend Development', parentId: 'technology', hasChildren: true },
        { id: 'mobile', label: 'Mobile Development', parentId: 'technology', hasChildren: true },
      ],
      frontend: [
        { id: 'react', label: 'React', parentId: 'frontend', hasChildren: false },
        { id: 'angular', label: 'Angular', parentId: 'frontend', hasChildren: false },
        { id: 'vue', label: 'Vue.js', parentId: 'frontend', hasChildren: false },
      ],
      backend: [
        { id: 'node', label: 'Node.js', parentId: 'backend', hasChildren: false },
        { id: 'python', label: 'Python', parentId: 'backend', hasChildren: false },
        { id: 'java', label: 'Java', parentId: 'backend', hasChildren: false },
      ],
      mobile: [
        { id: 'ios', label: 'iOS', parentId: 'mobile', hasChildren: false },
        { id: 'android', label: 'Android', parentId: 'mobile', hasChildren: false },
        { id: 'react-native', label: 'React Native', parentId: 'mobile', hasChildren: false },
      ],
      design: [
        { id: 'ui-design', label: 'UI Design', parentId: 'design', hasChildren: true },
        { id: 'ux-design', label: 'UX Design', parentId: 'design', hasChildren: true },
      ],
      'ui-design': [
        { id: 'web-design', label: 'Web Design', parentId: 'ui-design', hasChildren: false },
        { id: 'mobile-design', label: 'Mobile Design', parentId: 'ui-design', hasChildren: false },
      ],
      'ux-design': [
        { id: 'user-research', label: 'User Research', parentId: 'ux-design', hasChildren: false },
        { id: 'prototyping', label: 'Prototyping', parentId: 'ux-design', hasChildren: false },
      ],
    },
  },
  skillsTree: {
    root: [
      { id: 'programming', label: 'Programming Languages', hasChildren: true },
      { id: 'frameworks', label: 'Frameworks & Libraries', hasChildren: true },
    ],
    byParent: {
      programming: [
        { id: 'javascript', label: 'JavaScript', parentId: 'programming', hasChildren: false },
        { id: 'typescript', label: 'TypeScript', parentId: 'programming', hasChildren: false },
        { id: 'python', label: 'Python', parentId: 'programming', hasChildren: false },
        { id: 'java', label: 'Java', parentId: 'programming', hasChildren: false },
        { id: 'csharp', label: 'C#', parentId: 'programming', hasChildren: false },
      ],
      frameworks: [
        { id: 'js-frameworks', label: 'JavaScript Frameworks', parentId: 'frameworks', hasChildren: true },
        { id: 'backend-frameworks', label: 'Backend Frameworks', parentId: 'frameworks', hasChildren: true },
      ],
      'js-frameworks': [
        { id: 'react-framework', label: 'React', parentId: 'js-frameworks', hasChildren: false },
        { id: 'angular-framework', label: 'Angular', parentId: 'js-frameworks', hasChildren: false },
        { id: 'vue-framework', label: 'Vue.js', parentId: 'js-frameworks', hasChildren: false },
      ],
      'backend-frameworks': [
        { id: 'express', label: 'Express.js', parentId: 'backend-frameworks', hasChildren: false },
        { id: 'django', label: 'Django', parentId: 'backend-frameworks', hasChildren: false },
        { id: 'spring', label: 'Spring', parentId: 'backend-frameworks', hasChildren: false },
      ],
    },
  },
  locations: {
    root: [
      { id: 'north-america', label: 'North America', hasChildren: true },
      { id: 'europe', label: 'Europe', hasChildren: true },
    ],
    byParent: {
      'north-america': [
        { id: 'usa', label: 'United States', parentId: 'north-america', hasChildren: true },
        { id: 'canada', label: 'Canada', parentId: 'north-america', hasChildren: true },
      ],
      usa: [
        { id: 'california', label: 'California', parentId: 'usa', hasChildren: true },
        { id: 'new-york', label: 'New York', parentId: 'usa', hasChildren: true },
      ],
      california: [
        { id: 'san-francisco', label: 'San Francisco', parentId: 'california', hasChildren: false },
        { id: 'los-angeles', label: 'Los Angeles', parentId: 'california', hasChildren: false },
        { id: 'san-diego', label: 'San Diego', parentId: 'california', hasChildren: false },
      ],
      'new-york': [
        { id: 'nyc', label: 'New York City', parentId: 'new-york', hasChildren: false },
        { id: 'buffalo', label: 'Buffalo', parentId: 'new-york', hasChildren: false },
      ],
      canada: [
        { id: 'ontario', label: 'Ontario', parentId: 'canada', hasChildren: true },
      ],
      ontario: [
        { id: 'toronto', label: 'Toronto', parentId: 'ontario', hasChildren: false },
        { id: 'ottawa', label: 'Ottawa', parentId: 'ontario', hasChildren: false },
      ],
      europe: [
        { id: 'uk', label: 'United Kingdom', parentId: 'europe', hasChildren: true },
        { id: 'germany', label: 'Germany', parentId: 'europe', hasChildren: true },
      ],
      uk: [
        { id: 'london', label: 'London', parentId: 'uk', hasChildren: false },
        { id: 'manchester', label: 'Manchester', parentId: 'uk', hasChildren: false },
      ],
      germany: [
        { id: 'berlin', label: 'Berlin', parentId: 'germany', hasChildren: false },
        { id: 'munich', label: 'Munich', parentId: 'germany', hasChildren: false },
      ],
    },
  },
};

// Hierarchical loader endpoint
app.get('/api/form-data/hierarchy/:tree', (req, res) => {
  const { tree } = req.params;
  // Query parameter name is case-sensitive; only 'parentId' is accepted. Value is resolved case-insensitively below.
  const { parentId, search = '' } = req.query;
  const dataset = hierarchies[tree];
  if (!dataset) {
    return res.status(404).json({ error: 'Unknown hierarchy' });
  }

  // Resolve parentId value case-insensitively (accept TEchnology, teCHnology, etc.)
  const resolveParent = (ds, raw) => {
    if (!raw || String(raw).trim() === '') return null;
    const rawStr = String(raw);
    const rawLc = rawStr.toLowerCase();
    // Prefer lowercase id direct hit
    if (ds.byParent[rawLc]) return rawLc;
    // Exact id match (unlikely if mixed case)
    if (ds.byParent[rawStr]) return rawStr;
    // Case-insensitive id match across keys
    const keyCi = Object.keys(ds.byParent).find(k => k.toLowerCase() === rawLc);
    if (keyCi) return keyCi;
    // Build label→id index once per dataset and match labels case-insensitively
    if (!ds._labelToId) {
      const idx = {};
      try { (ds.root || []).forEach(n => { if (n && n.label) idx[String(n.label).toLowerCase()] = n.id; }); } catch {}
      try {
        const byP = ds.byParent || {};
        Object.keys(byP).forEach(pid => {
          try { (byP[pid] || []).forEach(n => { if (n && n.label) idx[String(n.label).toLowerCase()] = n.id; }); } catch {}
        });
      } catch {}
      ds._labelToId = idx;
    }
    const idFromLabel = ds._labelToId[rawLc];
    if (idFromLabel) return idFromLabel;
    return null;
  };

  let nodes = [];
  if (!parentId) {
    nodes = dataset.root;
  } else {
    const rawStr = String(parentId);
    const rawLc = rawStr.toLowerCase();
    const resolved = resolveParent(dataset, rawStr);
    const candidates = [];
    if (resolved) candidates.push(resolved);
    candidates.push(rawStr);
    candidates.push(rawLc);
    try {
      if (dataset._labelToId && dataset._labelToId[rawLc]) {
        candidates.push(dataset._labelToId[rawLc]);
      }
    } catch {}
    const key = candidates.find(k => Array.isArray(dataset.byParent[k]) && dataset.byParent[k].length) || (resolved || rawLc);
    nodes = dataset.byParent[key] || [];
  }

  const filtered = String(search)
    ? nodes.filter(n => n.label.toLowerCase().includes(String(search).toLowerCase()))
    : nodes;

  // Simulate network delay
  setTimeout(() => {
    res.json(filtered);
  }, 400);
});

// Form submission endpoints
app.post('/api/forms/basic', authenticateToken, (req, res) => {
  const formId = Date.now().toString();
  const submission = {
    id: formId,
    userId: req.user.id,
    formKind: 'basic',
    type: (req.body && (req.body.formType || req.body.type)) || 'basic',
    data: req.body,
    submittedAt: new Date().toISOString()
  };

  sessions.set(formId, submission);
  submissions.push(submission);
  persistSubmissionsToFile();

  res.json({
    success: true,
    submissionId: formId,
    message: 'Form submitted successfully'
  });
});

app.post('/api/forms/complex', authenticateToken, (req, res) => {
  const formId = Date.now().toString();
  const submission = {
    id: formId,
    userId: req.user.id,
    formKind: 'complex',
    type: (req.body && req.body.type) || 'complex',
    data: req.body,
    submittedAt: new Date().toISOString()
  };

  sessions.set(formId, submission);
  submissions.push(submission);
  persistSubmissionsToFile();

  res.json({
    success: true,
    submissionId: formId,
    message: 'Complex form submitted successfully'
  });
});

// Multi-page form endpoints
app.post('/api/forms/multipage/start', authenticateToken, (req, res) => {
  const sessionId = Date.now().toString();
  const session = {
    id: sessionId,
    userId: req.user.id,
    pages: {},
    currentPage: 1,
    startedAt: new Date().toISOString()
  };
  
  sessions.set(sessionId, session);
  
  res.json({
    sessionId,
    currentPage: 1
  });
});

app.post('/api/forms/multipage/:sessionId/page/:pageNumber', authenticateToken, (req, res) => {
  const { sessionId, pageNumber } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session || session.userId !== req.user.id) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.pages[pageNumber] = req.body;
  session.currentPage = parseInt(pageNumber);
  session.lastUpdated = new Date().toISOString();
  
  res.json({
    success: true,
    sessionId,
    currentPage: session.currentPage
  });
});

app.get('/api/forms/multipage/:sessionId', authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session || session.userId !== req.user.id) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session);
});

app.post('/api/forms/multipage/:sessionId/submit', authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session || session.userId !== req.user.id) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.submitted = true;
  session.submittedAt = new Date().toISOString();
  // Persist final submission with all pages
  const submission = {
    id: sessionId,
    userId: req.user.id,
    formKind: 'multipage',
    type: 'multipage',
    data: { pages: session.pages, currentPage: session.currentPage },
    submittedAt: session.submittedAt,
  };
  submissions.push(submission);
  persistSubmissionsToFile();

  res.json({
    success: true,
    submissionId: sessionId,
    message: 'Multi-page form submitted successfully'
  });
});

// Submitted forms list & detail endpoints
app.get('/api/forms/submissions', authenticateToken, (req, res) => {
  try {
    // Ensure we reflect latest persisted state
    loadSubmissionsFromFile();
    const userId = req.user.id;
    const { type, kind, from, to, q } = req.query;

    const fromDate = from ? new Date(String(from).length === 10 ? `${from}T00:00:00.000Z` : String(from)) : null;
    const toDate = to ? new Date(String(to).length === 10 ? `${to}T23:59:59.999Z` : String(to)) : null;
    const qLc = q ? String(q).toLowerCase() : '';
    const typeLc = type ? String(type).toLowerCase() : '';
    const kindLc = kind ? String(kind).toLowerCase() : '';

    const list = submissions
      .filter(s => s && s.userId === userId)
      .filter(s => {
        if (typeLc && String(s.type || '').toLowerCase() !== typeLc) return false;
        if (kindLc && String(s.formKind || '').toLowerCase() !== kindLc) return false;
        if (fromDate) {
          const t = new Date(s.submittedAt).getTime();
          if (Number.isFinite(fromDate.getTime()) && t < fromDate.getTime()) return false;
        }
        if (toDate) {
          const t = new Date(s.submittedAt).getTime();
          if (Number.isFinite(toDate.getTime()) && t > toDate.getTime()) return false;
        }
        if (qLc) {
          try {
            const hay = JSON.stringify(s.data || {}).toLowerCase();
            if (!hay.includes(qLc)) return false;
          } catch {}
        }
        return true;
      })
      .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load submissions' });
  }
});

app.get('/api/forms/submissions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  // Ensure we reflect latest persisted state
  loadSubmissionsFromFile();
  const s = submissions.find(x => x && x.id === id);
  if (!s) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  if (s.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(s);
});

// Workday-style endpoints (no URL parameters, using POST body)
app.post('/api/form-data/workday/countries', (req, res) => {
  // Simulate network delay like real Workday
  // Return data quickly - GoApply should handle synchronization
  setTimeout(() => {
    // Return only id and name to match real Workday format (no hasChildren)
    const countriesWithHierarchy = mockFormData.countries.map(country => ({
      id: country.id,
      name: country.name
    }));
    
    // Debug: Log a sample to see what we're sending
    console.log('[WORKDAY] Sample countries being sent:', countriesWithHierarchy.slice(0, 3));
    console.log('[WORKDAY] US country:', countriesWithHierarchy.find(c => c.id === 'US'));
    
    res.json(countriesWithHierarchy);
  }, 100); // Minimal delay for realistic network simulation
});

app.post('/api/form-data/workday/departments', (req, res) => {
  // Simulate network delay like real Workday
  setTimeout(() => {
    // Return only id and name to match real Workday format (no hasChildren)
    const departmentsWithHierarchy = mockFormData.departments.map(dept => ({
      id: dept.id,
      name: dept.name
    }));
    res.json(departmentsWithHierarchy);
  }, 400);
});

app.post('/api/form-data/workday/states', (req, res) => {
  const { country, parentValue } = req.body;
  const countryId = country || parentValue;
  
  console.log('[WORKDAY-STATES] Request body:', req.body);
  console.log('[WORKDAY-STATES] Country ID:', countryId);
  
  if (!countryId) {
    return res.status(400).json({ error: 'Country is required' });
  }
  
    // Return data quickly - GoApply should handle synchronization
    setTimeout(() => {
      const states = mockFormData.states[countryId] || [];
      console.log(`[WORKDAY-STATES] Found ${states.length} states for ${countryId}`);
      if (states.length > 0) {
        console.log('[WORKDAY-STATES] Sample states:', states.slice(0, 3));
      }
      // Return only id and name to match real Workday format (no hasChildren)
      const statesWithLeaf = states.map(state => ({
        id: state.id,
        name: state.name
      }));
      res.json(statesWithLeaf);
    }, 100); // Minimal delay for realistic network simulation
});

app.post('/api/form-data/workday/teams', (req, res) => {
  const { department, parentValue } = req.body;
  const deptId = department || parentValue;
  
  if (!deptId) {
    return res.status(400).json({ error: 'Department is required' });
  }
  
  // Simulate network delay like real Workday
  setTimeout(() => {
    const teams = mockFormData.teams[deptId] || [];
      // Return only id and name to match real Workday format (no hasChildren)
      const teamsWithLeaf = teams.map(team => ({
        id: team.id,
        name: team.name
      }));
    res.json(teamsWithLeaf);
  }, 400);
});

// Phone country codes endpoint (dynamic)
app.post('/api/form-data/workday/phone-codes', (req, res) => {
  // Simulate dynamic loading of phone country codes
  setTimeout(() => {
    res.json([
      { id: '+1', name: 'United States (+1)' },
      { id: '+44', name: 'United Kingdom (+44)' },
      { id: '+49', name: 'Germany (+49)' },
      { id: '+33', name: 'France (+33)' },
      { id: '+61', name: 'Australia (+61)' },
      { id: '+91', name: 'India (+91)' },
      { id: '+86', name: 'China (+86)' },
      { id: '+81', name: 'Japan (+81)' },
      { id: '+82', name: 'South Korea (+82)' },
      { id: '+55', name: 'Brazil (+55)' }
    ]);
  }, 500);
});

// Phone types endpoint (dynamic)
app.post('/api/form-data/workday/phone-types', (req, res) => {
  // Simulate dynamic loading of phone types
  setTimeout(() => {
    res.json([
      { id: 'mobile', name: 'Mobile' },
      { id: 'home', name: 'Home' },
      { id: 'work', name: 'Work' },
      { id: 'work_mobile', name: 'Work Mobile' },
      { id: 'other', name: 'Other' }
    ]);
  }, 350);
});

// Workday form submission endpoint
app.post('/api/forms/workday', authenticateToken, (req, res) => {
  const submission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.user.id,
    userEmail: req.user.email,
    formType: 'workday',
    data: req.body,
    submittedAt: new Date().toISOString()
  };
  
  submissions.push(submission);
  persistSubmissionsToFile();
  
  res.json({ 
    message: 'Workday form submitted successfully', 
    submissionId: submission.id 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
