// pjolseed: the dataset and the bucket as torrents, pointed to by IPFS (phase 37).
//
//	pjolseed torrents [-only dataset|bucket] [-limit N] [-dry]
//	pjolseed version
//
// One torrent per part of the dataset (acts, details, texts, ...) and per journal and year of the
// bucket (DU 2026, sejm term10, ...), made from the files of resources/ here, each with web seeds
// (BEP 19) on Hugging Face - the same files where they are hosted - so it downloads even when
// nobody seeds it. A torrent whose files did not change (paths and sizes) is kept, not hashed
// again. Then the torrents and their index as one UnixFS directory, CIDs computed offline, and a
// CAR file of it: resources/torrents/
//
//	<part>-<name>.torrent   the torrents
//	index.json              each with its infohash, magnet link, size, web seeds and CID
//	torrents.car            the directory for any IPFS node: ipfs dag import torrents.car
//	ROOT                    its root CID - where the torrents are found on IPFS
//
// Nothing is sent anywhere: putting it on IPFS is the owner's move (task torrents:publish).
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/Sarverott/P-jol-roll/stacks/go/internal/ipfs"
	"github.com/Sarverott/P-jol-roll/stacks/go/internal/torrent"
)

// Version is the project's one version, kept by src/devtools/version.ts.
const Version = "0.40.0"

// Part is one torrent to make: a directory of resources/ and where its files are on the web.
type Part struct {
	Part    string // dataset, bucket-DU, bucket-sejm
	Name    string // the torrent's directory: acts, 2026, term10
	Dir     string
	WebSeed string
}

// Entry is a line of the index.
type Entry struct {
	File        string `json:"file"`
	Part        string `json:"part"`
	CID         string `json:"cid"`
	Fingerprint string `json:"fingerprint"` // sha256 of its files' paths and sizes
	torrent.Made
}

// Index is resources/torrents/index.json.
type Index struct {
	Made     string  `json:"made"`
	Version  string  `json:"version"`
	Torrents []Entry `json:"torrents"`
}

var plain = regexp.MustCompile(`^[\w][\w.-]*$`)

func setting(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return strings.TrimRight(value, "/")
	}
	return fallback
}

func subdirs(dir string) []string {
	entries, _ := os.ReadDir(dir)
	var names []string
	for _, entry := range entries {
		if entry.IsDir() && plain.MatchString(entry.Name()) {
			names = append(names, entry.Name())
		}
	}
	sort.Strings(names)
	return names
}

// Parts lists the torrents resources/ makes: every directory of the dataset, every year (or
// term) of every journal of the bucket.
func Parts(resources, datasetURL, bucketURL, only string) []Part {
	var parts []Part
	if only == "" || only == "dataset" {
		for _, name := range subdirs(filepath.Join(resources, "dataset")) {
			parts = append(parts, Part{"dataset", name, filepath.Join(resources, "dataset", name), datasetURL + "/"})
		}
	}
	if only == "" || only == "bucket" {
		for _, journal := range subdirs(filepath.Join(resources, "bucket")) {
			for _, name := range subdirs(filepath.Join(resources, "bucket", journal)) {
				parts = append(parts, Part{"bucket-" + journal, name, filepath.Join(resources, "bucket", journal, name), bucketURL + "/" + journal + "/"})
			}
		}
	}
	return parts
}

func fingerprint(files []torrent.File) string {
	sum := sha256.New()
	for _, file := range files {
		fmt.Fprintf(sum, "%s %d\n", file.Path, file.Size)
	}
	return hex.EncodeToString(sum.Sum(nil))
}

