# Wessley.ai Frontend Tasks - UPDATED FOR DASHBOARD LAYOUT

## Completed Tasks ✅
- [x] TASK 0: Project bootstrap - Create Next.js app with TS, Tailwind, shadcn, ChatUI, Zustand
- [x] TASK 1: Base layout & navigation - App shell with top nav and theme toggle  
- [x] TASK 2: Homepage structure - Hero section and grid zones with placeholders
- [x] Fix design system - Update fonts, colors, layout positioning to match design
- [x] Make backgrounds full screen stretch

## Current Task 🔄
- [ ] **TASK 3: ChatUI Panel Integration (Priority 1)**
  - Create dashboard layout structure matching the provided design
  - Implement chat interface at BOTTOM of screen
  - Set up basic chat using `@chatui/core` 
  - Add initial assistant message: "What kind of car are we working on?"
  - Wire up Sign Up, Sign In, and Start Building button triggers to open dashboard
  - Load ChatPanel client-side only (dynamic import, no SSR)

## Pending Tasks 📋

### TASK 4: Message Bus - Zustand stores and types (Priority 2)
- Create `/src/stores/scene.ts` and `/src/stores/chat.ts`
- Define types: `SceneComponent`, `SceneCommand` (FOCUS, HIGHLIGHT, CLEAR_HIGHLIGHT, SET_VIEW, THEME), `SceneEvent`
- Define chat types: `ChatToolCall`, `ChatMessage`
- Implement `useSceneStore` with component management and command dispatch
- Implement `useChatStore` with helper that translates chat commands to scene commands
- Create `/src/lib/scene-communication.md` - instructions manual for scene-chat communication

### TASK 5: Scene Canvas + Action Menu Integration
- Create `components/scene/SceneCanvas.tsx` - 3D scene visualization in CENTER of dashboard
- Create `components/dashboard/ActionMenu.tsx` - RIGHT sidebar with action cards:
  - "Log a repair" - Mark starter relay as replaced and add receipt photo
  - "Predict weak spots" - Analyze harness and show wires at risk of overheating  
  - "Explore" - Highlight circuits connected to ignition
  - "Source parts" - Find compatible alternator connector near me
- Scene canvas hooks into message bus and logs commands (preparation for 3D engine)
- Action menu dispatches commands to scene bus

### TASK 6: Left Sidebar + Vehicle Selector
- Create `components/dashboard/LeftSidebar.tsx` with:
  - User profile section
  - Vehicle selector dropdown ("Hyundai Galloper 00'")
  - "Select Config" dropdown for vehicle presets
- Wire vehicle selection to scene state
- Add vehicle switching functionality

### TASK 7: Chat Command System  
- Implement command parsing in bottom chat:
  - `/focus <id>` → FOCUS command
  - `/highlight <id id id>` → HIGHLIGHT command  
  - `/view <iso|left|right|front|rear|top>` → SET_VIEW command
- Wire commands to `useSceneStore().dispatch()`
- Add command hints in chat placeholder text
- Ensure commands trigger visible scene changes

### TASK 8: Dashboard Layout Composition
- Create full dashboard layout:
  - Left: User profile + vehicle selector
  - Center: 3D scene canvas
  - Right: Action menu cards
  - Bottom: Chat interface
- Make layout responsive (mobile/tablet/desktop)
- Wire homepage buttons to open dashboard

### TASK 9: Accessibility and Polish
- Add proper ARIA labels and roles
- Ensure keyboard navigation works through all dashboard sections
- Test responsive breakpoints
- Add focus styles and screen reader support

### TASK 10: Demo Fixtures & Documentation  
- Add `public/fixtures/components.mock.json` with vehicle components
- Add `public/fixtures/vehicles.mock.json` with vehicle presets
- Load fixtures into dashboard at mount
- Update scene communication manual (`/src/lib/scene-communication.md`)
- Document dashboard integration patterns

## Architecture Notes - UPDATED

