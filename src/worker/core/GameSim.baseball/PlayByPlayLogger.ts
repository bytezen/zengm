import type { POS_NUMBERS_INVERSE } from "../../../common/constants.baseball";
import type { Runner, TeamNum } from "./types";

type PlayByPlayEventInputScore = {
	type: "goal";
	clock: number;
	t: TeamNum;
	names: [string] | [string, string] | [string, string, string];
	pids: [number] | [number, number] | [number, number, number];
	goalType: "ev" | "sh" | "pp" | "en";
	shotType: string;
};

type PlayByPlayEventInput =
	| {
			type: "sideStart";
			inning: number;
			t: TeamNum;
			pitcherPid: number;
	  }
	| {
			type: "sideOver";
			inning: number;
	  }
	| {
			type: "inningOver";
			inning: number;
	  }
	| {
			type: "gameOver";
	  }
	| {
			type: "injury";
			clock: number;
			t: TeamNum;
			pid: number;
	  }
	| {
			type: "plateAppearance";
			t: TeamNum;
			pid: number;
	  }
	| {
			type: "pitch";
			t: TeamNum;
			pid: number;
			pitchType: string;
	  }
	| {
			type: "foul";
			balls: number;
			strikes: number;
	  }
	| {
			type: "ball";
			balls: number;
			strikes: number;
	  }
	| {
			type: "strike";
			swinging: boolean;
			balls: number;
			strikes: number;
	  }
	| {
			type: "strikeOut";
			swinging: boolean;
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "bunt" | "ground" | "line";
			t: TeamNum;
			pid: number;
			direction:
				| "left"
				| "right"
				| "middle"
				| "farLeft"
				| "farRight"
				| "farLeftFoul"
				| "farRightFoul";
			speed: "soft" | "normal" | "hard";
	  }
	| {
			type: "fly";
			t: TeamNum;
			pid: number;
			direction:
				| "left"
				| "right"
				| "middle"
				| "farLeft"
				| "farRight"
				| "farLeftFoul"
				| "farRightFoul";
			distance: "infield" | "shallow" | "normal" | "deep" | "noDoubter";
	  }
	| {
			type: "hitResult";
			result: "flyOut" | "throwOut" | "fieldersChoice" | "doublePlay" | "hit";
			t: TeamNum;
			pid: number;
			posDefense: (keyof typeof POS_NUMBERS_INVERSE)[]; // Like for a double play, this could be [6, 4, 3]
			runners: Runner[];
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "hitResult";
			result: "error";
			t: TeamNum;
			pid: number;
			pidError: number;
			posDefense: (keyof typeof POS_NUMBERS_INVERSE)[]; // Like for a double play, this could be [6, 4, 3]
			runners: Runner[];
			numBases: 1 | 2 | 3 | 4;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "walk";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			intentional: boolean;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "hitByPitch";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "stealStart";
			pid: number;
			to: 2 | 3 | 4;
	  }
	| {
			type: "stealStartAll";
	  }
	| {
			type: "stealEnd";
			pid: number;
			pidError?: number;
			to: 2 | 3 | 4;
			out: boolean;
			throw: boolean;
			outAtNextBase: boolean; // For if the runner was thrown out when trying to advance one more base
			outs: number;
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "balk";
			t: TeamNum;
			pid: number;
			runners: Runner[];
			bases: [number | undefined, number | undefined, number | undefined];
	  }
	| {
			type: "sub";
			t: TeamNum;
			pidOff: number;
			pidOn: number;
	  };

export type PlayByPlayEvent =
	| (
			| PlayByPlayEventInput
			| {
					type: "stat";
					t: TeamNum;
					pid: number | undefined | null;
					s: string;
					amt: number;
			  }
	  )
	| {
			type: "init";
			boxScore: any;
	  };

export type PlayByPlayEventScore = PlayByPlayEventInputScore & {
	quarter: number;
	hide?: boolean;
};

class PlayByPlayLogger {
	active: boolean;

	playByPlay: PlayByPlayEvent[];

	scoringSummary: PlayByPlayEventScore[];

	constructor(active: boolean) {
		this.active = active;
		this.playByPlay = [];
		this.scoringSummary = [];
	}

	logEvent(event: PlayByPlayEventInput) {
		this.playByPlay.push(event);

		if (event.type === "goal") {
			this.scoringSummary.push(event);
		}
	}

	logStat(t: TeamNum, pid: number | undefined | null, s: string, amt: number) {
		if (!this.active) {
			return;
		}

		this.playByPlay.push({
			type: "stat",
			t,
			pid,
			s,
			amt,
		});
	}

	getPlayByPlay(boxScore: any): PlayByPlayEvent[] | undefined {
		if (!this.active) {
			return;
		}

		return [
			{
				type: "init",
				boxScore,
			},
			...this.playByPlay,
		];
	}
}

export default PlayByPlayLogger;
