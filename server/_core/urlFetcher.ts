import axios from "axios";
import * as cheerio from "cheerio";

export interface FetchedContent {
  title: string;
  description: string;
  content: string;
  isVideo: boolean;
  platform: string | null;
}

const VIDEO_PLATFORMS = [
  { pattern: /xiaohongshu\.com|xhslink\.com/i, name: "xiaohongshu" },
  { pattern: /douyin\.com|iesdouyin\.com/i, name: "douyin" },
  { pattern: /bilibili\.com/i, name: "bilibili" },
  { pattern: /weixin\.qq\.com/i, name: "wechat" },
  { pattern: /youtube\.com|youtu\.be/i, name: "youtube" },
  { pattern: /tiktok\.com/i, name: "tiktok" },
];

function detectPlatform(url: string): string | null {
  for (const platform of VIDEO_PLATFORMS) {
    if (platform.pattern.test(url)) {
      return platform.name;
    }
  }
  return null;
}

function isVideoUrl(url: string): boolean {
  const videoExtensions = /\.(mp4|avi|mov|wmv|flv|mkv|webm)(\?|$)/i;
  return videoExtensions.test(url) || detectPlatform(url) !== null;
}

async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<string> {
  const response = await axios.get(url, {
    timeout: timeoutMs,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    maxRedirects: 5,
  });
  return response.data;
}

function extractTextFromHtml(html: string): { title: string; description: string; content: string } {
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer, header elements
  $("script, style, nav, footer, header, aside, .sidebar, .advertisement, .ad").remove();

  // Extract meta information
  const title =
    $("meta[property='og:title']").attr("content") ||
    $("meta[name='twitter:title']").attr("content") ||
    $("title").text() ||
    "";

  const description =
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='twitter:description']").attr("content") ||
    $("meta[name='description']").attr("content") ||
    "";

  // Extract main content
  const mainContent =
    $("article").text() ||
    $("main").text() ||
    $("[role='main']").text() ||
    $(".content, .article-content, .post-content, .recipe-content").text() ||
    $("body").text() || "";

  // Clean up whitespace
  const cleanContent = mainContent
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim()
    .substring(0, 5000); // Limit content length

  return { title, description, content: cleanContent };
}

function extractVideoMetadata(html: string, platform: string): { title: string; description: string } {
  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("meta[name='twitter:title']").attr("content") ||
    $("title").text() ||
    "";

  const description =
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='twitter:description']").attr("content") ||
    $("meta[name='description']").attr("content") ||
    "";

  return { title, description };
}

export async function fetchUrlContent(url: string): Promise<FetchedContent> {
  const platform = detectPlatform(url);
  const isVideo = isVideoUrl(url);

  try {
    const html = await fetchWithTimeout(url);

    let title: string;
    let description: string;
    let content: string;

    if (isVideo && platform) {
      // For video platforms, focus on metadata
      const metadata = extractVideoMetadata(html, platform);
      title = metadata.title;
      description = metadata.description;
      content = "";
    } else {
      // For regular web pages, extract full content
      const extracted = extractTextFromHtml(html);
      title = extracted.title;
      description = extracted.description;
      content = extracted.content;
    }

    return {
      title,
      description,
      content,
      isVideo,
      platform,
    };
  } catch (error) {
    console.error(`Failed to fetch URL content: ${url}`, error);
    // Return minimal content if fetch fails
    return {
      title: "",
      description: "",
      content: `URL: ${url}`,
      isVideo,
      platform,
    };
  }
}
