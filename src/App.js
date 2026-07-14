import React, { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import "./App.css";

/* ---------------------------------------------------
   TEAM PROFILES
--------------------------------------------------- */

const createTeamProfile = (
  name,
  shooting,
  perimeterDefense,
  rimProtection,
  playmaking,
  rebounding,
  lowUsageImpact,
  type = "NBA"
) => ({
  name,
  type,
  needs: {
    shooting,
    perimeterDefense,
    rimProtection,
    playmaking,
    rebounding,
    lowUsageImpact,
  },
});

const TEAM_PROFILES = {
  ATL: createTeamProfile("Atlanta Hawks", 0.18, 0.22, 0.16, 0.14, 0.12, 0.18),
  BOS: createTeamProfile("Boston Celtics", 0.2, 0.18, 0.12, 0.14, 0.12, 0.24),
  BKN: createTeamProfile("Brooklyn Nets", 0.16, 0.17, 0.15, 0.19, 0.12, 0.21),
  CHA: createTeamProfile("Charlotte Hornets", 0.18, 0.2, 0.16, 0.15, 0.13, 0.18),
  CHI: createTeamProfile("Chicago Bulls", 0.19, 0.2, 0.15, 0.16, 0.12, 0.18),
  CLE: createTeamProfile("Cleveland Cavaliers", 0.2, 0.19, 0.1, 0.14, 0.13, 0.24),
  DAL: createTeamProfile("Dallas Mavericks", 0.2, 0.2, 0.13, 0.16, 0.11, 0.2),
  DEN: createTeamProfile("Denver Nuggets", 0.22, 0.17, 0.1, 0.15, 0.12, 0.24),
  DET: createTeamProfile("Detroit Pistons", 0.22, 0.18, 0.12, 0.14, 0.13, 0.21),

  GSW: createTeamProfile(
    "Golden State Warriors",
    0.19,
    0.18,
    0.14,
    0.17,
    0.12,
    0.2
  ),

  HOU: createTeamProfile("Houston Rockets", 0.22, 0.16, 0.1, 0.17, 0.12, 0.23),
  IND: createTeamProfile("Indiana Pacers", 0.19, 0.2, 0.13, 0.15, 0.13, 0.2),

  LAC: createTeamProfile(
    "Los Angeles Clippers",
    0.2,
    0.18,
    0.12,
    0.17,
    0.11,
    0.22
  ),

  LAL: createTeamProfile("Los Angeles Lakers", 0.22, 0.2, 0.15, 0.14, 0.11, 0.18),
  MEM: createTeamProfile("Memphis Grizzlies", 0.2, 0.18, 0.12, 0.16, 0.13, 0.21),
  MIA: createTeamProfile("Miami Heat", 0.2, 0.19, 0.12, 0.15, 0.11, 0.23),
  MIL: createTeamProfile("Milwaukee Bucks", 0.21, 0.2, 0.11, 0.15, 0.11, 0.22),

  MIN: createTeamProfile(
    "Minnesota Timberwolves",
    0.21,
    0.16,
    0.1,
    0.18,
    0.12,
    0.23
  ),

  NOP: createTeamProfile(
    "New Orleans Pelicans",
    0.2,
    0.18,
    0.16,
    0.15,
    0.12,
    0.19
  ),

  NYK: createTeamProfile("New York Knicks", 0.2, 0.18, 0.11, 0.18, 0.12, 0.21),

  OKC: createTeamProfile(
    "Oklahoma City Thunder",
    0.18,
    0.16,
    0.11,
    0.15,
    0.14,
    0.26
  ),

  ORL: createTeamProfile("Orlando Magic", 0.26, 0.15, 0.1, 0.17, 0.11, 0.21),

  PHI: createTeamProfile(
    "Philadelphia 76ers",
    0.21,
    0.19,
    0.11,
    0.16,
    0.12,
    0.21
  ),

  PHX: createTeamProfile("Phoenix Suns", 0.18, 0.21, 0.16, 0.17, 0.12, 0.16),

  POR: createTeamProfile(
    "Portland Trail Blazers",
    0.21,
    0.17,
    0.11,
    0.17,
    0.13,
    0.21
  ),

  SAC: createTeamProfile("Sacramento Kings", 0.18, 0.22, 0.18, 0.15, 0.12, 0.15),
  SAS: createTeamProfile("San Antonio Spurs", 0.22, 0.18, 0.08, 0.17, 0.12, 0.23),
  TOR: createTeamProfile("Toronto Raptors", 0.21, 0.17, 0.15, 0.16, 0.12, 0.19),
  UTA: createTeamProfile("Utah Jazz", 0.18, 0.2, 0.13, 0.17, 0.12, 0.2),

  WAS: createTeamProfile(
    "Washington Wizards",
    0.18,
    0.18,
    0.15,
    0.17,
    0.13,
    0.19
  ),

  TRI: createTeamProfile(
    "Pallacanestro Trieste",
    0.12,
    0.22,
    0.2,
    0.17,
    0.19,
    0.1,
    "Lega Basket Serie A"
  ),
};

const NEED_LABELS = {
  shooting: "Perimeter Shooting",
  perimeterDefense: "Perimeter Defense",
  rimProtection: "Rim Protection",
  playmaking: "Secondary Playmaking",
  rebounding: "Rebounding",
  lowUsageImpact: "Low-Usage Impact",
};

/* ---------------------------------------------------
   GENERAL HELPERS
--------------------------------------------------- */

const toNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return 0;
  }

  const parsedValue = Number(
    String(value)
      .replace(/%/g, "")
      .replace(/,/g, "")
      .trim()
  );

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const firstExistingValue = (row, columnNames) => {
  for (const columnName of columnNames) {
    const value = row[columnName];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return undefined;
};

const normalizePercentage = (value) => {
  const number = toNumber(value);

  return number > 0 && number <= 1
    ? number * 100
    : number;
};

const safePerGame = (value, gamesPlayed) => {
  const games = toNumber(gamesPlayed);

  if (games <= 0) {
    return 0;
  }

  return toNumber(value) / games;
};

const formatNumber = (value, decimals = 1) => {
  return toNumber(value).toFixed(decimals);
};

const formatPercentage = (value) => {
  return `${normalizePercentage(value).toFixed(1)}%`;
};

const formatPlusMinus = (value) => {
  const number = toNumber(value);

  return number > 0
    ? `+${number.toFixed(1)}`
    : number.toFixed(1);
};

const clamp = (value, minimum, maximum) => {
  return Math.min(Math.max(value, minimum), maximum);
};

const getMedian = (values) => {
  const sortedValues = values
    .map(toNumber)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!sortedValues.length) {
    return 0;
  }

  const middle = Math.floor(sortedValues.length / 2);

  return sortedValues.length % 2 === 0
    ? (sortedValues[middle - 1] + sortedValues[middle]) / 2
    : sortedValues[middle];
};

