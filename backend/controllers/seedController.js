import { runBulkSeed } from "../scripts/seedBulkDataset.js";

const seedState = {
  running: false,
  done: false,
  error: null,
  summary: null,
  startedAt: null,
  finishedAt: null,
};

const runInBackground = () => {
  runBulkSeed({ manageConnection: false })
    .then((summary) => {
      seedState.summary = summary;
      seedState.done = true;
      seedState.error = null;
    })
    .catch((error) => {
      console.error("Bulk seed failed:", error);
      seedState.error = error.message || "Seed failed";
      seedState.done = false;
    })
    .finally(() => {
      seedState.running = false;
      seedState.finishedAt = new Date();
    });
};

export const getBulkSeedStatus = async (_req, res) => {
  res.json(seedState);
};

export const startBulkSeed = async (_req, res) => {
  if (seedState.running) {
    return res.status(202).json({
      message: "Review dataset is already loading.",
      ...seedState,
    });
  }

  seedState.running = true;
  seedState.done = false;
  seedState.error = null;
  seedState.summary = null;
  seedState.startedAt = new Date();
  seedState.finishedAt = null;

  res.status(202).json({
    message: "Loading review dataset into the live database. Open Job Openings in about a minute.",
    running: true,
    startedAt: seedState.startedAt,
  });

  setImmediate(runInBackground);
};
