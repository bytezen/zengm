import classNames from "classnames";
import PropTypes from "prop-types";
import React, {
	ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { BoxScoreRow, BoxScoreWrapper } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { localActions, processLiveGameEvents } from "../util";
import type { View } from "../../common/types";
import { Dropdown } from "react-bootstrap";

type PlayerRowProps = {
	forceUpdate?: boolean;
	i: number;
	liveGameInProgress?: boolean;
	p: any;
};

class PlayerRow extends React.Component<PlayerRowProps> {
	prevInGame: boolean | undefined;

	// Can't just switch to useMemo because p is mutated. Might be better to fix that, then switch to useMemo!
	shouldComponentUpdate(nextProps: PlayerRowProps) {
		return process.env.SPORT === "basketball"
			? this.prevInGame || nextProps.p.inGame || nextProps.forceUpdate
			: true;
	}

	render() {
		const { p, ...props } = this.props;

		// Needed for shouldComponentUpdate because state is mutated so we need to explicitly store the last value
		this.prevInGame = p.inGame;

		const classes =
			process.env.SPORT === "basketball"
				? classNames({
						"table-warning": p.inGame,
				  })
				: undefined;

		return <BoxScoreRow className={classes} p={p} {...props} />;
	}
}

// @ts-ignore
PlayerRow.propTypes = {
	p: PropTypes.object.isRequired,
};

const updatePhaseAndLeagueTopBar = () => {
	localActions.update({
		liveGameInProgress: false,
	});
};

const getSeconds = (time: string) => {
	const [min, sec] = time.split(":").map(x => parseInt(x, 10));
	return min * 60 + sec;
};

const LiveGame = (props: View<"liveGame">) => {
	const [paused, setPaused] = useState(false);
	const pausedRef = useRef(paused);
	const [speed, setSpeed] = useState(7);
	const speedRef = useRef(speed);
	const [playIndex, setPlayIndex] = useState(-1);
	const [started, setStarted] = useState(!!props.events);

	const boxScore = useRef<any>(
		props.initialBoxScore ? props.initialBoxScore : {},
	);

	const overtimes = useRef(0);
	const playByPlayDiv = useRef<HTMLDivElement | null>(null);
	const quarters = useRef(["Q1"]);
	const componentIsMounted = useRef(false);
	const events = useRef<any[] | undefined>();

	const processToNextPause = useCallback((force?: boolean): number => {
		if (!componentIsMounted.current || (pausedRef.current && !force)) {
			return 0;
		}

		const startSeconds = getSeconds(boxScore.current.time);

		if (!events.current) {
			throw new Error("events.current is undefined");
		}

		const output = processLiveGameEvents({
			boxScore: boxScore.current,
			events: events.current,
			overtimes: overtimes.current,
			quarters: quarters.current,
		});
		const text = output.text;
		overtimes.current = output.overtimes;
		quarters.current = output.quarters;

		if (text !== undefined) {
			const p = document.createElement("p");
			const node = document.createTextNode(text);
			if (
				text === "End of game" ||
				text.startsWith("Start of") ||
				text.startsWith("Elam Ending activated! First team to")
			) {
				const b = document.createElement("b");
				b.appendChild(node);
				p.appendChild(b);
			} else {
				p.appendChild(node);
			}

			if (playByPlayDiv.current) {
				playByPlayDiv.current.insertBefore(p, playByPlayDiv.current.firstChild);
			}
		}

		if (events.current && events.current.length > 0) {
			if (!pausedRef.current) {
				setTimeout(processToNextPause, 4000 / 1.2 ** speedRef.current);
			}
		} else {
			boxScore.current.time = "0:00";
			boxScore.current.gameOver = true;
			if (boxScore.current.scoringSummary) {
				for (const event of boxScore.current.scoringSummary) {
					event.hide = false;
				}
			}

			// Update team records with result of game
			// Keep in sync with liveGame.ts
			for (const t of boxScore.current.teams) {
				if (boxScore.current.playoffs) {
					if (t.playoffs) {
						if (boxScore.current.won.tid === t.tid) {
							t.playoffs.won += 1;
						} else if (boxScore.current.lost.tid === t.tid) {
							t.playoffs.lost += 1;
						}
					}
				} else {
					if (boxScore.current.won.pts === boxScore.current.lost.pts) {
						// Tied!
						if (t.tied !== undefined) {
							t.tied += 1;
						}
					} else if (boxScore.current.won.tid === t.tid) {
						t.won += 1;
					} else if (boxScore.current.lost.tid === t.tid) {
						t.lost += 1;
					}
				}
			}

			updatePhaseAndLeagueTopBar();
		}

		setPlayIndex(prev => prev + 1);

		const endSeconds = getSeconds(boxScore.current.time);

		// This is negative when rolling over to a new quarter
		const elapsedSeconds = startSeconds - endSeconds;
		return elapsedSeconds;
	}, []);

	useEffect(() => {
		componentIsMounted.current = true;

		const setPlayByPlayDivHeight = () => {
			if (playByPlayDiv.current) {
				// Keep in sync with .live-game-affix
				if (window.matchMedia("(min-width:768px)").matches) {
					playByPlayDiv.current.style.height = `${window.innerHeight - 113}px`;
				} else if (playByPlayDiv.current.style.height !== "") {
					playByPlayDiv.current.style.removeProperty("height");
				}
			}
		};

		// Keep height of plays list equal to window
		setPlayByPlayDivHeight();
		window.addEventListener("optimizedResize", setPlayByPlayDivHeight);

		return () => {
			componentIsMounted.current = false;
			window.removeEventListener("optimizedResize", setPlayByPlayDivHeight);
			updatePhaseAndLeagueTopBar();
		};
	}, []);

	const startLiveGame = useCallback(
		(events2: any[]) => {
			events.current = events2;
			processToNextPause();
		},
		[processToNextPause],
	);

	useEffect(() => {
		if (props.events && !started) {
			boxScore.current = props.initialBoxScore;
			setStarted(true);
			startLiveGame(props.events.slice());
		}
	}, [props.events, props.initialBoxScore, started, startLiveGame]);

	// Plays up to `cutoffs` seconds, or until end of quarter
	const playSeconds = (cutoff: number) => {
		let seconds = 0;
		while (seconds < cutoff && !boxScore.current.gameOver) {
			const elapsedSeconds = processToNextPause(true);
			if (elapsedSeconds > 0) {
				seconds += elapsedSeconds;
			} else if (elapsedSeconds < 0) {
				// End of quarter, always stop
				break;
			}
		}
	};

	const playUntilLastTwoMinutes = () => {
		const quartersToPlay =
			quarters.current.length >= 4 ? 0 : 4 - quarters.current.length;
		for (let i = 0; i < quartersToPlay; i++) {
			playSeconds(Infinity);
		}

		const currentSeconds = getSeconds(boxScore.current.time);
		const targetSeconds = 125; // 2 minutes plus 5 seconds, cause can't always be exact
		const secoundsToPlay = currentSeconds - targetSeconds;
		if (secoundsToPlay > 0) {
			playSeconds(secoundsToPlay);
		}
	};

	const playUntilElamEnding = () => {
		while (
			boxScore.current.elamTarget === undefined &&
			!boxScore.current.gameOver
		) {
			processToNextPause(true);
		}
	};

	const handleSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
		const speed = parseInt(event.target.value, 10);
		if (!Number.isNaN(speed)) {
			setSpeed(speed);
			speedRef.current = speed;
		}
	};

	const handlePause = () => {
		setPaused(true);
		pausedRef.current = true;
	};

	const handlePlay = () => {
		setPaused(false);
		pausedRef.current = false;
		processToNextPause();
	};

	// Needs to return actual div, not fragment, for AutoAffix!!!
	return (
		<div>
			<p className="text-danger">
				If you navigate away from this page, you won't be able to see these
				play-by-play results again because they are not stored anywhere. The
				results of this game are already final, though.
			</p>

			<div className="row">
				<div className="col-md-9">
					{boxScore.current.gid >= 0 ? (
						<BoxScoreWrapper
							boxScore={boxScore.current}
							injuredToBottom
							Row={PlayerRow}
							playIndex={playIndex}
						/>
					) : (
						<h2>Loading...</h2>
					)}
				</div>
				<div className="col-md-3">
					<div className="live-game-affix">
						{boxScore.current.gid >= 0 ? (
							<div className="d-flex align-items-center mb-3">
								<div className="btn-group mr-2">
									{paused ? (
										<button
											className="btn btn-light-bordered"
											disabled={boxScore.current.gameOver}
											onClick={handlePlay}
											title="Resume Simulation"
										>
											<span className="glyphicon glyphicon-play" />
										</button>
									) : (
										<button
											className="btn btn-light-bordered"
											disabled={boxScore.current.gameOver}
											onClick={handlePause}
											title="Pause Simulation"
										>
											<span className="glyphicon glyphicon-pause" />
										</button>
									)}
									<button
										className="btn btn-light-bordered"
										disabled={!paused || boxScore.current.gameOver}
										onClick={() => {
											processToNextPause(true);
										}}
										title="Show Next Play"
									>
										<span className="glyphicon glyphicon-step-forward" />
									</button>
									<Dropdown alignRight>
										<Dropdown.Toggle
											id="live-game-sim-more"
											className="btn-light-bordered live-game-sim-more"
											disabled={!paused || boxScore.current.gameOver}
											variant={"no-class" as any}
											title="Fast Forward"
										>
											<span className="glyphicon glyphicon-fast-forward" />
										</Dropdown.Toggle>
										<Dropdown.Menu>
											<Dropdown.Item
												onClick={() => {
													playSeconds(60);
												}}
											>
												1 minute
											</Dropdown.Item>
											<Dropdown.Item
												onClick={() => {
													playSeconds(60 * 3);
												}}
											>
												3 minutes
											</Dropdown.Item>
											<Dropdown.Item
												onClick={() => {
													playSeconds(60 * 6);
												}}
											>
												6 minutes
											</Dropdown.Item>
											<Dropdown.Item
												onClick={() => {
													playSeconds(Infinity);
												}}
											>
												End of{" "}
												{boxScore.current.elamTarget === undefined
													? "quarter"
													: "game"}
											</Dropdown.Item>
											{!boxScore.current.elam ? (
												<Dropdown.Item
													onClick={() => {
														playUntilLastTwoMinutes();
													}}
												>
													Until last 2 minutes
												</Dropdown.Item>
											) : null}
											{boxScore.current.elam &&
											boxScore.current.elamTarget === undefined ? (
												<Dropdown.Item
													onClick={() => {
														playUntilElamEnding();
													}}
												>
													Until Elam Ending
												</Dropdown.Item>
											) : null}
										</Dropdown.Menu>
									</Dropdown>
								</div>
								<div className="form-group flex-grow-1 mb-0">
									<input
										type="range"
										className="form-control-range"
										disabled={boxScore.current.gameOver}
										min="1"
										max="33"
										step="1"
										value={speed}
										onChange={handleSpeedChange}
										title="Speed"
									/>
								</div>
							</div>
						) : null}

						<div
							className="live-game-playbyplay"
							ref={c => {
								playByPlayDiv.current = c;
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

// @ts-ignore
LiveGame.propTypes = {
	events: PropTypes.arrayOf(
		PropTypes.shape({
			type: PropTypes.string.isRequired,
		}),
	),
	initialBoxScore: PropTypes.object,
};

const LiveGameWrapper = (props: View<"liveGame">) => {
	useTitleBar({ title: "Live Game Simulation", hideNewWindow: true });

	return <LiveGame {...props} />;
};

// @ts-ignore
LiveGameWrapper.propTypes = LiveGame.propTypes;

export default LiveGameWrapper;
