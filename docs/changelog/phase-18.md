# Phase 18: what broke after v0.15.0, and the almanac

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795339760691 · commit 1e2f478

The owner's message in the chat, 2026-11-22, after PR #29 (v0.15.0) was
merged and released. It asks for the CodeQL alerts, the errors of the push
and the failed container to be resolved, and for an almanac of the cases
met so far (phase 18). Word for word:

```text
welp, we had a problem there. codeQL raported security vurnbilitiy of our code and i believe that it should be resolved there by quick glance of the place in code. check that issue. attempt to push dataset also returns something that bothers me, so check all new errors in logs. we need to list cases we already faces as issues that can be opened on github, presented how they were solved and as reference related to topics articles in `docs/almanac` dir as place for common problems, FAQ, solutions that we came up with while we had work with that data and more. if I'm not wrong that sort of solving and ruleseting was presented already in BOS main repo - here you can reproduce that almanac mechanics (BOS prototyping of methods and processing in project). container was faild - safety check rejects it when detected this issue raport from codeQL.. begin your duties and i will prepare plan for production and releasing stuff of app.
```

**What was found:** the container did not fail on CodeQL. The release run's
image build stopped in `tsc`, because `resources/locales/` was kept out of
the image by `.dockerignore`. CodeQL's 15 alerts (the first scan of
`codeql.yml`) were a separate thing, and one of them was real: in the
demo's remote mode, a journal `..` from an address named a file beside the
dataset. The push was refused by Hugging Face for a text holding control
characters, which it took for a binary file. All of it is in
`docs/almanac/cataclistics/`.
