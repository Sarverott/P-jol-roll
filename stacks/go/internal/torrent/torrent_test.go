package torrent

import (
	"crypto/sha1"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestFilesAndMake(t *testing.T) {
	dir := t.TempDir()
	put := func(path string, data []byte) {
		os.MkdirAll(filepath.Dir(filepath.Join(dir, path)), 0o755)
		os.WriteFile(filepath.Join(dir, path), data, 0o644)
	}
	first := make([]byte, 300*1024)
	for i := range first {
		first[i] = byte(i)
	}
	put("DU/a.pdf", first)
	put("DU/b.json", []byte("{}"))
	put("DU/c.pdf.part", []byte("half")) // being written
	put(".cache/x", []byte("hidden"))    // hidden
	files, err := Files(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(files) != 2 || files[0].Path != "DU/a.pdf" || files[1].Path != "DU/b.json" {
		t.Fatalf("files %v", files)
	}
	made, err := Make(dir, "2026", files, []string{"https://example.org/DU/"}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if made.Piece != 256*1024 || made.Size != 300*1024+2 || made.Files != 2 {
		t.Fatalf("%+v", made)
	}
	// two pieces: the first 256 KiB of a.pdf; the rest of it and b.json
	joined := append(append([]byte{}, first...), []byte("{}")...)
	one, two := sha1.Sum(joined[:256*1024]), sha1.Sum(joined[256*1024:])
	text := string(made.Bytes)
	if !strings.Contains(text, "6:pieces40:"+string(one[:])+string(two[:])) {
		t.Fatal("pieces not as the files hash")
	}
	if !strings.Contains(text, "8:url-listl23:https://example.org/DU/e") {
		t.Fatal("no web seed")
	}
	if !strings.HasPrefix(made.Magnet, "magnet:?xt=urn:btih:"+made.InfoHash+"&dn=2026&ws=https%3A%2F%2Fexample.org%2FDU%2F") {
		t.Fatal(made.Magnet)
	}
	if PieceLength(100<<30) != 16<<20 || PieceLength(1<<20) != 256<<10 {
		t.Fatal("piece lengths")
	}
}
