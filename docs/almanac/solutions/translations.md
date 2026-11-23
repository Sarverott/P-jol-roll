# Translations

How the packs are made and used is in [the guide](../../guides/translations.md);
here is what went wrong on the way.

- Vite's glob skips dotfiles: `.index.json` is imported by name.
- linkedom reports no `characterData` mutations: tests of the observer run
  in jsdom.
- Machine translation changes names: names, identifiers and named places
  stand in as numbers while the model works; a person reviews the rest.
- The packs are a submodule since phase 28, their gist the source: a checkout
  or an image without `git submodule update --init resources/locales` has no
  packs - the break of [the image without packs](../cataclistics/container-missing-locales.md)
  again - so every workflow that builds takes it, and `task init` names it.

## Cases

- [The index of language packs is missing from the viewer](../cataclistics/vite-glob-dotfiles.md)
- [Translations of what Vue renders later cannot be tested in linkedom](../cataclistics/i18n-test-dom.md)
- [Machine translation changes names and identifiers](../cataclistics/argos-mangles-names.md)
- [The release image does not build: language packs left out](../cataclistics/container-missing-locales.md)
