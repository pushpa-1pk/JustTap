class ProviderMetricsDTO {
  constructor(rawJson) {
    this.rating = Number(rawJson.rating || rawJson.metrics?.rating || 5.0);
    this.completedJobs = Number(rawJson.completedJobs || rawJson.metrics?.completedJobs || 0);
    this.experienceYears = Number(rawJson.experienceYears || rawJson.metrics?.experienceYears || 0);
    this.acceptanceRate = Number(rawJson.acceptanceRate || rawJson.metrics?.acceptanceRate || 100);
    this.cancellationRate = Number(rawJson.cancellationRate || rawJson.metrics?.cancellationRate || 0);
    this.averageResponseTimeSec = Number(rawJson.averageResponseTimeSec || rawJson.metrics?.averageResponseTimeSec || 30);
  }
}

module.exports = ProviderMetricsDTO;