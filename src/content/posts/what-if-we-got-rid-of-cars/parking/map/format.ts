/** One decimal, English thousands separators. The prototype's `fmt1`. */
export function fmt1(n: number): string {
	return (Math.round(n * 10) / 10).toLocaleString('en-GB');
}
