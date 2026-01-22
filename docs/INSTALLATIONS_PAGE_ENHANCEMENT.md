# Installations Page Enhancement - Implementation Tracker

**Status**: 🚧 In Progress
**Started**: 2026-01-22
**Target**: Multi-session implementation

---

## Overview

This document tracks the implementation of enhanced features for the `/dashboard/installations` page, including keyboard navigation, bulk delete operations, uninstall command preview, and improved UI/UX.

---

## User Requirements

- ✅ Arrow key navigation (Up/Down, Space/Enter, Delete, ?)
- ✅ Show uninstall commands for SPECIFIC installed packages from installation records
- ✅ Keep table layout, enhance styling (not card-based or timeline)
- ✅ Bulk delete with checkbox selection

---

## Architecture Summary

### State Management
- **New Store**: `installation-selection-store.ts` (Zustand)
  - Tracks selected installation IDs (Set<string>)
  - Tracks focused row index for keyboard navigation
  - Follows pattern from existing `selection-store.ts`

### Component Structure
```
InstallationsPage
├── InstallationHistoryTable (enhanced)
│   ├── AdvancedDataTable (add row selection)
│   ├── BulkActionBar (floating bottom bar)
│   └── DeleteConfirmationDialog (2-step flow)
└── UninstallCommandDialog (show uninstall commands)
```

### API Changes
- **New Endpoint**: `/api/installations/bulk-delete` (POST)
- **Validation**: `bulkDeleteInstallationsSchema`
- **Service**: `InstallationHistoryService.bulkDeleteInstallations()`

---

## Development Guidelines

### Test-Driven Development (TDD)

**IMPORTANT**: Follow TDD strategy for all new code:

1. **Write Tests First**
   - Write failing tests before implementing features
   - Tests should describe expected behavior
   - Start with unit tests, then integration tests

2. **Implement Minimal Code**
   - Write just enough code to make tests pass
   - Keep implementation focused and simple
   - Avoid over-engineering

3. **Refactor**
   - Clean up code while keeping tests green
   - Improve structure, naming, and organization
   - Ensure all tests still pass after refactoring

### Atomic Commits

**REQUIRED**: Make atomic, focused commits:

- **One logical change per commit**
  - Don't mix multiple features/fixes in one commit
  - Keep commits small and reviewable
  - Each commit should represent a complete, working change

- **Commit Message Format**
  ```
  type(scope): brief description

  - Detailed explanation if needed
  - Reference issues or tickets

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```

- **Examples**
  - `feat(store): add installation selection store with persistence`
  - `test(store): add unit tests for installation selection actions`
  - `feat(api): implement bulk delete endpoint with auth validation`
  - `refactor(table): extract checkbox logic into separate component`

### Pre-Commit Verification

**MANDATORY**: Before every commit, verify:

1. **Run Tests**
   ```bash
   bun test:run
   ```
   - All tests must pass
   - No skipped or failing tests
   - Coverage should not decrease

2. **Run Build**
   ```bash
   bun run build
   ```
   - Build must succeed
   - No TypeScript errors
   - No linting errors

3. **Check Types**
   ```bash
   bun run type-check  # if available
   ```
   - No type errors
   - Proper TypeScript usage

### Commit Workflow

**Step-by-step process for each feature:**

1. Write tests for the feature (TDD)
2. Implement feature to make tests pass
3. Refactor if needed (tests stay green)
4. Run `bun test:run` - verify all pass ✅
5. Run `bun run build` - verify success ✅
6. Run `git add <changed-files>`
7. Run `git commit -m "type(scope): description"`
8. Push when feature is complete

### Example TDD Workflow

**Phase 1.1: Installation Selection Store**

```bash
# 1. Write test first
touch src/stores/installation-selection-store.test.ts
# Write failing tests for store actions

# 2. Run test (should fail)
bun test installation-selection-store

# 3. Implement store
touch src/stores/installation-selection-store.ts
# Implement minimal code to pass tests

# 4. Run test (should pass)
bun test installation-selection-store

# 5. Verify build
bun run build

# 6. Commit
git add src/stores/installation-selection-store.ts src/stores/installation-selection-store.test.ts
git commit -m "feat(store): add installation selection store with persistence"

# 7. Continue with next feature...
```

---

## Implementation Progress

### Phase 1: Foundation (State & API) ✅ COMPLETE

#### 1.1 Installation Selection Store
**File**: `/src/stores/installation-selection-store.ts`

