// Package torrent makes a multi-file .torrent (BEP 3) of a directory, with web seeds (BEP 19):
// the same files where they are hosted, so the torrent downloads even when nobody seeds it.
package torrent

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"io/fs"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/Sarverott/P-jol-roll/stacks/go/internal/bencode"
)

// File is one file of a torrent: its path inside the torrent's directory, with slashes.
type File struct {
	Path string `json:"path"`
	Size int64  `json:"size"`
}

// Made is a torrent made: the file's bytes and what is said of it in the index.
type Made struct {
	Name      string   `json:"name"`
	InfoHash  string   `json:"infohash"`
	Magnet    string   `json:"magnet"`
	Size      int64    `json:"size"`
	Files     int      `json:"files"`
	Piece     int      `json:"piece"`
	WebSeeds  []string `json:"webseeds"`
	Bytes     []byte   `json:"-"`
	FilesList []File   `json:"-"`
}

// Files lists what a directory holds, in order: whole files only - no ".part" (a file being
// written), nothing hidden.
func Files(dir string) ([]File, error) {
	var files []File
	err := filepath.WalkDir(dir, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		name := entry.Name()
		if path != dir && strings.HasPrefix(name, ".") {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if entry.IsDir() || strings.HasSuffix(name, ".part") || !entry.Type().IsRegular() {
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		relative, err := filepath.Rel(dir, path)
		if err != nil {
			return err
		}
		files = append(files, File{Path: filepath.ToSlash(relative), Size: info.Size()})
		return nil
	})
	sort.Slice(files, func(a, b int) bool { return files[a].Path < files[b].Path })
	return files, err
}

// PieceLength: a power of two from 256 KiB to 16 MiB, about 2000 pieces a torrent.
func PieceLength(total int64) int {
	piece := 256 * 1024
	for piece < 16*1024*1024 && total/int64(piece) > 2000 {
		piece *= 2
	}
	return piece
}

// Make reads the files of dir (relative paths of Files) into a torrent named name.
func Make(dir, name string, files []File, webSeeds, trackers []string) (*Made, error) {
	if len(files) == 0 {
		return nil, fmt.Errorf("%s: no files", dir)
	}
	var total int64
	for _, file := range files {
		total += file.Size
	}
	piece := PieceLength(total)
	var pieces []byte
	buffer := make([]byte, 0, piece)
	chunk := make([]byte, 1024*1024)
	flush := func() {
		sum := sha1.Sum(buffer)
		pieces = append(pieces, sum[:]...)
		buffer = buffer[:0]
	}
	list := make([]any, 0, len(files))
	for _, file := range files {
		reader, err := os.Open(filepath.Join(dir, filepath.FromSlash(file.Path)))
		if err != nil {
			return nil, err
		}
		var read int64
		for {
			count, err := reader.Read(chunk)
			data := chunk[:count]
			read += int64(count)
			for len(data) > 0 {
				take := min(piece-len(buffer), len(data))
				buffer = append(buffer, data[:take]...)
				data = data[take:]
				if len(buffer) == piece {
					flush()
				}
			}
			if err == io.EOF {
				break
			}
			if err != nil {
				reader.Close()
				return nil, err
			}
		}
		reader.Close()
		if read != file.Size {
			return nil, fmt.Errorf("%s changed while read", file.Path)
		}
		parts := make([]any, 0)
		for _, part := range strings.Split(file.Path, "/") {
			parts = append(parts, part)
		}
		list = append(list, map[string]any{"length": file.Size, "path": parts})
	}
	if len(buffer) > 0 {
		flush()
	}
	info := map[string]any{
		"name":         name,
		"piece length": piece,
		"pieces":       pieces,
		"files":        list,
	}
	encodedInfo, err := bencode.Encode(info)
	if err != nil {
		return nil, err
	}
	sum := sha1.Sum(encodedInfo)
	infoHash := hex.EncodeToString(sum[:])
	whole := map[string]any{
		"info":       info,
		"created by": "P-jol-roll pjolseed",
		"comment":    "Polish journals of laws: https://github.com/Sarverott/P-jol-roll",
	}
	if len(webSeeds) > 0 {
		seeds := make([]any, 0, len(webSeeds))
		for _, seed := range webSeeds {
			seeds = append(seeds, seed)
		}
		whole["url-list"] = seeds
	}
	if len(trackers) > 0 {
		whole["announce"] = trackers[0]
		tiers := make([]any, 0, len(trackers))
		for _, tracker := range trackers {
			tiers = append(tiers, []any{tracker})
		}
		whole["announce-list"] = tiers
	}
	encoded, err := bencode.Encode(whole)
	if err != nil {
		return nil, err
	}
	magnet := url.Values{}
	magnet.Set("dn", name)
	for _, seed := range webSeeds {
		magnet.Add("ws", seed)
	}
	for _, tracker := range trackers {
		magnet.Add("tr", tracker)
	}
	return &Made{
		Name:      name,
		InfoHash:  infoHash,
		Magnet:    "magnet:?xt=urn:btih:" + infoHash + "&" + magnet.Encode(),
		Size:      total,
		Files:     len(files),
		Piece:     piece,
		WebSeeds:  webSeeds,
		Bytes:     encoded,
		FilesList: files,
	}, nil
}
