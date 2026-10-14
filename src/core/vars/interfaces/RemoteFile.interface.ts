export default interface RemoteFile {
	size: number;
	oid?: string; // hash of git blob, buckets do not have it
	lfsOid?: string; // sha256 of big file kept outside of git
}
