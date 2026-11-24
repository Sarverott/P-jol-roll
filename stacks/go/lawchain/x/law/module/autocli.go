package law

import (
	autocliv1 "cosmossdk.io/api/cosmos/autocli/v1"

	"lawchain/x/law/types"
)

// AutoCLIOptions implements the autocli.HasAutoCLIConfig interface.
func (am AppModule) AutoCLIOptions() *autocliv1.ModuleOptions {
	return &autocliv1.ModuleOptions{
		Query: &autocliv1.ServiceCommandDescriptor{
			Service: types.Query_serviceDesc.ServiceName,
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "Params",
					Use:       "params",
					Short:     "Shows the parameters of the module",
				},
				{
					RpcMethod:      "Agreement",
					Use:            "agreement [journal] [year]",
					Short:          "Query agreement",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "journal"}, {ProtoField: "year"}},
				},
			},
		},
		Tx: &autocliv1.ServiceCommandDescriptor{
			Service:              types.Msg_serviceDesc.ServiceName,
			EnhanceCustomCommand: true, // only required if you want to use the custom command
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "UpdateParams",
					Skip:      true, // skipped because authority gated
				},
				{
					RpcMethod:      "RecordSeal",
					Use:            "record-seal [journal] [year] [root] [files]",
					Short:          "Send a record-seal tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "journal"}, {ProtoField: "year"}, {ProtoField: "root"}, {ProtoField: "files"}},
				},
			},
		},
	}
}
