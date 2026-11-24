import { z } from "zod";
import { readOnly } from "../shared.js";

export default {
	title: "The declaration of transparency",
	description:
		'Public offices and the address space of the state (phase 44): of="offices" gives offices with their official e-mails, phones, address, www, ePUAP and coordinates (OpenStreetMap), searched by words (query: a town, a name, a kind - "urząd stanu cywilnego", "Krajowa Administracja Skarbowa", "placówka dyplomatyczna", "administracja zespolona"); of="networks" gives the networks and autonomous systems registered in RIPE to Polish public institutions.',
	inputSchema: z.object({
		of: z.enum(["offices", "networks"]).default("offices"),
		query: z.string().default(""),
		kind: z.string().default(""),
		offset: z.number().int().min(0).default(0),
		limit: z.number().int().min(1).max(100).default(20),
	}),
	annotations: readOnly,
};