- [x] Create Zustand store with persist middleware
- [x] Add state: `selectedInstallationIds: Set<string>`
- [x] Add state: `focusedRowIndex: number`
- [x] Implement actions:
  - [x] `toggleInstallation(id: string)`
  - [x] `selectInstallation(id: string)`
  - [x] `deselectInstallation(id: string)`
  - [x] `selectAll(ids: string[])`
  - [x] `clearSelection()`
  - [x] `selectRange(startId: string, endId: string, allIds: string[])`
  - [x] `setFocusedRowIndex(index: number)`
- [x] Add computed functions:
  - [x] `hasSelection()`
  - [x] `getSelectedIds()`
- [x] Configure localStorage persistence with Set serialization
- [x] Write unit tests: `/src/stores/installation-selection-store.test.ts`

**Status**: ✅ Completed

---

#### 1.2 Bulk Delete Validation Schema
**File**: `/src/lib/validation/schemas/installation.schema.ts`

- [x] Add `bulkDeleteInstallationsSchema`
  ```typescript
  z.object({
    installationIds: z.array(z.string().min(1)).min(1, 'At least one installation required')
  })
  ```
- [x] Export schema in `/src/lib/validation/index.ts`

**Status**: ✅ Completed

---

#### 1.3 Bulk Delete Service Method
**File**: `/src/services/installation-history.service.ts`

- [x] Add `bulkDeleteInstallations(installationIds: string[], userId: string)` method
- [x] Query installations using `inArray(installations.id, installationIds)`
- [x] Verify all installations belong to userId (security check)
- [x] Throw error if any installation not found or not owned
- [x] Delete using `and(inArray(installations.id, ids), eq(installations.userId, userId))`
- [x] Return void or success indicator

**Status**: ✅ Completed

---

#### 1.4 Bulk Delete API Endpoint
**File**: `/src/app/api/installations/bulk-delete/route.ts`

- [x] Create route file
- [x] Import `createAuthValidatedApiHandler`, `successResponse`
- [x] Import `bulkDeleteInstallationsSchema`
- [x] Implement POST handler:
  - [x] Use `createAuthValidatedApiHandler(bulkDeleteInstallationsSchema, ...)`
  - [x] Get userId from auth
  - [x] Call `InstallationHistoryService.bulkDeleteInstallations(ids, userId)`
  - [x] Return `successResponse({ success: true, deletedCount })`
- [x] Add error handling

**Status**: ✅ Completed

---

### Phase 2: Table Enhancement ✅ COMPLETE

#### 2.1 Enhanced AdvancedDataTable
**File**: `/src/components/admin/advanced-data-table.tsx`

- [x] Add new optional props to interface:
  - [x] `enableRowSelection?: boolean`
  - [x] `selectedRows?: Set<string>`
  - [x] `onRowSelectionChange?: (ids: Set<string>) => void`
  - [x] `onSelectAll?: () => void`
  - [x] `onClearSelection?: () => void`
  - [x] `focusedRowIndex?: number`
- [x] Implement checkbox column (when `enableRowSelection={true}`):
  - [x] Add checkbox as first column
  - [x] Header checkbox for Select All / Deselect All
  - [x] Row checkboxes with onChange handler
  - [ ] Implement Shift+click for range selection (deferred to Phase 3)
  - [x] Use `getRowId` to identify rows
- [x] Add row attributes for styling:
  - [x] `data-focused={focusedRowIndex === rowIndex}`
  - [x] `data-selected={selectedRows.has(rowId)}`
- [x] Ensure backward compatibility (all new props optional)
- [x] Indeterminate state support via `data-state="indeterminate"`

**Status**: ✅ Completed

---

#### 2.2 Update InstallationHistoryTable
**File**: `/src/components/installation-history-table.tsx`

- [x] Import `useInstallationSelectionStore`
- [x] Get selection state from store
- [x] Pass `enableRowSelection={true}` to AdvancedDataTable
- [x] Pass selection props: `selectedRows`, `onRowSelectionChange`, etc.
- [x] Add state for DeleteConfirmationDialog (open/close)
- [x] Add state for UninstallCommandDialog (open/close)
- [x] Add BulkActionBar component (conditional render, placeholder UI)
- [ ] Wire up bulk delete flow (deferred to Phase 5)
- [x] Keep existing features: device filter, search, individual delete

**Status**: ✅ Completed

---

### Phase 3: Keyboard Navigation ✅ COMPLETE

