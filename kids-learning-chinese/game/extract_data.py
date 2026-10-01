import fitz, re, json
from pypinyin import lazy_pinyin, Style

def extract_chars_universal(pdf_path, page_start, page_end):
    """Universal extraction for both 识字表 and 写字表 across both books."""
    doc = fitz.open(pdf_path)
    results = []
    seen_chars = set()
    current_type = '阅读'
    current_lesson = None
    
    for pdf_idx in range(page_start, min(page_end + 1, doc.page_count)):
        page = doc[pdf_idx]
        text = page.get_text()
        lines = text.strip().split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip noise
            if not line or '仅供' in line:
                i += 1; continue
            if re.match(r'^\d{2,3}$', line):
                i += 1; continue
            if re.match(r'^（共\d+', line):
                i += 1; continue
            if any(k in line for k in ['识 字 表', '写 字 表', '词 语 表', '识\u2002字\u2002表', '写\u2002字\u2002表', '词\u2002语\u2002表']):
                i += 1; continue
            
            # Section type
            clean = line.replace('\t', ' ').replace('\u2002', ' ').strip()
            if clean == '阅读':
                current_type = '阅读'; i += 1; continue
            if clean == '识字':
                current_type = '识字'; i += 1; continue
            if '语文园地' in clean:
                current_type = '语文园地'; i += 1; continue
            
            # Pure lesson number line
            lesson_match = re.match(r'^\s*(\d{1,2})\s*$', line)
            if lesson_match:
                current_lesson = int(lesson_match.group(1))
                i += 1; continue
            
            # Format B: all chars on one line (writing table) - MUST CHECK FIRST
            # to avoid being captured by Format A's single-char match
            # Use \s+ instead of \t for robustness across PDF text formats
            lesson_chars_match = re.match(r'^\s*(\d{1,2})\s+([\u4e00-\u9fff]{2,})', line)
            if lesson_chars_match:
                current_lesson = int(lesson_chars_match.group(1))
                chars_str = lesson_chars_match.group(2)
                for char in chars_str:
                    if char not in seen_chars:
                        seen_chars.add(char)
                        py = lazy_pinyin(char, style=Style.TONE)
                        results.append({
                            'type': current_type, 'lesson': current_lesson,
                            'char': char, 'pinyin': py[0] if py else ''
                        })
                i += 1; continue

            # Format A: lesson + first char on one line (2下 识字表)
            lesson_char_match = re.match(r'^\s*(\d{1,2})\s+([\u4e00-\u9fff])', line)
            if lesson_char_match:
                current_lesson = int(lesson_char_match.group(1))
                char = lesson_char_match.group(2)
                if char not in seen_chars:
                    seen_chars.add(char)
                    py = lazy_pinyin(char, style=Style.TONE)
                    results.append({
                        'type': current_type, 'lesson': current_lesson,
                        'char': char, 'pinyin': py[0] if py else ''
                    })
                i += 1
                # Process remaining chars (alternating char/pinyin lines)
                while i < len(lines):
                    next_line = lines[i].strip()
                    if not next_line or '仅供' in next_line:
                        i += 1; continue
                    if re.match(r'^\d{2,3}$', next_line):
                        i += 1; continue
                    if next_line in ('阅读', '识字') or '语文园地' in next_line:
                        break
                    if re.match(r'^\s*\d{1,2}\s*$', next_line) or re.match(r'^\s*\d{1,2}\s+', next_line):
                        break
                    if re.match(r'^[\u4e00-\u9fff]$', next_line):
                        char = next_line
                        if char not in seen_chars:
                            seen_chars.add(char)
                            py = lazy_pinyin(char, style=Style.TONE)
                            results.append({
                                'type': current_type, 'lesson': current_lesson,
                                'char': char, 'pinyin': py[0] if py else ''
                            })
                        i += 1
                    else:
                        i += 1
                continue
            
            # Format C: Single char + next line is pinyin (should not reach here
            # if Format A/B matched above, but kept for backward compat)
            single_char_match = re.match(r'^([\u4e00-\u9fff])$', line)
            if single_char_match and current_lesson is not None:
                char = single_char_match.group(1)
                if i + 1 < len(lines) and re.match(r'^[a-zA-Z]+$', lines[i+1].strip()):
                    if char not in seen_chars:
                        seen_chars.add(char)
                        py = lazy_pinyin(char, style=Style.TONE)
                        results.append({
                            'type': current_type, 'lesson': current_lesson,
                            'char': char, 'pinyin': py[0] if py else ''
                        })
                    i += 2; continue
                else:
                    i += 1; continue
            
            i += 1
    
    doc.close()
    return results

def extract_words_robust(pdf_path, page_start, page_end):
    doc = fitz.open(pdf_path)
    all_words = []
    seen = set()
    
    for pdf_idx in range(page_start, min(page_end + 1, doc.page_count)):
        page = doc[pdf_idx]
        text = page.get_text()
        lines = text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or '仅供' in line:
                continue
            if re.match(r'^\d{2,3}$', line):
                continue
            if re.match(r'^（共\d+', line):
                continue
            if '词' in line and '表' in line:
                continue
            
            words = re.findall(r'[\u4e00-\u9fff]{2,}', line)
            for w in words:
                if w not in seen:
                    seen.add(w)
                    all_words.append(w)
    
    doc.close()
    return all_words

# Paths
base = r'D:/ai_coder/p000_kids_programming/courses/'
pdf_2a = base + '（根据2022年版课程标准修订）义务教育教科书·语文二年级上册.pdf'
pdf_2b = base + '（根据2022年版课程标准修订）义务教育教科书·语文二年级下册.pdf'

# Extract
sz_2a = extract_chars_universal(pdf_2a, 112, 116)
print(f'2上 识字表: {len(sz_2a)} chars')

xz_2a = extract_chars_universal(pdf_2a, 117, 119)
print(f'2上 写字表: {len(xz_2a)} chars')

words_2a = extract_words_robust(pdf_2a, 120, 122)
print(f'2上 词语表: {len(words_2a)} words')

sz_2b = extract_chars_universal(pdf_2b, 117, 120)
print(f'2下 识字表: {len(sz_2b)} chars')

xz_2b = extract_chars_universal(pdf_2b, 121, 123)
print(f'2下 写字表: {len(xz_2b)} chars')

words_2b = extract_words_robust(pdf_2b, 124, 126)
print(f'2下 词语表: {len(words_2b)} words')

# Save data
data = {
    'sz_2a': sz_2a, 'xz_2a': xz_2a, 'words_2a': words_2a,
    'sz_2b': sz_2b, 'xz_2b': xz_2b, 'words_2b': words_2b,
}
with open(r'D:/ai_coder/p000_kids_programming/game/temp_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Summary
print(f'\n=== SUMMARY ===')
print(f'2上: 识字表{len(sz_2a)} + 写字表{len(xz_2a)} + 词语表{len(words_2a)}')
print(f'2下: 识字表{len(sz_2b)} + 写字表{len(xz_2b)} + 词语表{len(words_2b)}')
print(f'总计: 生字{len(sz_2a)+len(sz_2b)+len(xz_2a)+len(xz_2b)} 词语{len(words_2a)+len(words_2b)}')

# Samples
print('\n--- 2下 识字表 sample ---')
for c in sz_2b[:10]:
    print(f'  {c["char"]} {c["pinyin"]} L{c["lesson"]} {c["type"]}')
print('\n--- 2下 写字表 sample ---')
for c in xz_2b[:10]:
    print(f'  {c["char"]} {c["pinyin"]} L{c["lesson"]} {c["type"]}')
