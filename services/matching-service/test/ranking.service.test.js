const test = require("node:test");
const assert = require("node:assert/strict");

const RankingService = require("../src/services/ranking/ranking.service");

test("RankingService ranks stronger candidates ahead of weaker ones", async () => {
  const service = new RankingService();

  const ranked = await service.rankProviders([
    {
      providerId: "provider-a",
      distance: 1,
      etaMinutes: 8,
      pricing: { value: 300 },
      metrics: { rating: 4.8, experienceYears: 6, acceptanceRate: 98 },
    },
    {
      providerId: "provider-b",
      distance: 5,
      etaMinutes: 20,
      pricing: { value: 500 },
      metrics: { rating: 4.1, experienceYears: 1, acceptanceRate: 70 },
    },
  ]);

  assert.equal(ranked[0].providerId, "provider-a");
  assert.ok(ranked[0].matchingScore > ranked[1].matchingScore);
});
