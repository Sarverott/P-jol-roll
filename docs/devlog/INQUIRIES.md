# INQUIRIES: work asked for in the owner's own words

Written below the line. Agents turn each inquiry into the plan (VISION,
ROADMAP, TODO), move it word for word into the changelog, and leave this file
with its header only.

---


### automation of space refresh

instead of manually repeat of updates of that lightweight huggingface space we can make it been performed by github workflow when project is published as release. also instead of static version there bring version tag loading been made with taskfile and environment overwritting so dockerfile is not edited every time but separed config file. also let's add more functionalities to our GUI interface and TUI louncher - that secound one still required to be improoved, because now it is hard to use, even help manual does not help much.

### fireworks for organic children

our dataset is full of other data than only law acts, bring it to context menu and add more tabs there. as for graph map of all law acts these are lack of controls to zoom in or out or search things - check if we can make something like that.

aditional tab with plots and diagrams also will be usefull.

next tab with status info and statistical metrics with playable animation of law evolution across time - this can be epic! histogram with slider and play-pause button with adjustible speed... yea, lots of not critically required feachers but somehow i have to convince humans that it shines. noone actually currentlu understand what that project means for future of mankind.

ow! almost forgot, bring also there webmcp package for frontend, normal mcp package inside container connected to that openapi and an extensive settings tab.

### credits in footer

place contributors listed in authors file be shown with license notice after clicking "Terms of use". place also there all links related to project that can become handy references. 

### full functionality in every way we run that

most of things has still been made by task invoking, but we want to be able do everything in all interfaces - GUI, TUI, REPL and taskfile calling has to give opportunities to fully access all functions, not just limited part of them.

that can require from you to make a map of functionalities.

first list methods how we can run the project:
- gui desktop
- tui louncher
- openapi server
- repl shell
- cli commands
- taskfile calling
...ETCETERA


then for each runmethod list all that can be done with it
- help
- list acts
...ETCETERA

then we have network that should presenting holes - this is what we need to patch and to make it efficiently it is required to delegate calling from diffrent interfaces we uses same functionalities it has to be unified code of these procedures instead of writting multiple versions of same codes.

if you don't know where to write notes - i remind you that we have something like scrapnotes and even generator for new files like that

let me know if you will have some problems here

> PS. huggingface is same interface with limited functions to mostly reading, but leave related with disable activities buttons and stuff, just turn them disabled with functions and behaviour of disabled stuff by bulma.

### reform of main webpage

it remains very plain and empty. make background some crazy variation with p5.js and maybe our logo image of this project. remember to keep readability of text.