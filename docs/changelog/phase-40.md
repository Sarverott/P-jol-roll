# Phase 40: the person's devices in the desktop app

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795527217294 · commit 0d7f273

No new words of the owner: the order of phase 35 goes on. The phase of
VISION, from the owner's answer to Q17 (changelog phase 22):

> the person's devices in the desktop app: printers, phones, FIDO keys for
> signing (Q17)

The decision on Q17: "the desktop app reaches devices of the person:
Bluetooth for sticker printers and phones, USB HID like FIDO keys and
printers, so a document can be printed and signed digitally from the app;
offered in the context menus of the tray and of the window. Printing comes
first (this phase); pairing devices and signing are a phase of their own."

Understood as:

- **Signing with a FIDO key** (USB HID, by WebAuthn): a security key
  registered once in the app; then "Save as PDF and sign" signs the PDF's
  sha256 with it - the signature beside the PDF (`.sig.json`), holding
  the key's public part, so anyone verifies it (`task sign:verify`). Not
  a qualified electronic signature of eIDAS: a proof that the holder of
  that key signed that file.
- **Sticker printers over Bluetooth**: a label of an act - its ELI, its
  title, a QR code of its address - in ESC/POS, the language of thermal
  printers, sent over Web Bluetooth to the printer the person picks.
- **Phones**: Web Bluetooth cannot send a file to a phone (it speaks only
  to Bluetooth Low Energy services, not to a phone's file transfer), so the
  phone takes the act by its camera: a QR code of its address on the demo,
  shown by the app.
- All three in the window's right-click menu, the tray and the menu of the
  app. Checked here as far as no device is needed: the signature's
  verification, a security key simulated in Chromium (WebAuthn's virtual
  authenticator), the bytes of a label. The real key, printer and phone are
  the owner's to try.
