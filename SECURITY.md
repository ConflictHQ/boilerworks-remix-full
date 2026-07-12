# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Boilerworks, please report it responsibly.

**Do not open a public issue.**

Instead, email **security@weareconflict.com** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge your report within 48 hours and aim to release a fix within 7 days for critical issues.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | Yes       |

## Security Best Practices

When deploying Boilerworks:

- Change all default credentials (PostgreSQL user/password, seeded admin account)
- Set `SESSION_SECRET` to a strong random value (at least 32 characters)
- Use HTTPS in production
- Set `NODE_ENV=production`
- Review the auth conventions in `bootstrap.md`
