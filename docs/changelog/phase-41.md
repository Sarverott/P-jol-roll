# Phase 41: sources that hold - Sejm, SAOS and the courts' own portals

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795534187118 · commit 86ffc140

The owner's message in the chat, 2026-11-24, after the badges and the
security updates. Word for word:

```text
Check Dev branches, dependabot has some PRs merged there, but it was conflicting so check, review and fix if it is needed. After that you can check saos and sejm API - they does not work so well and these can be provided by other related sources of government servers. Besides that let's add to our dataset and into bucket also international sets of laws that are adopted by Poland besides own codex of laws. To be interdisciplinary add government contract tenders and any of important local and regional statements or decisions. We want to make autoraporting mechanics by mail to authorities like polish police, army, CBA, ABW, AW, CERT, NASK and other like that. We need to list all gov offices emails for official contact data with phones and addresses, including OpenStreetMap pinning of coords of places, government IPs and other like that - that is our declaration of transparency. Any decisions you want from me or questions to be answered you shall place as Qs and they should invoke creation of new issue on GitHub. Next will be integrations for mirrors on Bitbucket, Gitlab, sourcehut, gitea Official and own selfhostable gitea container - each platform carries same rules for milestones creation, PR and devlog relation, or else adopted things on GitHub. For public information we want to post linked announcement from GitHub discussion's announcements link on Tumblr, X, blogger, telegram, discord and mastodon. All of that is a lot so split it into phases that we want do before that next upcoming. Go ahead, plan your work and start to realize it with no pauses until something important holds for my attention there
```

Understood as:

- **The dev branches** were checked first: `dev/dependabot` held #125,
  #126, #128 and #130, their conflicts resolved on GitHub; every module in
  them was already in `development` at the same or a newer version, so
  the branch was merged keeping those and brought up to `development`.
  `dev/Jarvis` and `dev/Sarverott` hold nothing that has not landed.
- **The order split into phases** before the one planned next (ESP32, now
  phase 48), each in VISION and ROADMAP (milestone M6):
  41 sources that hold, 42 international law adopted by Poland, 43 public
  tenders and local and regional law, 44 the declaration of transparency
  (every public office's contacts, its place on OpenStreetMap, the address
  space of the state), 45 reports to the authorities by mail, 46 mirrors
  on GitLab, Bitbucket, sourcehut, Gitea and a Gitea of our own, 47
  announcements on Tumblr, X, Blogger, Telegram, Discord and Mastodon.
- **The questions** (Q20-Q24 of BRAINSTORM) open issues on GitHub as every
  question of the devlog does (`devlog.yml`). A phase that waits for one
  is built as far as it goes without the answer.
- **This phase**: what was found probing the sources on 2026-11-24 - the
  lists of the Sejm API answer in under 5 s, a day's transcripts in 26 s
  or more (40 s timed out), its PDF in 6 s; SAOS answers fast but holds
  judgments dated 3013 and 2101, and is fed from the courts' own portals,
  whose `ncourt-api` is not public. So: the transcripts given time and a
  fallback, the dates of SAOS checked, and the judgments of the common
  courts' Portal Orzeczeń taken from it directly.
