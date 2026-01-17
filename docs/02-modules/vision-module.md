# Vision Module Documentation

## Overview

The Vision page provides a high-level visual overview of the BD AI Portal's purpose, features, and AI agents. It serves as an internal landing page for SJ Innovation team members to understand the platform's capabilities and strategic direction.

## Location

- **Route**: `/vision`
- **Navigation**: Sidebar, after "Feedback" tab
- **Access**: All authenticated users (team_member and above)

---

## Page Structure

### 1. Vision Hero (`VisionHero.tsx`)

A prominent banner section with:
- Gradient background (primary → accent)
- Project title and tagline
- Strategic North Star callout box

**Key content:**
- Title: "BD AI Portal"
- Tagline: "Orchestrating intelligent business development at startup velocity"
- North Star: 30% pipeline growth, 20% faster deals, audit-ready transparency

### 2. Vision Pillars (`VisionPillars.tsx`)

Three core principles displayed as cards:

| Pillar | Icon | Description |
|--------|------|-------------|
| Always-On Intelligence | Brain | Agents anticipate opportunities without human prompts |
| Composable Workflows | Workflow | Business teams orchestrate BD sequences without code |
| Human-in-the-Loop | UserCheck | Clear approval checkpoints for compliance |

### 3. Feature Showcase (`FeatureShowcase.tsx`)

Grid of platform modules with links:

| Module | Route | Color Theme |
|--------|-------|-------------|
| Pipeline Management | /prospecting | Emerald/Teal |
| Outreach & Campaigns | /campaigns | Violet/Purple |
| Performance Tracking | /bd/performance/personal | Blue/Cyan |
| Document Signing | /signing-documents | Orange/Amber |
| Feedback System | /feedback | Pink/Rose |
| Task Management | /bd/actions/tasks | Indigo/Blue |

### 4. Agent Gallery (`AgentGallery.tsx`)

Dynamic grid of active AI agents:
- Fetches from `ai_agents` table via `useAgentList` hook
- Filters to show only active agents (`is_active = true`)
- Displays agent name, category badge, and mission description

**Agent mission descriptions** are stored in a local mapping object for display consistency.

### 5. Agent Examples (`AgentExamples.tsx`)

Interactive demonstration section:
- Dropdown to select an agent
- "Run Example" button to simulate agent output
- Before/After comparison cards showing:
  - Manual process time and effort
  - Agent output with time savings

**Hardcoded examples for:**
- BD Research Analyst
- LinkedIn Message Generator
- Deal Status Intelligence

### 6. Impact Metrics (`ImpactMetrics.tsx`)

Three target metrics displayed as large stat cards:

| Metric | Value | Description |
|--------|-------|-------------|
| Pipeline Velocity | 30% | Increase via intelligent lead scoring |
| Deal Acceleration | 20% | Faster cycles via automated follow-ups |
| Trust & Compliance | 100% | Audit-ready transparency |

---

## Data Sources

| Component | Data Source |
|-----------|-------------|
| VisionHero | Static content |
| VisionPillars | Static content |
| FeatureShowcase | Static content with route links |
| AgentGallery | Database: `ai_agents` table |
| AgentExamples | Hardcoded example data |
| ImpactMetrics | Static content |

---

## File Structure

```
src/
├── pages/
│   └── Vision.tsx              # Main page component
├── components/
│   └── vision/
│       ├── VisionHero.tsx      # Hero banner
│       ├── VisionPillars.tsx   # Three pillars section
│       ├── FeatureShowcase.tsx # Feature modules grid
│       ├── AgentGallery.tsx    # Active agents display
│       ├── AgentExamples.tsx   # Interactive demo
│       └── ImpactMetrics.tsx   # Target metrics
```

---

## Design Patterns

### Colors
- Uses semantic design tokens from `index.css`
- Gradient classes: `bg-gradient-to-br from-primary to-accent`
- Card hover effects with `hover:shadow-lg hover:-translate-y-1`

### Typography
- Section headers: `text-2xl font-bold text-foreground`
- Body text: `text-muted-foreground`
- Descriptions: `text-sm text-muted-foreground`

### Layout
- Page container: `py-8 space-y-16` for section spacing
- Cards: Use shadcn `Card` component
- Grids: `grid md:grid-cols-3 gap-6`

### Animations
- Card hover: `transition-all duration-300`
- Icon hover: `group-hover:scale-110 transition-transform`
- Content reveal: CSS transition with timeout

---

## Implementation Guide for AI Agents

To replicate this Vision page pattern in another project:

### 1. Create Component Structure

```bash
# Create vision components directory
mkdir -p src/components/vision

# Create page and components
touch src/pages/Vision.tsx
touch src/components/vision/VisionHero.tsx
touch src/components/vision/VisionPillars.tsx
touch src/components/vision/FeatureShowcase.tsx
touch src/components/vision/AgentGallery.tsx
touch src/components/vision/AgentExamples.tsx
touch src/components/vision/ImpactMetrics.tsx
```

### 2. Add Navigation

In your `Layout.tsx` or navigation config:
```typescript
{
  name: "Vision",
  href: "/vision",
  icon: Lightbulb, // or Sparkles
  current: false,
}
```

### 3. Add Route

In your `App.tsx`:
```typescript
<Route path="/vision" element={
  <ProtectedRoute requiredMinimumRole="team_member">
    <Layout />
  </ProtectedRoute>
}>
  <Route index element={<Vision />} />
</Route>
```

### 4. Customize Content

Update the following based on your project:
- `VisionHero.tsx`: Project name, tagline, north star goals
- `VisionPillars.tsx`: Your core principles
- `FeatureShowcase.tsx`: Your platform modules
- `AgentGallery.tsx`: Your agent missions mapping
- `AgentExamples.tsx`: Your agent before/after examples
- `ImpactMetrics.tsx`: Your target metrics

### 5. Connect Data

If you have an agents table:
```typescript
// Create a hook to fetch agents
export function useAgentList() {
  return useQuery({
    queryKey: ["ai-agents"],
    queryFn: listAgents,
  });
}
```

---

## Accessibility

- All icons have semantic meaning via text labels
- Color contrast meets WCAG AA standards
- Interactive elements are keyboard accessible
- Cards have visible focus states

---

## Future Enhancements

1. **Live Agent Stats**: Show real-time run counts and success rates
2. **Roadmap Timeline**: Add project phases with progress indicators
3. **Team Contributors**: Showcase team members behind each feature
4. **Video Demos**: Embed short videos showing agents in action
5. **Personalized View**: Show agents relevant to user's role
