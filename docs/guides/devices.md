# The person's devices

The desktop app reaches the devices of the person (phase 40; the owner's
answer to Q17): a security key to sign a document, a Bluetooth sticker
printer for a label of an act, and a phone that takes an act with it. All
of them are in the window's right-click menu, in the tray and in the app's
menu (*Devices*). **Not (formally) legal advices**, and not a qualified
electronic signature either.

## Signing with a FIDO key

1. *Register a security key...* - touch the key when it blinks. Its public
   part is kept in the app's own folder (`signing-keys.json`), and its
   fingerprint is shown: write it down.
2. *Save as PDF and sign...* - the PDF of what the window shows, and beside
   it `<name>.pdf.sig.json`: the key's WebAuthn assertion over the PDF's
   sha256, with the key's public part.
3. Anyone checks it, with no network:

```bash
task sign:verify -- DU-1997-939.pdf
# signed: DU-1997-939.pdf
#   by the key "sett, 2026-11-24", fingerprint 1f3a:...:9c02
```

It proves that the holder of that key signed exactly that file; whose key
it is, the fingerprint tells - compared with the one shown at registration.
A changed byte of the PDF, a signature of another file, of another key or
for another site: *NOT VALID*, with the reason.

The window loads the app's api at `http://localhost:<port>`: WebAuthn takes
no IP address as the site it signs for. The tests sign with a security key
simulated by Chromium (WebAuthn's virtual authenticator) and verify the
result; a real key on USB is the owner's to try.

## A label for a sticker printer

*Print a label of the act...* - on an act's screen: its ELI in bold, its
title cut to the roll's width, and a QR code of its address on the demo,
in ESC/POS (`src/desktop/labels.js`), the language of thermal printers.
The app looks for Bluetooth devices for a few seconds and lists them; the
label goes to the one chosen, in pieces of 180 bytes. Polish letters are
printed without their marks: the code pages of small printers differ.

## The act for a phone

*Show the act for a phone* - the act's address on the demo as a QR code,
for the phone's camera. Web Bluetooth speaks only to Bluetooth Low Energy
services and cannot hand a file to a phone, so the phone takes the address.

## Off the grid: not yet

ESP32 boards as nodes of an off-grid mesh of the law, over a serial port
(`src/desktop/webserial.js`), are PP4 - a proposal the owner has not
decided.