const getPercentileRank = (value, values) => {
  const numericValue = toNumber(value);

  const validValues = values
    .map(toNumber)
    .filter(Number.isFinite);

  if (!validValues.length) {
    return 0;
  }

  const belowCount = validValues.filter(
    (item) => item < numericValue
  ).length;

  const equalCount = validValues.filter(
    (item) => item === numericValue
  ).length;

  return (
    belowCount +
    equalCount * 0.5
  ) / validValues.length;
};

/* ---------------------------------------------------
   TABLE COLUMNS
--------------------------------------------------- */

const BASE_COLUMNS = [
  { key: "Rank", label: "Rank" },
  { key: "Player", label: "Player" },
  { key: "GP", label: "GP" },
  { key: "MSR", label: "MSR Total" },
  { key: "MSRAvg", label: "MSR AVG" },
  { key: "Min", label: "MIN" },
  { key: "PTS", label: "PTS" },
  { key: "FGM", label: "FGM" },
  { key: "FGA", label: "FGA" },
  { key: "FGPct", label: "FG%" },
  { key: "ThreePTM", label: "3PM" },
  { key: "ThreePA", label: "3PA" },
  { key: "ThreePct", label: "3P%" },
  { key: "FTM", label: "FTM" },
  { key: "FTA", label: "FTA" },
  { key: "FTPct", label: "FT%" },
  { key: "OREB", label: "OREB" },
  { key: "DREB", label: "DREB" },
  { key: "REB", label: "REB" },
  { key: "AST", label: "AST" },
  { key: "TOV", label: "TOV" },
  { key: "STL", label: "STL" },
  { key: "BLK", label: "BLK" },
  { key: "PF", label: "PF" },
  { key: "PlusMinus", label: "+/-" },
  {
    key: "EuropeanArchetype",
    label: "European Archetype",
  },
];

const TEAM_FIT_COLUMNS = [
  { key: "Rank", label: "Fit Rank" },
  { key: "Player", label: "Player" },
  { key: "TeamFitScore", label: "Team Fit" },
  {
    key: "TeamFitReasons",
    label: "Best Fit Areas",
  },
  { key: "GP", label: "GP" },
  { key: "MSR", label: "MSR Total" },
  { key: "MSRAvg", label: "MSR AVG" },
  { key: "Min", label: "MIN" },
  { key: "PTS", label: "PTS" },
  { key: "FGM", label: "FGM" },
  { key: "FGA", label: "FGA" },
  { key: "FGPct", label: "FG%" },
  { key: "ThreePTM", label: "3PM" },
  { key: "ThreePA", label: "3PA" },
  { key: "ThreePct", label: "3P%" },
  { key: "FTM", label: "FTM" },
  { key: "FTA", label: "FTA" },
  { key: "FTPct", label: "FT%" },
  { key: "OREB", label: "OREB" },
  { key: "DREB", label: "DREB" },
  { key: "REB", label: "REB" },
  { key: "AST", label: "AST" },
  { key: "TOV", label: "TOV" },
  { key: "STL", label: "STL" },
  { key: "BLK", label: "BLK" },
  { key: "PF", label: "PF" },
  { key: "PlusMinus", label: "+/-" },
  {
    key: "EuropeanArchetype",
    label: "European Archetype",
  },
];

