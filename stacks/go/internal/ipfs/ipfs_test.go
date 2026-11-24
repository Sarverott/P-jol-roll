package ipfs

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/ipld/go-car/v2/blockstore"
)

// the CIDs below are what kubo 0.39 gives: ipfs add -r --only-hash --cid-version=1 dir
func TestBuildAsIpfsAdd(t *testing.T) {
	big := make([]byte, 300000) // more than one chunk of 256 KiB
	for i := range big {
		big[i] = byte(i % 251)
	}
	dir, err := Build(context.Background(), map[string][]byte{"a.txt": []byte("hello world\n"), "b.bin": big})
	if err != nil {
		t.Fatal(err)
	}
	for name, want := range map[string]string{
		"a.txt": "bafkreifjjcie6lypi6ny7amxnfftagclbuxndqonfipmb64f2km2devei4",
		"b.bin": "bafybeih7gz5kvvg2zafb7vue6izhy6c4tglvwpi3rgunwdag2fidn2y6eq",
	} {
		if got := dir.Files[name].String(); got != want {
			t.Errorf("%s: %s, kubo gives %s", name, got, want)
		}
	}
	if got := dir.Root.String(); got != "bafybeig47ihziwuclinpxekrnrr24j2vfj5h5gujba652qrg2tmla5auzu" {
		t.Errorf("root %s", got)
	}

	// the CAR holds every block from the root down
	path := filepath.Join(t.TempDir(), "dir.car")
	if err := dir.WriteCar(context.Background(), path); err != nil {
		t.Fatal(err)
	}
	car, err := blockstore.OpenReadOnly(path)
	if err != nil {
		t.Fatal(err)
	}
	defer car.Close()
	roots, _ := car.Roots()
	if len(roots) != 1 || roots[0] != dir.Root {
		t.Fatalf("roots %v", roots)
	}
	for _, one := range dir.Files {
		if ok, _ := car.Has(context.Background(), one); !ok {
			t.Errorf("%s not in the CAR", one)
		}
	}
	if info, _ := os.Stat(path); info.Size() < 300000 {
		t.Errorf("the CAR is %d bytes", info.Size())
	}
}
