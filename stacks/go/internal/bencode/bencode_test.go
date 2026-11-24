package bencode

import "testing"

func TestEncode(t *testing.T) {
	got, err := Encode(map[string]any{
		"name": "acts", "piece length": 262144, "files": []any{map[string]any{"length": int64(3), "path": []any{"DU", "2026.jsonl"}}},
	})
	if err != nil {
		t.Fatal(err)
	}
	// keys in byte order: "files" < "name" < "piece length"
	want := "d5:filesld6:lengthi3e4:pathl2:DU10:2026.jsonleee4:name4:acts12:piece lengthi262144ee"
	if string(got) != want {
		t.Fatalf("got %s", got)
	}
	if _, err := Encode(3.5); err == nil {
		t.Fatal("a float encoded")
	}
}
