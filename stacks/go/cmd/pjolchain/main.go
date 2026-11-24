// pjolchain: what this mirror tells the chain of the law (phase 39) - the root of every year it
// sealed (task seal), to be recorded by lawchaind tx law record-seal.
//
//	pjolchain roots [-journal DU] [-json]
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/Sarverott/P-jol-roll/stacks/go/internal/seal"
)

// Version is the project's one version, kept by src/devtools/version.ts.
const Version = "0.43.0"

func main() {
	if len(os.Args) < 2 || (os.Args[1] != "roots" && os.Args[1] != "version") {
		fmt.Fprintln(os.Stderr, "usage: pjolchain roots [-journal DU] [-json] | pjolchain version")
		os.Exit(2)
	}
	if os.Args[1] == "version" {
		fmt.Println(Version)
		return
	}
	flags := flag.NewFlagSet("roots", flag.ExitOnError)
	resources := flags.String("resources", "../../resources", "resources/ of the project")
	journal := flags.String("journal", "", "one journal; every one when empty")
	asJSON := flags.Bool("json", false, "as JSON")
	flags.Parse(os.Args[2:])
	years, err := seal.Years(*resources, *journal)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if *asJSON {
		json.NewEncoder(os.Stdout).Encode(years)
		return
	}
	for _, one := range years {
		fmt.Printf("%s %d %s %d\n", one.Journal, one.Year, one.Root, one.Files)
	}
}
