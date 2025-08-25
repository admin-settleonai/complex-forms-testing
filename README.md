# Complex Forms Testing Application

A comprehensive React application that replicates the most complex forms found on job sites like Workday, Greenhouse, and Lever. This application is designed for testing form handling capabilities with various complex UI patterns.

## Features

### Form Elements
- **Basic Elements**: Text fields, text areas, radio buttons, checkboxes
- **Static Selects**: Dropdowns with hidden panels that appear on click
- **Dynamic Selects**: Options loaded via network calls
- **Progressive Loading Selects**: Options loaded incrementally as user scrolls
- **Hierarchical Multiselects**: Multiple hierarchy levels with parent-child relationships
- **Multi-page Forms**: Both single-load and progressive-load strategies
- **Hidden Fields**: Form data that's submitted but not visible
- **External Form Elements**: Elements outside the main form container

### Authentication
- User registration and login system
- JWT-based authentication
- Protected forms behind login wall

### Complex UI Patterns
- Workday-style dropdowns with ARIA attributes
- Greenhouse-style multi-step applications
- Lever-style dynamic field loading
- Custom dropdown implementations with search functionality
- Hierarchical data selection (Country → State → City)
- Department → Team cascading selections

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Authentication**: JWT tokens
- **Containerization**: Docker & Docker Compose
- **Styling**: CSS with modern form patterns

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/admin-settleonai/complex-forms-testing.git
cd complex-forms-testing
```

2. Using Docker Compose (Recommended):
```bash
docker-compose up
```

3. Manual Setup:

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm start
```

### Access the Application

- Frontend: http://localhost:3101
- Backend API: http://localhost:3100

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Form Data
- `GET /api/form-data/countries` - Get countries list
- `GET /api/form-data/states/:countryId` - Get states for a country
- `GET /api/form-data/departments` - Get departments
- `GET /api/form-data/teams/:departmentId` - Get teams for a department
- `GET /api/form-data/skills` - Get skills with pagination
- `GET /api/form-data/job-titles` - Get job titles with progressive loading

### Form Submission
- `POST /api/forms/basic` - Submit basic form
- `POST /api/forms/complex` - Submit complex form
- `POST /api/forms/multipage/start` - Start multi-page form session
- `POST /api/forms/multipage/:sessionId/page/:pageNumber` - Save page data
- `GET /api/forms/multipage/:sessionId` - Get session data
- `POST /api/forms/multipage/:sessionId/submit` - Submit complete form

## Form Examples

### 1. Basic Form
Simple form with text inputs, radio buttons, and checkboxes.

### 2. Dynamic Dropdown Form
Form with country/state cascading dropdowns loaded via API.

### 3. Hierarchical Multiselect Form
Complex form with department/team hierarchy and multi-selection.

### 4. Progressive Loading Form
Form with job title search that loads results progressively.

### 5. Multi-page Application Form
Workday-style multi-step application with progress tracking.

### 6. Complex Integration Form
Combines all patterns in a single comprehensive form.

## Testing Scenarios

1. **Authentication Flow**: Register → Login → Access protected forms
2. **Dynamic Loading**: Select country → Load states dynamically
3. **Search & Filter**: Type in progressive dropdown → See filtered results
4. **Multi-page Navigation**: Fill page 1 → Next → Fill page 2 → Back → Review → Submit
5. **Complex Validation**: Test required fields, conditional logic, and dependencies

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm start    # Runs React development server
```

### Docker Development
```bash
docker-compose up --build  # Rebuild and run containers
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
