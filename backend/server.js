require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// In-memory storage (replace with database in production)
const users = [];
const sessions = new Map();

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
  countries: [
    { id: 'US', name: 'United States', hasStates: true },
    { id: 'CA', name: 'Canada', hasProvinces: true },
    { id: 'UK', name: 'United Kingdom' },
    { id: 'DE', name: 'Germany' },
    { id: 'FR', name: 'France' },
    { id: 'JP', name: 'Japan' },
    { id: 'AU', name: 'Australia', hasStates: true },
    { id: 'BR', name: 'Brazil', hasStates: true },
    { id: 'IN', name: 'India', hasStates: true },
    { id: 'CN', name: 'China', hasProvinces: true }
  ],
  states: {
    US: [
      { id: 'CA', name: 'California' },
      { id: 'NY', name: 'New York' },
      { id: 'TX', name: 'Texas' },
      { id: 'FL', name: 'Florida' },
      { id: 'IL', name: 'Illinois' },
      { id: 'PA', name: 'Pennsylvania' },
      { id: 'OH', name: 'Ohio' },
      { id: 'GA', name: 'Georgia' },
      { id: 'NC', name: 'North Carolina' },
      { id: 'MI', name: 'Michigan' }
    ],
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

// Generate a large list of job titles for progressive loading
for (let i = 1; i <= 500; i++) {
  mockFormData.jobTitles.push({
    id: `job-${i}`,
    name: `Job Title ${i}`,
    department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][Math.floor(Math.random() * 5)],
    level: ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'][Math.floor(Math.random() * 5)]
  });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
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
app.get('/api/form-data/countries', (req, res) => {
  setTimeout(() => {
    res.json(mockFormData.countries);
  }, 300); // Simulate network delay
});

app.get('/api/form-data/states/:countryId', (req, res) => {
  const { countryId } = req.params;
  setTimeout(() => {
    res.json(mockFormData.states[countryId] || []);
  }, 500); // Simulate network delay
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

// Form submission endpoints
app.post('/api/forms/basic', authenticateToken, (req, res) => {
  const formId = Date.now().toString();
  const submission = {
    id: formId,
    userId: req.user.id,
    data: req.body,
    submittedAt: new Date().toISOString()
  };
  
  sessions.set(formId, submission);
  
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
    data: req.body,
    submittedAt: new Date().toISOString()
  };
  
  sessions.set(formId, submission);
  
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
  
  res.json({
    success: true,
    submissionId: sessionId,
    message: 'Multi-page form submitted successfully'
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
