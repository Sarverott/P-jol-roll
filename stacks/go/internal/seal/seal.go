// Package seal reads the records of `task seal` (resources/dataset/files/<journal>/<year>.jsonl:
// a file's path, size and sha256) into one root per year - what a mirror tells the chain it holds
// (phase 39). The root: sha256 of "<path> <sha256>\n" of every file, sorted by path, a file's
// newest record counting. Two mirrors with the same files have the same root.
package seal

import (
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// Year is one year of a journal as sealed here.
type Year struct {
	Journal string `json:"journal"`
	Year    int    `json:"year"`
	Root    string `json:"root"`
	Files   int    `json:"files"`
}

var tableName = regexp.MustCompile(`^(\d{4})\.jsonl$`)

// RootOf a year's table of records.
func RootOf(path string) (string, int, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", 0, err
	}
	defer file.Close()
	latest := map[string]string{}
	lines := bufio.NewScanner(file)
	lines.Buffer(make([]byte, 1024*1024), 16*1024*1024)
	for lines.Scan() {
		var record struct {
			Path   string `json:"path"`
			SHA256 string `json:"sha256"`
		}
		if strings.TrimSpace(lines.Text()) == "" {
			continue
		}
		if err := json.Unmarshal(lines.Bytes(), &record); err != nil {
			return "", 0, fmt.Errorf("%s: %w", path, err)
		}
		if record.Path != "" && record.SHA256 != "" {
			latest[record.Path] = record.SHA256
		}
	}
	if err := lines.Err(); err != nil {
		return "", 0, err
	}
	paths := make([]string, 0, len(latest))
	for one := range latest {
		paths = append(paths, one)
	}
	sort.Strings(paths)
	sum := sha256.New()
	for _, one := range paths {
		fmt.Fprintf(sum, "%s %s\n", one, latest[one])
	}
	return hex.EncodeToString(sum.Sum(nil)), len(paths), nil
}

// Years are the roots of every year sealed under dataset/files/ (of one journal, when named).
func Years(resources, journal string) ([]Year, error) {
	root := filepath.Join(resources, "dataset", "files")
	journals, err := os.ReadDir(root)
	if err != nil {
		return nil, err
	}
	var years []Year
	for _, dir := range journals {
		if !dir.IsDir() || (journal != "" && dir.Name() != journal) {
			continue
		}
		tables, _ := os.ReadDir(filepath.Join(root, dir.Name()))
		for _, table := range tables {
			match := tableName.FindStringSubmatch(table.Name())
			if match == nil {
				continue
			}
			sealed, files, err := RootOf(filepath.Join(root, dir.Name(), table.Name()))
			if err != nil {
				return nil, err
			}
			year, _ := strconv.Atoi(match[1])
			years = append(years, Year{dir.Name(), year, sealed, files})
		}
	}
	sort.Slice(years, func(a, b int) bool {
		return years[a].Journal < years[b].Journal || (years[a].Journal == years[b].Journal && years[a].Year < years[b].Year)
	})
	return years, nil
}
