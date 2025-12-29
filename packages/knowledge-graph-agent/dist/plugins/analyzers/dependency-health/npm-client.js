import { createLogger } from "../../../utils/logger.js";
const logger = createLogger("npm-client");
class NpmClient {
  registryUrl;
  timeout;
  cacheTtl;
  cache = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.registryUrl = config.registryUrl ?? "https://registry.npmjs.org";
    this.timeout = config.timeout ?? 3e4;
    this.cacheTtl = config.cacheTtl ?? 36e5;
  }
  /**
   * Get cached value or fetch new data
   */
  async getCached(key, fetcher) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.data;
    }
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "knowledge-graph-agent/1.0"
        }
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Get package metadata from npm registry
   */
  async getPackageMetadata(packageName) {
    const cacheKey = `metadata:${packageName}`;
    try {
      return await this.getCached(cacheKey, async () => {
        const encodedName = encodeURIComponent(packageName).replace("%40", "@");
        const url = `${this.registryUrl}/${encodedName}`;
        logger.debug("Fetching package metadata", { package: packageName, url });
        const response = await this.fetchWithTimeout(url);
        if (!response.ok) {
          if (response.status === 404) {
            logger.warn("Package not found in registry", { package: packageName });
            return null;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const latestVersion = data["dist-tags"]?.latest ?? "";
        const versionData = latestVersion ? data.versions?.[latestVersion] ?? {} : {};
        return {
          name: data.name,
          version: latestVersion,
          description: data.description,
          keywords: data.keywords,
          author: typeof data.author === "string" ? { name: data.author } : data.author,
          license: data.license,
          repository: data.repository,
          homepage: data.homepage,
          bugs: data.bugs,
          lastPublish: latestVersion ? data.time?.[latestVersion] : void 0,
          deprecated: versionData.deprecated,
          hasTypes: !!(versionData.types || versionData.typings)
        };
      });
    } catch (error) {
      logger.error("Failed to fetch package metadata", error instanceof Error ? error : void 0, {
        package: packageName
      });
      return null;
    }
  }
  /**
   * Get download statistics from npm
   */
  async getDownloadStats(packageName) {
    const cacheKey = `downloads:${packageName}`;
    try {
      return await this.getCached(cacheKey, async () => {
        const encodedName = encodeURIComponent(packageName).replace("%40", "@");
        const weekUrl = `https://api.npmjs.org/downloads/point/last-week/${encodedName}`;
        const monthUrl = `https://api.npmjs.org/downloads/point/last-month/${encodedName}`;
        const dayUrl = `https://api.npmjs.org/downloads/point/last-day/${encodedName}`;
        const [weekResponse, monthResponse, dayResponse] = await Promise.all([
          this.fetchWithTimeout(weekUrl).catch(() => null),
          this.fetchWithTimeout(monthUrl).catch(() => null),
          this.fetchWithTimeout(dayUrl).catch(() => null)
        ]);
        const weekData = weekResponse?.ok ? await weekResponse.json() : null;
        const monthData = monthResponse?.ok ? await monthResponse.json() : null;
        const dayData = dayResponse?.ok ? await dayResponse.json() : null;
        if (!weekData && !monthData && !dayData) {
          return null;
        }
        return {
          daily: dayData?.downloads ?? 0,
          weekly: weekData?.downloads ?? 0,
          monthly: monthData?.downloads ?? 0
        };
      });
    } catch (error) {
      logger.error("Failed to fetch download stats", error instanceof Error ? error : void 0, {
        package: packageName
      });
      return null;
    }
  }
  /**
   * Get quality metrics (simulated based on available data)
   * In production, this could use npms.io API or similar service
   */
  async getQualityMetrics(packageName) {
    const cacheKey = `quality:${packageName}`;
    try {
      return await this.getCached(cacheKey, async () => {
        const [metadata, downloads] = await Promise.all([
          this.getPackageMetadata(packageName),
          this.getDownloadStats(packageName)
        ]);
        if (!metadata) {
          return null;
        }
        let popularity = 0;
        if (downloads) {
          popularity = Math.min(downloads.monthly / 1e5, 1);
        }
        let maintenance = 0.5;
        if (metadata.lastPublish) {
          const daysSincePublish = (Date.now() - new Date(metadata.lastPublish).getTime()) / (1e3 * 60 * 60 * 24);
          maintenance = Math.max(0.2, 1 - daysSincePublish / 365);
        }
        let quality = 0.3;
        if (metadata.description) quality += 0.1;
        if (metadata.repository) quality += 0.1;
        if (metadata.homepage) quality += 0.1;
        if (metadata.license) quality += 0.1;
        if (metadata.hasTypes) quality += 0.15;
        if (metadata.keywords && metadata.keywords.length > 0) quality += 0.05;
        if (!metadata.deprecated) quality += 0.1;
        quality = Math.min(quality, 1);
        const final = quality * 0.35 + popularity * 0.35 + maintenance * 0.3;
        return {
          quality,
          popularity,
          maintenance,
          final
        };
      });
    } catch (error) {
      logger.error("Failed to calculate quality metrics", error instanceof Error ? error : void 0, {
        package: packageName
      });
      return null;
    }
  }
  /**
   * Get all available information for a package
   */
  async getFullPackageInfo(packageName) {
    const [metadata, downloads, quality] = await Promise.all([
      this.getPackageMetadata(packageName),
      this.getDownloadStats(packageName),
      this.getQualityMetrics(packageName)
    ]);
    if (metadata) {
      metadata.downloads = downloads ?? void 0;
      metadata.quality = quality ?? void 0;
    }
    return { metadata, downloads, quality };
  }
  /**
   * Batch fetch metadata for multiple packages
   */
  async batchGetMetadata(packageNames, concurrency = 5) {
    const results = /* @__PURE__ */ new Map();
    const chunks = [];
    for (let i = 0; i < packageNames.length; i += concurrency) {
      chunks.push(packageNames.slice(i, i + concurrency));
    }
    for (const chunk of chunks) {
      const promises = chunk.map(async (name) => {
        const metadata = await this.getPackageMetadata(name);
        results.set(name, metadata);
      });
      await Promise.all(promises);
    }
    return results;
  }
  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}
function createNpmClient(config) {
  return new NpmClient(config);
}
export {
  NpmClient,
  createNpmClient
};
//# sourceMappingURL=npm-client.js.map
