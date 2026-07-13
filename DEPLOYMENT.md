# Corinthians Study deployment

The production site is configured for:

`https://corinthians.mybibleexplorer.com`

The Next.js application uses a static export. A push to `main` runs the checks, builds the site into `out/`, uploads the Pages artifact, and deploys it through GitHub Actions.

## One-time GitHub setup

1. Create the repository at `https://github.com/samirtharaj7-creator/Corinthians` and push this project to its `main` branch.
2. Open **Settings → Pages** in the repository and select **GitHub Actions** as the publishing source.
3. In the Pages custom-domain field, enter `corinthians.mybibleexplorer.com`.
4. At the DNS provider for `mybibleexplorer.com`, add this record:

   | Type | Host | Target |
   | --- | --- | --- |
   | CNAME | `corinthians` | `samirtharaj7-creator.github.io` |

5. After GitHub provisions the certificate, enable **Enforce HTTPS**.

Verifying `mybibleexplorer.com` in the GitHub account settings is also recommended to protect its Pages subdomains from takeover.

## Local production check

```bash
npm ci
NEXT_PUBLIC_SITE_URL=https://corinthians.mybibleexplorer.com npm run build
```

The generated `out/` directory must contain `index.html`, `404.html`, `.nojekyll`, and `CNAME`.
