import { LucideIcon, Rocket, Network, Database, Code, Layout, Puzzle, Box, Settings, AlertCircle } from "lucide-react";

export interface DocCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  items: DocItem[];
}

export interface DocItem {
  id: string;
  title: string;
  description: string;
  category: string;
  file: string;
  tags?: string[];
  lastUpdated?: string;
}

export const documentationIndex: DocCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    description: 'Setup and introduction to the project',
    items: [
      {
        id: 'overview',
        title: 'Project Overview',
        description: 'Understanding the SJ Business Development AI platform',
        category: 'getting-started',
        file: 'getting-started/overview',
        tags: ['overview', 'introduction'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'setup',
        title: 'Development Setup',
        description: 'Local development environment configuration',
        category: 'getting-started',
        file: 'getting-started/setup',
        tags: ['setup', 'installation', 'local'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'tech-stack',
        title: 'Tech Stack',
        description: 'Technologies and frameworks used',
        category: 'getting-started',
        file: 'getting-started/tech-stack',
        tags: ['react', 'supabase', 'typescript'],
        lastUpdated: '2025-01-09'
      }
    ]
  },
  {
    id: 'architecture',
    title: 'Architecture',
    icon: Network,
    description: 'System design and architectural patterns',
    items: [
      {
        id: 'database-schema',
        title: 'Database Schema',
        description: 'Complete database structure and relationships',
        category: 'architecture',
        file: 'architecture/database-schema',
        tags: ['database', 'schema', 'supabase'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'frontend',
        title: 'Frontend Architecture',
        description: 'React component structure and patterns',
        category: 'architecture',
        file: 'architecture/frontend',
        tags: ['react', 'components', 'routing'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'auth-flow',
        title: 'Authentication & Authorization',
        description: 'Security, roles, and access control',
        category: 'architecture',
        file: 'architecture/auth-flow',
        tags: ['auth', 'security', 'roles'],
        lastUpdated: '2025-01-09'
      }
    ]
  },
  {
    id: 'database',
    title: 'Database',
    icon: Database,
    description: 'Database tables, RLS policies, and migrations',
    items: [
      {
        id: 'users-table',
        title: 'Users Table',
        description: 'User management and authentication',
        category: 'database',
        file: 'database/tables/users',
        tags: ['users', 'auth'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'brands-table',
        title: 'Brands Table',
        description: 'Brand management and ownership',
        category: 'database',
        file: 'database/tables/brands',
        tags: ['brands', 'clients'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'rls-policies',
        title: 'RLS Policies',
        description: 'Row Level Security implementation',
        category: 'database',
        file: 'database/rls-policies',
        tags: ['security', 'rls', 'policies'],
        lastUpdated: '2025-01-09'
      }
    ]
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: Code,
    description: 'Edge Functions and API endpoints',
    items: [
      {
        id: 'edge-functions-overview',
        title: 'Edge Functions Overview',
        description: 'Introduction to Supabase Edge Functions',
        category: 'api',
        file: 'api/edge-functions/overview',
        tags: ['api', 'edge-functions'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'admin-users',
        title: 'admin-users Function',
        description: 'User management API',
        category: 'api',
        file: 'api/edge-functions/admin-users',
        tags: ['api', 'users', 'admin'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'eod-data-sync',
        title: 'eod-data-sync Function',
        description: 'EOD data synchronization',
        category: 'api',
        file: 'api/edge-functions/eod-data-sync',
        tags: ['api', 'eod', 'sync'],
        lastUpdated: '2025-01-09'
      }
    ]
  },
  {
    id: 'frontend',
    title: 'Frontend Development',
    icon: Layout,
    description: 'Components, hooks, and UI patterns',
    items: [
      {
        id: 'components',
        title: 'Component Architecture',
        description: 'React component structure and best practices',
        category: 'frontend',
        file: 'frontend/components',
        tags: ['react', 'components'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'hooks',
        title: 'Custom Hooks',
        description: 'Reusable React hooks reference',
        category: 'frontend',
        file: 'frontend/hooks',
        tags: ['react', 'hooks', 'custom'],
        lastUpdated: '2025-01-09'
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Puzzle,
    description: 'Third-party integrations and setup guides',
    items: [
      {
        id: 'n8n-eod',
        title: 'N8n EOD Workflow',
        description: 'ActiveCollab EOD data integration',
        category: 'integrations',
        file: 'integrations/n8n-eod-workflow',
        tags: ['n8n', 'eod', 'activecollab'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'n8n-analytics',
        title: 'N8n Google Analytics',
        description: 'Google Analytics integration setup',
        category: 'integrations',
        file: 'integrations/n8n-google-analytics',
        tags: ['n8n', 'analytics', 'google'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'collabai',
        title: 'CollabAI Integration',
        description: 'AI agent collaboration setup',
        category: 'integrations',
        file: 'integrations/collabai',
        tags: ['collabai', 'ai'],
        lastUpdated: '2025-01-09'
      }
    ]
  },
  {
    id: 'features',
    title: 'Features',
    icon: Box,
    description: 'Application features and workflows',
    items: [
      {
        id: 'eod-system',
        title: 'EOD Submission System',
        description: 'End-of-day reporting workflow',
        category: 'features',
        file: 'features/eod-system',
        tags: ['eod', 'submissions', 'workflow'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'user-management',
        title: 'User Management',
        description: 'User administration and permissions',
        category: 'features',
        file: 'features/user-management',
        tags: ['users', 'permissions', 'admin'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'brand-management',
        title: 'Brand Management',
        description: 'Brand configuration and team assignment',
        category: 'features',
        file: 'features/brand-management',
        tags: ['brands', 'clients', 'teams'],
        lastUpdated: '2025-01-09'
      }
    ]
  },
  {
    id: 'deployment',
    title: 'Deployment',
    icon: Settings,
    description: 'Build, deployment, and operations',
    items: [
      {
        id: 'environment-config',
        title: 'Environment Configuration',
        description: 'Setting up environment variables and secrets',
        category: 'deployment',
        file: 'deployment/environment-config',
        tags: ['environment', 'config', 'secrets'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'database-migrations',
        title: 'Database Migrations',
        description: 'Managing database schema changes',
        category: 'deployment',
        file: 'deployment/database-migrations',
        tags: ['database', 'migrations', 'schema'],
        lastUpdated: '2025-01-09'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: AlertCircle,
    description: 'Common issues and debugging guides',
    items: [
      {
        id: 'common-issues',
        title: 'Common Issues',
        description: 'Frequently encountered problems and solutions',
        category: 'troubleshooting',
        file: 'troubleshooting/common-issues',
        tags: ['debugging', 'issues', 'faq'],
        lastUpdated: '2025-01-09'
      },
      {
        id: 'debugging',
        title: 'Debugging Guide',
        description: 'Tools and techniques for debugging',
        category: 'troubleshooting',
        file: 'troubleshooting/debugging',
        tags: ['debugging', 'dev-tools'],
        lastUpdated: '2025-01-09'
      }
    ]
  }
];

export function getAllDocItems(): DocItem[] {
  return documentationIndex.flatMap(category => category.items);
}

export function getDocByFile(file: string): DocItem | undefined {
  return getAllDocItems().find(item => item.file === file);
}

export function getCategoryById(id: string): DocCategory | undefined {
  return documentationIndex.find(category => category.id === id);
}
