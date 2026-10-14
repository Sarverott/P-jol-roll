export default interface FileRecord {
	path: string; // inside of bucket
	size: number;
	sha256: string;
	url: string; // where it was taken from
	gatheredAt: string;
}
