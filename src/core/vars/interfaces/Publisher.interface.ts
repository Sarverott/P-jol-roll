// journal with its years - one entry of GET /acts
export default interface Publisher {
	code: string; // "DU" for Dziennik Ustaw, "MP" for Monitor Polski
	name: string;
	actsCount: number;
	years: number[];
}
