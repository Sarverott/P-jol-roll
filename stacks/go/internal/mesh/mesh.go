// Package mesh holds the mirrors of the law (phase 38): their registry
// (resources/configs/mirrors/mirrors.yaml), a mirror's WireGuard keys, its WireGuard configuration
// with every other mirror as a peer, and Traefik's configuration balancing the site over all of
// them through the tunnels.
package mesh

import (
	"bytes"
	"crypto/ecdh"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/netip"
	"os"
	"regexp"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"
)

// Mirror is one copy of the law on the network.
type Mirror struct {
	Name      string `yaml:"name"`
	Title     string `yaml:"title,omitempty"`
	Code      int    `yaml:"code,omitempty"`
	Address   string `yaml:"address,omitempty"`
	Endpoint  string `yaml:"endpoint,omitempty"`
	PublicKey string `yaml:"publicKey,omitempty"`
}

// Registry is mirrors.yaml.
type Registry struct {
	Network string   `yaml:"network"`
	Port    int      `yaml:"port"`
	Domain  string   `yaml:"domain"`
	Mirrors []Mirror `yaml:"mirrors"`
}

var name = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,62}$`)

// Load reads the registry and checks it: names, addresses inside the network, no two alike.
func Load(path string) (*Registry, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var registry Registry
	if err := yaml.Unmarshal(data, &registry); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	network, err := netip.ParsePrefix(registry.Network)
	if err != nil {
		return nil, fmt.Errorf("network %q: %w", registry.Network, err)
	}
	if registry.Port == 0 {
		registry.Port = 51820
	}
	seen := map[string]string{}
	for at, mirror := range registry.Mirrors {
		if !name.MatchString(mirror.Name) {
			return nil, fmt.Errorf("mirror %q: a name of small letters, digits and -", mirror.Name)
		}
		address, err := registry.AddressOf(mirror)
		if err != nil {
			return nil, err
		}
		if !network.Contains(address) {
			return nil, fmt.Errorf("%s: %s is outside %s", mirror.Name, address, network)
		}
		for _, key := range []string{"name " + mirror.Name, "address " + address.String()} {
			if other, ok := seen[key]; ok {
				return nil, fmt.Errorf("%s and %s share the %s", other, mirror.Name, key)
			}
			seen[key] = mirror.Name
		}
		registry.Mirrors[at].Address = address.String()
	}
	return &registry, nil
}

// AddressOf is a mirror's address: its own, or 10.42.<code>.1 of the network for a voivodeship.
func (r *Registry) AddressOf(mirror Mirror) (netip.Addr, error) {
	if mirror.Address != "" {
		return netip.ParseAddr(mirror.Address)
	}
	if mirror.Code < 1 || mirror.Code > 254 {
		return netip.Addr{}, fmt.Errorf("%s: no address, and its code %d is not 1-254", mirror.Name, mirror.Code)
	}
	network := netip.MustParsePrefix(r.Network).Addr().As4()
	return netip.AddrFrom4([4]byte{network[0], network[1], byte(mirror.Code), 1}), nil
}

// Find is the mirror of that name.
func (r *Registry) Find(mirror string) (Mirror, error) {
	for _, one := range r.Mirrors {
		if one.Name == mirror {
			return one, nil
		}
	}
	return Mirror{}, fmt.Errorf("no mirror %q in the registry", mirror)
}

// Joined are the mirrors on the network (with a public key), and the one asked for.
func (r *Registry) Joined(self string) []Mirror {
	var joined []Mirror
	for _, one := range r.Mirrors {
		if one.PublicKey != "" || one.Name == self {
			joined = append(joined, one)
		}
	}
	return joined
}

// NewKey is a WireGuard private key (Curve25519, clamped as `wg genkey` gives it) and its public.
func NewKey() (private, public string, err error) {
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		return "", "", err
	}
	key[0] &= 248
	key[31] = (key[31] & 127) | 64
	public, err = PublicOf(base64.StdEncoding.EncodeToString(key))
	return base64.StdEncoding.EncodeToString(key), public, err
}

// PublicOf is the public key of a private one, as `wg pubkey` gives it.
func PublicOf(private string) (string, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(private))
	if err != nil || len(raw) != 32 {
		return "", fmt.Errorf("not a WireGuard key")
	}
	key, err := ecdh.X25519().NewPrivateKey(raw)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(key.PublicKey().Bytes()), nil
}

// WireGuard is a mirror's configuration for wg-quick: itself, and every other mirror on the
// network as a peer - reached at its endpoint, or waiting to be called when it has none.
func (r *Registry) WireGuard(self, private string) (string, error) {
	mirror, err := r.Find(self)
	if err != nil {
		return "", err
	}
	bits := netip.MustParsePrefix(r.Network).Bits()
	var out strings.Builder
	fmt.Fprintf(&out, "# the mirror %s on the network of the law (pjolmesh, phase 38); made again, never edited\n", self)
	fmt.Fprintf(&out, "[Interface]\nAddress = %s/%d\nListenPort = %d\nPrivateKey = %s\n", mirror.Address, bits, r.Port, private)
	for _, peer := range r.Joined(self) {
		if peer.Name == self {
			continue
		}
		fmt.Fprintf(&out, "\n# %s\n[Peer]\nPublicKey = %s\nAllowedIPs = %s/32\n", peer.Name, peer.PublicKey, peer.Address)
		if peer.Endpoint != "" {
			fmt.Fprintf(&out, "Endpoint = %s\n", peer.Endpoint)
		}
		fmt.Fprintf(&out, "PersistentKeepalive = 25\n")
	}
	return out.String(), nil
}

// Traefik is the dynamic configuration of a mirror's Traefik: the site balanced over every
// mirror on the network through the tunnels, each checked by /api/host; each mirror alone at
// <name>.<domain> when there is a domain.
func (r *Registry) Traefik(self string, port int) ([]byte, error) {
	joined := r.Joined(self)
	sort.Slice(joined, func(a, b int) bool { return joined[a].Name < joined[b].Name })
	servers := []map[string]any{}
	routers := map[string]any{}
	services := map[string]any{}
	check := map[string]any{"path": "/api/host", "interval": "30s", "timeout": "5s"}
	for _, mirror := range joined {
		url := fmt.Sprintf("http://%s:%d", mirror.Address, port)
		servers = append(servers, map[string]any{"url": url})
		if r.Domain != "" {
			routers[mirror.Name] = map[string]any{
				"rule":        fmt.Sprintf("Host(`%s.%s`)", mirror.Name, r.Domain),
				"service":     mirror.Name,
				"entryPoints": []string{"web"},
			}
			services[mirror.Name] = map[string]any{"loadBalancer": map[string]any{
				"servers": []map[string]any{{"url": url}}, "healthCheck": check,
			}}
		}
	}
	rule := "PathPrefix(`/`)"
	if r.Domain != "" {
		rule = fmt.Sprintf("Host(`%s`)", r.Domain)
	}
	routers["law"] = map[string]any{"rule": rule, "service": "law", "entryPoints": []string{"web"}, "priority": 1}
	services["law"] = map[string]any{"loadBalancer": map[string]any{"servers": servers, "healthCheck": check}}
	var out bytes.Buffer
	out.WriteString(fmt.Sprintf("# Traefik of the mirror %s (pjolmesh, phase 38): the site over %d mirror(s); made again, never edited\n", self, len(joined)))
	encoder := yaml.NewEncoder(&out)
	encoder.SetIndent(2)
	if err := encoder.Encode(map[string]any{"http": map[string]any{"routers": routers, "services": services}}); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}

// SetPublicKey writes a mirror's public key into the registry file, its comments kept.
func SetPublicKey(path, mirror, public string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var document yaml.Node
	if err := yaml.Unmarshal(data, &document); err != nil {
		return err
	}
	root := document.Content[0]
	var list *yaml.Node
	for at := 0; at+1 < len(root.Content); at += 2 {
		if root.Content[at].Value == "mirrors" {
			list = root.Content[at+1]
		}
	}
	if list == nil {
		return fmt.Errorf("%s: no mirrors", path)
	}
	for _, item := range list.Content {
		found, key := false, -1
		for at := 0; at+1 < len(item.Content); at += 2 {
			switch item.Content[at].Value {
			case "name":
				found = item.Content[at+1].Value == mirror
			case "publicKey":
				key = at + 1
			}
		}
		if !found {
			continue
		}
		if key >= 0 {
			item.Content[key].Value = public
		} else {
			item.Content = append(item.Content,
				&yaml.Node{Kind: yaml.ScalarNode, Value: "publicKey"},
				&yaml.Node{Kind: yaml.ScalarNode, Value: public, Style: yaml.DoubleQuotedStyle})
		}
		var out bytes.Buffer
		encoder := yaml.NewEncoder(&out)
		encoder.SetIndent(2)
		if err := encoder.Encode(&document); err != nil {
			return err
		}
		return os.WriteFile(path, out.Bytes(), 0o644)
	}
	return fmt.Errorf("no mirror %q in %s", mirror, path)
}
