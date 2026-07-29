#!/usr/bin/env python3
"""
劳动法法律法规爬虫 — 从 gov.cn 等公开来源抓取法律原文
输出: data/knowledge/labor/laws/<law_id>.json (遵循现有格式)
"""

import re
import json
import os
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ── 配置 ──────────────────────────────────────────────
OUTPUT_DIR = Path("data/knowledge/labor/laws")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
REQUEST_DELAY = 2.0  # 请求间隔（秒）

# ── 目标法律清单 ──────────────────────────────────────
# 注意: gov.cn 的 URL 可能随时间变化，如失效请搜索最新 URL
TARGET_LAWS = [
    {
        "lawId": "social_insurance_law",
        "title": "中华人民共和国社会保险法",
        "url": "https://www.gov.cn/guoqing/2021-10/29/content_5647616.htm",
        "description": "社会保险法（2018年修正）",
        "effective_date": "2011-07-01",
    },
    {
        "lawId": "female_protection_regulation",
        "title": "女职工劳动保护特别规定",
        "url": "https://www.gov.cn/zhengce/content/2012-05/07/content_6584.htm",
        "description": "女职工劳动保护特别规定",
        "effective_date": "2012-04-28",
    },
    {
        "lawId": "labor_contract_implementation_regulation",
        "title": "中华人民共和国劳动合同法实施条例",
        "url": "https://www.gov.cn/zhengce/content/2008-09/19/content_6630.htm",
        "description": "劳动合同法实施条例",
        "effective_date": "2008-09-18",
    },
    {
        "lawId": "annual_leave_regulation",
        "title": "职工带薪年休假条例",
        "url": "https://www.gov.cn/zhengce/content/2008-03/28/content_6636.htm",
        "description": "职工带薪年休假条例",
        "effective_date": "2008-01-01",
    },
    {
        "lawId": "annual_leave_implementation",
        "title": "企业职工带薪年休假实施办法",
        "url": "https://www.gov.cn/zhengce/2022-08/31/content_5711300.htm",
        "description": "企业职工带薪年休假实施办法",
        "effective_date": "2008-09-18",
    },
]


CONTENT_CONTAINERS = [
    "TRS_Editor",
    "pages_content",
    "article",
    "content",
    "maintext",
    "Custom_UnionStyle",
    "main-content",
    "text-content",
    "con_text",
]


def fetch_page(url: str) -> str:
    """抓取网页，返回纯净文本"""
    print(f"  Fetching: {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.encoding = "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")

        # 移除 script/style 标签
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        # 优先从已知容器提取
        for cls in CONTENT_CONTAINERS:
            container = soup.find(class_=cls)
            if container:
                text = container.get_text(separator="\n", strip=True)
                if len(text) > 500:
                    print(f"  📦 从 .{cls} 提取 ({len(text)} chars)")
                    return text

        # 回退：从 body 提取
        body = soup.find("body") or soup
        text = body.get_text(separator="\n", strip=True)
        print(f"  📦 从 <body> 提取 ({len(text)} chars)")
        return text
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}")
        return ""


def parse_law_text(text: str) -> list:
    """
    解析法律文本，返回章节列表。
    每章节含 chapterNo, title, articles[].
    不包含章节结构（如司法解释）则返回一个虚拟章节.
    """
    if not text:
        return []

    # ── 尝试检测章节结构 ──
    # 匹配 "第X章" 或 "第X部分"
    chapter_pattern = re.compile(
        r"(?:第[一二三四五六七八九十百零\d]+[章节部分]|第[零〇一二三四五六七八九十]\d*[章节部分])\s*[^\n]{0,30}",
        re.MULTILINE,
    )
    # 匹配 "第X条" 
    article_pattern = re.compile(r"(第[\d一二三四五六七八九十百零]+[条])\s*", re.MULTILINE)

    # 先尝试找章节结构
    chapters = chapter_pattern.findall(text)

    if chapters:
        return _parse_with_chapters(text, chapters, article_pattern)
    else:
        # 无章节，按条文直接解析
        return _parse_articles_only(text, article_pattern)


