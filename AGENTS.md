# Agent Guidelines for POI Project

## Build/Test Commands
- **Full build**: `npm run build` (builds all workspaces)
- **Frontend build**: `cd src/poi_frontend && npm run build` (TypeScript + Vite)
- **Backend deploy**: `dfx deploy` (deploys Motoko canister)
- **Development server**: `npm start` (starts Vite dev server on port 3000)
- **Format code**: `cd src/poi_frontend && npm run format` (Prettier)
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