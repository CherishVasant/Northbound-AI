# Northbound AI - Placement Preparation Tracker

A comprehensive web application for tracking your placement exam preparation journey. Northbound AI helps you manage DSA problems, technical subjects, projects, aptitude tests, HR interview questions, and professional certifications all in one place.

## Features

### 📊 Dashboard
- Overview of all modules with quick stats
- Progress visualization across all areas
- Quick action buttons to access each module
- Overall progress tracking

### 💻 DSA Tracker
- Track data structures and algorithms problems
- Filter by pattern, status, and difficulty level
- Inline editing for easy updates
- Status tracking: Not Started → In Progress → Reviewed → Mastered
- Search functionality across problems
- Add, edit, and delete DSA problems

### 📚 Core Subjects
- Organize learning by subject (DSA, OS, DBMS, SQL, OOPs, CN, System Design)
- Track topics within each subject with completion status
- Add resource links and personal notes
- Per-subject and overall progress tracking
- Expandable accordion interface for easy navigation

### 🚀 Projects
- Manage your development projects
- Track tech stack for each project
- Monitor project status (Planned, In Progress, Done)
- Add skills you're learning through each project
- External links to GitHub or deployed projects
- Card-based grid layout

### 🧠 Aptitude & HR
**Aptitude Topics Tab:**
- Track aptitude preparation by topic
- Mark topics as complete
- Resource links for each topic
- Progress tracking

**HR Questions Tab:**
- Store common HR interview questions
- Write and refine draft answers
- Tag questions by category
- Filter by tags
- Track question sources

### 🎓 Certifications
- Track professional certifications
- Monitor certification status (Not Started, In Progress, Completed)
- Set deadlines and get reminders
- Track providers and links
- Table-based view with deadline indicators

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Hooks + localStorage
- **Storage**: Browser localStorage (client-side)

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Project Structure

```
app/
  layout.tsx           # Root layout with sidebar navigation
  page.tsx             # Dashboard
  dsa/page.tsx         # DSA Tracker
  subjects/page.tsx    # Core Subjects
  projects/page.tsx    # Projects
  aptitude/page.tsx    # Aptitude & HR
  certifications/page.tsx # Certifications

components/
  shared/
    ProgressBar.tsx        # Reusable progress bar
    PageHeader.tsx         # Page title and progress
    SearchFilter.tsx       # Search and filter component
    EmptyState.tsx         # Empty state UI
    ConfirmDialog.tsx      # Confirmation dialogs

lib/
  hooks/
    useLocalStorage.ts     # Custom hook for localStorage
  utils/
    storage.ts             # Storage keys and type definitions
    mockData.ts            # Sample seed data
```

## Data Structure

All data is persisted in browser localStorage with the following structure:

### DSA Problem
```typescript
interface DSAProblem {
  id: string
  problemName: string
  link: string
  pattern: string
  dataStructures: string[]
  approach: string
  triggerKeywords: string[]
  coreLogic: string
  personalNotes: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  status: 'Not Started' | 'In Progress' | 'Reviewed' | 'Mastered'
  dateAdded: string
}
```

### Subject & Topic
```typescript
interface Subject {
  id: string
  name: string
  topics: Topic[]
}

interface Topic {
  id: string
  name: string
  completed: boolean
  resourceLink: string
  notes: string
}
```

### Project
```typescript
interface Project {
  id: string
  name: string
  status: 'Planned' | 'In Progress' | 'Done'
  techStack: string[]
  skillsToLearn: string[]
  notes: string
  link: string
}
```

### Certifications
```typescript
interface Certification {
  id: string
  name: string
  provider: string
  status: 'Not Started' | 'In Progress' | 'Completed'
  deadline: string
  link: string
  notes: string
}
```

## Features Highlights

### Search & Filter
- Real-time search across all modules
- Filter by status, difficulty, pattern, tags
- Quick clear filters button

### Progress Tracking
- Visual progress bars throughout the app
- Statistics cards on each module
- Overall progress dashboard

### Responsive Design
- Mobile-friendly interface
- Sidebar navigation works on all screen sizes
- Cards and tables adapt to screen size

### Data Persistence
- All data automatically saves to localStorage
- Data persists across browser sessions
- No backend required

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly

## Color Theme

The app features a modern indigo/blue color scheme with:
- **Primary Color**: Indigo (#4C3FB2 / oklch(0.427 0.173 264.363))
- **Accent Color**: Complementary blue tones
- **Background**: Clean light/dark mode support
- **Text**: High contrast for readability

## Keyboard Shortcuts

- Tab: Navigate between elements
- Enter: Submit forms, open dropdowns
- Escape: Close dialogs and modals
- Space: Toggle checkboxes

## Future Enhancements

- Backend integration for data persistence
- AI-powered DSA problem generation from problem statements
- Collaborative features for group study
- Analytics and insights dashboard
- Export data as PDF/CSV
- Integration with external APIs (LeetCode, GitHub, etc.)
- Dark mode toggle
- Customizable themes
- Email reminders for deadlines

## Development

### Available Scripts

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Lint code
pnpm lint

# Format code
pnpm format
```

### Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Storage Notes

- Data is stored in browser localStorage with keys prefixed by `placement_`
- Storage limit is typically 5-10MB per origin
- Clearing browser data will delete all tracked information
- To backup data, use the browser's developer tools

## Tips for Using Northbound AI

1. **DSA Tracker**: Mark problems as you complete them. Update status progressively (Not Started → In Progress → Reviewed → Mastered)

2. **Core Subjects**: Break down each subject into specific topics for better tracking

3. **Projects**: Link to your GitHub repos or deployed projects for quick access

4. **Aptitude & HR**: Regularly review your draft answers and refine them

5. **Certifications**: Set realistic deadlines and track your preparation progress

6. **Dashboard**: Check your overall progress regularly to stay motivated

## License

This project is open source and available for personal and educational use.

## Support

For issues, suggestions, or improvements, please feel free to contribute or reach out.

---

**Happy Preparing! Good luck with your placement journey! 🚀**
