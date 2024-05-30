import { spawn } from "child_process";
import Cloudflare from "cloudflare";
import { readFile } from "fs/promises";
import build from "./build.js";
import { bySport, getSport } from "./buildFuncs.js";

const getSubdomain = () => {
	const inputSubdomain = process.argv[2];

	// test is basketball-gm.com only
	const validSubdomains = ["beta", "play", "test"];

	if (validSubdomains.includes(inputSubdomain)) {
		return inputSubdomain;
	}
	if (inputSubdomain === undefined) {
		return "play";
	}
	throw new Error(
		`Invalid subdomain ${inputSubdomain} - should be ${validSubdomains.join(
			"/",
		)} (default is play)`,
	);
};

const mySpawn = (command, args) => {
	return new Promise(resolve => {
		console.log(`${command} ${args.join(" ")}`);

		const cmd = spawn(command, args, { shell: true, stdio: "inherit" });
		cmd.on("close", code => {
			if (code !== 0) {
				console.log(`child process exited with code ${code}`);
				process.exit(code);
			}
			resolve();
		});
	});
};

const deploy = async () => {
	const cloudflareConfig = JSON.parse(
		await readFile(
			new URL("../../../../.config/cloudflare.json", import.meta.url),
		),
	);

	await build();

	const subdomain = getSubdomain();
	const sport = getSport();
	const domain = bySport({
		baseball: `${subdomain === "play" ? "" : "beta."}baseball.zengm.com`,
		basketball: `${subdomain}.basketball-gm.com`,
		football: `${subdomain}.football-gm.com`,
		hockey: `${subdomain === "play" ? "" : "beta."}hockey.zengm.com`,
	});

	console.log(`\nDeploying to ${domain}...`);

	// Copy gen first, so index.html never links to partial file
	// files is here because real-player-data was briefly there in May 2020, so we don't want to delete it
	// .well-known is here because we never want to delete anything in it
	const copyAndKeep = ["gen", "files", ".well-known"]; // MAKE SURE TO EXCLUDE FROM DELETION BELOW
	for (const folder of copyAndKeep) {
		console.log(`Copying ${folder}...`);
		await mySpawn("rsync", [
			"-vhrl",
			`./build/${folder}/`,
			`jersch50@pdx1-shared-a3-10.dreamhost.com:/home/jersch50/${domain}/${folder}/`,
		]);
	}

	console.log("Copying other files...");
	// files and leagues are here because real-player-data was briefly there in May 2020, so we don't want to delete them
	const excludes = [
		"--exclude",
		"/gen",
		"--exclude",
		"/leagues",
		"--exclude",
		"/files",
		"--exclude",
		"/.well-known",

		// For baseball and hockey
		"--exclude",
		"/old",
	];
	if (subdomain === "beta") {
		excludes.push("--exclude", "/sw.js*");
	}
	await mySpawn("rsync", [
		"-vhrl",
		"--delete",
		...excludes,
		"./build/",
		`jersch50@pdx1-shared-a3-10.dreamhost.com:/home/jersch50/${domain}/`,
	]);

	if (subdomain !== "beta") {
		console.log("Invalidating Cloudflare cache...");

		const zone = cloudflareConfig.zones[sport];
		if (!zone) {
			throw new Error("Missing zone in Cloudflare config file");
		}

		const cloudflare = new Cloudflare({
			apiEmail: "jdscheff@gmail.com",
			apiKey: cloudflareConfig.apiKey,
		});

		const response = await cloudflare.cache.purge({
			zone_id: zone,
			purge_everything: true,
		});
		if (
			!response ||
			JSON.stringify(response) !== JSON.stringify({ id: zone })
		) {
			console.log("WEIRD RESPONSE FROM CLOUDFLARE:");
			console.log(response);
		}
	} else {
		console.log("No Cloudfare cache invalidation needed in beta");
	}

	console.log("\nDone!");
};

export default deploy;
