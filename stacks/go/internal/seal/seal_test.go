package seal

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"testing"
)

func TestRootsOfTheRecords(t *testing.T) {
	resources := t.TempDir()
	dir := filepath.Join(resources, "dataset", "files", "DU")
	os.MkdirAll(dir, 0o755)
	// b.pdf gathered twice: its newer record counts; the order of the lines does not matter
	os.WriteFile(filepath.Join(dir, "2026.jsonl"), []byte(
		`{"path":"DU/2026/b.pdf","sha256":"old"}`+"\n"+
			`{"path":"DU/2026/a.json","sha256":"aa","size":2}`+"\n\n"+
			`{"path":"DU/2026/b.pdf","sha256":"bb"}`+"\n"), 0o644)
	os.WriteFile(filepath.Join(dir, "notes.txt"), []byte("not a year"), 0o644)
	years, err := Years(resources, "")
	if err != nil {
		t.Fatal(err)
	}
	sum := sha256.Sum256([]byte("DU/2026/a.json aa\nDU/2026/b.pdf bb\n"))
	if len(years) != 1 || years[0] != (Year{"DU", 2026, hex.EncodeToString(sum[:]), 2}) {
		t.Fatalf("%+v", years)
	}
	if none, _ := Years(resources, "MP"); len(none) != 0 {
		t.Fatal("another journal's years")
	}
}