### Target Layout (from provided image):
```
┌─────────────┬─────────────────────────┬─────────────────┐
│ Left        │ Center                  │ Right           │
│ Sidebar     │ 3D Scene Canvas         │ Action Menu     │
│             │                         │                 │
│ • Profile   │ [3D Wiring Harness]     │ • Log repair    │
│ • Vehicle   │                         │ • Predict weak  │
│   Selector  │                         │ • Explore       │
│ • Config    │                         │ • Source parts  │
│             │                         │                 │
├─────────────┴─────────────────────────┴─────────────────┤
│ Bottom Chat Interface                                   │
│ "Type your message..."                                  │
└─────────────────────────────────────────────────────────┘
```

### Key Changes from Original Plan:
1. **Dashboard Layout** - Full screen dashboard instead of modal ChatUI
2. **Chat Position** - Bottom of screen, not container for other elements
3. **Scene Position** - Center of dashboard, main focus area
4. **Action Menu** - Right sidebar with specific automotive actions
5. **Left Sidebar** - User profile and vehicle selection
6. **Button Triggers** - Homepage buttons open full dashboard view

### Communication Flow:
```
Chat Input → Command Parser → useChatStore → useSceneStore → SceneCanvas
Action Menu → Direct Commands → useSceneStore → SceneCanvas
Vehicle Selector → Vehicle Change → useSceneStore → SceneCanvas Update
```

---

## Social Network Platform Tasks 🌐

### MVP Phase 1: Core Vehicle Assistant (Priority: HIGH)
*Focus: Core AI analysis and chat functionality*

- [ ] **Database Migration 001**: Core vehicle assistant tables
  - profiles, vehicles, vehicle_images, electrical_analyses, conversations, messages
  - RLS policies for multi-tenant security
  - Auto-profile creation triggers

### MVP Phase 2: Basic Social Features (Priority: MEDIUM)
*Focus: Pinterest-style sharing and discovery*

- [ ] **Database Migration 002**: Basic social features
  - posts (vehicle projects with images/content)
  - user_follows (follower/following relationships)
  - post_likes (engagement tracking)
  - post_comments (community interaction)

- [ ] **Social Feed UI Components**
  - Pinterest-style grid layout for post discovery
  - Post creation form with image upload
  - User profile pages with posts grid
  - Follow/unfollow functionality

### MVP Phase 3: Advanced Social Features (Priority: LOW)
*Focus: Full social platform capabilities*

- [ ] **Database Migration 003**: Advanced social features
  - collections/boards (Pinterest-style organization)
  - post_bookmarks (save functionality)
  - tags system with discovery
  - notifications table for real-time updates

- [ ] **Advanced Social UI**
  - Collections/boards management
  - Tag-based discovery and filtering
  - Notification center
  - Advanced search (users, posts, tags, vehicles)

### MVP Phase 4: Platform Features (Priority: FUTURE)
*Focus: Production-ready social network*

- [ ] **Content & Media System**
  - Video upload and processing pipeline
  - Image optimization and CDN integration
  - Content moderation tools and reporting system
  - Rich text editor with mentions (@username)

- [ ] **User Experience & Discovery**
  - Trending/popular posts algorithm
  - Recommendation engine ("Users like you also follow...")
  - User verification and badges system
  - Enhanced profiles with bio, social links, expertise

- [ ] **Engagement & Community**
  - Direct messaging/chat system
  - Groups/communities (BMW E46 enthusiasts, etc.)
  - Events system (meetups, car shows)
  - Achievement/reputation system

- [ ] **Technical Infrastructure**
  - Real-time features (WebSocket connections)
  - Background job processing for media
  - Advanced caching strategies
  - Content analytics for creators
  - API rate limiting
  - Monetization features (premium, marketplace)

### Database Design Strategy
```
MVP Phase 1: Core Vehicle Assistant
├── Focus on AI analysis workflow
├── User auth and vehicle management
└── Chat functionality

MVP Phase 2: Basic Social
├── Post sharing (Pinterest-style)
├── Follow relationships
└── Basic engagement (likes, comments)

MVP Phase 3: Advanced Social
├── Collections and organization
├── Discovery and search
└── Notifications and real-time features

MVP Phase 4: Full Platform
├── Content moderation and safety
├── Advanced algorithms and recommendations
└── Monetization and platform features
```