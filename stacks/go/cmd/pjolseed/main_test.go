package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestSeedMakesThenKeeps(t *testing.T) {
	resources := t.TempDir()
	put := func(path, data string) {
		os.MkdirAll(filepath.Dir(filepath.Join(resources, path)), 0o755)
		os.WriteFile(filepath.Join(resources, path), []byte(data), 0o644)
	}
	put("dataset/acts/DU/2026.jsonl", "{}\n")
	put("dataset/.cache/x", "hidden")
	put("bucket/DU/2026/WDU20260000001.json", "{}")
	put("bucket/sejm/term10/processes/1.json", "{}")
	parts := Parts(resources, "https://hf/d", "https://hf/b", "")
	if len(parts) != 3 || parts[1].WebSeed != "https://hf/b/DU/" || parts[2].Name != "term10" {
		t.Fatalf("%+v", parts)
	}
	out := filepath.Join(resources, "torrents")
	var said []string
	log := func(line string) { said = append(said, line) }
	index, root, err := Seed(context.Background(), parts, out, nil, 0, log)
	if err != nil {
		t.Fatal(err)
	}
	if len(index.Torrents) != 3 || len(said) != 3 || root == "" {
		t.Fatalf("%d torrents, said %v", len(index.Torrents), said)
	}
	for _, name := range []string{"dataset-acts.torrent", "bucket-DU-2026.torrent", "bucket-sejm-term10.torrent", "index.json", "torrents.car", "ROOT"} {
		if _, err := os.Stat(filepath.Join(out, name)); err != nil {
			t.Error(err)
		}
	}
	// again with nothing changed: every torrent kept, none made, the same root
	said = nil
	_, again, err := Seed(context.Background(), parts, out, nil, 0, log)
	if err != nil || len(said) != 0 || again != root {
		t.Fatalf("made again: %v %v %s", err, said, again)
	}
	// one file more: that torrent made again, the root changes
	put("bucket/DU/2026/WDU20260000002.json", "{}")
	index, changed, _ := Seed(context.Background(), parts, out, nil, 0, log)
	if len(said) != 1 || changed == root {
		t.Fatalf("said %v", said)
	}
	data, _ := os.ReadFile(filepath.Join(out, "index.json"))
	var read Index
	json.Unmarshal(data, &read)
	if read.Torrents[0].CID == "" || read.Torrents[0].Magnet == "" {
		t.Fatalf("%+v", read.Torrents[0])
	}
}
