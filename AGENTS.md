# Agent Guidelines for POI Project

## Build/Test Commands
- **Full build**: `dfx build --network ic --verbose` (builds all canisters for mainnet with verbose output)
- **Backend deploy**: Ask the user to run `dfx deploy --ic` (deploys Motoko and frontend canister to mainnet, requires user input for password)
- **Generate types**: `dfx generate` (updates Candid interface)

## Code Style Guidelines

### TypeScript/React
- **Strict mode**: Always enabled (`"strict": true`)
- **JSX**: Use `react-jsx` transform
- **Imports**: ES modules, use path aliases (`declarations/` for IC types)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Types**: Explicit typing required, use interfaces for complex objects
- **Error handling**: Use try/catch with async/await, handle IC agent errors

### Motoko
- **Actor pattern**: Use persistent actors for stateful canisters
- **Naming**: camelCase for functions, PascalCase for types
- **Error handling**: Use Result types, avoid throwing exceptions
- **Imports**: Import from base library (`import Result "mo:base/Result"`)

### General
- **Formatting**: Prettier for JS/TS/JSX/SCSS files
- **No semicolons**: ES modules style (optional semicolons)
- **Single quotes**: For string literals
- **No comments**: Unless explicitly requested by user

## Styling
- **CSS Framework**: Tailwind CSS v4 with dark theme
- **Build Process**: Integrated with dfx build system
- **PostCSS**: Configured for Tailwind CSS v4
