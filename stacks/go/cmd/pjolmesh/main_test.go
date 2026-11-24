package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMirrorOnceKeysThenConfigs(t *testing.T) {
	resources := t.TempDir()
	registry := filepath.Join(resources, "mirrors.yaml")
	os.WriteFile(registry, []byte("network: 10.42.0.0/16\nport: 51820\ndomain: \"\"\nmirrors:\n  - { name: lubelskie, code: 6 }\n  - { name: opolskie, code: 16 }\n"), 0o644)
	first, err := Keys(registry, resources, "lubelskie")
	if err != nil {
		t.Fatal(err)
	}
	again, _ := Keys(registry, resources, "lubelskie")
	if first != again {
		t.Fatal("the keys were made again")
	}
	key := filepath.Join(resources, "secrets", "wireguard", "lubelskie.key")
	if info, _ := os.Stat(key); info.Mode().Perm() != 0o600 {
		t.Fatalf("the private key is %v", info.Mode())
	}
	if _, err := Configure(registry, resources, "opolskie", 8080, "wireguard"); err == nil {
		t.Fatal("configured without keys")
	}
	Keys(registry, resources, "opolskie")
	written, err := Configure(registry, resources, "opolskie", 8080, "mirror")
	if err != nil || len(written) != 2 {
		t.Fatal(err, written)
	}
	config, _ := os.ReadFile(written[0])
	if !strings.Contains(string(config), "PublicKey = "+first) || !strings.Contains(string(config), "AllowedIPs = 10.42.6.1/32") {
		t.Fatalf("%s", config)
	}
	traefik, _ := os.ReadFile(written[1])
	if !strings.Contains(string(traefik), "http://10.42.6.1:8080") || !strings.Contains(string(traefik), "PathPrefix(`/`)") {
		t.Fatalf("%s", traefik)
	}
}
