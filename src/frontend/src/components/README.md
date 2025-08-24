# Fradium Frontend Components

## Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   └── Container.jsx
│   ├── layout/             # Layout components
│   │   ├── Header.jsx
│   │   └── MainLayout.jsx
│   └── sections/           # Page sections
│       └── HeroSection.jsx
├── pages/                  # Page components
├── core/                   # Core utilities and styles
└── assets/                 # Static assets
```

## Components

### UI Components
- **Button**: Customizable button with variants and sizes
- **Card**: Card component with header, content, and footer
- **Container**: Responsive container wrapper

### Layout Components
- **Header**: Navigation header with mobile responsive menu
- **MainLayout**: Main application layout wrapper

### Section Components
- **HeroSection**: Landing page hero section with animations

## Usage

```jsx
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

// Button usage
<Button variant="outline" size="lg">
  Click me
</Button>

// Card usage
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

## Styling

- Uses TailwindCSS for styling
- Custom color scheme based on Fradium branding
- Responsive design with mobile-first approach
