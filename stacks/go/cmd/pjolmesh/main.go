// pjolmesh: the mirrors of the law on a WireGuard network, balanced by Traefik (phase 38).
//
//	pjolmesh keys <mirror>        its WireGuard keys: the private one into resources/secrets/wireguard/
//	                              (never overwritten), the public one into the registry
//	pjolmesh wireguard <mirror>   its wg-quick configuration: resources/.containerdatavol/mirror/wireguard/wg0.conf
//	pjolmesh traefik <mirror>     its Traefik: resources/.containerdatavol/mirror/traefik/dynamic.yaml
//	pjolmesh mirror <mirror>      all three - what a machine runs to become that mirror
//	pjolmesh list                 the mirrors, their addresses, which are on the network
//
// The registry is resources/configs/mirrors/mirrors.yaml (-registry); -resources the directory
// the files go under. A mirror is on the network once its public key is in the registry: commit
// it, and the other mirrors take it with their next `pjolmesh mirror`.
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/Sarverott/P-jol-roll/stacks/go/internal/mesh"
)

// Version is the project's one version, kept by src/devtools/version.ts.
const Version = "0.43.0"

func fail(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}

func writeWhole(path string, data []byte, mode os.FileMode) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(path+".part", data, mode); err != nil {
		return err
	}
	return os.Rename(path+".part", path)
}

// Keys makes the mirror's keys once and writes the public one into the registry.
func Keys(registryPath, resources, mirror string) (string, error) {
	registry, err := mesh.Load(registryPath)
	if err != nil {
		return "", err
	}
	if _, err := registry.Find(mirror); err != nil {
		return "", err
	}
	path := filepath.Join(resources, "secrets", "wireguard", mirror+".key")
	var public string
	if data, err := os.ReadFile(path); err == nil {
		if public, err = mesh.PublicOf(string(data)); err != nil {
			return "", fmt.Errorf("%s: %w", path, err)
		}
	} else {
		var private string
		if private, public, err = mesh.NewKey(); err != nil {
			return "", err
		}
		if err := writeWhole(path, []byte(private+"\n"), 0o600); err != nil {
			return "", err
		}
	}
	return public, mesh.SetPublicKey(registryPath, mirror, public)
}

// Configure writes the mirror's WireGuard and Traefik configurations.
func Configure(registryPath, resources, mirror string, port int, what string) ([]string, error) {
	registry, err := mesh.Load(registryPath)
	if err != nil {
		return nil, err
	}
	var written []string
	out := filepath.Join(resources, ".containerdatavol", "mirror")
	if what == "wireguard" || what == "mirror" {
		private, err := os.ReadFile(filepath.Join(resources, "secrets", "wireguard", mirror+".key"))
		if err != nil {
			return nil, fmt.Errorf("no keys of %s here: pjolmesh keys %s", mirror, mirror)
		}
		config, err := registry.WireGuard(mirror, strings.TrimSpace(string(private)))
		if err != nil {
			return nil, err
		}
		path := filepath.Join(out, "wireguard", "wg0.conf")
		if err := writeWhole(path, []byte(config), 0o600); err != nil {
			return nil, err
		}
		written = append(written, path)
	}
	if what == "traefik" || what == "mirror" {
		config, err := registry.Traefik(mirror, port)
		if err != nil {
			return nil, err
		}
		path := filepath.Join(out, "traefik", "dynamic.yaml")
		if err := writeWhole(path, config, 0o644); err != nil {
			return nil, err
		}
		written = append(written, path)
	}
	return written, nil
}

func main() {
	flags := flag.NewFlagSet("pjolmesh", flag.ExitOnError)
	registryPath := flags.String("registry", "../../resources/configs/mirrors/mirrors.yaml", "the registry of mirrors")
	resources := flags.String("resources", "../../resources", "resources/ of the project")
	port := flags.Int("port", 8080, "the port of the api on every mirror")
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: pjolmesh keys|wireguard|traefik|mirror <mirror> | list | version")
		os.Exit(2)
	}
	command := os.Args[1]
	flags.Parse(os.Args[2:])
	mirror := flags.Arg(0)
	switch command {
	case "version":
		fmt.Println(Version)
	case "list":
		registry, err := mesh.Load(*registryPath)
		if err != nil {
			fail(err)
		}
		for _, one := range registry.Mirrors {
			state := "not on the network"
			if one.PublicKey != "" {
				state = "on the network"
				if one.Endpoint != "" {
					state += ", reached at " + one.Endpoint
				}
			}
			fmt.Printf("%-22s %-12s %s\n", one.Name, one.Address, state)
		}
	case "keys", "wireguard", "traefik", "mirror":
		if mirror == "" {
			fail(fmt.Errorf("which mirror: pjolmesh %s <mirror>", command))
		}
		if command == "keys" || command == "mirror" {
			public, err := Keys(*registryPath, *resources, mirror)
			if err != nil {
				fail(err)
			}
			fmt.Printf("%s: public key %s, written into %s - commit it, so the others peer with it\n", mirror, public, *registryPath)
		}
		if command != "keys" {
			written, err := Configure(*registryPath, *resources, mirror, *port, command)
			if err != nil {
				fail(err)
			}
			for _, path := range written {
				fmt.Println(path)
			}
		}
	default:
		fail(fmt.Errorf("no command %q", command))
	}
}
