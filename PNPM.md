# Using pnpm

This project uses **pnpm** instead of npm for package management. pnpm is faster and more efficient because it uses a content-addressable store, avoiding duplication of dependencies across projects.

## Why pnpm?

- 🚀 **Faster**: Up to 2x faster than npm
- 💾 **Saves disk space**: Shared dependencies across projects
- 🔒 **Strict**: Better dependency management
- 📦 **Compatible**: Works with all npm packages

## Installation

### Install pnpm globally

```bash
npm install -g pnpm
```

Or via alternative methods:
```bash
# Using Homebrew (macOS)
brew install pnpm

# Using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Verify installation:
```bash
pnpm --version
```

## Usage

All npm commands work with pnpm:

```bash
# Install dependencies
pnpm install

# Add a package
pnpm add <package>

# Add a dev dependency
pnpm add -D <package>

# Run scripts
pnpm dev
pnpm build
pnpm test

# Update dependencies
pnpm update

# Remove a package
pnpm remove <package>
```

## Project Commands

```bash
# Install all dependencies
make install
# or
pnpm install

# Run dev server
make dev
# or
pnpm dev

# Run tests
make test-crypto
# or
pnpm test

# Build frontend
pnpm build

# Start production server
pnpm start
```

## Migration from npm

If you previously used npm:

1. Delete `node_modules/` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. Install with pnpm:
   ```bash
   pnpm install
   ```

3. pnpm creates `pnpm-lock.yaml` (already in .gitignore)

## Troubleshooting

### "pnpm: command not found"
- Install pnpm: `npm install -g pnpm`
- Or use the installation script: `curl -fsSL https://get.pnpm.io/install.sh | sh -`

### Slow installation
- pnpm is usually faster, but first install creates the store
- Subsequent installs will be much faster

### Permission errors
- Use `pnpm setup` to configure pnpm properly
- Or install with `npm install -g pnpm` (may need sudo)

## Resources

- [pnpm Documentation](https://pnpm.io/)
- [pnpm vs npm](https://pnpm.io/pnpm-vs-npm)
- [Benchmarks](https://pnpm.io/benchmarks)

---

For more details, see the main [README.md](README.md)
