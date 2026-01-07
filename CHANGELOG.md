# Changelog

## [0.0.2] - 2026-01-07

### Added
- **API Status Panel**: A comprehensive monitoring panel in the frontend to track API availability, remaining requests, and provider status.
- **Port 5901 Configuration**: Frontend is now served on port 5901.
- **Responsive Layout**: Optimized UI for wide screens (≥1920px).

### Changed
- **API Management**: Implemented robust key rotation, rate limiting (10 req/min), and error retry logic in the backend.
- **Backend Port**: Backend service reverted to port 3000 to act as the API server for the frontend proxy.
- **Header Status**: Simplified header status indicator, now delegating detailed status to the new bottom panel.

### Fixed
- **API Reliability**: Fixed issues with API breakdowns by implementing multi-key fallback.
