import axios from "axios";
import pino from "pino";

const logger = pino({ level: "info", transport: { target: "pino-pretty", options: { colorize: true } } });

const MAX_RETRIES = 3;

/**
 * Downloads a video from a given URL with retry logic.
 */
export async function downloadVideo(url: string): Promise<Buffer | null> {
  if (!url) return null;

  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      logger.info(`📥 Downloading video (Attempt ${attempts + 1})`);
      const response = await axios.get(url, { responseType: "arraybuffer" });

      if (!response.data || response.data.length === 0) {
        logger.error("❌ Empty video response");
        return null;
      }

      logger.info(`✅ Video downloaded (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`❌ Download failed: ${error}`);
      attempts++;
      await new Promise((res) => setTimeout(res, 1000 * attempts));
    }
  }

  logger.error("❌ Failed to download video after retries.");
  return null;
}
