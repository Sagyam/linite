# Package Discovery System

Automated tools to discover missing packages for existing apps in Linite across different sources (Flathub, Snapcraft, AUR, etc.).

## 🎯 Overview

This system helps you find packages that exist but aren't in your database yet. Reddit users complained that Linite doesn't show all the different ways to install apps - these scripts help solve that problem by:

1. **Discovering missing packages** - Search external APIs for packages you don't have
2. **Improving coverage** - Identify which apps need more package sources
3. **Automating searches** - Batch process multiple apps at once
4. **Prioritizing work** - See which apps have the worst coverage and need attention first

## 📦 Available Scripts

### 1. `discover-packages.ts` - Main Discovery Tool

Discover packages for individual apps or generate coverage reports.

**Usage:**

```bash
# Show coverage report (RECOMMENDED FIRST!)
bun scripts/package-discovery/discover-packages.ts --coverage

# Discover packages for a specific app
bun scripts/package-discovery/discover-packages.ts firefox
bun scripts/package-discovery/discover-packages.ts obs
bun scripts/package-discovery/discover-packages.ts vlc
```

**Features:**
- Searches Flathub, Snapcraft, AUR, and Repology APIs
- Calculates confidence scores (high/medium/low) for matches
- Shows existing packages vs suggested new ones
- Generates detailed JSON reports in `.reports/` folder

**Output Example:**
```
App: VLC Media Player (vlc)
Source: snap
Existing package: vlc

Suggested packages:
  ✅ [HIGH] vlc - The ultimate media player (Exact name match)
  ❓ [LOW] gridplayer - Play multiple videos side-by-side (Appears in search results)
```

### 2. `discover-by-category.ts` - Batch Discovery

Discover packages for all apps in a specific category.

**Usage:**

```bash
# List all categories
bun scripts/package-discovery/discover-by-category.ts --list-categories

# Discover for browsers (13 apps)
bun scripts/package-discovery/discover-by-category.ts browsers

# Discover for AI tools (4 apps)
bun scripts/package-discovery/discover-by-category.ts ai
```

**Features:**
- Processes entire categories at once
- Shows progress as it searches
- Generates ready-to-paste JSON entries for seed files
- Creates category-specific reports

**Bonus Output:**
```javascript
// Add to seed/packages/flatpak.json:
  { "app": "brave", "identifier": "com.brave.Browser", "isAvailable": true, "source": "flatpak" },
```

### 3. `quick-check.ts` - Quick Status Checker

Quickly see which sources have packages for a specific app.

**Usage:**

```bash
# Check a specific app
bun scripts/package-discovery/quick-check.ts firefox

# Show apps with worst coverage (need attention!)
bun scripts/package-discovery/quick-check.ts --missing
```

**Output Example:**
```
Package Availability:

  ✅ flatpak : org.mozilla.firefox
  ✅ snap    : firefox
  ❌ aur
  ✅ apt     : firefox
  ✅ dnf     : firefox
  ✅ pacman  : firefox
  ❌ zypper
  ❌ homebrew
  ✅ nix     : firefox
  ❌ script

Coverage: 6/10 sources (60%)
```

## 🚀 Recommended Workflow

### Step 1: Assess Current State

```bash
bun scripts/package-discovery/discover-packages.ts --coverage
```

This shows your current coverage:
- **Nix**: 71% (best)
- **Pacman**: 67%
- **Flatpak**: 52%
- **Snap**: 40%
- **AUR**: 17% (needs work!)
- **Script**: 7% (very low)

### Step 2: Identify Priority Apps

```bash
bun scripts/package-discovery/quick-check.ts --missing
```

This shows apps with only 1-3 package sources (typically 67+ apps need attention).

### Step 3: Discover by Category

Focus on categories with low coverage:

```bash
bun scripts/package-discovery/discover-by-category.ts browsers
bun scripts/package-discovery/discover-by-category.ts ai
bun scripts/package-discovery/discover-by-category.ts utilities
```

### Step 4: Review and Add Packages

