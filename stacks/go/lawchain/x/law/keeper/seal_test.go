package keeper_test

import (
	"context"
	"errors"
	"strings"
	"testing"

	"cosmossdk.io/core/address"
	storetypes "cosmossdk.io/store/types"
	addresscodec "github.com/cosmos/cosmos-sdk/codec/address"
	"github.com/cosmos/cosmos-sdk/runtime"
	"github.com/cosmos/cosmos-sdk/testutil"
	sdk "github.com/cosmos/cosmos-sdk/types"
	moduletestutil "github.com/cosmos/cosmos-sdk/types/module/testutil"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"

	"lawchain/x/law/keeper"
	module "lawchain/x/law/module"
	"lawchain/x/law/types"
)

// mirrors stands in for the staking module: the validators, bonded or not
type mirrors map[string]stakingtypes.BondStatus

func (m mirrors) ConsensusAddressCodec() address.Codec {
	return addresscodec.NewBech32Codec("cosmosvalcons")
}

func (m mirrors) GetValidator(_ context.Context, operator sdk.ValAddress) (stakingtypes.Validator, error) {
	status, ok := m[operator.String()]
	if !ok {
		return stakingtypes.Validator{}, errors.New("no validator")
	}
	return stakingtypes.Validator{OperatorAddress: operator.String(), Status: status}, nil
}

func (m mirrors) GetBondedValidatorsByPower(context.Context) ([]stakingtypes.Validator, error) {
	var bonded []stakingtypes.Validator
	for operator, status := range m {
		if status == stakingtypes.Bonded {
			bonded = append(bonded, stakingtypes.Validator{OperatorAddress: operator, Status: status})
		}
	}
	return bonded, nil
}

func (m mirrors) ValidatorByConsAddr(context.Context, sdk.ConsAddress) (stakingtypes.ValidatorI, error) {
	return nil, errors.New("not used")
}

func TestMirrorsAgreeOnAYear(t *testing.T) {
	encCfg := moduletestutil.MakeTestEncodingConfig(module.AppModule{})
	codec := addresscodec.NewBech32Codec(sdk.GetConfig().GetBech32AccountAddrPrefix())
	storeKey := storetypes.NewKVStoreKey(types.StoreKey)
	ctx := testutil.DefaultContextWithDB(t, storeKey, storetypes.NewTransientStoreKey("transient")).Ctx

	// four mirrors bonded, one not
	accounts := make([]sdk.AccAddress, 5)
	known := mirrors{}
	for at := range accounts {
		accounts[at] = sdk.AccAddress([]byte(strings.Repeat(string(rune('a'+at)), 20)))
		status := stakingtypes.Bonded
		if at == 4 {
			status = stakingtypes.Unbonded
		}
		known[sdk.ValAddress(accounts[at]).String()] = status
	}
	k := keeper.NewKeeper(runtime.NewKVStoreService(storeKey), encCfg.Codec, codec,
		authtypes.NewModuleAddress(types.GovModuleName), known)
	if err := k.Params.Set(ctx, types.DefaultParams()); err != nil {
		t.Fatal(err)
	}
	server := keeper.NewMsgServerImpl(k)
	query := keeper.NewQueryServerImpl(k)
	same := strings.Repeat("a1", 32)
	other := strings.Repeat("b2", 32)
	seal := func(at int, root string) error {
		creator, _ := codec.BytesToString(accounts[at])
		_, err := server.RecordSeal(ctx, &types.MsgRecordSeal{Creator: creator, Journal: "DU", Year: 2026, Root: root, Files: 3})
		return err
	}
	agreement := func() *types.QueryAgreementResponse {
		answer, err := query.Agreement(ctx, &types.QueryAgreementRequest{Journal: "DU", Year: 2026})
		if err != nil {
			t.Fatal(err)
		}
		return answer
	}

	if answer := agreement(); answer.Agreed || answer.Root != "" || answer.Mirrors != 4 {
		t.Fatalf("nothing sealed: %+v", answer)
	}
	for _, at := range []int{0, 1} {
		if err := seal(at, same); err != nil {
			t.Fatal(err)
		}
	}
	if err := seal(2, other); err != nil {
		t.Fatal(err)
	}
	// two of four on one root: the most, but not two thirds
	if answer := agreement(); answer.Root != same || answer.Attested != 2 || answer.Agreed {
		t.Fatalf("2 of 4: %+v", answer)
	}
	// the third mirror seals again, now as the others: 3 of 4 is 75%
	if err := seal(2, same); err != nil {
		t.Fatal(err)
	}
	if answer := agreement(); answer.Root != same || answer.Attested != 3 || !answer.Agreed {
		t.Fatalf("3 of 4: %+v", answer)
	}
	// an unbonded validator and a stranger are not mirrors; a broken seal is refused
	if err := seal(4, same); err == nil {
		t.Fatal("an unbonded validator sealed")
	}
	stranger, _ := codec.BytesToString(sdk.AccAddress([]byte(strings.Repeat("z", 20))))
	if _, err := server.RecordSeal(ctx, &types.MsgRecordSeal{Creator: stranger, Journal: "DU", Year: 2026, Root: same}); err == nil {
		t.Fatal("a stranger sealed")
	}
	for _, broken := range []*types.MsgRecordSeal{
		{Journal: "../x", Year: 2026, Root: same},
		{Journal: "DU", Year: 1066, Root: same},
		{Journal: "DU", Year: 2026, Root: "not-a-root"},
	} {
		broken.Creator, _ = codec.BytesToString(accounts[0])
		if _, err := server.RecordSeal(ctx, broken); err == nil {
			t.Fatalf("taken: %+v", broken)
		}
	}
	// another year is its own
	if answer, _ := query.Agreement(ctx, &types.QueryAgreementRequest{Journal: "DU", Year: 2025}); answer.Root != "" {
		t.Fatalf("2025: %+v", answer)
	}
	if err := (types.Params{Share: 0}).Validate(); err == nil {
		t.Fatal("a share of 0 taken")
	}
}
