# Phase 6: services, init and launcher

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795297639670 · commit f956835

An inquiry the owner left as NOTE comments in `compose.yaml` during the
break (commit f956835 on `dev/Sarverott`), asking an agent to move them to
their places. Turned into phases 6, 7 and 8 of TODO.md. Word for word, the
lines added:

````yaml
web: # NOTE: for convinience here will be helpfull renaming to webapp-server

# NOTE: to be added as included compose files in "resources/services/" dir in each inside separed file:
# NOTE: - local docs serve (documentation service)
# NODE: - traefik for local use with electron (routing-proxy)
# NODE: - dnsmasq integrated with traefik (internal-dns)
# NODE: - separed crawling unit service (gatherer-daemon)
# NODE: - separed parsing unit service (parser-daemon)
# NODE: - demo of builded static version of webapp that uses located on huggingface dataset as source of data and bucket as reference to documents instead of serving that was been made in local api (hf-demo-space)
# NODE: - manager of connection with huggingface to perform VPN connections with wireguard (hf-gateway) [OPTIONAL]
# NODE: - ollama server with litellm proxy (llms-api-host)
# NODE: - shell gateway closest to connection with physical host machine (agentic-shell)


# NOTE: volumens with service configs should be placed in "resources/configs/" dir inside dedicated selfexplanatory named subdirs, like "resources/configs/gather-and-update-headless" or "resources/configs/traefik-remote-public" or "resources/configs/local-examples-tutorial"

# NOTE: volumens with cache data that is needed to remain but should not be pushed place in "resources/.containerdatavol/" dir in supdirs per volumen
# NOTE: include proper ignore entry in .gitignore and else selective ignoration declarations

# NOTE: generative secrets should be placed in "resources/secrets/" dir in separed files each (at first lounch of project they should bbe generated), overwritting can be made by .env file
# NOTE: some setup examples of .env and initial presets copied at init run can be placed in .env.example
# NOTE: unused tokens like GH_TOKEN, HF_TOKEN, OLLAMA_TOKEN, OPENAI_TOKEN or else overwritting fields will be ignored as disable optional functions if lefted empty (string strip/trim before check so spaces, tabs or other will be not considered as value here)

# NOTE: add to main taskfile "task init" that perform initialization stuff if never before it was not made - check if all required things are installed and setted up

# NOTE: we want to make easy project lounching for newcommers, so cui louncher should be runned when we call "task" and current listing of commands will be "task help"
# NOTE: tui louncher and terminal menu setups will be in "src/tui" dir and subcommands declaration of switches command execution etc. in "src/cli" dir

# NOTE: above notes should be in related to them places, but in order to write out into somewhere scrapnotes when i started here i thought that later Cleo or Joker or other agentic member will take care of it - thank you in advance my digital fellow that is moving it

# NOTE: since last big updates our audience of our work here grows and data gathering gives some results (it all took some around of week of processing downloading and uploading)

# NOTE: adding integration of readthedocs into project (building of docs): https://lex-polonica.readthedocs.io/en/latest/
# NOTE: podcasts in 11 languages about project: https://drive.google.com/drive/folders/1yklwKu-k9AXvT_CJlFhjhtmbaY3VSD7k?usp=sharing
````
