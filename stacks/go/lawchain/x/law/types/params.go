package types

import "fmt"

// DefaultShare: the percent of the mirrors (bonded validators) whose seal of a year must be the
// same for the year to be agreed - two thirds and more, as CometBFT's own consensus asks.
var DefaultShare uint64 = 67

// NewParams creates a new Params instance.
func NewParams(
	share uint64,
) Params {
	return Params{
		Share: share,
	}
}

// DefaultParams returns a default set of parameters.
func DefaultParams() Params {
	return NewParams(
		DefaultShare,
	)
}

// Validate validates the set of params.
func (p Params) Validate() error {
	if err := validateShare(p.Share); err != nil {
		return err
	}

	return nil
}

// validateShare validates the Share parameter.
func validateShare(v uint64) error {
	if v < 1 || v > 100 {
		return fmt.Errorf("share is a percent, 1 to 100: %d", v)
	}
	return nil
}