def _parse_with_chapters(text: str, chapters: list, article_pattern) -> list:
    """解析有章节结构的内容（自动去重目录，跳过TOC）"""
    # 找所有章节位置
    all_spans = []
    for ch in set(chapters):
        pos = 0
        while True:
            pos = text.find(ch, pos)
            if pos < 0:
                break
            all_spans.append((pos, ch.strip()))
            pos += len(ch)

    # 按位置排序
    all_spans.sort()

    if not all_spans:
        return []

    # 策略：取每个章节号的最后一次出现（跳过TOC）
    # 因为TOC的章节在正文之前出现
    final_chapters = {}
    for pos, ch_title in all_spans:
        ch_num = _extract_chapter_number(ch_title)
        if ch_num > 0:
            # 保留最后一次出现
            final_chapters[ch_num] = (pos, ch_title)

    # 按位置排序
    sorted_chapters = sorted(final_chapters.items(), key=lambda x: x[1][0])

    result = []
    for i, (ch_num, (pos, ch_title)) in enumerate(sorted_chapters):
        # 确定本节的结束位置
        if i + 1 < len(sorted_chapters):
            end_pos = sorted_chapters[i + 1][1][0]
        else:
            end_pos = len(text)

        # 本节内容
        section_text = text[pos + len(ch_title):end_pos].strip()

        # 提取本条内的法条
        articles = _extract_articles(section_text, article_pattern)

        result.append({
            "chapterNo": ch_num,
            "title": ch_title,
            "articles": articles,
        })

    return result


def _parse_articles_only(text: str, article_pattern) -> list:
    """解析无章节结构的内容"""
    articles = _extract_articles(text, article_pattern)
    if articles:
        return [{"chapterNo": 1, "title": "全文", "articles": articles}]
    return []


def _extract_chapter_number(title: str) -> int:
    """从'第一章'等提取数字"""
    return _parse_cn_number(title)


def _extract_articles(text: str, article_pattern) -> list:
    """从文本中提取法条款"""
    article_matches = list(article_pattern.finditer(text))
    articles = []

    for i, match in enumerate(article_matches):
        art_title = match.group(1)
        # 提取条文编号
        art_no = _extract_article_number(art_title)

        # 确定本条结束位置
        if i + 1 < len(article_matches):
            end_pos = article_matches[i + 1].start()
        else:
            end_pos = len(text)

        # 提取内容
        start_pos = match.end()
        content = text[start_pos:end_pos].strip()
        # 清理
        content = re.sub(r"\s*\n\s*", " ", content)
        content = content.strip()

        if art_no > 0:
            articles.append({
                "articleNo": art_no,
                "content": content,
                "keywords": [],
            })

    return articles


def _extract_article_number(title: str) -> int:
    """从'第一条'等提取数字"""
    return _parse_cn_number(title)


def _parse_cn_number(text: str) -> int:
    """解析中文数字为整数 如 十一→11, 一百二十三→123"""
    cn_nums = {
        "零": 0, "一": 1, "二": 2, "三": 3, "四": 4,
        "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
        "十": 10, "百": 100, "千": 1000,
    }
    match = re.search(r"[第]?([一二三四五六七八九十百零千\d]+)", text)
    if not match:
        return 0
    num_str = match.group(1)

    # 阿拉伯数字
    if num_str.isdigit():
        return int(num_str)

    # 中文数字
    result = 0
    current = 0
    for ch in num_str:
        if ch in cn_nums:
            val = cn_nums[ch]
            if val >= 10:
                # 是位权（十、百、千）
                if current == 0:
                    current = 1
                result += current * val
                current = 0
            else:
                # 是个位数
                current = val
        elif ch == "零":
            current = 0
    result += current
    return result


