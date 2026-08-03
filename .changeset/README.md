# Changesets

Run `pnpm changeset` with any change that should ship; both packages version
in lockstep (see `config.json` `fixed`). Merging to main updates the
"Version Packages" PR; merging that PR publishes to npm and tags the release.