#### 3.1 Keyboard Navigation Hook
**File**: `/src/hooks/use-installation-keyboard-navigation.ts`

- [x] Create custom hook `useInstallationKeyboardNavigation(installations: InstallationWithRelations[])`
- [x] Import `useInstallationSelectionStore`
- [x] Add state: `showHelpDialog`
- [x] Implement keyboard event handler:
  - [x] ArrowUp: Move focus up, scroll into view
  - [x] ArrowDown: Move focus down, scroll into view
  - [x] Home: Jump to first row
  - [x] End: Jump to last row
  - [x] Space/Enter: Toggle selection on focused row
  - [x] Delete/Backspace: Trigger delete confirmation for selected items
  - [x] Ctrl+A: Select all visible rows
  - [x] Escape: Clear selection
  - [x] ?: Show help dialog
- [x] Detect input fields (don't interfere with typing)
- [x] Implement auto-scroll: `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
- [x] Return `{ showHelpDialog, setShowHelpDialog }`
- [x] Write unit tests: `/src/hooks/use-installation-keyboard-navigation.test.ts`
- [x] Fix data-row-index attribute in AdvancedDataTable

**Status**: ✅ Completed

---

#### 3.2 Keyboard Shortcuts Help Dialog
**File**: `/src/components/installation-keyboard-shortcuts-dialog.tsx`

- [x] Create dialog component
- [x] Follow pattern from existing `keyboard-shortcuts-dialog.tsx`
- [x] Props: `open: boolean`, `onOpenChange: (open: boolean) => void`
- [x] List all keyboard shortcuts:
  - Navigation (Arrow keys, Home, End)
  - Selection (Space, Enter, Ctrl+A)
  - Actions (Delete)
  - Help (?)
- [x] Use shadcn Dialog, Table components
- [x] Add keyboard shortcut notation styling

**Status**: ✅ Completed

---

### Phase 4: Bulk Actions UI ✅ COMPLETE

#### 4.1 BulkActionBar Component
**File**: `/src/components/bulk-action-bar.tsx`

- [x] Create component with props:
  - [x] `selectedCount: number`
  - [x] `onDelete: () => void`
  - [x] `onClearSelection: () => void`
  - [x] `isDeleting?: boolean`
- [x] Position: Fixed bottom with z-index
- [x] Style: Backdrop blur, shadow, border-top
- [x] Content:
  - [x] Text: "X installations selected"
  - [x] Delete button (destructive variant)
  - [x] Clear selection button
- [x] Animation: Slide up when `selectedCount > 0`
- [x] Loading state during deletion
- [x] Use shadcn Card, Button components
- [x] Write comprehensive tests (9 tests)
- [x] Integrate into InstallationHistoryTable

**Status**: ✅ Completed

---

### Phase 5: Delete Confirmation Flow ✅ COMPLETE

#### 5.1 DeleteConfirmationDialog Component
**File**: `/src/components/delete-confirmation-dialog.tsx`

- [x] Create component with props:
  - [x] `open: boolean`
  - [x] `onOpenChange: (open: boolean) => void`
  - [x] `installations: InstallationWithRelations[]`
  - [x] `onConfirmDelete: () => void`
  - [x] `onShowUninstallCommands: () => void`
- [x] Dialog content:
  - [x] Header: "Delete X installations?"
  - [x] List app names being deleted (max 10, then "and X more...")
  - [x] Warning text about permanent deletion
- [x] Three buttons:
  - [x] "Show Uninstall Commands" (primary)
  - [x] "Just Delete" (destructive)
  - [x] "Cancel" (secondary)
- [x] Use shadcn Dialog pattern (DialogDescription with asChild for valid HTML)
- [x] Write 11 comprehensive tests

**Status**: ✅ Completed

---

#### 5.2 Wire Delete Flow in InstallationHistoryTable
**File**: `/src/components/installation-history-table.tsx`

- [x] Create React Query mutation for bulk delete
  - [x] Call `/api/installations/bulk-delete`
  - [x] Pass `installationIds` array
- [x] Implement delete flow:
  - [x] Bulk delete button click → Open DeleteConfirmationDialog
  - [x] "Show Commands" → Open UninstallCommandDialog (Phase 6 placeholder)
    - [ ] On UninstallCommandDialog close → Call delete mutation (deferred to Phase 6)
  - [x] "Just Delete" → Call delete mutation immediately
- [x] On success:
  - [x] Invalidate `['installations']` query
  - [x] Invalidate `['user-devices']` query
  - [x] Clear selection
  - [x] Show success toast
- [x] On error:
  - [x] Show error toast
  - [x] Keep selection intact

**Status**: ✅ Completed

---

### Phase 6: Uninstall Command Dialog

#### 6.1 UninstallCommandDialog Component
**File**: `/src/components/uninstall-command-dialog.tsx`

- [ ] Create component with props:
  - [ ] `open: boolean`
  - [ ] `onOpenChange: (open: boolean) => void`
  - [ ] `installations: InstallationWithRelations[]`
  - [ ] `onComplete?: () => void`
- [ ] Derive data from installations:
  - [ ] Extract distroId (use first installation's distro)
  - [ ] Extract packageIds array
  - [ ] Extract app info for display
  - [ ] Validate all installations use same distro (or handle mixed)
- [ ] Use `useUninstallCommand` hook:
  - [ ] Pass derived distroId
  - [ ] Pass packageIds
  - [ ] Get commands, cleanupCommands, etc.
- [ ] Dialog structure:
  - [ ] Header with title and count
  - [ ] Copy all button
  - [ ] Download script button
  - [ ] Setup cleanup section (CleanupCommands)
  - [ ] Main uninstall commands (UninstallCommands)
  - [ ] Dependency cleanup section (CleanupCommands)
  - [ ] Manual steps (ManualUninstallSteps)
  - [ ] Warnings section (CommandWarnings)
- [ ] On close: Call `onComplete()` callback
- [ ] Reuse existing components:
  - [ ] `<UninstallCommands />`
  - [ ] `<CleanupCommands />`
  - [ ] `<ManualUninstallSteps />`
  - [ ] `<CommandWarnings />`
  - [ ] `<CommandHeader />`

**Status**: ⬜ Not Started

---

### Phase 7: UI/UX Enhancements

#### 7.1 Table Styling Improvements
**File**: `/src/components/installation-history-table.tsx`

- [ ] Add custom row styles to AdvancedDataTable:
  - [ ] `transition-all duration-200`
  - [ ] `hover:bg-muted/50`
  - [ ] `data-[focused=true]:border-l-4 data-[focused=true]:border-l-primary`
  - [ ] `data-[selected=true]:bg-primary/10`
- [ ] Increase row padding: `py-4`
- [ ] Visual hierarchy:
  - [ ] App name: Larger font (text-base or text-lg), font-semibold
  - [ ] Package info: Muted color (text-muted-foreground), smaller (text-sm)
  - [ ] Add subtle borders between rows
- [ ] Improve column spacing

**Status**: ⬜ Not Started

---

#### 7.2 Enhanced Empty State
**File**: `/src/components/installation-history-table.tsx`

- [ ] Add animated icon with pulse animation
- [ ] Improve CTA button styling
- [ ] Better copy and layout
- [ ] Consider illustration or larger icon

**Status**: ⬜ Not Started

---

#### 7.3 Loading States
**File**: `/src/components/installation-history-table.tsx`

- [ ] Add skeleton loader during initial fetch
- [ ] Show loading spinner in BulkActionBar during delete
- [ ] Disable buttons during mutations
- [ ] Add loading state to delete confirmation dialog

**Status**: ⬜ Not Started

---

## Testing Checklist

### Unit Tests
- [ ] `installation-selection-store.test.ts` - Store actions and computed values
- [ ] `use-installation-keyboard-navigation.test.ts` - Keyboard event handlers
- [ ] Service method tests for bulk delete with ownership verification
- [ ] Validation schema tests

### Integration Tests
- [ ] Keyboard navigation + table interaction
- [ ] Bulk selection flow (individual, shift+click, select all)
- [ ] Delete confirmation flow (both paths)
- [ ] API endpoint with authentication and validation

### Manual Testing
- [ ] Test with large installation list (100+ items)
- [ ] Test keyboard navigation with screen reader
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test mobile responsiveness (keyboard shortcuts hidden)
- [ ] Test error scenarios (network errors, unauthorized access)

---

## Security Checklist

- [ ] Ownership verification in service layer
- [ ] All API endpoints use `createAuthValidatedApiHandler`
- [ ] Database filtering (no in-memory filtering)
- [ ] Input validation with Zod schemas
- [ ] CSRF protection (Next.js default)
- [ ] Rate limiting considerations

---

## Accessibility Checklist

- [ ] Keyboard navigation works without mouse
- [ ] Visual focus indicators on all interactive elements
- [ ] ARIA labels on buttons and controls
- [ ] Help dialog accessible via keyboard
- [ ] Screen reader friendly (test with NVDA/VoiceOver)
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus trap in dialogs

---

## Files Summary

### New Files (10)
1. ✅ `/src/stores/installation-selection-store.ts`
2. ✅ `/src/hooks/use-installation-keyboard-navigation.ts`
3. ✅ `/src/components/bulk-action-bar.tsx`
4. ✅ `/src/components/delete-confirmation-dialog.tsx`
5. ⬜ `/src/components/uninstall-command-dialog.tsx`
6. ✅ `/src/components/installation-keyboard-shortcuts-dialog.tsx`
7. ✅ `/src/app/api/installations/bulk-delete/route.ts`
8. ✅ `/src/stores/installation-selection-store.test.ts`
9. ✅ `/src/hooks/use-installation-keyboard-navigation.test.ts`
10. ✅ `/src/components/bulk-action-bar.test.tsx`
11. ✅ `/src/components/delete-confirmation-dialog.test.tsx`

### Modified Files (5)
1. ✅ `/src/components/installation-history-table.tsx`
2. ✅ `/src/components/admin/advanced-data-table.tsx`
3. ✅ `/src/services/installation-history.service.ts`
4. ✅ `/src/lib/validation/schemas/installation.schema.ts`
5. ✅ `/src/lib/validation/index.ts`

---

## Session Log

### Session 1 - 2026-01-22
- ✅ Explored codebase (installations page, CommandDialog, keyboard navigation)
- ✅ Asked clarifying questions about implementation approach
- ✅ Created comprehensive implementation plan
- ✅ Created this progress tracking document

**Next Session**: Start with Phase 1.1 (Installation Selection Store)

### Session 2 - 2026-01-22
- ✅ Phase 1.1: Created installation selection store with 44 tests passing
- ✅ Phase 1.2: Added bulk delete validation schema with 20 tests passing
- ✅ Phase 1.3: Implemented bulk delete service method with 10 new tests
- ✅ Phase 1.4: Created bulk delete API endpoint
- ✅ All Phase 1 (Foundation) tasks completed
- ✅ Followed TDD approach throughout
- ✅ All atomic commits with proper messages
- ✅ All tests passing (74 tests across 3 files)
- ✅ Build successful

**Next Session**: Phase 2 (Table Enhancement)

### Session 3 - 2026-01-22
- ✅ Phase 2.1: Enhanced AdvancedDataTable with row selection props
  - Added 7 new optional props for row selection
  - Implemented checkbox column with header/row checkboxes
  - Added indeterminate state support via `data-state="indeterminate"`
  - Applied visual styling for focused/selected rows
- ✅ Phase 2.2: Updated InstallationHistoryTable with selection integration
  - Connected to installation-selection-store
  - Added bulk delete and uninstall dialog state
  - Implemented placeholder BulkActionBar UI
  - Maintained backward compatibility
- ✅ All Phase 2 (Table Enhancement) tasks completed
- ✅ Build successful (TypeScript compiles)
- ✅ Committed changes: `feat(table): add row selection to AdvancedDataTable and InstallationHistoryTable`

**Notes:**
- Shift+click range selection deferred to Phase 3 (Keyboard Navigation)
- Bulk delete flow wiring deferred to Phase 5 (Delete Confirmation Flow)
- BulkActionBar is placeholder UI; full component in Phase 4

**Next Session**: Phase 3 (Keyboard Navigation)

### Session 4 - 2026-01-22
- ✅ Phase 3.1: Keyboard Navigation Hook
  - Found existing implementation with ArrowUp/Down, Space/Enter, Delete, Ctrl+A, Escape, ?
  - Added Home/End key support for jumping to first/last row
  - Fixed data-index to data-row-index attribute for proper scrolling
  - All 11 tests passing
- ✅ Phase 3.2: Keyboard Shortcuts Help Dialog
  - Already implemented with complete UI
  - Lists all keyboard shortcuts including new Home/End keys
  - Integrated into InstallationHistoryTable
- ✅ All Phase 3 (Keyboard Navigation) tasks completed
- ✅ Build successful (TypeScript compiles)
- ✅ All 1260 tests passing
- ✅ Committed changes: `feat(keyboard): add Home/End keys and fix data-row-index attribute`

**Next Session**: Phase 4 (Bulk Actions UI)

### Session 5 - 2026-01-22
- ✅ Phase 4.1: BulkActionBar Component
  - Created BulkActionBar component with full TypeScript types
  - Implemented fixed bottom positioning with z-50 and backdrop blur
  - Added responsive design (stack on mobile, row on desktop)
  - Implemented slide-up animation using Tailwind's animate-in
  - Added loading state with spinner during deletion
  - Created 9 comprehensive tests covering all functionality
  - Replaced placeholder in InstallationHistoryTable
  - Integrated with installation selection store and deletion mutation
- ✅ All Phase 4 (Bulk Actions UI) tasks completed
- ✅ Build successful (TypeScript compiles)
- ✅ All 1269 tests passing (9 new tests added)
- ✅ Committed changes: `feat(bulk-actions): add BulkActionBar component with full integration`

**Next Session**: Phase 5 (Delete Confirmation Flow)

### Session 6 - 2026-01-22
- ✅ Phase 5.1: DeleteConfirmationDialog Component
  - Created DeleteConfirmationDialog with all required props
  - Implemented installation list display (max 10 with overflow)
  - Added warning message with AlertTriangle icon
  - Three action buttons: Cancel, Just Delete, Show Uninstall Commands
  - Fixed HTML validation by using asChild on DialogDescription
  - Created 11 comprehensive tests covering all functionality
  - All tests passing with vitest
- ✅ Phase 5.2: Wire Delete Flow in InstallationHistoryTable
  - Added bulkDeleteMutation for /api/installations/bulk-delete endpoint
  - Implemented handleBulkDelete for immediate deletion
  - Implemented handleShowUninstallCommands (Phase 6 placeholder)
  - Integrated DeleteConfirmationDialog into component
  - Proper error handling with toast notifications
  - Query invalidation and selection clearing on success
  - Selection preserved on error
- ✅ All Phase 5 (Delete Confirmation Flow) tasks completed
- ✅ Build successful (TypeScript compiles)
- ✅ All 1280 tests passing (11 new tests added)
- ✅ Committed changes: `feat(delete-flow): implement bulk delete confirmation dialog with full integration`

**Next Session**: Phase 6 (Uninstall Command Dialog)

---

## Notes & Decisions

### Key Design Decisions

1. **Dedicated Store**: Created `installation-selection-store.ts` instead of local state for better keyboard nav integration and persistence
2. **Bulk Endpoint**: Dedicated `/api/installations/bulk-delete` for atomic transactions and better performance
3. **New UninstallCommandDialog**: Created specialized component instead of reusing CommandDialog due to different data flow
4. **Arrow Keys**: Using conventional arrow keys instead of VIM bindings (j/k) for better accessibility

### Technical Considerations

- CommandDialog uninstall tab is fully functional - use as reference
- AdvancedDataTable changes must be backward compatible
- Follow existing patterns from `selection-store.ts` and `use-keyboard-navigation.ts`
- Use shadcn/ui components consistently
- All API handlers follow standardized middleware patterns

---

## Success Criteria

When all items are checked, the feature is complete:

### Functionality
- [x] Arrow Up/Down navigates rows with visual focus indicator
- [x] Home/End jumps to first/last row
- [x] Space/Enter toggles selection on focused row
- [x] Delete key opens confirmation dialog
- [x] ? opens help dialog with all shortcuts
- [x] Checkboxes allow individual selection
- [ ] Shift+click selects range of rows (deferred)
- [x] Select All/Deselect All works correctly
- [x] Bulk action bar appears when items selected
- [x] Delete confirmation shows two options (show commands / just delete)
- [ ] UninstallCommandDialog shows commands for specific packages (Phase 6)
- [ ] Commands can be copied individually or all at once (Phase 6)
- [ ] Commands can be downloaded as script (Phase 6)
- [x] Deletion works correctly (single and bulk)
- [x] Queries invalidate and UI updates after deletion

### UI/UX
- [x] Table has better spacing and hover effects
- [x] Focused row has visual indicator
- [x] Selected rows have visual indicator
- [x] Animations are smooth and not janky
- [ ] Empty state is more inviting
- [ ] Loading states are clear
- [ ] Error messages are helpful

### Security
- [ ] Only installation owner can delete
- [ ] Bulk delete verifies ownership of ALL installations
- [ ] API endpoints require authentication
- [ ] Input validation works correctly

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing complete
- [ ] Accessibility testing complete
- [ ] Cross-browser testing complete

---

## Questions / Blockers

_Document any questions or blockers encountered during implementation_

None yet.

---

**Last Updated**: 2026-01-22
**Progress**: 73% (11/15 phases complete)
