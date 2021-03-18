import { helpers } from "../util";

const countryCodes = {
	Algeria: "dz",
	"American Samoa": "as",
	Angola: "ao",
	Argentina: "ar",
	Armenia: "am",
	Australia: "au",
	Austria: "at",
	Azerbaijan: "az",
	Bahamas: "bs",
	Belarus: "by",
	Belgium: "be",
	Benin: "bj",
	Bolivia: "bo",
	"Bosnia and Herzegovina": "ba",
	Brazil: "br",
	Bulgaria: "bg",
	Cameroon: "cm",
	Canada: "ca",
	"Cape Verde": "cv",
	"Central African Republic": "cf",
	Chad: "td",
	Chile: "cl",
	China: "cn",
	Colombia: "co",
	Congo: "cg",
	"Costa Rica": "cr",
	Croatia: "hr",
	Cuba: "cu",
	"Czech Republic": "cz",
	Denmark: "dk",
	"Dominican Republic": "do",
	"East Timor": "tp",
	Egypt: "eg",
	"El Salvador": "sv",
	England: "gb",
	Ecuador: "ec",
	Estonia: "ee",
	Ethiopia: "et",
	Finland: "fi",
	France: "fr",
	"French Guiana": "gf",
	Gabon: "ga",
	Georgia: "ge",
	Germany: "de",
	Ghana: "gh",
	Greece: "gr",
	Guadeloupe: "gp",
	Guatemala: "gt",
	Guinea: "gn",
	"Guinea-Bissau": "gw",
	Haiti: "ht",
	Honduras: "hn",
	Hungary: "hu",
	Iceland: "is",
	India: "in",
	Indonesia: "id",
	Iran: "ir",
	Ireland: "ie",
	Israel: "il",
	Italy: "it",
	"Ivory Coast": "ci",
	Jamaica: "jm",
	Japan: "jp",
	Kazakhstan: "kz",
	Kenya: "ke",
	Kosovo: "xk",
	Kyrgyzstan: "kg",
	Laos: "la",
	Latvia: "lv",
	Liberia: "lr",
	Lithuania: "lt",
	Luxembourg: "lu",
	Macau: "mo",
	Mali: "ml",
	Mexico: "mx",
	Moldova: "md",
	Montenegro: "me",
	Morocco: "ma",
	Mozambique: "mz",
	Nepal: "np",
	Netherlands: "nl",
	"New Zealand": "nz",
	Nicaragua: "ni",
	Nigeria: "ng",
	"North Korea": "kp",
	"North Macedonia": "mk",
	Norway: "no",
	Pakistan: "pk",
	Panama: "pa",
	"Papua New Guinea": "pg",
	Paraguay: "py",
	Peru: "pe",
	Philippines: "ph",
	Poland: "pl",
	Portugal: "pt",
	"Puerto Rico": "pr",
	Romania: "ro",
	Russia: "ru",
	Samoa: "ws",
	Scotland: "gb",
	Senegal: "sn",
	Serbia: "rs",
	Slovakia: "sk",
	Slovenia: "si",
	"South Africa": "za",
	"South Korea": "kr",
	"South Sudan": "ss",
	Spain: "es",
	Sudan: "sd",
	Sweden: "se",
	Switzerland: "ch",
	Thailand: "th",
	"Trinidad and Tobago": "tt",
	Turkey: "tr",
	USA: "us",
	Ukraine: "ua",
	Uruguay: "uy",
	Uzbekistan: "uz",
	Venezuela: "ve",
	Vietnam: "vn",
	"Virgin Islands": "vi",
};

export const categories = {
	award: {
		text: "Awards",
		className: "badge-warning",
	},
	draft: {
		text: "Draft",
		className: "badge-darkblue",
	},
	league: {
		text: "League",
		className: "badge-secondary",
	},
	injury: {
		text: "Injuries",
		className: "badge-danger",
	},
	playerFeat: {
		text: "Player Feats",
		className: "badge-info",
	},
	playoffs: {
		text: "Playoffs",
		className: "badge-orange",
	},
	rare: {
		text: "Rare Events",
		className: "badge-dark",
	},
	transaction: {
		text: "Transactions",
		className: "badge-success",
	},
	team: {
		text: "Teams",
		className: "badge-light",
	},
};

const CountryFlag = ({ country }: { country: string }) => {
	const country2 = helpers.getCountry(country);
	const code = countryCodes[country2];
	if (code) {
		return code;
	}

	return "??";
};

export default CountryFlag;
