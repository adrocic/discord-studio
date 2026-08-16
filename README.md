# Guildcraft

Guildcraft is a free, privacy-friendly Discord server blueprint builder. It turns a short guided workflow into an implementation-ready JSON plan for:

- purpose, audience, expected scale, and join model;
- categories, text/voice/forum channels, topics, and visibility;
- ordered role layers and permission presets;
- onboarding, verification, AutoMod, media filtering, and moderator logs;
- community agreements;
- minimum bot OAuth scopes, a calculated Discord permission integer, and a safe operator checklist.

Everything runs in the browser. There is no account, analytics, build step, database, or bot token field. Drafts remain in the current browser using local storage.

## Included playbooks

- **Competitive team** — designed around a 5–7 player tournament roster, with availability, scrims, champion pools, strategy, VOD review, match-day voice, and captain-only tournament administration.
- **Project team** — decisions, planning, delivery, reviews, and private admin context.
- **Community** — arrival, conversation, events, showcases, feedback, and moderation.
- **Creator hub** — audience conversation, releases, live events, support, and member showcases.

The competitive playbook was informed by the public [Beer League Esports](https://beer-league.games/) workflow: persistent teams, seasonal rosters, weekly matches, flexible scheduling, tournament codes, and game statistics. Guildcraft is not affiliated with Beer League Esports, Riot Games, Discord, or their respective products.

## Run locally

Open `index.html` directly in a modern browser, or serve the folder locally:

```powershell
python -m http.server 4173 --directory .
```

Then open `http://localhost:4173`.

## Publish on GitHub Pages

This repository includes a zero-build Pages workflow.

1. Create a public GitHub repository and put these files at its root.
2. Push the default branch to GitHub.
3. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The `Deploy static site to Pages` workflow publishes the app.

GitHub will show the public URL in the deployment summary. No environment variables or secrets are needed.

## Security boundary

Guildcraft deliberately does not ask for a Discord bot token. To automate server changes, pass the exported JSON blueprint to a trusted server-side deployment service that reads the token from a secrets manager or environment variable.

Discord does not allow bots to create a server for a user. An authorized person creates the server and installs the builder bot. The bot can then create roles, categories, channels, and permission overwrites within its role hierarchy. Grant only the permissions listed by the blueprint, keep the builder role above only the roles it manages, and remove it after deployment if ongoing synchronization is unnecessary.

## Contributing

Issues and pull requests are welcome. Keep new playbooks general, keep the static/no-account privacy model intact, and do not add third-party tracking. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
