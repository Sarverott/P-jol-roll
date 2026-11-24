package keeper

import (
	"context"
	"fmt"
	"regexp"

	"lawchain/x/law/types"

	"cosmossdk.io/collections"
	errorsmod "cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

var (
	journal = regexp.MustCompile(`^[A-Za-z]{1,16}$`)
	root    = regexp.MustCompile(`^[0-9a-f]{64}$`)
)

// RecordSeal: a mirror says what the checksums of a year's files are there (phase 39) - the root of
// its records of `task seal`. Only a mirror may: the account of a bonded validator. A mirror's
// newer seal of the same year replaces its older one.
func (k msgServer) RecordSeal(ctx context.Context, msg *types.MsgRecordSeal) (*types.MsgRecordSealResponse, error) {
	account, err := k.addressCodec.StringToBytes(msg.Creator)
	if err != nil {
		return nil, errorsmod.Wrap(err, "invalid creator address")
	}
	if !journal.MatchString(msg.Journal) || msg.Year < 1900 || msg.Year > 2200 || !root.MatchString(msg.Root) {
		return nil, fmt.Errorf("a journal of letters, a year 1900-2200 and a root of 64 hex digits: %s %d %s", msg.Journal, msg.Year, msg.Root)
	}
	operator := sdk.ValAddress(account)
	validator, err := k.stakingKeeper.GetValidator(ctx, operator)
	if err != nil || !validator.IsBonded() {
		return nil, fmt.Errorf("%s is not a mirror: not the account of a bonded validator", msg.Creator)
	}
	key := collections.Join3(msg.Journal, msg.Year, operator.String())
	if err := k.Seals.Set(ctx, key, fmt.Sprintf("%s %d", msg.Root, msg.Files)); err != nil {
		return nil, err
	}
	sdk.UnwrapSDKContext(ctx).EventManager().EmitEvent(sdk.NewEvent("law_seal",
		sdk.NewAttribute("mirror", operator.String()),
		sdk.NewAttribute("journal", msg.Journal),
		sdk.NewAttribute("year", fmt.Sprint(msg.Year)),
		sdk.NewAttribute("root", msg.Root),
	))
	return &types.MsgRecordSealResponse{}, nil
}