// Seed makes (or keeps) the torrents of the parts in out, then the IPFS directory of them.
func Seed(ctx context.Context, parts []Part, out string, trackers []string, limit int, log func(string)) (*Index, string, error) {
	if err := os.MkdirAll(out, 0o755); err != nil {
		return nil, "", err
	}
	previous := map[string]Entry{}
	if data, err := os.ReadFile(filepath.Join(out, "index.json")); err == nil {
		var index Index
		if json.Unmarshal(data, &index) == nil {
			for _, entry := range index.Torrents {
				previous[entry.File] = entry
			}
		}
	}
	index := &Index{Made: time.Now().UTC().Format(time.RFC3339), Version: Version}
	contents := map[string][]byte{}
	made := 0
	for _, part := range parts {
		file := part.Part + "-" + part.Name + ".torrent"
		files, err := torrent.Files(part.Dir)
		if err != nil {
			return nil, "", err
		}
		if len(files) == 0 {
			continue
		}
		print := fingerprint(files)
		path := filepath.Join(out, file)
		if old, ok := previous[file]; ok && old.Fingerprint == print && old.WebSeeds != nil && len(old.WebSeeds) > 0 && old.WebSeeds[0] == part.WebSeed {
			if data, err := os.ReadFile(path); err == nil {
				contents[file] = data
				index.Torrents = append(index.Torrents, old)
				continue
			}
		}
		if limit > 0 && made >= limit {
			continue
		}
		log(fmt.Sprintf("%s: %d files", file, len(files)))
		torrentMade, err := torrent.Make(part.Dir, part.Name, files, []string{part.WebSeed}, trackers)
		if err != nil {
			return nil, "", err
		}
		if err := writeWhole(path, torrentMade.Bytes); err != nil {
			return nil, "", err
		}
		contents[file] = torrentMade.Bytes
		index.Torrents = append(index.Torrents, Entry{File: file, Part: part.Part, Fingerprint: print, Made: *torrentMade})
		made++
	}
	if len(contents) == 0 {
		return nil, "", fmt.Errorf("no files to make torrents of")
	}
	// the CIDs of the torrents first, written into the index; then the index beside them
	torrents, err := ipfs.Build(ctx, contents)
	if err != nil {
		return nil, "", err
	}
	for at := range index.Torrents {
		index.Torrents[at].CID = torrents.Files[index.Torrents[at].File].String()
	}
	sort.Slice(index.Torrents, func(a, b int) bool { return index.Torrents[a].File < index.Torrents[b].File })
	data, err := json.MarshalIndent(index, "", "\t")
	if err != nil {
		return nil, "", err
	}
	data = append(data, '\n')
	if err := writeWhole(filepath.Join(out, "index.json"), data); err != nil {
		return nil, "", err
	}
	contents["index.json"] = data
	directory, err := ipfs.Build(ctx, contents)
	if err != nil {
		return nil, "", err
	}
	car := filepath.Join(out, "torrents.car")
	os.Remove(car + ".part")
	if err := directory.WriteCar(ctx, car+".part"); err != nil {
		return nil, "", err
	}
	if err := os.Rename(car+".part", car); err != nil {
		return nil, "", err
	}
	root := directory.Root.String()
	return index, root, writeWhole(filepath.Join(out, "ROOT"), []byte(root+"\n"))
}

// a file appears under its name only when it is whole, as everywhere in the project
func writeWhole(path string, data []byte) error {
	if err := os.WriteFile(path+".part", data, 0o644); err != nil {
		return err
	}
	return os.Rename(path+".part", path)
}

func main() {
	if len(os.Args) < 2 || (os.Args[1] != "torrents" && os.Args[1] != "version") {
		fmt.Fprintln(os.Stderr, "usage: pjolseed torrents [-only dataset|bucket] [-limit N] [-dry] | pjolseed version")
		os.Exit(2)
	}
	if os.Args[1] == "version" {
		fmt.Println(Version)
		return
	}
	flags := flag.NewFlagSet("torrents", flag.ExitOnError)
	resources := flags.String("resources", setting("RESOURCES_DIR", "../../resources"), "the resources/ of the project")
	only := flags.String("only", "", "dataset or bucket; both when empty")
	limit := flags.Int("limit", 0, "torrents made (not kept) in one run; 0: all")
	dry := flags.Bool("dry", false, "only say what would be made")
	flags.Parse(os.Args[2:])
	datasetURL := setting("DATASET_URL", "https://huggingface.co/datasets/Sarverott/polish_national_law_docs/resolve/main")
	bucketURL := setting("BUCKET_URL", "https://huggingface.co/buckets/Sarverott/raw-law-of-poland/resolve")
	var trackers []string
	for _, tracker := range strings.Split(os.Getenv("TORRENT_TRACKERS"), ",") {
		if tracker = strings.TrimSpace(tracker); tracker != "" {
			trackers = append(trackers, tracker)
		}
	}
	parts := Parts(*resources, datasetURL, bucketURL, *only)
	if *dry {
		for _, part := range parts {
			files, _ := torrent.Files(part.Dir)
			var size int64
			for _, file := range files {
				size += file.Size
			}
			fmt.Printf("%s-%s.torrent\t%d files\t%.1f MB\t%s%s/\n", part.Part, part.Name, len(files), float64(size)/1e6, part.WebSeed, part.Name)
		}
		return
	}
	out := filepath.Join(*resources, "torrents")
	index, root, err := Seed(context.Background(), parts, out, trackers, *limit, func(line string) { fmt.Fprintln(os.Stderr, line) })
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf("%d torrents in %s\nIPFS root: %s (torrents.car: ipfs dag import, or task torrents:publish)\n", len(index.Torrents), out, root)
}
