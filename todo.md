# Recipes Collection App - TODO

## Core Features

### Backend & Database
- [x] Design database schema (recipes, ingredients, household, members, weekly_plan, to_buy_list)
- [x] Create API routes for recipe CRUD operations
- [x] Implement recipe extraction from URLs (AI-powered)
- [x] Create household/family sharing system
- [x] Implement invite link generation and validation
- [x] Build weekly planner API endpoints
- [x] Build to-buy list API endpoints
- [x] Implement ingredient search functionality
- [x] Add recipe categorization (cooking method, dish type)

### Frontend - Navigation & Layout
- [x] Set up tab bar navigation (Home, Recipes, This Week, Settings)
- [x] Create ScreenContainer components for all screens
- [x] Implement SafeArea handling
- [x] Set up language context (Chinese/English)

### Frontend - Home Screen
- [x] Design and build home dashboard
- [x] Add quick action buttons (Add Recipe, This Week, To-Buy List, Search)
- [x] Show recent recipes carousel
- [x] Display family members indicator
- [ ] Add language toggle button

### Frontend - Recipe Management
- [x] Build recipe list screen with grid/list view
- [x] Implement category filters (cooking method, dish type)
- [x] Create recipe detail screen
- [x] Build add recipe screen (manual entry + link paste)
- [ ] Implement recipe search by ingredient
- [ ] Add edit/delete recipe functionality

### Frontend - This Week Planner
- [x] Build "This Week" recipes screen
- [ ] Implement ingredient checklist with checkboxes
- [ ] Auto-generate to-buy list from unchecked ingredients
- [ ] Add ability to remove recipes from weekly plan
- [ ] Show ingredient completion status

### Frontend - To-Buy List
- [ ] Build to-buy list screen
- [ ] Implement checkbox for marking items purchased
- [ ] Add ability to manually add/remove items
- [ ] Add clear all button
- [ ] Show item count

### Frontend - Family Sharing
- [ ] Build family members screen
- [ ] Display household invite link
- [ ] Implement copy-to-clipboard functionality
- [ ] Create share link screen with QR code (optional)
- [ ] Build member management (remove members)

### Frontend - Settings
- [x] Build settings screen
- [x] Implement language toggle (Chinese/English)
- [ ] Add theme preferences (optional)
- [x] Add about section

### Frontend - Styling & Theme
- [x] Apply soft beige and warm colour palette
- [x] Create theme configuration with custom colors
- [ ] Ensure responsive mobile-first design
- [ ] Test one-handed usage on all screens
- [ ] Ensure proper touch target sizes (44x44 pt minimum)

### Frontend - Bilingual Support
- [x] Create i18n/translation system
- [x] Translate all UI text to Chinese and English
- [x] Translate recipe-related labels and placeholders
- [ ] Test language switching on all screens

### Testing & Polish
- [ ] Test all user flows end-to-end
- [ ] Test recipe extraction from various URLs
- [ ] Test family sharing and invite links
- [ ] Test ingredient search functionality
- [ ] Test weekly planner and to-buy list sync
- [ ] Test language switching
- [ ] Verify responsive design on different screen sizes
- [ ] Test dark mode (if implemented)
- [ ] Performance optimization

### Branding & Deployment
- [x] Generate custom app logo
- [x] Update app.config.ts with app name and branding
- [x] Create app icon and splash screen
- [ ] Prepare for deployment
