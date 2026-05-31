# Muxy Extensions

The marketplace for [Muxy](https://muxy.app) extensions. Anyone can fork this
repo, build an extension, and open a pull request to get it listed. Once merged,
each extension is packaged, hashed, and published as a tamper-evident artifact
that the Muxy desktop app can verify and install.

## How it works

```
Fork → develop in extensions/<name>/ → open PR
   → CI validates (schema, paths, permissions, security lint)
   → maintainer reviews and merges
   → CI packs each CHANGED extension, hashes it (SHA-256), signs the zip,
     and uploads it to muxy.app (only what changed, not the whole catalog)
   → muxy.app stores it and serves the marketplace
   → the Muxy app downloads, verifies the signature + hash, and installs
```

## Repository layout

```
extensions/<name>/      one directory per extension (name == manifest.name)
schema/                 manifest.schema.json — the manifest contract
scripts/                validate / pack / publish tooling (Node, no app needed)
examples/hello-world/   a copyable starter extension
.github/                CI workflows, issue + PR templates, CODEOWNERS
```

## Browse and install

Extensions are installed from inside the Muxy desktop app's marketplace, which
reads the catalog served by muxy.app and downloads one signed extension at a
time. You do not install extensions by cloning this repo.

## Contribute an extension

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version:

```bash
# 1. Fork, then copy the starter
cp -R examples/hello-world extensions/my-extension

# 2. Rename it: set manifest.name to "my-extension" (must match the directory)

# 3. Build your extension (see the author guide linked below)

# 4. Validate locally
npm install
node scripts/validate.mjs my-extension

# 5. Commit, push, open a PR
```

The complete extension author guide — manifest fields, the `window.muxy` API,
permissions, and theming — ships inside Muxy and is mirrored at
[muxy.app](https://muxy.app).

## Integrity

At publish time, each extension's zip **and** a metadata document (name, version,
SHA-256, permissions, asset hashes) are individually signed with Muxy's minisign
key. The desktop app verifies both signatures against a pinned public key and
derives every trusted fact from the signed metadata before installing.
See [SECURITY.md](SECURITY.md) for the full trust chain.

## License

[MIT](LICENSE) for the tooling and repository. Individual extensions may carry
their own license.
