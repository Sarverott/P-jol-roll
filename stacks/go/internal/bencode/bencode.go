// Package bencode writes the encoding of BitTorrent (BEP 3): integers, byte strings, lists and
// dictionaries with their keys sorted - all a .torrent file is made of.
package bencode

import (
	"bytes"
	"fmt"
	"sort"
)

// Encode writes a value of string, []byte, int, int64, []any or map[string]any.
func Encode(value any) ([]byte, error) {
	var out bytes.Buffer
	if err := encode(&out, value); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}

func encode(out *bytes.Buffer, value any) error {
	switch one := value.(type) {
	case string:
		fmt.Fprintf(out, "%d:%s", len(one), one)
	case []byte:
		fmt.Fprintf(out, "%d:", len(one))
		out.Write(one)
	case int:
		fmt.Fprintf(out, "i%de", one)
	case int64:
		fmt.Fprintf(out, "i%de", one)
	case []any:
		out.WriteByte('l')
		for _, item := range one {
			if err := encode(out, item); err != nil {
				return err
			}
		}
		out.WriteByte('e')
	case map[string]any:
		keys := make([]string, 0, len(one))
		for key := range one {
			keys = append(keys, key)
		}
		sort.Strings(keys) // raw byte order, as BEP 3 asks
		out.WriteByte('d')
		for _, key := range keys {
			fmt.Fprintf(out, "%d:%s", len(key), key)
			if err := encode(out, one[key]); err != nil {
				return err
			}
		}
		out.WriteByte('e')
	default:
		return fmt.Errorf("bencode: %T cannot be encoded", value)
	}
	return nil
}
