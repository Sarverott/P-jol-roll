import { sha256 as digest } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

/*
The key of a text in a language pack (hooks.ts): the SHA-256 of its English, as 64 hex digits.
It has to be synchronous and the same in a browser, in node and in a terminal: crypto.subtle
of browsers only answers asynchronously and node:crypto is not in a browser. So it is
@noble/hashes - small, audited, the same code everywhere.
  sha256("search") -> "24193290...3717", the same as `printf %s search | sha256sum`
*/
// NOTE: say what?!?!?!? make it more clear please...
// ANSWER: done - the hand-written SHA-256 (64 rounds of bit twiddling) is gone; an audited library
// does it, and this file only says why a synchronous hash is needed at all

export const sha256 = (text: string): string =>
	bytesToHex(digest(utf8ToBytes(text)));
