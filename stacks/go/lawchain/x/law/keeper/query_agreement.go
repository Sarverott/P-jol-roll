package keeper

import (
	"context"
	"sort"
	"strings"

	"lawchain/x/law/types"

	"cosmossdk.io/collections"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Agreement: what the mirrors agree a year of a journal is (phase 39). Only the seals of the
// mirrors bonded now count; the root sealed by most of them is the answer, agreed when they are
// at least the share (67%) of all bonded mirrors.
func (q queryServer) Agreement(ctx context.Context, req *types.QueryAgreementRequest) (*types.QueryAgreementResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}
	params, err := q.k.Params.Get(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	bonded, err := q.k.stakingKeeper.GetBondedValidatorsByPower(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	mirrors := map[string]bool{}
	for _, validator := range bonded {
		mirrors[validator.GetOperator()] = true
	}
	counts := map[string]uint64{}
	prefix := collections.NewSuperPrefixedTripleRange[string, uint64, string](req.Journal, req.Year)
	err = q.k.Seals.Walk(ctx, prefix, func(key collections.Triple[string, uint64, string], seal string) (bool, error) {
		if mirrors[key.K3()] {
			counts[strings.Fields(seal)[0]]++
		}
		return false, nil
	})
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	roots := make([]string, 0, len(counts))
	for one := range counts {
		roots = append(roots, one)
	}
	// most seals first; between equals the smaller root, so every node answers the same
	sort.Slice(roots, func(a, b int) bool {
		return counts[roots[a]] > counts[roots[b]] || (counts[roots[a]] == counts[roots[b]] && roots[a] < roots[b])
	})
	answer := &types.QueryAgreementResponse{Mirrors: uint64(len(mirrors))}
	if len(roots) > 0 {
		answer.Root = roots[0]
		answer.Attested = counts[roots[0]]
		answer.Agreed = answer.Attested*100 >= params.Share*answer.Mirrors
	}
	return answer, nil
}
