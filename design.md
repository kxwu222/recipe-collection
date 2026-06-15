# Recipes Collection App - Design Plan

## Overview
A mobile app for household recipe management with family sharing, recipe extraction from links, ingredient-based search, and weekly meal planning with shopping lists.

## Screen List

1. **Home/Dashboard** - Main entry point showing quick actions and recent recipes
2. **Recipe List** - Browse all recipes with category filters (cooking method, dish type)
3. **Recipe Detail** - Full recipe view with ingredients, steps, and add-to-week button
4. **Add Recipe** - Form to manually add recipes or paste links for auto-extraction
5. **Search** - Search recipes by ingredients or recipe name
6. **This Week Recipes** - Weekly meal planner with ingredient checklist
7. **To-Buy List** - Shopping list of missing ingredients with checkboxes
8. **Family Members** - View household members and manage sharing
9. **Settings** - Language selection (Chinese/English), theme preferences
10. **Share Link** - Display/copy household invite link

## Primary Content and Functionality

### Home/Dashboard
- Quick action buttons: "Add Recipe", "This Week", "To-Buy List", "Search"
- Recent recipes carousel (last 5 added)
- Family members indicator
- Language toggle (CN/EN)

### Recipe List
- Grid or list view of all recipes
- Filter by cooking method (炒, 蒸, 凉拌, etc.)
- Filter by dish type (粤菜, 潮汕菜, 客家菜, etc.)
- Search bar for quick filtering
- Tap to view recipe detail

### Recipe Detail
- Recipe name (bilingual)
- Ingredients list with quantities
- Step-by-step cooking instructions
- Cooking method and dish type tags
- "Add to This Week" button
- Share recipe option

### Add Recipe
- Manual entry form (name, ingredients, steps, method, type)
- Link paste option for auto-extraction (blog/video content)
- AI-powered extraction of ingredients and steps from URLs
- Save button

### Search
- Search by ingredient name (e.g., "chicken", "番茄")
- Search by recipe name
- Display matching recipes
- Tap to view detail

### This Week Recipes
- List of recipes added for the week
- Each recipe shows ingredients with checkboxes
- Unchecked ingredients automatically added to "To-Buy List"
- Ability to remove recipes from weekly plan
- Visual indicator of ingredient completion status

### To-Buy List
- Auto-generated list of unchecked ingredients from This Week recipes
- Checkboxes to mark items as purchased
- Ability to manually add/remove items
- Clear all button

### Family Members
- List of household members
- Display member names and join date
- Option to remove members (admin only)
- Show household name/ID

### Settings
- Language toggle (中文/English)
- Theme preference (light/dark - optional)
- About app

### Share Link
- Display unique household invite link
- Copy to clipboard button
- QR code for easy sharing

## Key User Flows

### Flow 1: Add Recipe from Link
1. User taps "Add Recipe" on home
2. User pastes blog/video URL
3. App extracts ingredients and steps using AI
4. User reviews and edits if needed
5. User saves recipe
6. Recipe appears in list

### Flow 2: Plan This Week
1. User navigates to "This Week"
2. User searches for recipes and adds them
3. System auto-generates ingredient list
4. User checks off ingredients as they have them
5. Unchecked ingredients appear in "To-Buy List"
6. User reviews shopping list before going to market

### Flow 3: Family Sharing
1. User creates household (on first login)
2. User shares invite link with family
3. Family members join via link
4. All members can add/view recipes
5. Weekly planner and to-buy list shared across household

### Flow 4: Search by Ingredient
1. User taps "Search" on home
2. User types ingredient name (e.g., "chicken", "番茄")
3. App displays all recipes containing that ingredient
4. User taps recipe to view details

## Color Choices

### Soft Beige & Warm Palette
- **Primary Background**: `#F5F1ED` (soft beige)
- **Secondary Background**: `#FFFFFF` (white for cards)
- **Text Primary**: `#3D3D3D` (warm dark brown)
- **Text Secondary**: `#8B8B8B` (warm gray)
- **Accent/Primary Action**: `#D4A574` (warm tan/gold)
- **Secondary Action**: `#E8D5C4` (light warm beige)
- **Success**: `#A8C686` (soft sage green)
- **Warning**: `#E8B4A8` (warm peachy)
- **Border**: `#E8DFD7` (very light beige)
- **Surface/Cards**: `#FEFBF8` (off-white with warm tone)

## Language Support
- Chinese (Simplified): 中文
- English: English
- Toggle in Settings
- All UI text, labels, and placeholders bilingual
- Recipe content can be in either language

## Mobile-First Design Principles
- Portrait orientation (9:16)
- One-handed usage: primary actions in bottom half of screen
- Large touch targets (min 44x44 pt)
- Minimal scrolling on home screen
- Tab bar for main navigation (Home, Recipes, This Week, Settings)
- Bottom sheet for secondary actions
