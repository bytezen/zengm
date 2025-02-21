import path from "node:path";
import { Worker } from "node:worker_threads";

const watchJS = (
	updateStart: (filename: string) => void,
	updateEnd: (filename: string) => void,
	updateError: (filename: string, error: Error) => void,
) => {
	for (const name of ["ui", "worker"]) {
		const filename = `build/gen/${name}.js`;

		const worker = new Worker(
			path.join(import.meta.dirname, "watchJSWorker.ts"),
			{
				workerData: {
					name,
				},
			},
		);

		worker.on("message", message => {
			if (message.type === "start") {
				updateStart(filename);
			}
			if (message.type === "end") {
				updateEnd(filename);
			}
			if (message.type === "error") {
				updateError(filename, message.error);
			}
		});
	}
};

// watchJS((filename) => console.log('updateStart', filename), (filename) => console.log('updateEnd', filename), (filename, error) => console.log('updateError', filename, error));

export default watchJS;
