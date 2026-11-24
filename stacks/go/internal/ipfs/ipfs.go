// Package ipfs computes, offline, what IPFS would make of files: their CIDs as
// `ipfs add -r --cid-version=1` gives them (UnixFS, raw leaves, chunks of 256 KiB, sha2-256) and
// a directory of them, then writes every block into a CAR file - which any IPFS node imports
// (`ipfs dag import`) to serve the directory under the same root CID. Nothing goes to the network.
package ipfs

import (
	"bytes"
	"context"
	"fmt"
	"sort"

	chunker "github.com/ipfs/boxo/chunker"
	mdtest "github.com/ipfs/boxo/ipld/merkledag/test"
	"github.com/ipfs/boxo/ipld/unixfs/importer/balanced"
	"github.com/ipfs/boxo/ipld/unixfs/importer/helpers"
	uio "github.com/ipfs/boxo/ipld/unixfs/io"
	"github.com/ipfs/go-cid"
	ipld "github.com/ipfs/go-ipld-format"
	"github.com/ipld/go-car/v2/blockstore"
	mh "github.com/multiformats/go-multihash"
)

// V1 is the CID builder of `ipfs add --cid-version=1`.
var V1 = cid.V1Builder{Codec: cid.DagProtobuf, MhType: mh.SHA2_256}

// Directory is a UnixFS directory built in memory: its root and the CID of each file.
type Directory struct {
	Root  cid.Cid
	Files map[string]cid.Cid
	dag   ipld.DAGService
}

func add(ctx context.Context, dag ipld.DAGService, content []byte) (ipld.Node, error) {
	params := helpers.DagBuilderParams{
		Maxlinks:   helpers.DefaultLinksPerBlock,
		RawLeaves:  true,
		CidBuilder: V1,
		Dagserv:    dag,
	}
	builder, err := params.New(chunker.NewSizeSplitter(bytes.NewReader(content), chunker.DefaultBlockSize))
	if err != nil {
		return nil, err
	}
	return balanced.Layout(builder)
}

// Build makes one directory of the files given by their names (no slashes: a flat directory).
func Build(ctx context.Context, files map[string][]byte) (*Directory, error) {
	dag := mdtest.Mock()
	directory, err := uio.NewBasicDirectory(dag, uio.WithCidBuilder(V1))
	if err != nil {
		return nil, err
	}
	names := make([]string, 0, len(files))
	for name := range files {
		names = append(names, name)
	}
	sort.Strings(names)
	made := &Directory{Files: map[string]cid.Cid{}, dag: dag}
	for _, name := range names {
		node, err := add(ctx, dag, files[name])
		if err != nil {
			return nil, fmt.Errorf("%s: %w", name, err)
		}
		if err := directory.AddChild(ctx, name, node); err != nil {
			return nil, err
		}
		made.Files[name] = node.Cid()
	}
	root, err := directory.GetNode()
	if err != nil {
		return nil, err
	}
	if err := dag.Add(ctx, root); err != nil {
		return nil, err
	}
	made.Root = root.Cid()
	return made, nil
}

// WriteCar writes every block of the directory, from its root down, into a CAR file (v2).
func (d *Directory) WriteCar(ctx context.Context, path string) error {
	car, err := blockstore.OpenReadWrite(path, []cid.Cid{d.Root})
	if err != nil {
		return err
	}
	seen := map[cid.Cid]bool{}
	var walk func(cid.Cid) error
	walk = func(one cid.Cid) error {
		if seen[one] {
			return nil
		}
		seen[one] = true
		node, err := d.dag.Get(ctx, one)
		if err != nil {
			return err
		}
		if err := car.Put(ctx, node); err != nil {
			return err
		}
		for _, link := range node.Links() {
			if err := walk(link.Cid); err != nil {
				return err
			}
		}
		return nil
	}
	if err := walk(d.Root); err != nil {
		return err
	}
	return car.Finalize()
}