def generate_keywords(text: str, max_kw: int = 5) -> list:
    """为条文生成关键词（基于长度和关键术语）"""
    keywords = []
    # 简单关键词提取：取前几个有意义的词
    important_terms = [
        "劳动合同", "劳动者", "用人单位", "工资", "工伤", "保险",
        "解除", "终止", "赔偿", "补偿", "仲裁", "诉讼", "时效",
        "女职工", "未成年工", "工时", "休假", "年休假", "加班",
        "派遣", "非全日制", "试用期", "服务期", "竞业限制",
        "违约金", "赔偿金", "经济补偿", "社会保险",
    ]
    found = []
    for term in important_terms:
        if term in text:
            found.append(term)
        if len(found) >= max_kw:
            break
    return found


def generate_law_json(law_info: dict, chapters: list) -> dict:
    """生成与现有格式一致的 JSON"""
    return {
        "lawId": law_info["lawId"],
        "title": law_info["title"],
        "chapters": chapters,
    }


def scrape_law(law_info: dict) -> dict | None:
    """抓取一部法律并返回结构化 JSON"""
    print(f"\n{'='*60}")
    print(f"抓取: {law_info['title']}")
    print(f"{'='*60}")

    text = fetch_page(law_info["url"])
    if not text or len(text) < 100:
        print(f"  ❌ 内容不足，跳过")
        return None

    chapters = parse_law_text(text)
    if not chapters:
        print(f"  ❌ 未能解析出章节结构")
        return None

    law_json = generate_law_json(law_info, chapters)

    # 添加关键词到每条
    total_articles = 0
    for ch in chapters:
        for art in ch["articles"]:
            art["keywords"] = generate_keywords(art["content"])
            total_articles += 1

    print(f"  ✅ 成功解析: {len(chapters)} 章, {total_articles} 条")

    return law_json


def save_law_json(data: dict):
    """保存 JSON 文件"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    filepath = OUTPUT_DIR / f"{data['lawId']}.json"

    # 如果文件已存在，备份
    if filepath.exists():
        backup = filepath.with_suffix(".json.bak")
        filepath.rename(backup)
        print(f"  📦 旧文件已备份: {backup.name}")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  💾 已保存: {filepath}")


def verify_json(filepath: Path) -> bool:
    """验证 JSON 文件格式正确"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert "lawId" in data
        assert "title" in data
        assert "chapters" in data
        total_articles = sum(
            len(ch.get("articles", [])) for ch in data["chapters"]
        )
        print(f"  📊 验证: {data['title']} — {len(data['chapters'])}章, {total_articles}条 ✅")
        return True
    except Exception as e:
        print(f"  ❌ 验证失败: {e}")
        return False


def main():
    print("=" * 60)
    print("📜 劳动法法律法规爬虫")
    print("=" * 60)

    os.chdir(Path(__file__).parent.parent)  # 切换到项目根目录

    results = {"success": 0, "failed": 0, "skipped": 0}
    for i, law in enumerate(TARGET_LAWS):
        print(f"\n[{i+1}/{len(TARGET_LAWS)}] ", end="")

        # 检查是否已存在
        out_path = OUTPUT_DIR / f"{law['lawId']}.json"
        if out_path.exists():
            print(f"  ⏭️  {law['title']} 已存在，跳过 (删除文件后重试)")
            results["skipped"] += 1
            verify_json(out_path)
            continue

        law_data = scrape_law(law)
        if law_data:
            save_law_json(law_data)
            if verify_json(out_path):
                results["success"] += 1
            else:
                results["failed"] += 1
        else:
            results["failed"] += 1

        # 请求间隔
        if i < len(TARGET_LAWS) - 1:
            time.sleep(REQUEST_DELAY)

    print(f"\n{'='*60}")
    print(f"📊 结果: ✅ {results['success']} 成功, ❌ {results['failed']} 失败, ⏭️ {results['skipped']} 跳过")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