1. Check the confidence level (✅ high is best)
2. Verify the package is correct
3. Copy JSON to appropriate `seed/packages/{source}.json`
4. Run your validation script

### Step 5: Discover Individual Apps

```bash
bun scripts/package-discovery/discover-packages.ts chrome
bun scripts/package-discovery/discover-packages.ts claude-code
```

## 📊 Understanding the Output

### Confidence Levels

- **✅ High**: Exact or very close name match
  - Example: "firefox" → "org.mozilla.firefox"
  - Action: Usually safe to add after quick verification

- **⚠️ Medium**: Partial match or found in description
  - Example: "vscode" → "code" or "visual-studio-code"
  - Action: Check homepage/description before adding

- **❓ Low**: Keyword match or appears in results
  - Example: Related but not exact matches
  - Action: Manually verify it's the right package

### Coverage Report Format

```
flatpak        156 / 220 (71%) ████████████████████████████████████
                └─ Apps  └─ Total  └─ %     └─ Visual bar
```

## 💡 Tips & Best Practices

### 1. Start Small
- Test with 1-2 apps first
- Verify the results are accurate
- Then scale up to categories

### 2. Rate Limiting
The scripts include delays to avoid rate limits:
- 300-500ms between sources
- 500-2000ms between apps

### 3. Manual Verification
Always verify before adding:
- Check package description matches the app
- Verify homepage URL matches
- Confirm it's not a fork or different variant

### 4. Common False Positives
Watch out for:
- Libraries vs applications ("python" finds many python-* packages)
- Different apps with similar names
- Development versions vs stable
- Regional variants

### 5. Alternative Names
Some apps have different package names:
- "vscode" vs "code" vs "visual-studio-code"
- "obs" vs "obs-studio"
- "nodejs" vs "node"

Try searching with alternative names if you get no results.

## 🔧 API Status

### Working APIs ✅
- **Snapcraft**: Works well, good results
- **AUR**: Works well, comprehensive coverage
- **Repology**: Works, but may return some undefined values

### Issues ⚠️
- **Flathub**: API endpoint appears to have changed (getting 404s)
  - You may need to update the Flathub client or use their new API
  - Manual searches on flathub.org still work

### Rate Limits
- **Flathub**: ~60 requests/minute
- **Snapcraft**: ~100 requests/minute
- **AUR**: ~4000 requests/day
- **Repology**: ~60 requests/minute

## 📁 Output Files

All discovery reports are saved to `.reports/` folder (not tracked by git):
- `package-discovery-{app-slug}.json` - Individual app discoveries
- `discovery-{category}-{timestamp}.json` - Category batch discoveries

## 🐛 Troubleshooting

### "API error: 429"
You're being rate limited. Wait a few minutes.

### "No results found"
- Try alternative names (e.g., "vscode" → "code")
- Search manually on the platform
- Some apps may not be available on that source

### "App not found"
Make sure the slug exists in `seed/apps.json`:
```bash
cat seed/apps.json | bun jq -r '.[].slug' | grep firefox
```

## 🎯 Next Steps

### Immediate Actions

1. **Run coverage report**:
   ```bash
   bun scripts/package-discovery/discover-packages.ts --coverage
   ```

2. **Check worst apps**:
   ```bash
   bun scripts/package-discovery/quick-check.ts --missing
   ```

3. **Discover for a high-priority category**:
   ```bash
   bun scripts/package-discovery/discover-by-category.ts browsers
   ```

### Short Term

1. Focus on apps with 10-20% coverage
2. Run discovery for 2-3 categories per day
3. Add 50-100 new packages this week

### Long Term

1. Get all apps to at least 50% coverage
2. Focus on universal sources (Flatpak, Snap)
3. Consider adding more script installers

## 🙏 Contributing

After running discovery:

1. Review the suggestions in the JSON output
2. Manually verify the packages exist and are correct
3. Add entries to the appropriate `seed/packages/{source}.json` file
4. Ensure proper JSON formatting
5. Test with your validation script
6. Commit with a clear message: `feat: add flatpak packages for browsers category`

---

**Happy Package Hunting! 🎉**