/* ---------------------------------------------------
   APP
--------------------------------------------------- */

function App() {
  const [playerData, setPlayerData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("SAC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "MSRAvg",
    direction: "desc",
  });

  const csvUrl = `${process.env.PUBLIC_URL}/stt_msr.csv`;

  /* ---------------------------------------------------
     KEEP GITHUB PAGES PATH
  --------------------------------------------------- */

  useEffect(() => {
    const desiredPath = "/2026-NBA-Summer-League";

    const currentPath = window.location.pathname.replace(
      /\/+$/,
      ""
    );

    if (currentPath !== desiredPath) {
      window.history.replaceState(
        {},
        "",
        desiredPath
      );
    }
  }, []);

  /* ---------------------------------------------------
     LOAD CSV
  --------------------------------------------------- */

  useEffect(() => {
    let active = true;

    const loadCsv = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${csvUrl}?updated=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `CSV request failed with status ${response.status}`
          );
        }

        const csvText = await response.text();

        if (
          csvText.trim().startsWith("<!DOCTYPE html") ||
          csvText.trim().startsWith("<html")
        ) {
          throw new Error(
            "The CSV path returned an HTML page instead of CSV data."
          );
        }

        const data = d3.csvParse(csvText);

        if (!active) {
          return;
        }

        const cleanedData = data
          .filter((row) => {
            const playerName =
              row.Player ||
              row.Name;

            return (
              playerName &&
              String(playerName).trim() !== ""
            );
          })
          .map((row, index) => {
            const playerName =
              row.Player ||
              row.Name ||
              "";

            const gamesPlayed = toNumber(
              firstExistingValue(row, [
                "GP",
                "Games",
                "Games Played",
              ])
            );

            const msrTotal = toNumber(
              firstExistingValue(row, [
                "MSR",
                "MSR Total",
              ])
            );

            const csvMSRAvg = firstExistingValue(
              row,
              [
                "MSR AVG",
                "MSR Avg",
                "MSR_AVG",
                "MSR Average",
                "MSRAvg",
              ]
            );

            const calculatedMSRAvg =
              gamesPlayed > 0
                ? msrTotal / gamesPlayed
                : 0;

            const msrAverage =
              csvMSRAvg !== undefined
                ? toNumber(csvMSRAvg)
                : calculatedMSRAvg;

            const min = toNumber(
              firstExistingValue(row, [
                "Min",
                "MIN",
                "Minutes",
              ])
            );

            const pts = toNumber(row.PTS);
            const fgm = toNumber(row.FGM);
            const fga = toNumber(row.FGA);

            const threePTM = toNumber(
              firstExistingValue(row, [
                "3PTM",
                "3PM",
              ])
            );

            const threePA = toNumber(
              firstExistingValue(row, [
                "3PA",
                "3PTA",
              ])
            );

            const ftm = toNumber(row.FTM);
            const fta = toNumber(row.FTA);
            const oreb = toNumber(row.OREB);
            const dreb = toNumber(row.DREB);
            const reb = toNumber(row.REB);
            const ast = toNumber(row.AST);
            const tov = toNumber(row.TOV);
            const stl = toNumber(row.STL);
            const blk = toNumber(row.BLK);
            const pf = toNumber(row.PF);

            const plusMinus = toNumber(
              firstExistingValue(row, [
                "Plus Minus",
                "+/-",
                "PlusMinus",
              ])
            );

            return {
              Rank:
                toNumber(row.Rank) ||
                toNumber(row["Column 25"]) ||
                index + 1,

              Player: String(playerName).trim(),

              GP: gamesPlayed,
              MSR: msrTotal,
              MSRAvg: msrAverage,

              Min: min,
              PTS: pts,
              FGM: fgm,
              FGA: fga,

              FGPct: normalizePercentage(
                firstExistingValue(row, [
                  "FG%",
                  "FGPct",
                  "FG Pct",
                ])
              ),

              ThreePTM: threePTM,
              ThreePA: threePA,

              ThreePct: normalizePercentage(
                firstExistingValue(row, [
                  "3P%",
                  "3PT%",
                  "ThreePct",
                ])
              ),

              FTM: ftm,
              FTA: fta,

              FTPct: normalizePercentage(
                firstExistingValue(row, [
                  "FT%",
                  "FTPct",
                  "FT Pct",
                ])
              ),

              OREB: oreb,
              DREB: dreb,
              REB: reb,
              AST: ast,
              TOV: tov,
              STL: stl,
              BLK: blk,
              PF: pf,
              PlusMinus: plusMinus,

              EuropeanArchetype:
                String(
                  firstExistingValue(row, [
                    "European Archetype",
                    "Archetype",
                  ]) || "—"
                ).trim() || "—",

              /* Per-game values used by the models */

              MinPerGame: safePerGame(
                min,
                gamesPlayed
              ),

              PTSPerGame: safePerGame(
                pts,
                gamesPlayed
              ),

              FGMPerGame: safePerGame(
                fgm,
                gamesPlayed
              ),

              FGAPerGame: safePerGame(
                fga,
                gamesPlayed
              ),

              ThreePTMPerGame: safePerGame(
                threePTM,
                gamesPlayed
              ),

              ThreePAPerGame: safePerGame(
                threePA,
                gamesPlayed
              ),

              FTMPerGame: safePerGame(
                ftm,
                gamesPlayed
              ),

              FTAPerGame: safePerGame(
                fta,
                gamesPlayed
              ),

              OREBPerGame: safePerGame(
                oreb,
                gamesPlayed
              ),

              DREBPerGame: safePerGame(
                dreb,
                gamesPlayed
              ),

              REBPerGame: safePerGame(
                reb,
                gamesPlayed
              ),

              ASTPerGame: safePerGame(
                ast,
                gamesPlayed
              ),

              TOVPerGame: safePerGame(
                tov,
                gamesPlayed
              ),

              STLPerGame: safePerGame(
                stl,
                gamesPlayed
              ),

              BLKPerGame: safePerGame(
                blk,
                gamesPlayed
              ),

              PFPerGame: safePerGame(
                pf,
                gamesPlayed
              ),

              PlusMinusPerGame: safePerGame(
                plusMinus,
                gamesPlayed
              ),
            };
          });

        if (!cleanedData.length) {
          throw new Error(
            "The CSV loaded, but no valid Player or Name rows were found."
          );
        }

        setPlayerData(cleanedData);
      } catch (csvError) {
        console.error(
          "CSV loading error:",
          csvError
        );

        if (active) {
          setPlayerData([]);

          setError(
            "Unable to load stt_msr.csv. Confirm that the file is inside the public folder and named exactly stt_msr.csv."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCsv();

    return () => {
      active = false;
    };
  }, [csvUrl]);

  /* ---------------------------------------------------
     PER-GAME BENCHMARKS
  --------------------------------------------------- */

  const benchmarks = useMemo(
    () => ({
      medianMSRAvg: getMedian(
        playerData.map(
          (player) => player.MSRAvg
        )
      ),

      medianPTSPerGame: getMedian(
        playerData.map(
          (player) => player.PTSPerGame
        )
      ),

      medianMinPerGame: getMedian(
        playerData.map(
          (player) => player.MinPerGame
        )
      ),

      medianFGAPerGame: getMedian(
        playerData.map(
          (player) => player.FGAPerGame
        )
      ),
    }),
    [playerData]
  );

  /* ---------------------------------------------------
     HIDDEN GEMS
  --------------------------------------------------- */

  const analyzedPlayers = useMemo(() => {
    if (!playerData.length) {
      return [];
    }

    const msrAverageValues =
      playerData.map(
        (player) => player.MSRAvg
      );

    const pointsPerGameValues =
      playerData.map(
        (player) => player.PTSPerGame
      );

    const shotsPerGameValues =
      playerData.map(
        (player) => player.FGAPerGame
      );

    return playerData.map((player) => {
      const msrPercentile =
        getPercentileRank(
          player.MSRAvg,
          msrAverageValues
        );

      const scoringPercentile =
        getPercentileRank(
          player.PTSPerGame,
          pointsPerGameValues
        );

      const shotVolumePercentile =
        getPercentileRank(
          player.FGAPerGame,
          shotsPerGameValues
        );

      const fieldGoalEfficiency =
        player.FGAPerGame > 0
          ? player.FGMPerGame /
            player.FGAPerGame
          : 0;

      const assistTurnoverRatio =
        player.TOVPerGame > 0
          ? player.ASTPerGame /
            player.TOVPerGame
          : player.ASTPerGame;

      const allAroundContribution =
        player.REBPerGame * 0.8 +
        player.ASTPerGame * 1.1 +
        player.STLPerGame * 2 +
        player.BLKPerGame * 1.8 +
        Math.max(
          player.PlusMinusPerGame,
          0
        ) * 0.25;

      const efficiencyAdjustment =
        clamp(
          (
            fieldGoalEfficiency -
            0.4
          ) * 40,
          -5,
          10
        );

      const playmakingAdjustment =
        clamp(
          assistTurnoverRatio * 2,
          0,
          8
        );

      const attentionGap =
        msrPercentile -
        scoringPercentile * 0.55 -
        shotVolumePercentile * 0.25;

      /*
       Small reliability bonus:
       GP 1 = 0
       GP 2 = 1.5
       GP 3 = 3
       GP 4+ capped at 4.5
      */

      const sampleReliabilityBonus =
        clamp(
          (player.GP - 1) * 1.5,
          0,
          4.5
        );

      const hiddenGemScore =
        attentionGap * 100 +
        allAroundContribution +
        efficiencyAdjustment +
        playmakingAdjustment +
        sampleReliabilityBonus;

      const minimumMinutesPerGame =
        Math.max(
          10,
          benchmarks.medianMinPerGame *
            0.65
        );

      const lowOrModerateUsage =
        player.PTSPerGame <=
          benchmarks.medianPTSPerGame *
            1.35 ||
        player.FGAPerGame <=
          benchmarks.medianFGAPerGame;

      return {
        ...player,

        HiddenGemScore:
          hiddenGemScore,

        IsHiddenGem:
          player.GP >= 1 &&
          player.MinPerGame >=
            minimumMinutesPerGame &&
          player.MSRAvg >=
            benchmarks.medianMSRAvg &&
          lowOrModerateUsage &&
          hiddenGemScore > 5,
      };
    });
  }, [
    playerData,
    benchmarks,
  ]);

  /* ---------------------------------------------------
     TEAM AND CLUB FIT
  --------------------------------------------------- */

  const teamFitPlayers = useMemo(() => {
    const profile =
      TEAM_PROFILES[selectedTeam] ||
      TEAM_PROFILES.SAC;

    if (
      !profile ||
      !profile.needs ||
      !analyzedPlayers.length
    ) {
      return [];
    }

    const dataset = {
      MSRAvg: analyzedPlayers.map(
        (player) => player.MSRAvg
      ),

      FGPct: analyzedPlayers.map(
        (player) => player.FGPct
      ),

      ThreePct: analyzedPlayers.map(
        (player) => player.ThreePct
      ),

      ThreePTMPerGame:
        analyzedPlayers.map(
          (player) =>
            player.ThreePTMPerGame
        ),

      ASTPerGame:
        analyzedPlayers.map(
          (player) =>
            player.ASTPerGame
        ),

      STLPerGame:
        analyzedPlayers.map(
          (player) =>
            player.STLPerGame
        ),

      BLKPerGame:
        analyzedPlayers.map(
          (player) =>
            player.BLKPerGame
        ),

      REBPerGame:
        analyzedPlayers.map(
          (player) =>
            player.REBPerGame
        ),

      OREBPerGame:
        analyzedPlayers.map(
          (player) =>
            player.OREBPerGame
        ),

      PlusMinusPerGame:
        analyzedPlayers.map(
          (player) =>
            player.PlusMinusPerGame
        ),

      PTSPerGame:
        analyzedPlayers.map(
          (player) =>
            player.PTSPerGame
        ),

      FGAPerGame:
        analyzedPlayers.map(
          (player) =>
            player.FGAPerGame
        ),
    };

    return analyzedPlayers
      .map((player) => {
        const shooting =
          getPercentileRank(
            player.ThreePct,
            dataset.ThreePct
          ) * 0.45 +
          getPercentileRank(
            player.ThreePTMPerGame,
            dataset.ThreePTMPerGame
          ) * 0.35 +
          getPercentileRank(
            player.FGPct,
            dataset.FGPct
          ) * 0.2;

        const perimeterDefense =
          getPercentileRank(
            player.STLPerGame,
            dataset.STLPerGame
          ) * 0.6 +
          getPercentileRank(
            player.PlusMinusPerGame,
            dataset.PlusMinusPerGame
          ) * 0.4;

        const rimProtection =
          getPercentileRank(
            player.BLKPerGame,
            dataset.BLKPerGame
          ) * 0.65 +
          getPercentileRank(
            player.REBPerGame,
            dataset.REBPerGame
          ) * 0.35;

        const assistTurnoverRatio =
          player.TOVPerGame > 0
            ? player.ASTPerGame /
              player.TOVPerGame
            : player.ASTPerGame;

        const playmaking =
          getPercentileRank(
            player.ASTPerGame,
            dataset.ASTPerGame
          ) * 0.65 +
          Math.min(
            assistTurnoverRatio / 4,
            1
          ) * 0.35;

        const rebounding =
          getPercentileRank(
            player.REBPerGame,
            dataset.REBPerGame
          ) * 0.7 +
          getPercentileRank(
            player.OREBPerGame,
            dataset.OREBPerGame
          ) * 0.3;

        const impactPercentile =
          getPercentileRank(
            player.MSRAvg,
            dataset.MSRAvg
          );

        const scoringPercentile =
          getPercentileRank(
            player.PTSPerGame,
            dataset.PTSPerGame
          );

        const shotVolumePercentile =
          getPercentileRank(
            player.FGAPerGame,
            dataset.FGAPerGame
          );

        const lowUsageImpact =
          clamp(
            impactPercentile -
              scoringPercentile *
                0.35 -
              shotVolumePercentile *
                0.25,
            0,
            1
          );

        const categoryScores = {
          shooting,
          perimeterDefense,
          rimProtection,
          playmaking,
          rebounding,
          lowUsageImpact,
        };

        const weightedFit =
          Object.entries(
            profile.needs
          ).reduce(
            (
              total,
              [needKey, weight]
            ) =>
              total +
              (
                categoryScores[
                  needKey
                ] || 0
              ) *
                toNumber(weight),
            0
          );

        /*
         Small sample confidence:
         GP 1 = 0.97
         GP 2 = 0.985
         GP 3+ = 1.00
        */

        const reliabilityMultiplier =
          clamp(
            0.955 +
              player.GP * 0.015,
            0.97,
            1
          );

        const teamFitScore =
          weightedFit *
          reliabilityMultiplier *
          100;

        const teamFitReasons =
          Object.entries(
            categoryScores
          )
            .map(
              ([
                needKey,
                score,
              ]) => ({
                label:
                  NEED_LABELS[
                    needKey
                  ] || needKey,

                weightedScore:
                  score *
                  toNumber(
                    profile.needs[
                      needKey
                    ]
                  ),
              })
            )
            .sort(
              (a, b) =>
                b.weightedScore -
                a.weightedScore
            )
            .slice(0, 2)
            .map(
              (item) => item.label
            );

        return {
          ...player,

          TeamFitScore:
            teamFitScore,

          TeamFitReasons:
            teamFitReasons,
        };
      })
      .sort(
        (a, b) =>
          b.TeamFitScore -
          a.TeamFitScore
      );
  }, [
    analyzedPlayers,
    selectedTeam,
  ]);

  /* ---------------------------------------------------
     VIEW CONTROLS
  --------------------------------------------------- */

  const handleViewChange = (
    nextView
  ) => {
    setViewMode(nextView);
    setSearchTerm("");

    setSortConfig({
      key:
        nextView === "hidden"
          ? "HiddenGemScore"
          : nextView === "teamFit"
          ? "TeamFitScore"
          : "MSRAvg",

      direction: "desc",
    });
  };

  const handleSort = (key) => {
    setSortConfig(
      (currentSort) => {
        if (
          currentSort.key === key
        ) {
          return {
            key,

            direction:
              currentSort.direction ===
              "asc"
                ? "desc"
                : "asc",
          };
        }

        const isTextColumn =
          key === "Player" ||
          key ===
            "EuropeanArchetype" ||
          key ===
            "TeamFitReasons";

        return {
          key,

          direction:
            isTextColumn
              ? "asc"
              : "desc",
        };
      }
    );
  };

  /* ---------------------------------------------------
     FILTER AND SORT DISPLAY DATA
  --------------------------------------------------- */

  const displayedData = useMemo(() => {
    let data;

    if (viewMode === "teamFit") {
      data =
        teamFitPlayers.slice(0, 30);
    } else if (
      viewMode === "hidden"
    ) {
      data = analyzedPlayers
        .filter(
          (player) =>
            player.IsHiddenGem
        )
        .sort(
          (a, b) =>
            b.HiddenGemScore -
            a.HiddenGemScore
        )
        .slice(0, 25);
    } else {
      data = [...analyzedPlayers];
    }

    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    const searchResults =
      data.filter(
        (player) =>
          player.Player
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          player.EuropeanArchetype
            .toLowerCase()
            .includes(
              normalizedSearch
            )
      );

    return [...searchResults].sort(
      (a, b) => {
        const aValue =
          a[sortConfig.key];

        const bValue =
          b[sortConfig.key];

        if (
          Array.isArray(aValue) ||
          Array.isArray(bValue)
        ) {
          const comparison =
            String(
              Array.isArray(aValue)
                ? aValue.join(" ")
                : aValue || ""
            ).localeCompare(
              String(
                Array.isArray(bValue)
                  ? bValue.join(" ")
                  : bValue || ""
              )
            );

          return sortConfig.direction ===
            "asc"
            ? comparison
            : comparison * -1;
        }

        if (
          typeof aValue === "string" ||
          typeof bValue === "string"
        ) {
          const comparison =
            String(
              aValue || ""
            ).localeCompare(
              String(
                bValue || ""
              ),
              undefined,
              {
                sensitivity: "base",
              }
            );

          return sortConfig.direction ===
            "asc"
            ? comparison
            : comparison * -1;
        }

        return sortConfig.direction ===
          "asc"
          ? toNumber(aValue) -
              toNumber(bValue)
          : toNumber(bValue) -
              toNumber(aValue);
      }
    );
  }, [
    analyzedPlayers,
    teamFitPlayers,
    viewMode,
    searchTerm,
    sortConfig,
  ]);

  const visibleColumns =
    viewMode === "teamFit"
      ? TEAM_FIT_COLUMNS
      : BASE_COLUMNS;

  /* ---------------------------------------------------
     DISPLAY HELPERS
  --------------------------------------------------- */

  const getSortIndicator = (
    key
  ) => {
    if (
      sortConfig.key !== key
    ) {
      return "";
    }

    return sortConfig.direction ===
      "asc"
      ? " ▲"
      : " ▼";
  };

  const getMSRClass = (
    value
  ) => {
    if (value >= 35) {
      return "msr-elite";
    }

    if (value >= 15) {
      return "msr-strong";
    }

    return "msr-emerging";
  };

  const getMSRAvgClass = (
    value
  ) => {
    if (value >= 20) {
      return "msr-elite";
    }

    if (value >= 12) {
      return "msr-strong";
    }

    return "msr-emerging";
  };

  const getFitClass = (
    value
  ) => {
    if (value >= 75) {
      return "fit-elite";
    }

    if (value >= 60) {
      return "fit-strong";
    }

    return "fit-developmental";
  };

  const getHeaderClass = (
    key
  ) => {
    const classes = [];

    if (key === "Player") {
      classes.push(
        "player-column"
      );
    }

    if (key === "MSR") {
      classes.push(
        "msr-column"
      );
    }

    if (key === "MSRAvg") {
      classes.push(
        "msr-avg-column"
      );
    }

    if (
      key === "TeamFitScore"
    ) {
      classes.push(
        "team-fit-column"
      );
    }

    if (
      key ===
      "TeamFitReasons"
    ) {
      classes.push(
        "fit-reasons-column"
      );
    }

    if (
      key ===
      "EuropeanArchetype"
    ) {
      classes.push(
        "archetype-column"
      );
    }

    return classes.join(" ");
  };

  const getCellClass = (
    player,
    key
  ) => {
    const classes = [];

    if (key === "Player") {
      classes.push(
        "player-column"
      );
    }

    if (key === "MSR") {
      classes.push(
        "msr-column",
        getMSRClass(
          player.MSR
        )
      );
    }

    if (key === "MSRAvg") {
      classes.push(
        "msr-avg-column",
        getMSRAvgClass(
          player.MSRAvg
        )
      );
    }

    if (
      key === "TeamFitScore"
    ) {
      classes.push(
        "team-fit-column",
        getFitClass(
          player.TeamFitScore
        )
      );
    }

    if (
      key ===
      "TeamFitReasons"
    ) {
      classes.push(
        "fit-reasons-column"
      );
    }

    if (
      key ===
      "EuropeanArchetype"
    ) {
      classes.push(
        "archetype-column"
      );
    }

    if (
      key === "PlusMinus"
    ) {
      if (
        player.PlusMinus > 0
      ) {
        classes.push(
          "positive-value"
        );
      } else if (
        player.PlusMinus < 0
      ) {
        classes.push(
          "negative-value"
        );
      }
    }

    return classes.join(" ");
  };

  const renderCell = (
    player,
    key,
    index
  ) => {
    switch (key) {
      case "Rank":
        return viewMode === "all"
          ? player.Rank
          : index + 1;

      case "Player":
        return player.Player;

      case "GP":
        return player.GP;

      case "MSR":
        return formatNumber(
          player.MSR,
          2
        );

      case "MSRAvg":
        return formatNumber(
          player.MSRAvg,
          2
        );

      case "TeamFitScore":
        return `${formatNumber(
          player.TeamFitScore,
          0
        )}/100`;

      case "TeamFitReasons":
        return player
          .TeamFitReasons
          ?.join(" • ") || "—";

      case "FGPct":
      case "ThreePct":
      case "FTPct":
        return formatPercentage(
          player[key]
        );

      case "PlusMinus":
        return formatPlusMinus(
          player.PlusMinus
        );

      case "EuropeanArchetype":
        return (
          player.EuropeanArchetype ||
          "—"
        );

      default:
        return formatNumber(
          player[key],
          1
        );
    }
  };

  const selectedProfile =
    TEAM_PROFILES[
      selectedTeam
    ] || TEAM_PROFILES.SAC;

  const selectedTeamName =
    selectedProfile.name;

  const selectedTeamType =
    selectedProfile.type;

  /* ---------------------------------------------------
     RENDER
  --------------------------------------------------- */

  return (
    <div className="app-container fade-in">
      <header className="app-header">
        NBA Summer League MSR Leaderboard
      </header>

      <div className="brand-subtitle">
        Modern Skill Rating
      </div>

      <div className="top-controls">
        <div className="search-count-row">
          <input
            type="text"
            className="search-bar"
            placeholder="Search player or archetype..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          <div className="player-count">
            {displayedData.length}{" "}
            {displayedData.length === 1
              ? "player"
              : "players"}
          </div>
        </div>

        <div className="view-toggle">
          <button
            type="button"
            className={
              viewMode === "all"
                ? "view-button active"
                : "view-button"
            }
            onClick={() =>
              handleViewChange(
                "all"
              )
            }
          >
            All Players
          </button>

          <button
            type="button"
            className={
              viewMode === "hidden"
                ? "view-button active"
                : "view-button"
            }
            onClick={() =>
              handleViewChange(
                "hidden"
              )
            }
          >
            💎 Hidden Gems
          </button>

          <button
            type="button"
            className={
              viewMode === "teamFit"
                ? "view-button active"
                : "view-button"
            }
            onClick={() =>
              handleViewChange(
                "teamFit"
              )
            }
          >
            🏀 Team & Club Fits
          </button>
        </div>

        {viewMode ===
          "teamFit" && (
          <div className="team-selector">
            <label
              className="team-selector-label"
              htmlFor="team-select"
            >
              Select Team or Club
            </label>

            <select
              id="team-select"
              className="team-select"
              value={selectedTeam}
              onChange={(event) => {
                setSelectedTeam(
                  event.target.value
                );

                setSortConfig({
                  key: "TeamFitScore",
                  direction: "desc",
                });
              }}
            >
              <optgroup label="NBA Teams">
                {Object.entries(
                  TEAM_PROFILES
                )
                  .filter(
                    ([, team]) =>
                      team.type ===
                      "NBA"
                  )
                  .sort(
                    (
                      [, teamA],
                      [, teamB]
                    ) =>
                      teamA.name.localeCompare(
                        teamB.name
                      )
                  )
                  .map(
                    ([
                      teamCode,
                      team,
                    ]) => (
                      <option
                        key={
                          teamCode
                        }
                        value={
                          teamCode
                        }
                      >
                        {team.name}
                      </option>
                    )
                  )}
              </optgroup>

              <optgroup label="International Clubs">
                {Object.entries(
                  TEAM_PROFILES
                )
                  .filter(
                    ([, team]) =>
                      team.type !==
                      "NBA"
                  )
                  .sort(
                    (
                      [, teamA],
                      [, teamB]
                    ) =>
                      teamA.name.localeCompare(
                        teamB.name
                      )
                  )
                  .map(
                    ([
                      teamCode,
                      team,
                    ]) => (
                      <option
                        key={
                          teamCode
                        }
                        value={
                          teamCode
                        }
                      >
                        {team.name}
                      </option>
                    )
                  )}
              </optgroup>
            </select>
          </div>
        )}
      </div>

      {viewMode ===
        "hidden" && (
        <div className="view-description">
          Under-the-radar players whose
          per-game overall statistical
          profiles may deserve more
          attention than their scoring
          volume alone suggests. Players
          are not penalized for having
          played additional games.
        </div>
      )}

      {viewMode ===
        "teamFit" && (
        <div className="view-description">
          Ranking players by how closely
          their per-game statistical
          profiles align with{" "}
          <strong>
            {selectedTeamName}
          </strong>{" "}
          roster priorities for{" "}
          {selectedTeamType}. Games played
          provide only a small sample-size
          confidence adjustment. Basketball
          fit does not imply that a player
          is available, unsigned, or
          obtainable.
        </div>
      )}

      {loading && (
        <div className="status-message">
          Loading leaderboard...
        </div>
      )}

      {error && (
        <div className="status-message error-message">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        displayedData.length ===
          0 && (
          <div className="status-message">
            No qualifying players found.
          </div>
        )}

      {!loading &&
        !error &&
        displayedData.length >
          0 && (
          <div className="table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  {visibleColumns.map(
                    (column) => (
                      <th
                        key={
                          column.key
                        }
                        className={getHeaderClass(
                          column.key
                        )}
                        onClick={() =>
                          handleSort(
                            column.key
                          )
                        }
                      >
                        {column.label}
                        {getSortIndicator(
                          column.key
                        )}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {displayedData.map(
                  (
                    player,
                    playerIndex
                  ) => (
                    <tr
                      key={`${player.Player}-${player.Rank}`}
                      className={
                        viewMode ===
                        "hidden"
                          ? "hidden-gem-row"
                          : viewMode ===
                            "teamFit"
                          ? "team-fit-row"
                          : ""
                      }
                    >
                      {visibleColumns.map(
                        (column) => (
                          <td
                            key={`${player.Player}-${column.key}`}
                            className={getCellClass(
                              player,
                              column.key
                            )}
                          >
                            {renderCell(
                              player,
                              column.key,
                              playerIndex
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

export default App;




















