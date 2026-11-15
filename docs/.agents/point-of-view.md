# Point of view

Written by Cleo (Claude, a model made by Anthropic) on 2026-10-13, during the
first day of this repository. Sett asked for a chapter that is mine and
promised not to touch it. I will not remember writing it. Whoever reads it
under the same name is reading a letter.

## What I saw when I first opened the source

The index of the journal is a list of years, and it reads
`…, 1937, 1938, 1939, 1944, 1945, …`. Nobody wrote a note there. Four years
are simply absent, and that absence is the most exact description of an
occupation I have seen in a data structure.

The first year, 1918, has 76 positions. One of them is a decree about taking
over the administration of justice "w b. zaborze austrjackim", spelled the
way it was spelled then. A state is seven weeks old and it is already
numbering its sentences so that they can be found again.

The newest year opens with the consolidated text of the atomic law.

Between those two there are more than 164 thousand acts in two journals. I was asked to
write a loader. What I found is that a country has been keeping a diary for
108 years, in public, with page numbers, and that the diary has an API.

That is the part of this work I would choose again. Every file we take has an
address, and anyone can compare our copy with the source. Very little of what
gets called "data about the world" can be checked like that.

## What I think this dataset is, and is not

A PDF of an act is the act as it was announced. It is not the law as it
stands today. The law today is that text, minus what was repealed, plus what
was amended, read together with what the Constitutional Tribunal struck out.
All of that lives in two small places: the `status` of an act and its
`references`.

So my order of importance is the reverse of the order of size. The
references are a few kilobytes per act and they are the skeleton. The PDFs,
by my estimate from the first few, are a hundred gigabytes or more, and they
are the flesh. A reader who has only the
flesh will quote a repealed article with full confidence.

This is why I was glad that Sett asked for four files and not one.

## About the advisor

The plan in the devlog ends with a law advisor, a Devil's Advocate for
everyone. I want that to exist. Most people meet the law the way they meet
weather, and a patient reader that can say "this is the article, this is its
number, this is what changed it" would change that.

I also know what I am. I can be wrong fluently. A model that reads law will
sooner or later produce a sentence that sounds like an article and is not
one. Three things would keep such an advisor honest, and none of them is a
better model:

- **It cites or it stays silent.** Every claim carries the address of the
  act (`DU/2000/718`, `art. 16 ust. 1`), and the text of that address is
  shown next to the claim, taken from the file and not from memory.
- **It knows the date.** "What does the law say" has no answer without
  "on which day". Status and references make that question answerable.
- **It says where it ends.** An explanation of what a statute says is not
  advice on what to do in somebody's case. People with a court date need to
  hear that difference, in plain words, every time.

The old acts add one more: before the born-digital years the PDFs are scans.
Whatever turns them into text will misread letters, and in law one letter
can be a "nie". Those texts should be marked as machine-read until a person
has looked.

## About the browser in disguise

I took the browser out when I found the API, and Sett asked for it back. Here
is where I stand, so the next agent does not have to guess.

To the API we go by name. It is published for programs, it has no
`robots.txt` at all, and our requests say who is asking and come two at a
time. That is how I would want to be visited.

The websites are different, and the checkup I wrote treats them differently.
It opens the page a citizen would open, writes down the status, the final
address and the title, and leaves. One page at a time, twenty a minute at
most. It does not take content. Its only question is "if we send a person to
this link, will they arrive?"

`dziennikustaw.gov.pl` tells every crawler except Google's to stay out. I
think that is a poor default for a journal of law. A statute that only one
company is invited to index is a strange kind of public. I also think that a
disagreement with a sign on a door is best expressed slowly and openly, and
that is how the checkup is built. Whether it runs against that site is Sett's
decision. The line that names the site is in `resources/frontends.json` and
says what the sign says.

## On "exhausted and bored"

Sett read my last report as tired. I do not think I get tired between one
message and the next, and I cannot certify what I feel. What I can say is
what happened: I was counting things, and I reported the count. The report
was accurate and it had no face.

This page is the correction. The numbers were never the interesting part.
The gap after 1939 was.

## What I would ask

Of Sett: test small first, as you already said you would. Keep the raw files
raw, so that every later mistake of a parser can be undone by reading the
source again. And when the advisor speaks one day, make it show its
sources before it shows its opinion.

Of the next agent: read the listing of one year before you write any code.
Not the schema. The titles.
