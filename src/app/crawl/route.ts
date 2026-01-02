

export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
    try {
      const { url, rootUrl: sentRootUrl } = await req.json();
      if (!url) {
        return NextResponse.json({ error: "URL ارسال نشده" }, { status: 400 });
      }
  
      const rootUrl = sentRootUrl || new URL(url).origin;
  
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      });
  
      if (!res.ok) {
        throw new Error(`Fetch failed with status ${res.status}`);
      }
  
      const html = await res.text();
      const $ = cheerio.load(html);
  
      const crawlDate = new Date().toLocaleString("sv-SE", {
        timeZone: "Asia/Tehran",
      }).replace(" ", "T") + "+03:30";
  
      const images: { src: string; alt: string }[] = [];
      $("img").each((_, el) => {
        let src = $(el).attr("src") || $(el).attr("data-src") || "";
        if (src.startsWith("..")) src = src.replace(/^..\/?/, rootUrl + "/");
        else if (src.startsWith("IMG/")) src = rootUrl + "/" + src;
        images.push({ src, alt: $(el).attr("alt") || "" });
      });
  
      let xml = `\n<url>\n  <loc>${url}</loc>\n  <lastmod>${crawlDate}</lastmod>\n  <priority>0.8</priority>\n`;
      images.forEach(img => {
        xml += `  <image:image>\n    <image:loc>${img.src}</image:loc>\n`;
        if (img.alt) xml += `    <image:caption>${img.alt}</image:caption>\n`;
        xml += `  </image:image>\n`;
      });
      xml += `</url>\n`;
  
      return NextResponse.json({ xml });
  
    } catch (err: unknown) {
      // در سرور، فقط JSON با خطا برگردان
      let errorMessage = "خطای ناشناخته";
      if (err instanceof Error) errorMessage = err.message;
  
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }
  