package mesh

import (
	"encoding/base64"
	"encoding/hex"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const registry = `# the registry, its comments kept
network: 10.42.0.0/16
port: 51820
domain: prawo.example
mirrors:
  - { name: mazowieckie, title: mazowieckie, code: 14 }
  - { name: pomorskie, code: 22, endpoint: "pomorskie.example:51820", publicKey: "PUB22" }
  - { name: warszawa, address: 10.42.14.65 } # a district
  - { name: slaskie, code: 24 }
`

func write(t *testing.T, text string) string {
	path := filepath.Join(t.TempDir(), "mirrors.yaml")
	os.WriteFile(path, []byte(text), 0o644)
	return path
}

func TestLoadAndAddresses(t *testing.T) {
	r, err := Load(write(t, registry))
	if err != nil {
		t.Fatal(err)
	}
	want := map[string]string{"mazowieckie": "10.42.14.1", "pomorskie": "10.42.22.1", "warszawa": "10.42.14.65", "slaskie": "10.42.24.1"}
	for _, one := range r.Mirrors {
		if one.Address != want[one.Name] {
			t.Errorf("%s at %s", one.Name, one.Address)
		}
	}
	for _, broken := range []string{
		strings.Replace(registry, "address: 10.42.14.65", "address: 10.42.14.1", 1), // two at one address
		strings.Replace(registry, "address: 10.42.14.65", "address: 10.9.0.1", 1),   // outside
		strings.Replace(registry, "name: slaskie", "name: Śląskie", 1),              // not a plain name
	} {
		if _, err := Load(write(t, broken)); err == nil {
			t.Errorf("taken: %s", broken)
		}
	}
}

func TestKeys(t *testing.T) {
	// RFC 7748, 6.1: Alice's private key and its public one
	private, _ := hex.DecodeString("77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a")
	public, err := PublicOf(base64.StdEncoding.EncodeToString(private))
	if err != nil {
		t.Fatal(err)
	}
	if raw, _ := base64.StdEncoding.DecodeString(public); hex.EncodeToString(raw) != "8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a" {
		t.Fatalf("public %x", raw)
	}
	one, onePublic, _ := NewKey()
	two, _, _ := NewKey()
	if one == two {
		t.Fatal("two keys alike")
	}
	if derived, _ := PublicOf(one); derived != onePublic {
		t.Fatal("public not of the private")
	}
	raw, _ := base64.StdEncoding.DecodeString(one)
	if raw[0]&7 != 0 || raw[31]&128 != 0 || raw[31]&64 == 0 {
		t.Fatal("not clamped")
	}
}

func TestWireGuardAndTraefik(t *testing.T) {
	path := write(t, registry)
	if err := SetPublicKey(path, "mazowieckie", "PUB14"); err != nil {
		t.Fatal(err)
	}
	data, _ := os.ReadFile(path)
	if !strings.Contains(string(data), "# the registry, its comments kept") || !strings.Contains(string(data), "# a district") {
		t.Fatalf("comments lost:\n%s", data)
	}
	r, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	config, err := r.WireGuard("mazowieckie", "PRIV")
	if err != nil {
		t.Fatal(err)
	}
	for _, line := range []string{"Address = 10.42.14.1/16", "ListenPort = 51820", "PrivateKey = PRIV", "PublicKey = PUB22", "AllowedIPs = 10.42.22.1/32", "Endpoint = pomorskie.example:51820"} {
		if !strings.Contains(config, line) {
			t.Errorf("no %q in\n%s", line, config)
		}
	}
	// slaskie and warszawa have no key: not on the network
	if strings.Contains(config, "10.42.24.1") || strings.Contains(config, "10.42.14.65") || strings.Count(config, "[Peer]") != 1 {
		t.Errorf("peers not on the network:\n%s", config)
	}
	traefik, err := r.Traefik("mazowieckie", 8080)
	if err != nil {
		t.Fatal(err)
	}
	text := string(traefik)
	for _, part := range []string{"url: http://10.42.14.1:8080", "url: http://10.42.22.1:8080", "Host(`prawo.example`)", "Host(`pomorskie.prawo.example`)", "path: /api/host"} {
		if !strings.Contains(text, part) {
			t.Errorf("no %q in\n%s", part, text)
		}
	}
	if strings.Contains(text, "10.42.24.1") {
		t.Error("a mirror not on the network is balanced")
	}
	if err := SetPublicKey(path, "nowhere", "X"); err == nil {
		t.Error("a key set for no mirror")
	}
}
