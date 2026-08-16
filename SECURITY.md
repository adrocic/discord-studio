# Security policy

## Reporting

Please report suspected vulnerabilities privately through GitHub's **Security → Report a vulnerability** flow when enabled. Do not open a public issue containing secrets or an exploit with user impact.

## Scope

Guildcraft is a static planning tool. It should never request, store, transmit, or log Discord bot tokens, OAuth client secrets, member lists, or private server data. Browser local storage contains only the blueprint the user enters.

Any future deployer must be a separate trusted server-side component with authenticated access, CSRF protection, encrypted secret storage, audit logging, rate-limit handling, and strict validation of the exported schema.
