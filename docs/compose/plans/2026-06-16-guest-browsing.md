# Guest Browsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to browse all pages without login, only requiring authentication for write operations (add recipe, edit, join family).

**Architecture:** Remove auth gates from page display, add `requireAuth()` utility that redirects to login when user attempts write operations.

**Tech Stack:** WeChat Mini Program (WXML, WXSS, JS)

---

## File Structure

- `miniprogram/utils/util.js` - Add `requireAuth()` helper
- `miniprogram/pages/index/index.js` - Remove auth gate, add auth check on goToAddRecipe
- `miniprogram/pages/index/index.wxml` - Remove "Not Authenticated" block
- `miniprogram/pages/recipes/recipes.js` - Remove auth gate, add auth check on goToAddRecipe
- `miniprogram/pages/recipes/recipes.wxml` - Remove "Not Authenticated" block
- `miniprogram/pages/this-week/this-week.js` - Remove auth gate, add auth check on write operations
- `miniprogram/pages/this-week/this-week.wxml` - Remove "Not Authenticated" block
- `miniprogram/pages/settings/settings.wxml` - Show login button when not authenticated
- `miniprogram/pages/add-recipe/add-recipe.js` - Add auth check before handleApplyParsed

---

### Task 1: Add requireAuth utility

**Files:**
- Modify: `miniprogram/utils/util.js`

- [ ] **Step 1: Read current util.js**

- [ ] **Step 2: Add requireAuth function**

```javascript
function requireAuth() {
  const app = getApp()
  if (!app.globalData.user) {
    wx.navigateTo({ url: '/pages/login/login' })
    return false
  }
  return true
}
```

- [ ] **Step 3: Export the function**

Add `requireAuth` to module.exports.

---

### Task 2: Update Index page

**Files:**
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`

- [ ] **Step 1: Update index.js**

Remove `isAuthenticated` from data. Update `checkAuth()` to always load data (with empty state if not logged in). Add auth check to `goToAddRecipe()`.

- [ ] **Step 2: Update index.wxml**

Remove the "Not Authenticated" block (lines 3-9). Show quick actions and recent recipes section for all users.

---

### Task 3: Update Recipes page

**Files:**
- Modify: `miniprogram/pages/recipes/recipes.js`
- Modify: `miniprogram/pages/recipes/recipes.wxml`

- [ ] **Step 1: Update recipes.js**

Remove `isAuthenticated` from data. Update `checkAuth()` to always show page. Add auth check to `goToAddRecipe()`.

- [ ] **Step 2: Update recipes.wxml**

Remove the "Not Authenticated" block (lines 12-18). Show search/filter UI for all users.

---

### Task 4: Update This-week page

**Files:**
- Modify: `miniprogram/pages/this-week/this-week.js`
- Modify: `miniprogram/pages/this-week/this-week.wxml`

- [ ] **Step 1: Update this-week.js**

Remove `isAuthenticated` from data. Update `checkAuth()` to always show page. Add auth check to write operations (addToWeek, addToBuyList).

- [ ] **Step 2: Update this-week.wxml**

Remove the "Not Authenticated" block (lines 8-14). Show date selector and tabs for all users.

---

### Task 5: Update Settings page

**Files:**
- Modify: `miniprogram/pages/settings/settings.wxml`

- [ ] **Step 1: Update settings.wxml**

Show login button in user info section when not authenticated. Keep custom filters visible for all users.

---

### Task 6: Update Add-recipe page

**Files:**
- Modify: `miniprogram/pages/add-recipe/add-recipe.js`

- [ ] **Step 1: Update add-recipe.js**

Add auth check before `handleApplyParsed()`. If not authenticated, redirect to login.

---

### Task 7: Test all pages

- [ ] **Step 1: Test without login**

Open mini program, verify all tabs are browsable, verify write operations prompt login.

- [ ] **Step 2: Test with login**

Login, verify all functionality works as before.
