# LogPoint Service

The LogPoint Service provides a debugging utility that allows you to set conditional breakpoints and logging points in your application. It can be configured through environment variables or at runtime.

##Configuration

Two types of points can be configured:
- Breakpoints (`BREAKPOINTS`)
- LogPoints (`LOGPOINTS`)

These can be set via environment variables or programmatically:

```typescript
// Environment variables
BREAKPOINTS=component1,component2
LOGPOINTS=service1,service2

// Programmatic access
const lp = window.lp; // Global service instance
lp.bpSelectorString.$ = 'component1,component2';
lp.lpSelectorString.$ = 'service1,service2';
```

The service maintains selectors as comma-separated strings and converts them into arrays for matching against your application's components and services.
