# Muxy Extensions

The marketplace for [Muxy](https://muxy.app) extensions. Anyone can fork this
repo, build an extension, and open a pull request to get it listed. Once merged,
each extension is packaged, hashed, and published as a tamper-evident artifact
that the Muxy desktop app can verify and install.

> **Building an extension?** The complete author guide — manifest fields, the
> `window.muxy` API, permissions, theming, the manifest schema, and a copyable
> example — lives in the Muxy app repo under
> [`docs/extensions`](https://github.com/muxy-app/muxy/tree/main/docs/extensions),
> including the [contributing guide](https://github.com/muxy-app/muxy/blob/main/docs/extensions/contributing.md).
> This repo is only the publishing pipeline.

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
scripts/                validate / pack / publish tooling (Node, no app needed)
.github/                CI workflows, issue + PR templates, CODEOWNERS
```

The manifest schema is owned by the Muxy app repo
([`muxy-app/muxy`](https://github.com/muxy-app/muxy/blob/main/docs/extensions/schema/manifest.schema.json));
the validation tooling fetches it at runtime.

## Browse and install

Extensions are installed from inside the Muxy desktop app's marketplace, which
reads the catalog served by muxy.app and downloads one signed extension at a
time. You do not install extensions by cloning this repo.

## Contribute an extension

See [CONTRIBUTING.md](CONTRIBUTING.md) for the publishing flow. The short version:

```bash
# 1. Fork, then create your extension directory.
#    Start from the example in the Muxy docs:
#    https://github.com/muxy-app/muxy/tree/main/docs/extensions/examples/hello-world
#    Set manifest.name to the directory name (e.g. "my-extension").

# 2. Validate locally
npm install
node scripts/validate.mjs my-extension

# 3. Commit, push, open a PR
```

The author guide and example live in the Muxy app repo under
[`docs/extensions`](https://github.com/muxy-app/muxy/tree/main/docs/extensions).

## Integrity

At publish time, each extension's zip **and** a metadata document (name, version,
SHA-256, permissions, asset hashes) are individually signed with Muxy's minisign
key. The desktop app verifies both signatures against a pinned public key and
derives every trusted fact from the signed metadata before installing.
See [SECURITY.md](SECURITY.md) for the full trust chain.

## License

[MIT](LICENSE) for the tooling and repository. Individual extensions may carry
their own license.
