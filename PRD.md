# Terminal Quest - Linux Terminal Puzzle Game

A browser-based puzzle game that emulates a Linux terminal environment where players solve system administration challenges through commands, configuration, and optional coding.

**Experience Qualities**:
1. **Authentic** - The terminal must feel like a real Linux system with proper command responses and file system navigation
2. **Challenging** - Puzzles should require thinking and Linux knowledge while remaining accessible
3. **Rewarding** - Clear progression, scoring feedback, and achievement moments when solving puzzles

**Complexity Level**: Light Application (multiple features with basic state)
- Multiple puzzle levels with different mechanics
- Persistent scoring and progress system
- Terminal command parsing and response generation

## Essential Features

### Terminal Emulator
- **Functionality**: Renders a realistic Linux terminal with command input, output history, and proper styling
- **Purpose**: Core gameplay interface that immerses players in the Linux environment
- **Trigger**: Automatically displayed on game start
- **Progression**: User types command → Parser processes → Response displayed → State updated
- **Success criteria**: Commands like ls, cd, cat, nano work realistically

### Level System
- **Functionality**: Progressive puzzle levels with unique objectives (configure files, install packages, fix permissions)
- **Purpose**: Provides structured challenges that teach Linux concepts
- **Trigger**: Level loads after completing previous or selecting from menu
- **Progression**: Read objective → Explore system → Execute solution → Level complete
- **Success criteria**: Each level has clear win condition that validates user actions

### Scoring System
- **Functionality**: Points based on time taken, number of attempts, and hints used
- **Purpose**: Adds replayability and competitive element
- **Trigger**: Scoring starts when level begins, calculated on completion
- **Progression**: Base score → Time penalty → Error penalty → Hint penalty → Final score
- **Success criteria**: Score accurately reflects player performance

### Hint System
- **Functionality**: Players can request hints at point cost, limited per level
- **Purpose**: Prevents frustration while maintaining challenge
- **Trigger**: Player clicks hint button or types 'hint' command
- **Progression**: Request hint → Deduct points → Display progressive hint
- **Success criteria**: Hints guide without giving away solution

### Progress Persistence
- **Functionality**: Save completed levels, scores, and current progress using useKV
- **Purpose**: Players can return and continue their journey
- **Trigger**: Automatic save on level completion and periodic autosave
- **Progression**: Complete level → Save progress → Available on reload
- **Success criteria**: Progress persists across browser sessions

## Edge Case Handling
- **Invalid commands**: Display helpful "command not found" with suggestions
- **Empty input**: Ignore gracefully, show new prompt
- **Rapid input**: Queue commands, process sequentially
- **Browser refresh**: Restore current level state from storage
- **Long output**: Scrollable terminal with history limit

## Design Direction
The design should evoke the nostalgic feel of classic terminal interfaces while feeling modern and polished. Dark backgrounds with phosphor-green or amber text create authenticity. The UI outside the terminal should be minimal and unobtrusive.

## Color Selection
- **Primary Color**: `oklch(0.75 0.18 142)` - Phosphor green for terminal text and accents
- **Secondary Colors**: `oklch(0.25 0.02 240)` - Deep blue-black for terminal background
- **Accent Color**: `oklch(0.85 0.15 85)` - Amber/gold for highlights, scores, and achievements
- **Background**: `oklch(0.12 0.02 260)` - Near-black with slight blue tint
- **Foreground/Background Pairings**:
  - Terminal green (`oklch(0.75 0.18 142)`) on terminal bg (`oklch(0.12 0.02 260)`) - Ratio 8.2:1 ✓
  - Amber accent (`oklch(0.85 0.15 85)`) on dark bg (`oklch(0.12 0.02 260)`) - Ratio 9.1:1 ✓
  - Muted text (`oklch(0.55 0.05 142)`) on dark bg - Ratio 4.8:1 ✓

## Font Selection
Monospace fonts are essential for terminal authenticity. JetBrains Mono provides excellent readability and coding ligatures while feeling technical and modern.

- **Typographic Hierarchy**:
  - Terminal text: JetBrains Mono Regular/16px/1.5 line-height
  - Level titles: JetBrains Mono Bold/24px/tight
  - UI labels: JetBrains Mono Medium/14px/normal
  - Score display: JetBrains Mono Bold/20px/tight

## Animations
Animations should be subtle and functional - cursor blink for the terminal, smooth text appearance for command output, and satisfying completion effects when solving puzzles. Avoid anything that interrupts the typing flow.

## Component Selection
- **Components**: 
  - Card for terminal container with custom dark styling
  - Button for hint/menu actions with terminal-style borders
  - ScrollArea for terminal history
  - Dialog for level selection and game menu
  - Badge for score and level indicators
  - Progress for time/hint indicators
- **Customizations**: 
  - Custom terminal input component with blinking cursor
  - Level objective overlay component
- **States**: 
  - Buttons: ghost style with green border on hover
  - Input: invisible styling, cursor only indicator
- **Icon Selection**: Terminal, Trophy, Lightbulb (hints), Check (success)
- **Spacing**: Tight spacing within terminal (4px), generous padding around (24px)
- **Mobile**: Full-width terminal, virtual keyboard friendly input, touch-accessible buttons
